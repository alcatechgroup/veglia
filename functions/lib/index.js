"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEmployeeStatus = exports.importEmployeesWebhook = exports.importEmployees = exports.calculatePreventiveScore = exports.createLandingLead = exports.generateCompanyCertificate = exports.syncComplianceScore = exports.checkComplianceAlerts = exports.sendInviteEmail = exports.calculateISPC = exports.dailyHealthCheck = exports.createInvite = exports.generateCertificate = exports.acceptInvite = exports.createBranch = exports.createCompany = exports.chatWithVeglia = exports.awardPoints = exports.syncUserClaims = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const nodemailer = __importStar(require("nodemailer"));
const pdf_lib_1 = require("pdf-lib");
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const anthropicApiKey = (0, params_1.defineSecret)("ANTHROPIC_API_KEY");
admin.initializeApp();
const db = admin.firestore();
/**
 * Sincroniza custom claims sempre que /users/{uid} é criado ou atualizado.
 * Garante que company_id e role no token JWT ficam em sincronia com o Firestore.
 */
exports.syncUserClaims = (0, firestore_1.onDocumentWritten)("users/{uid}", async (event) => {
    const uid = event.params.uid;
    const data = event.data?.after?.data();
    if (!data) {
        // Documento deletado — limpa claims
        await admin.auth().setCustomUserClaims(uid, {});
        return;
    }
    const claims = {
        company_id: data.company_id,
        role: data.role,
    };
    await admin.auth().setCustomUserClaims(uid, claims);
});
/**
 * Concede pontos ao usuário por ações na plataforma.
 * Calcula level e badges automaticamente.
 */
exports.awardPoints = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { user_id, company_id, action } = request.data;
    if (!user_id || !company_id || !action) {
        throw new https_1.HttpsError("invalid-argument", "user_id, company_id e action são obrigatórios");
    }
    const POINTS_MAP = {
        video_watched: 10,
        module_completed: 50,
        trilha_completed: 200,
        certificate_issued: 500,
        invite_accepted: 100,
    };
    const points = POINTS_MAP[action] ?? 0;
    const LEVELS = [
        { name: "Iniciante", min: 0 },
        { name: "Guardiao", min: 500 },
        { name: "Protetor", min: 1500 },
        { name: "Defensor", min: 3500 },
    ];
    const BADGE_RULES = [
        {
            id: "primeiro-certificado",
            condition: (_, __, a) => a === "certificate_issued",
        },
        {
            id: "compliance-completo",
            condition: (pts) => pts >= 700,
        },
        {
            id: "vacinado-2026",
            condition: (_, badges) => badges.includes("primeiro-certificado"),
        },
    ];
    const pointsRef = db.collection("user_points").doc(user_id);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(pointsRef);
        const existing = snap.exists ? snap.data() : { total_points: 0, badges: [] };
        const newTotal = existing.total_points + points;
        const currentBadges = existing.badges ?? [];
        // Calcula level
        let level = "Iniciante";
        for (const l of LEVELS) {
            if (newTotal >= l.min)
                level = l.name;
        }
        // Verifica novos badges
        const newBadges = [...currentBadges];
        for (const rule of BADGE_RULES) {
            if (!newBadges.includes(rule.id) && rule.condition(newTotal, newBadges, action)) {
                newBadges.push(rule.id);
            }
        }
        tx.set(pointsRef, {
            user_id,
            company_id,
            total_points: newTotal,
            level,
            badges: newBadges,
            updated_at: Date.now(),
        }, { merge: true });
    });
    return { success: true, points_awarded: points };
});
/**
 * Assistente IA preventivo da Vegl.ia.
 * Usa Anthropic Claude API via HTTP direto (sem SDK, para evitar dependencia extra).
 * Busca contexto do usuario e mantém histórico das últimas 10 mensagens.
 */
