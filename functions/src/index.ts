import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CustomClaims, UserRole } from "@veglia/shared";

admin.initializeApp();
const db = admin.firestore();

/**
 * Sincroniza custom claims sempre que /users/{uid} é criado ou atualizado.
 * Garante que company_id e role no token JWT ficam em sincronia com o Firestore.
 */
export const syncUserClaims = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const data = event.data?.after?.data();

  if (!data) {
    // Documento deletado — limpa claims
    await admin.auth().setCustomUserClaims(uid, {});
    return;
  }

  const claims: CustomClaims = {
    company_id: data.company_id as string,
    role: data.role as UserRole,
  };

  await admin.auth().setCustomUserClaims(uid, claims);
});

/**
 * Cria a empresa e o usuário admin em uma transação atômica.
 * Chamado pelo onboarding após o primeiro login.
 */
export const createCompany = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

  const { companyName, cnpj } = request.data as { companyName: string; cnpj?: string };
  if (!companyName?.trim()) throw new HttpsError("invalid-argument", "companyName required");

  const uid = request.auth.uid;
  const email = request.auth.token.email ?? "";

  const companyRef = db.collection("companies").doc();
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const existingUser = await tx.get(userRef);
    if (existingUser.exists) {
      throw new HttpsError("already-exists", "User already belongs to a company");
    }

    tx.set(companyRef, {
      name: companyName.trim(),
      cnpj: cnpj ?? null,
      plan: "starter",
      adminUid: uid,
      createdAt: Date.now(),
    });

    tx.set(userRef, {
      uid,
      company_id: companyRef.id,
      role: "admin" as UserRole,
      email,
      displayName: request.auth!.token.name ?? email,
      createdAt: Date.now(),
    });
  });

  return { company_id: companyRef.id };
});

/**
 * Registra colaborador via token de convite.
 * Após usar o convite, seta role collaborator no mesmo tenant da empresa.
 */
export const acceptInvite = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

  const { inviteId } = request.data as { inviteId: string };
  if (!inviteId) throw new HttpsError("invalid-argument", "inviteId required");

  const uid = request.auth.uid;
  const inviteRef = db.collection("invites").doc(inviteId);
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const invite = await tx.get(inviteRef);
    if (!invite.exists) throw new HttpsError("not-found", "Invite not found");

    const data = invite.data()!;
    if (data.usedAt !== null) throw new HttpsError("failed-precondition", "Invite already used");

    tx.set(userRef, {
      uid,
      company_id: data.company_id,
      role: data.role as UserRole,
      email: request.auth!.token.email ?? "",
      displayName: request.auth!.token.name ?? "",
      createdAt: Date.now(),
    });

    tx.update(inviteRef, { usedAt: Date.now() });
  });

  return { ok: true };
});

/**
 * Gera certificado de compliance quando o colaborador conclui a trilha.
 * Gera PDF via pdf-lib, salva no Firebase Storage e retorna URL pública.
 */