exports.chatWithVeglia = (0, https_1.onCall)({ secrets: [anthropicApiKey] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { message } = request.data;
    if (!message?.trim())
        throw new https_1.HttpsError("invalid-argument", "message required");
    const uid = request.auth.uid;
    const companyId = request.auth.token["company_id"];
    // Rate limit: busca mensagens do dia atual
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayMsgsSnap = await db
        .collection("ai_chats")
        .doc(uid)
        .collection("messages")
        .where("role", "==", "user")
        .where("created_at", ">=", startOfDay.getTime())
        .get();
    // Rate limit básico: 10 msgs/dia para planos starter (liberado para demo)
    // Em produção: verificar plan da empresa para aplicar limite
    const DAILY_LIMIT = 50;
    if (todayMsgsSnap.size >= DAILY_LIMIT) {
        throw new https_1.HttpsError("resource-exhausted", "Limite diário atingido");
    }
    // Busca contexto do usuário
    const [enrollSnap, passportSnap, diagSnap] = await Promise.all([
        db.collection("enrollments").where("uid", "==", uid).get(),
        db.collection("health_passports").doc(uid).get(),
        db.collection("diagnostic_results").doc(uid).get(),
    ]);
    const completedCourses = enrollSnap.docs
        .filter((d) => d.data().completed_at)
        .map((d) => d.data().course_id);
    const passport = passportSnap.exists ? passportSnap.data() : null;
    const diagnostic = diagSnap.exists ? diagSnap.data() : null;
    const userContext = `
Contexto do usuário:
- Trilhas concluídas: ${completedCourses.length > 0 ? completedCourses.join(", ") : "nenhuma"}
- Vacinas registradas: ${passport ? passport.vaccinations.length : 0}
- Score de saúde: ${passport?.health_score ?? "não avaliado"}
- Diagnóstico: ${diagnostic ? `score ${diagnostic.score}/100, categoria ${diagnostic.category}` : "não realizado"}
`;
    // Histórico das últimas 10 mensagens
    const historySnap = await db
        .collection("ai_chats")
        .doc(uid)
        .collection("messages")
        .orderBy("created_at", "desc")
        .limit(10)
        .get();
    const history = historySnap.docs
        .map((d) => d.data())
        .reverse();
    const systemPrompt = `Você é a Vegl.ia IA — assistente de saúde preventiva corporativa da plataforma Vegl.ia, desenvolvida em parceria com a VaciVitta e validada pela Dra. Amanda Conde Perez Fernandes (pediatra, neonatologista, nutróloga, membro da SBIm).

Seu papel:
- Orientar sobre saúde preventiva, vacinação, compliance da Lei 15.377/2026 e NR-1
- Recomendar trilhas de aprendizado disponíveis na plataforma
- Sempre indicar consulta médica para diagnósticos individuais
- Nunca fazer diagnóstico médico — apenas orientações preventivas e educativas
- Tom: direto, acolhedor, com autoridade técnica baseada em evidências

${userContext}

IMPORTANTE: Quando não souber algo, diga "consulte um profissional de saúde". Nunca diagnostique condições médicas individuais.`;
    const anthropicKey = anthropicApiKey.value();
    if (!anthropicKey) {
        throw new https_1.HttpsError("failed-precondition", "Assistente IA não configurado");
    }
    // Chamada à API Anthropic via fetch nativo do Node 20
    const messages = [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
    ];
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 1024,
            system: systemPrompt,
            messages,
        }),
    });
    if (!response.ok) {
        throw new https_1.HttpsError("internal", "Erro ao chamar assistente IA");
    }
    const aiResponse = (await response.json());
    const aiText = aiResponse.content.find((c) => c.type === "text")?.text ?? "";
    // Salva conversa no Firestore
    const chatRef = db.collection("ai_chats").doc(uid);
    const msgsRef = chatRef.collection("messages");
    const now = Date.now();
    await Promise.all([
        msgsRef.add({ role: "user", content: message, created_at: now }),
        msgsRef.add({ role: "assistant", content: aiText, created_at: now + 1 }),
        chatRef.set({ user_id: uid, company_id: companyId, updated_at: now }, { merge: true }),
    ]);
    return { response: aiText };
});
/**
 * Cria a empresa e o usuário admin em uma transação atômica.
 * Chamado pelo onboarding após o primeiro login.
 */
exports.createCompany = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { companyName, cnpj } = request.data;
    if (!companyName?.trim())
        throw new https_1.HttpsError("invalid-argument", "companyName required");
    const uid = request.auth.uid;
    const email = request.auth.token.email ?? "";
    const companyRef = db.collection("companies").doc();
    const userRef = db.collection("users").doc(uid);
    await db.runTransaction(async (tx) => {
        const existingUser = await tx.get(userRef);
        if (existingUser.exists) {
            throw new https_1.HttpsError("already-exists", "User already belongs to a company");
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
            role: "admin",
            email,
            displayName: request.auth.token.name ?? email,
            createdAt: Date.now(),
        });
    });
    return { company_id: companyRef.id };
});
/**
 * Cria uma filial de empresa existente.
 * Apenas admin ou admin_rh da empresa matriz pode chamar.
 * Cria a empresa filial + convite para o RH responsável.
 */
exports.createBranch = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login necessário");
    const { role, company_id } = request.auth.token;
    if (role !== "admin" && role !== "admin_rh") {
        throw new https_1.HttpsError("permission-denied", "Apenas admin ou admin_rh pode criar filiais");
    }
    const { branchName, cnpj, rhEmail, rhName } = request.data;
    if (!branchName?.trim())
        throw new https_1.HttpsError("invalid-argument", "Nome da filial obrigatório");
    if (!rhEmail?.trim())
        throw new https_1.HttpsError("invalid-argument", "E-mail do RH da filial obrigatório");
    const matrixId = company_id ?? "";
    if (!matrixId)
        throw new https_1.HttpsError("failed-precondition", "company_id ausente no token");
    const matrixSnap = await db.collection("companies").doc(matrixId).get();
    if (!matrixSnap.exists)
        throw new https_1.HttpsError("not-found", "Empresa matriz não encontrada");
    const matrix = matrixSnap.data();
    const branchRef = db.collection("companies").doc();
    const branchId = branchRef.id;
    await branchRef.set({
        id: branchId,
        name: branchName.trim(),
        cnpj: cnpj ? cnpj.replace(/\D/g, "") : null,
        plan: matrix.plan || "starter",
        parent_id: matrixId,
        is_matrix: false,
        adminUid: "",
        createdAt: Date.now(),
    });
    const inviteRef = db.collection("invites").doc();
    await inviteRef.set({
        id: inviteRef.id,
        company_id: branchId,
        email: rhEmail.trim().toLowerCase(),
        role: "rh_filial",
        createdBy: request.auth.uid,
        createdAt: Date.now(),
        usedAt: null,
        displayName: rhName?.trim() || rhEmail.trim(),
        cargo: "Operador RH",
    });
    await db.collection("companies").doc(matrixId).update({ is_matrix: true });
    return { branchId, inviteId: inviteRef.id };
});
/**
 * Registra colaborador via token de convite.
 * Após usar o convite, seta role collaborator no mesmo tenant da empresa.
 */
exports.acceptInvite = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { inviteId } = request.data;
    if (!inviteId)
        throw new https_1.HttpsError("invalid-argument", "inviteId required");
    const uid = request.auth.uid;
    const inviteRef = db.collection("invites").doc(inviteId);
    const userRef = db.collection("users").doc(uid);
    await db.runTransaction(async (tx) => {
        const invite = await tx.get(inviteRef);
        if (!invite.exists)
            throw new https_1.HttpsError("not-found", "Invite not found");
        const data = invite.data();
        if (data.usedAt !== null)
            throw new https_1.HttpsError("failed-precondition", "Invite already used");
        tx.set(userRef, {
            uid,
            company_id: data.company_id,
            role: data.role,
            email: request.auth.token.email ?? "",
            displayName: request.auth.token.name ?? "",
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
exports.generateCertificate = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { courseId } = request.data;
    if (!courseId)
        throw new https_1.HttpsError("invalid-argument", "courseId required");
    const uid = request.auth.uid;
    const enrollmentId = `${uid}_${courseId}`;
    const enrollRef = db.collection("enrollments").doc(enrollmentId);
    const enrollSnap = await enrollRef.get();
    if (!enrollSnap.exists)
        throw new https_1.HttpsError("not-found", "Enrollment not found");
    const enrollment = enrollSnap.data();
    if (!enrollment.completed_at) {
        throw new https_1.HttpsError("failed-precondition", "Course not completed yet");
    }
    // Idempotente: se já tem certificado com PDF, retorna o existente
    if (enrollment.certificate_url) {
        return { certificate_url: enrollment.certificate_url, already_issued: true };
    }
    const company_id = enrollment.company_id;
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
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    // Fundo deep navy
    page.drawRectangle({
        x: 0, y: 0, width, height,
        color: (0, pdf_lib_1.rgb)(0.043, 0.145, 0.271),
    });
    // Borda decorativa mint
    page.drawRectangle({
        x: 20, y: 20, width: width - 40, height: height - 40,
        borderColor: (0, pdf_lib_1.rgb)(0.365, 0.827, 0.659),
        borderWidth: 2,
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
        opacity: 0,
    });
    // Título "CERTIFICADO DE COMPLIANCE"
    page.drawText("CERTIFICADO DE COMPLIANCE", {
        x: width / 2 - 180,
        y: height - 100,
        size: 24,
        font: fontBold,
        color: (0, pdf_lib_1.rgb)(0.788, 0.663, 0.431), // champagne
    });
    // Subtítulo Lei
    page.drawText("Lei 15.377/2026 · Saúde Preventiva Corporativa", {
        x: width / 2 - 170,
        y: height - 135,
        size: 14,
        font: fontRegular,
        color: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7),
    });
    // "Certificamos que"
    page.drawText("Certificamos que", {
        x: width / 2 - 60,
        y: height / 2 + 40,
        size: 14,
        font: fontRegular,
        color: (0, pdf_lib_1.rgb)(0.6, 0.6, 0.6),
    });
    // Nome do colaborador
    const nome = userData.displayName
        ?? userData.name
        ?? userData.email
        ?? "";
    page.drawText(nome, {
        x: Math.max(40, width / 2 - nome.length * 7),
        y: height / 2,
        size: 28,
        font: fontBold,
        color: (0, pdf_lib_1.rgb)(1, 1, 1),
    });
    // Concluiu a trilha
    const courseLabel = courseId === "lei-15377"
        ? "Trilha Lei 15.377/2026 — Saúde Preventiva"
        : "Trilha NR-1 — Gestão de Riscos Ocupacionais";
    page.drawText(`concluiu com êxito a ${courseLabel}`, {
        x: width / 2 - 200,
        y: height / 2 - 40,
        size: 14,
        font: fontRegular,
        color: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7),
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
        color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
    });
    // Hash de verificação (rodapé esquerdo)
    page.drawText(`Código de verificação: ${hash.substring(0, 32)}...`, {
        x: 40,
        y: 35,
        size: 8,
        font: fontRegular,
        color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3),
    });
    // Powered by Vacivitta (rodapé direito)
    page.drawText("Powered by Vacivitta", {
        x: width - 150,
        y: 35,
        size: 9,
        font: fontBold,
        color: (0, pdf_lib_1.rgb)(0.365, 0.827, 0.659),
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
 * Cria um ou mais convites para colaboradores.
 * Apenas admin_rh ou admin da empresa pode chamar.
 * Retorna IDs criados e dispara sendInviteEmail para cada convite.
 */
exports.createInvite = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const callerRole = request.auth.token["role"];
    const callerCompanyId = request.auth.token["company_id"];
    if (callerRole !== "admin" && callerRole !== "admin_rh") {
        throw new https_1.HttpsError("permission-denied", "Only admin or admin_rh can create invites");
    }
    const { emails, role, company_id } = request.data;
    if (!emails?.length)
        throw new https_1.HttpsError("invalid-argument", "emails array required");
    if (!role)
        throw new https_1.HttpsError("invalid-argument", "role required");
    if (!company_id)
        throw new https_1.HttpsError("invalid-argument", "company_id required");
    // Admin só pode criar convites para a própria empresa
    if (callerCompanyId && callerCompanyId !== company_id) {
        throw new https_1.HttpsError("permission-denied", "Cannot create invites for a different company");
    }
    const inviteIds = [];
    const batch = db.batch();
    for (const email of emails) {
        const inviteRef = db.collection("invites").doc();
        batch.set(inviteRef, {
            email: email.trim().toLowerCase(),
            role,
            company_id,
            created_by: request.auth.uid,
            createdAt: Date.now(),
            usedAt: null,
        });
        inviteIds.push(inviteRef.id);
    }
    await batch.commit();
    return { created: inviteIds.length, inviteIds };
});
/**
 * Cron diário: verifica vacinas vencendo, módulos abandonados, diagnósticos pendentes.
 * Cria notificações em notifications/{id}.
 * Roda às 08:00 BRT todos os dias.
 */
exports.dailyHealthCheck = (0, scheduler_1.onSchedule)("0 11 * * *", async () => {
    const now = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const passportsSnap = await db.collection("health_passports").get();
    const batch = db.batch();
    let count = 0;
    for (const passDoc of passportsSnap.docs) {
        const passport = passDoc.data();
        const userId = passport.user_id;
        const companyId = passport.company_id;
        // Checar vacinas — se ultima vacina tem mais de 11 meses (influenza anual como proxy)
        const vaccinations = passport.vaccinations ?? [];
        if (vaccinations.length > 0) {
            const lastVaccine = vaccinations.reduce((a, b) => a.date_applied > b.date_applied ? a : b);
            const daysSince = (now - lastVaccine.date_applied) / (1000 * 60 * 60 * 24);
            if (daysSince > 335) {
                const notifRef = db.collection("notifications").doc();
                batch.set(notifRef, {
                    user_id: userId,
                    company_id: companyId,
                    type: "vaccine_expiring",
                    message: "Sua ultima vacinacao tem mais de 11 meses. Que tal verificar o calendario?",
                    action_url: "/app/passaporte",
                    read: false,
                    created_at: now,
                });
                count++;
            }
        }
        // Checar modulos abandonados
        const enrollSnap = await db
            .collection("enrollments")
            .where("uid", "==", userId)
            .where("completed_at", "==", null)
            .get();
        for (const enroll of enrollSnap.docs) {
            const data = enroll.data();
            const startedAt = data.started_at;
            if (now - startedAt > fourteenDaysMs) {
                const notifRef = db.collection("notifications").doc();
                batch.set(notifRef, {
                    user_id: userId,
                    company_id: companyId,
                    type: "module_reminder",
                    message: "Voce tem uma trilha em andamento ha mais de 14 dias. Continue de onde parou!",
                    action_url: `/app/trilha/${data.course_id}`,
                    read: false,
                    created_at: now,
                });
                count++;
            }
        }
    }
    await batch.commit();
    console.log(`dailyHealthCheck: ${count} notificacoes criadas`);
});
/**
 * Cron mensal: calcula ISPC (Índice de Saúde Preventiva Corporativa) por empresa.
 * Roda no dia 1 de cada mês às 06:00 BRT.
 */
exports.calculateISPC = (0, scheduler_1.onSchedule)("0 9 1 * *", async () => {
    const companiesSnap = await db.collection("companies").get();
    const now = Date.now();
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const batch = db.batch();
    for (const compDoc of companiesSnap.docs) {
        const companyId = compDoc.id;
        const [enrollSnap, passSnap, usersSnap] = await Promise.all([
            db.collection("enrollments").where("company_id", "==", companyId).get(),
            db.collection("health_passports").where("company_id", "==", companyId).get(),
            db.collection("users").where("company_id", "==", companyId).get(),
        ]);
        const total = usersSnap.size;
        if (total === 0)
            continue;
        const completed = enrollSnap.docs.filter((d) => d.data().completed_at).length;
        const vaccinated = passSnap.docs.filter((d) => (d.data().vaccinations ?? []).length > 0).length;
        const educationScore = total > 0 ? Math.round((completed / total) * 100) : 0;
        const vaccinationScore = total > 0 ? Math.round((vaccinated / total) * 100) : 0;
        const preventionScore = Math.round((educationScore + vaccinationScore) / 2);
        const overallScore = Math.round(educationScore * 0.4 + vaccinationScore * 0.4 + preventionScore * 0.2);
        const docId = `${companyId}_${period}`;
        const ref = db.collection("ispc_snapshots").doc(docId);
        batch.set(ref, {
            company_id: companyId,
            period,
            score: overallScore,
            breakdown: {
                education: educationScore,
                vaccination: vaccinationScore,
                prevention: preventionScore,
            },
            created_at: now,
        });
    }
    await batch.commit();
    console.log(`calculateISPC: periodo ${period} processado`);
});
/**
 * Envia email de convite para o colaborador.
 * Em produção, configura SMTP_USER / SMTP_PASS / SMTP_HOST via Firebase environment.
 * Em dev/demo, usa Ethereal (captura sem enviar) e retorna preview_url.
 */
exports.sendInviteEmail = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { inviteId, toEmail, toName, companyName } = request.data;
    if (!inviteId || !toEmail) {
        throw new https_1.HttpsError("invalid-argument", "inviteId e toEmail são obrigatórios");
    }
    // Verifica que o convite pertence à empresa do RH que está chamando
    const inviteSnap = await db.collection("invites").doc(inviteId).get();
    if (!inviteSnap.exists)
        throw new https_1.HttpsError("not-found", "Convite não encontrado");
    const invite = inviteSnap.data();
    if (invite.company_id !== request.auth.token["company_id"]) {
        throw new https_1.HttpsError("permission-denied", "Convite não pertence à sua empresa");
    }
    // Link de aceite — usa APP_URL env var para suportar custom domain em produção
    const appUrl = process.env.APP_URL || "https://veglia-6e734.web.app";
    const inviteLink = `${appUrl}/aceitar-convite?token=${inviteId}`;
    // ── Configurar transporte SMTP ──────────────────────────────────────────────
    let transporter;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST ?? "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: { user: smtpUser, pass: smtpPass },
        });
    }
    else {
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
/**
 * Cron diário às 09:00 BRT: verifica vencimentos de vacinas (30 dias) e
 * atualiza o status na collection vaccination_records.
 * Cria notificações na collection notifications para alertas próximos.
 */
exports.checkComplianceAlerts = (0, scheduler_1.onSchedule)("0 12 * * *", async () => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const vaxSnap = await db.collection("vaccination_records").get();
    const batch = db.batch();
    let alertCount = 0;
    for (const vaxDoc of vaxSnap.docs) {
        const data = vaxDoc.data();
        const nextDose = data.next_dose_date;
        const currentStatus = data.status;
        if (!nextDose)
            continue;
        let newStatus;
        if (nextDose < now) {
            newStatus = "overdue";
        }
        else if (nextDose <= now + thirtyDaysMs) {
            newStatus = "pending";
        }
        else {
            newStatus = "up_to_date";
        }
        // Atualiza status se mudou
        if (newStatus !== currentStatus) {
            batch.update(vaxDoc.ref, { status: newStatus, status_updated_at: now });
        }
        // Cria notificação para pending/overdue
        if ((newStatus === "pending" || newStatus === "overdue") && currentStatus === "up_to_date") {
            const notifRef = db.collection("notifications").doc();
            const daysUntil = Math.round((nextDose - now) / (1000 * 60 * 60 * 24));
            batch.set(notifRef, {
                company_id: data.company_id,
                user_id: data.employee_id,
                type: "vaccine_expiring",
                message: newStatus === "overdue"
                    ? `Vacina ${data.vaccine_name} está vencida. Regularize para manter o compliance.`
                    : `Vacina ${data.vaccine_name} vence em ${daysUntil} dias. Agende com antecedência.`,
                action_url: "/app/compliance/vacinacao",
                read: false,
                created_at: now,
            });
            alertCount++;
        }
    }
    await batch.commit();
    console.log(`checkComplianceAlerts: ${alertCount} alertas gerados`);
});
/**
 * Trigger: recalcula o compliance_score da empresa sempre que um enrollment
 * ou vaccination_record é criado/atualizado.
 * Atualiza a collection compliance_scores/{company_id}.
 */