export const generateCertificate = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

  const { courseId } = request.data as { courseId: string };
  if (!courseId) throw new HttpsError("invalid-argument", "courseId required");

  const uid = request.auth.uid;
  const enrollmentId = `${uid}_${courseId}`;
  const enrollRef = db.collection("enrollments").doc(enrollmentId);

  const enrollSnap = await enrollRef.get();
  if (!enrollSnap.exists) throw new HttpsError("not-found", "Enrollment not found");

  const enrollment = enrollSnap.data()!;
  if (!enrollment.completed_at) {
    throw new HttpsError("failed-precondition", "Course not completed yet");
  }

  // Idempotente: se já tem certificado com PDF, retorna o existente
  if (enrollment.certificate_url) {
    return { certificate_url: enrollment.certificate_url, already_issued: true };
  }

  const company_id: string = enrollment.company_id;

  // Busca dados do usuário para o certificado
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data() ?? {};

  // Gera hash SHA-256 do conteúdo do certificado para verificação de autenticidade
  const certPayload = JSON.stringify({
    uid,
    company_id,
    courseId,
    displayName: userData.displayName ?? "",
    email: userData.email ?? "",
    completedAt: enrollment.completed_at,
    issuedAt: Date.now(),
  });
  const hash = crypto.createHash("sha256").update(certPayload).digest("hex");

  const certId = `${uid}_${courseId}`;
  const certRef = db.collection("certificates").doc(certId);

  // ── Geração do PDF ──────────────────────────────────────────────────────────

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Fundo deep navy
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: rgb(0.043, 0.145, 0.271),
  });

  // Borda decorativa mint
  page.drawRectangle({
    x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.365, 0.827, 0.659),
    borderWidth: 2,
    color: rgb(0, 0, 0),
    opacity: 0,
  });

  // Título "CERTIFICADO DE COMPLIANCE"
  page.drawText("CERTIFICADO DE COMPLIANCE", {
    x: width / 2 - 180,
    y: height - 100,
    size: 24,
    font: fontBold,
    color: rgb(0.788, 0.663, 0.431), // champagne
  });

  // Subtítulo Lei
  page.drawText("Lei 15.377/2026 · Saúde Preventiva Corporativa", {
    x: width / 2 - 170,
    y: height - 135,
    size: 14,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
  });

  // "Certificamos que"
  page.drawText("Certificamos que", {
    x: width / 2 - 60,
    y: height / 2 + 40,
    size: 14,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Nome do colaborador
  const nome = (userData.displayName as string | undefined)
    ?? (userData.name as string | undefined)
    ?? (userData.email as string | undefined)
    ?? "";
  page.drawText(nome, {
    x: Math.max(40, width / 2 - nome.length * 7),
    y: height / 2,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Concluiu a trilha
  const courseLabel =
    courseId === "lei-15377"
      ? "Trilha Lei 15.377/2026 — Saúde Preventiva"
      : "Trilha NR-1 — Gestão de Riscos Ocupacionais";
  page.drawText(`concluiu com êxito a ${courseLabel}`, {
    x: width / 2 - 200,
    y: height / 2 - 40,
    size: 14,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Data formatada
  const dataFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  page.drawText(dataFormatada, {
    x: width / 2 - 60,
    y: height / 2 - 80,
    size: 12,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Hash de verificação (rodapé esquerdo)
  page.drawText(`Código de verificação: ${hash.substring(0, 32)}...`, {
    x: 40,
    y: 35,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Powered by Vacivitta (rodapé direito)
  page.drawText("Powered by Vacivitta", {
    x: width - 150,
    y: 35,
    size: 9,
    font: fontBold,
    color: rgb(0.365, 0.827, 0.659),
  });

  const pdfBytes = await pdfDoc.save();

  // ── Salvar no Firebase Storage ──────────────────────────────────────────────

  const bucket = admin.storage().bucket();
  const file = bucket.file(`certificates/${certId}.pdf`);
  await file.save(Buffer.from(pdfBytes), {
    metadata: { contentType: "application/pdf" },
  });
  await file.makePublic();

  const pdfUrl = `https://storage.googleapis.com/${bucket.name}/certificates/${certId}.pdf`;

  // ── Persistir no Firestore ──────────────────────────────────────────────────

  await db.runTransaction(async (tx) => {
    tx.set(certRef, {
      uid,
      company_id,
      course_id: courseId,
      displayName: userData.displayName ?? "",
      email: userData.email ?? "",
      issued_at: Date.now(),
      sha256: hash,
      pdf_url: pdfUrl,
    });

    tx.update(enrollRef, {
      certificate_url: pdfUrl,
      certificate_id: certId,
      certificate_hash: hash,
    });
  });

  return { certificate_id: certId, sha256: hash, pdf_url: pdfUrl };
});

/**
 * Envia email de convite para o colaborador.
 * Em produção, configura SMTP_USER / SMTP_PASS / SMTP_HOST via Firebase environment.
 * Em dev/demo, usa Ethereal (captura sem enviar) e retorna preview_url.
 */
export const sendInviteEmail = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

  const { inviteId, toEmail, toName, companyName } = request.data as {
    inviteId: string;
    toEmail: string;
    toName: string;
    companyName: string;
  };

  if (!inviteId || !toEmail) {
    throw new HttpsError("invalid-argument", "inviteId e toEmail são obrigatórios");
  }

  // Verifica que o convite pertence à empresa do RH que está chamando
  const inviteSnap = await db.collection("invites").doc(inviteId).get();
  if (!inviteSnap.exists) throw new HttpsError("not-found", "Convite não encontrado");

  const invite = inviteSnap.data()!;
  if (invite.company_id !== request.auth.token["company_id"]) {
    throw new HttpsError("permission-denied", "Convite não pertence à sua empresa");
  }

  // Link de aceite — usa APP_URL env var para suportar custom domain em produção
  const appUrl = process.env.APP_URL || "https://veglia-6e734.web.app";
  const inviteLink = `${appUrl}/aceitar-convite?token=${inviteId}`;

  // ── Configurar transporte SMTP ──────────────────────────────────────────────
  let transporter: nodemailer.Transporter;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });
  } else {
    // Ethereal: captura emails sem entregar — ideal para demo/homologação
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  // ── HTML do email ───────────────────────────────────────────────────────────
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background: #0B2545; color: white; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
      <h1 style="color: #5DD3A8; font-size: 24px; margin-bottom: 8px;">
        Olá, ${toName || "colaborador"}!
      </h1>
      <p style="color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6;">
        A <strong style="color: white;">${companyName}</strong> te convidou para acessar a plataforma
        <strong style="color: #5DD3A8;">Vegl.ia</strong> — o programa de Compliance Preventivo da sua empresa.
      </p>
      <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">
        Em poucos minutos você vai aprender sobre seus direitos garantidos pela
        <strong style="color: #C9A96E;">Lei 15.377/2026</strong>,
        incluindo vacinação, prevenção de cânceres e saúde mental no trabalho.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a
          href="${inviteLink}"
          style="background: #5DD3A8; color: #0B2545; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;"
        >
          Acessar plataforma →
        </a>
      </div>
      <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center;">
        Powered by Vacivitta · Quem vela, cuida.
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"Vegl.ia · Compliance" <noreply@veglia.com.br>`,
    to: toEmail,
    subject: `${companyName} te convidou para a plataforma de compliance`,
    html,
  });

  // Ethereal retorna preview URL; SMTP real retorna false
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  await db.collection("invites").doc(inviteId).update({
    email_sent_at: Date.now(),
    email_preview: previewUrl,
  });

  return {
    success: true,
    preview_url: previewUrl,
    message: smtpUser
      ? "Email enviado com sucesso"
      : "Email capturado em modo demo — consulte preview_url para visualizar",
  };
});