exports.syncComplianceScore = (0, firestore_1.onDocumentWritten)("{collection}/{docId}", async (event) => {
    const collection = event.params.collection;
    // Só dispara para as collections relevantes
    if (collection !== "enrollments" && collection !== "vaccination_records") {
        return;
    }
    const data = event.data?.after?.data() ?? event.data?.before?.data();
    if (!data)
        return;
    const companyId = data.company_id;
    if (!companyId)
        return;
    // Busca dados da empresa para calcular score
    const [usersSnap, enrollSnap, vaxSnap, assessSnap] = await Promise.all([
        db.collection("users").where("company_id", "==", companyId).get(),
        db.collection("enrollments").where("company_id", "==", companyId).get(),
        db.collection("vaccination_records").where("company_id", "==", companyId).get(),
        db.collection("health_assessments").where("company_id", "==", companyId).get(),
    ]);
    const total = usersSnap.size;
    if (total === 0)
        return;
    const completedEnrolls = enrollSnap.docs.filter((d) => d.data().completed_at != null).length;
    const vaccinatedUsers = new Set(vaxSnap.docs.map((d) => d.data().employee_id)).size;
    const assessedUsers = assessSnap.size;
    const educationScore = Math.round((completedEnrolls / total) * 100);
    const vaccinationScore = Math.round((vaccinatedUsers / total) * 100);
    const mentalHealthScore = assessedUsers > 0
        ? Math.min(100, Math.round((assessedUsers / total) * 80 + 20))
        : 40;
    const ergonomicsScore = 50; // mock até NR-1 ter tracking específico
    const overallScore = Math.round(educationScore * 0.35 +
        vaccinationScore * 0.35 +
        mentalHealthScore * 0.15 +
        ergonomicsScore * 0.15);
    let riskLevel;
    if (overallScore >= 91)
        riskLevel = "excelencia";
    else if (overallScore >= 71)
        riskLevel = "bom";
    else if (overallScore >= 41)
        riskLevel = "atencao";
    else
        riskLevel = "alto";
    await db.collection("compliance_scores").doc(companyId).set({
        company_id: companyId,
        vaccination_coverage: vaccinationScore,
        training_compliance: educationScore,
        mental_health_score: mentalHealthScore,
        ergonomics_score: ergonomicsScore,
        overall_score: overallScore,
        risk_level: riskLevel,
        updated_at: Date.now(),
    }, { merge: true });
    // Registra evento de auditoria para mudança significativa de score
    const prevSnap = await db.collection("compliance_scores").doc(companyId).get();
    const prevScore = prevSnap.data()?.overall_score;
    if (prevScore !== undefined && Math.abs(overallScore - prevScore) >= 5) {
        await db.collection("audit_events").add({
            company_id: companyId,
            event_type: "compliance_score_changed",
            payload: {
                previous_score: prevScore,
                new_score: overallScore,
                risk_level: riskLevel,
                description: `Score de compliance alterado de ${prevScore} para ${overallScore}`,
            },
            timestamp: Date.now(),
        });
    }
    console.log(`syncComplianceScore: company ${companyId} → score ${overallScore} (${riskLevel})`);
});
/**
 * Gera o Certificado de Empresa Verificada Vegl.ia.
 * Cria PDF com score de compliance, número de colaboradores certificados e hash SHA-256.
 * Idempotente por company_id + year.
 */
exports.generateCompanyCertificate = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const callerRole = request.auth.token["role"];
    if (callerRole !== "admin" && callerRole !== "admin_rh") {
        throw new https_1.HttpsError("permission-denied", "Apenas admin ou admin_rh pode gerar certificado de empresa");
    }
    const { company_id, year } = request.data;
    if (!company_id || !year) {
        throw new https_1.HttpsError("invalid-argument", "company_id e year são obrigatórios");
    }
    // Verifica que o caller pertence à empresa
    const callerCompanyId = request.auth.token["company_id"];
    if (callerCompanyId && callerCompanyId !== company_id) {
        throw new https_1.HttpsError("permission-denied", "Empresa inválida");
    }
    const certDocId = `${company_id}_${year}`;
    const certRef = db.collection("company_certificates").doc(certDocId);
    // Idempotente: retorna o existente se já emitido este ano
    const existing = await certRef.get();
    if (existing.exists) {
        return {
            pdf_url: existing.data()?.pdf_url ?? "",
            score: existing.data()?.score ?? 0,
            already_issued: true,
        };
    }
    // Busca dados da empresa
    const [companySnap, complianceSnap, usersSnap, certificatesSnap] = await Promise.all([
        db.collection("companies").doc(company_id).get(),
        db.collection("compliance_scores").doc(company_id).get(),
        db.collection("users").where("company_id", "==", company_id).get(),
        db.collection("certificates").where("company_id", "==", company_id).get(),
    ]);
    if (!companySnap.exists)
        throw new https_1.HttpsError("not-found", "Empresa não encontrada");
    const companyData = companySnap.data();
    const complianceData = complianceSnap.exists ? complianceSnap.data() : null;
    const overallScore = complianceData?.overall_score ?? 0;
    const totalCollaborators = usersSnap.size;
    const certifiedCollaborators = certificatesSnap.size;
    if (overallScore < 40) {
        throw new https_1.HttpsError("failed-precondition", `Score mínimo para certificação é 40. Score atual: ${overallScore}`);
    }
    // Hash de verificação
    const certPayload = JSON.stringify({
        company_id,
        company_name: companyData.name,
        year,
        score: overallScore,
        collaborators_certified: certifiedCollaborators,
        issued_at: Date.now(),
    });
    const hash = crypto.createHash("sha256").update(certPayload).digest("hex");
    // Gera PDF
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    // Fundo
    page.drawRectangle({ x: 0, y: 0, width, height, color: (0, pdf_lib_1.rgb)(0.043, 0.145, 0.271) });
    page.drawRectangle({
        x: 20, y: 20, width: width - 40, height: height - 40,
        borderColor: (0, pdf_lib_1.rgb)(0.365, 0.827, 0.659), borderWidth: 2,
        color: (0, pdf_lib_1.rgb)(0, 0, 0), opacity: 0,
    });
    // Título
    page.drawText("CERTIFICADO DE EMPRESA VERIFICADA", {
        x: width / 2 - 210, y: height - 100,
        size: 22, font: fontBold, color: (0, pdf_lib_1.rgb)(0.788, 0.663, 0.431),
    });
    page.drawText("Programa de Compliance Preventivo Corporativo · Lei 15.377/2026", {
        x: width / 2 - 210, y: height - 135,
        size: 13, font: fontRegular, color: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7),
    });
    // Nome da empresa
    page.drawText("Certificamos que", {
        x: width / 2 - 60, y: height / 2 + 50,
        size: 13, font: fontRegular, color: (0, pdf_lib_1.rgb)(0.6, 0.6, 0.6),
    });
    const nome = companyData.name;
    page.drawText(nome, {
        x: Math.max(40, width / 2 - nome.length * 7), y: height / 2 + 10,
        size: 26, font: fontBold, color: (0, pdf_lib_1.rgb)(1, 1, 1),
    });
    page.drawText("implementou com êxito o Programa de Compliance Preventivo Corporativo", {
        x: width / 2 - 235, y: height / 2 - 30,
        size: 13, font: fontRegular, color: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7),
    });
    // Score e estatísticas
    page.drawText(`Score de Compliance: ${overallScore}/100  ·  ${certifiedCollaborators} colaboradores certificados`, {
        x: width / 2 - 170, y: height / 2 - 70,
        size: 12, font: fontBold, color: (0, pdf_lib_1.rgb)(0.365, 0.827, 0.659),
    });
    // Validade
    const issued = new Date();
    const expires = new Date(issued);
    expires.setFullYear(expires.getFullYear() + 1);
    page.drawText(`Emitido em ${issued.toLocaleDateString("pt-BR")} · Válido até ${expires.toLocaleDateString("pt-BR")}`, { x: width / 2 - 130, y: height / 2 - 110, size: 11, font: fontRegular, color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5) });
    // Hash e rodapé
    page.drawText(`Verificacao: ${hash.substring(0, 32)}...`, {
        x: 40, y: 35, size: 8, font: fontRegular, color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3),
    });
    page.drawText("Powered by Vacivitta", {
        x: width - 150, y: 35, size: 9, font: fontBold, color: (0, pdf_lib_1.rgb)(0.365, 0.827, 0.659),
    });
    const pdfBytes = await pdfDoc.save();
    // Salva no Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(`company_certificates/${certDocId}.pdf`);
    await file.save(Buffer.from(pdfBytes), { metadata: { contentType: "application/pdf" } });
    await file.makePublic();
    const pdfUrl = `https://storage.googleapis.com/${bucket.name}/company_certificates/${certDocId}.pdf`;
    // Persiste no Firestore
    await certRef.set({
        company_id,
        year,
        score: overallScore,
        collaborators_certified: certifiedCollaborators,
        total_collaborators: totalCollaborators,
        pdf_url: pdfUrl,
        hash,
        issued_at: Date.now(),
        expires_at: expires.getTime(),
    });
    return { pdf_url: pdfUrl, score: overallScore, already_issued: false };
});
/**
 * Recebe lead capturado pelo chat Vela ou formulário da landing page.
 * Salva em /leads com status inicial "novo" para o Kanban de leads no admin.
 * Não requer autenticação — é endpoint público da landing page.
 */
function inferPlan(size) {
    const n = parseInt(size, 10);
    if (isNaN(n) || n <= 30)
        return "starter";
    if (n <= 250)
        return "compliance";
    if (n <= 1000)
        return "professional";
    return "enterprise";
}
exports.createLandingLead = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const { name, company, size, email, phone, message, source, timestamp, conversation_summary } = req.body;
    if (!email || !name || !company) {
        res.status(400).json({ success: false, error: "name, company e email são obrigatórios" });
        return;
    }
    const recommended_plan = inferPlan(size ?? "0");
    const leadData = {
        name: name.trim(),
        company: company.trim(),
        size: size || "não informado",
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        message: message?.trim() || "",
        source: source || "landing_page",
        original_timestamp: timestamp || null,
        conversation_summary: conversation_summary || "",
        recommended_plan,
        status: "novo",
        assignee: null,
        notes: [],
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
    };
    const docRef = await db.collection("leads").add(leadData);
    res.json({ success: true, lead_id: docRef.id });
});
/**
 * Calcula o Preventive Health Score do colaborador a partir das respostas
 * do diagnóstico. Chamado pelo DiagnosticoColaborador.tsx como alternativa
 * ao cálculo client-side (para garantir integridade do score).
 */
exports.calculatePreventiveScore = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const { answers } = request.data;
    if (!answers || typeof answers !== "object") {
        throw new https_1.HttpsError("invalid-argument", "answers object required");
    }
    // Mapeamento de scores por pergunta (mesma lógica do client)
    const SCORE_MAPS = {
        q_sleep: [0, 33, 66, 100],
        q_exercise: [0, 33, 66, 100],
        q_stress: [0, 33, 66, 100],
        q_smoking: [0, 40, 70, 100],
        q_alcohol: [0, 33, 66, 100],
        q_diet: [0, 33, 66, 100],
        q_vaccine_flu: [0, 20, 100],
        q_vaccine_covid: [0, 33, 66, 100],
        q_chronic: [0, 40, 60, 100],
        q_checkup: [0, 33, 66, 100],
        q_water: [0, 33, 66, 100],
        q_mental: [0, 25, 66, 100],
    };
    const scores = Object.entries(answers).map(([key, idx]) => {
        const map = SCORE_MAPS[key];
        return map && idx >= 0 && idx < map.length ? map[idx] : 50;
    });
    if (scores.length === 0)
        throw new https_1.HttpsError("invalid-argument", "No valid answers");
    const preventive_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    let classification;
    if (preventive_score >= 91)
        classification = "excelencia";
    else if (preventive_score >= 71)
        classification = "bom";
    else if (preventive_score >= 41)
        classification = "atencao";
    else
        classification = "alto_risco";
    return { preventive_score, classification };
});
exports.importEmployees = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const role = request.auth.token.role;
    if (!["admin", "admin_rh", "rh"].includes(role))
        throw new https_1.HttpsError("permission-denied", "RH role required");
    const company_id = request.auth.token.company_id;
    const { employees } = request.data;
    if (!Array.isArray(employees) || employees.length === 0)
        throw new https_1.HttpsError("invalid-argument", "employees array required");
    if (employees.length > 500)
        throw new https_1.HttpsError("invalid-argument", "Max 500 employees per batch");
    const batchRef = db.collection("import_batches").doc();
    const errors = [];
    let created = 0;
    let skipped = 0;
    // Cria o documento de batch primeiro (status processing)
    await batchRef.set({
        company_id,
        total: employees.length,
        created: 0,
        skipped: 0,
        errors: [],
        status: "processing",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        created_by: request.auth.uid,
    });
    // Processa em chunks de 100 (limite de batch do Firestore)
    const CHUNK = 100;
    for (let i = 0; i < employees.length; i += CHUNK) {
        const chunk = employees.slice(i, i + CHUNK);
        const batch = db.batch();
        for (const emp of chunk) {
            if (!emp.email || !emp.name) {
                errors.push(`Linha ${i + chunk.indexOf(emp) + 1}: email e nome obrigatórios`);
                skipped++;
                continue;
            }
            const email = emp.email.trim().toLowerCase();
            const existing = await db
                .collection("invites")
                .where("email", "==", email)
                .where("company_id", "==", company_id)
                .limit(1)
                .get();
            if (!existing.empty) {
                skipped++;
                continue;
            }
            const inviteRef = db.collection("invites").doc();
            batch.set(inviteRef, {
                email,
                name: emp.name.trim(),
                department: emp.department?.trim() ?? "",
                role: "collaborator",
                company_id,
                cpf: emp.cpf?.replace(/\D/g, "") ?? null,
                employee_status: "importado",
                invite_token: crypto.randomUUID(),
                email_sent_at: null,
                used_at: null,
                source: "import",
                batch_id: batchRef.id,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            created++;
        }
        await batch.commit();
    }
    // Atualiza batch com resultado final
    await batchRef.update({
        created,
        skipped,
        errors,
        status: "done",
        finished_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { batch_id: batchRef.id, total: employees.length, created, skipped, errors };
});
// ─────────────────────────────────────────────────────────────────────────────
// F4b · importEmployeesWebhook — Endpoint HTTP para integração folha de pag.
// Autenticação: Authorization: Bearer <webhook_token> (armazenado em companies)
// ─────────────────────────────────────────────────────────────────────────────
exports.importEmployeesWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }
    // Extrai token do header Authorization
    const authHeader = req.headers.authorization ?? "";
    if (!authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization header required" });
        return;
    }
    const token = authHeader.slice(7).trim();
    // Busca empresa pelo webhook_token
    const companySnap = await db
        .collection("companies")
        .where("webhook_token", "==", token)
        .limit(1)
        .get();
    if (companySnap.empty) {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    const company_id = companySnap.docs[0].id;
    const { employees } = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
        res.status(400).json({ error: "employees array required" });
        return;
    }
    if (employees.length > 1000) {
        res.status(400).json({ error: "Max 1000 employees per request" });
        return;
    }
    const batchRef = db.collection("import_batches").doc();
    let created = 0;
    let skipped = 0;
    const errors = [];
    await batchRef.set({
        company_id,
        total: employees.length,
        created: 0,
        skipped: 0,
        errors: [],
        status: "processing",
        source: "webhook",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    const CHUNK = 100;
    for (let i = 0; i < employees.length; i += CHUNK) {
        const chunk = employees.slice(i, i + CHUNK);
        const batch = db.batch();
        for (const emp of chunk) {
            if (!emp.email || !emp.name) {
                skipped++;
                continue;
            }
            const email = emp.email.trim().toLowerCase();
            const existing = await db
                .collection("invites")
                .where("email", "==", email)
                .where("company_id", "==", company_id)
                .limit(1)
                .get();
            if (!existing.empty) {
                skipped++;
                continue;
            }
            const inviteRef = db.collection("invites").doc();
            batch.set(inviteRef, {
                email,
                name: emp.name.trim(),
                department: emp.department?.trim() ?? "",
                role: "collaborator",
                company_id,
                cpf: emp.cpf?.replace(/\D/g, "") ?? null,
                employee_status: "importado",
                invite_token: crypto.randomUUID(),
                email_sent_at: null,
                used_at: null,
                source: "webhook",
                batch_id: batchRef.id,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            created++;
        }
        await batch.commit();
    }
    await batchRef.update({
        created,
        skipped,
        errors,
        status: "done",
        finished_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, batch_id: batchRef.id, total: employees.length, created, skipped });
});
// ─────────────────────────────────────────────────────────────────────────────
// F5 · syncEmployeeStatus — Trigger que mantém employee_status em invites
//      atualizado conforme enrollments e certificates são criados.
// ─────────────────────────────────────────────────────────────────────────────
exports.syncEmployeeStatus = (0, firestore_1.onDocumentWritten)("{collection}/{docId}", async (event) => {
    const collection = event.params.collection;
    const data = event.data?.after?.data();
    if (!data)
        return;
    // Só interessa enrollments e certificates
    if (collection !== "enrollments" && collection !== "certificates")
        return;
    const uid = data.uid;
    if (!uid)
        return;
    // Busca o convite correspondente ao email do usuário
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists)
        return;
    const email = userDoc.data()?.email;
    if (!email)
        return;
    const inviteSnap = await db
        .collection("invites")
        .where("email", "==", email)
        .where("company_id", "==", data.company_id)
        .limit(1)
        .get();
    if (inviteSnap.empty)
        return;
    const inviteRef = inviteSnap.docs[0].ref;
    const invite = inviteSnap.docs[0].data();
    // Determina o novo status baseado no estado atual e no evento
    let newStatus = null;
    if (collection === "certificates") {
        newStatus = "certificado_emitido";
    }
    else if (collection === "enrollments") {
        const watchPct = data.watch_percent_last;
        const completed = data.completed;
        if (completed) {
            newStatus = "concluido";
        }
        else if ((watchPct ?? 0) > 0) {
            newStatus = "em_andamento";
        }
    }
    if (!newStatus)
        return;
    // Só avança no pipeline, nunca regride
    const STATUS_ORDER = [
        "importado",
        "convite_enviado",
        "acesso_aceito",
        "em_andamento",
        "concluido",
        "certificado_emitido",
    ];
    const current = invite.employee_status;
    const currentIdx = STATUS_ORDER.indexOf(current ?? "importado");
    const newIdx = STATUS_ORDER.indexOf(newStatus);
    if (newIdx > currentIdx) {
        await inviteRef.update({ employee_status: newStatus });
    }
});
//# sourceMappingURL=index.js.map