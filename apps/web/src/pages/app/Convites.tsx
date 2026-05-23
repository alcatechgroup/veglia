import { useEffect, useRef, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import QRCode from "qrcode";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { AddCollaboratorModal } from "@/pages/app/DashboardRH";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InviteDoc {
  id: string;
  company_id: string;
  email: string;
  displayName: string;
  cargo: string;
  createdAt: { toMillis?: () => number; seconds?: number } | number | null;
  usedAt: { toMillis?: () => number; seconds?: number } | number | null;
  email_sent_at?: number | null;
  email_preview?: string | null;
}

interface SendInviteEmailPayload {
  inviteId: string;
  toEmail: string;
  toName: string;
  companyName: string;
}

interface SendInviteEmailResult {
  success: boolean;
  preview_url: string | null;
  message: string;
}

type FilterTab = "todos" | "aguardando" | "criada";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMs(
  val: InviteDoc["createdAt"]
): number | null {
  if (!val) return null;
  if (typeof val === "number") return val;
  if (typeof val === "object") {
    if ("toMillis" in val && typeof val.toMillis === "function") return val.toMillis();
    if ("seconds" in val && typeof val.seconds === "number") return val.seconds * 1000;
  }
  return null;
}

function formatDate(val: InviteDoc["createdAt"]): string {
  const ms = toMs(val);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("pt-BR");
}

function inviteLink(inviteId: string): string {
  return `${window.location.origin}/aceitar-convite?token=${inviteId}`;
}

// ─── Modal QR Code ────────────────────────────────────────────────────────────

interface QrModalProps {
  link: string;
  onClose: () => void;
}

function QrModal({ link, onClose }: QrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, link, {
      width: 240,
      margin: 2,
      color: { dark: "#0B2545", light: "#F4EDE0" },
    });
  }, [link]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">QR Code do convite</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="rounded-xl overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-white/40 mb-1">Link do convite</p>
          <p className="text-[11px] text-white/70 break-all font-mono leading-relaxed">
            {link}
          </p>
        </div>

        <p className="text-[11px] text-white/30 text-center mb-4">
          Imprima este QR e afixe no mural da empresa
        </p>

        <button
          onClick={onClose}
          className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function InviteStatusBadge({ usedAt }: { usedAt: InviteDoc["usedAt"] }) {
  if (usedAt == null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
        <span>○</span> Aguardando
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
      <span>✓</span> Conta criada
    </span>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Convites() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const [invites, setInvites] = useState<InviteDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailSentId, setEmailSentId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  // ── Nome da empresa ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    getDoc(doc(db, "companies", companyId)).then((snap) => {
      if (snap.exists()) setCompanyName((snap.data() as { name: string }).name ?? "");
    });
  }, [companyId]);

  // ── Snapshot de convites ──────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "invites"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      const docs: InviteDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<InviteDoc, "id">),
      }));
      // Mais recentes primeiro
      docs.sort((a, b) => {
        const ta = toMs(a.createdAt) ?? 0;
        const tb = toMs(b.createdAt) ?? 0;
        return tb - ta;
      });
      setInvites(docs);
      setLoading(false);
    });
  }, [companyId]);

  // ── Filtro ────────────────────────────────────────────────────────────────
  const filtered = invites.filter((inv) => {
    if (filter === "aguardando") return inv.usedAt == null;
    if (filter === "criada") return inv.usedAt != null;
    return true;
  });

  const pendingCount = invites.filter((inv) => inv.usedAt == null).length;

  // ── Copiar link ───────────────────────────────────────────────────────────
  const handleCopy = async (invite: InviteDoc) => {
    const link = inviteLink(invite.id);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Enviar email de convite ───────────────────────────────────────────────
  const handleSendEmail = async (invite: InviteDoc) => {
    if (sendingEmailId === invite.id) return;
    // QW6: confirmação para evitar reenvio acidental
    const jaEnviado = !!invite.email_sent_at;
    if (jaEnviado) {
      const ok = window.confirm(
        `Enviar novamente o convite para ${invite.email}?\n\nUm email já foi enviado anteriormente.`
      );
      if (!ok) return;
    }
    setSendingEmailId(invite.id);
    try {
      const functions = getFunctions();
      const sendInviteEmail = httpsCallable<SendInviteEmailPayload, SendInviteEmailResult>(
        functions,
        "sendInviteEmail"
      );
      const result = await sendInviteEmail({
        inviteId: invite.id,
        toEmail: invite.email,
        toName: invite.displayName,
        companyName,
      });
      setEmailSentId(invite.id);
      // Em modo demo, abre o preview no Ethereal
      if (result.data.preview_url) {
        window.open(result.data.preview_url, "_blank", "noopener,noreferrer");
      }
      setTimeout(() => setEmailSentId(null), 3000);
    } catch (err) {
      console.error("Erro ao enviar convite:", err);
    } finally {
      setSendingEmailId(null);
    }
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "aguardando", label: "Aguardando" },
    { id: "criada", label: "Conta criada" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Convites</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Gerencie os convites enviados para sua equipe
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Novo convite
        </button>
      </div>

      {/* Banner de alerta */}
      {!loading && pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3">
          <span className="text-amber-400 text-sm">⚠</span>
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{pendingCount}</span>{" "}
            {pendingCount === 1
              ? "colaborador ainda não aceitou o convite"
              : "colaboradores ainda não aceitaram o convite"}{" "}
            — envie um lembrete
          </p>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === tab.id
                ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/70"
            }`}
          >
            {tab.label}
            {tab.id === "aguardando" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-white/30 text-sm">Nenhum convite encontrado.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-[#5DD3A8] text-sm hover:underline"
            >
              Criar primeiro convite
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3">Nome</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">E-mail</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Cargo</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Data convite</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invite, idx) => (
                <tr
                  key={invite.id}
                  className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${
                    idx % 2 === 0 ? "" : "bg-white/[0.02]"
                  }`}
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-white">
                    {invite.displayName || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">{invite.email}</td>
                  <td className="px-4 py-3.5 text-sm text-white/50">{invite.cargo || "—"}</td>
                  <td className="px-4 py-3.5">
                    <InviteStatusBadge usedAt={invite.usedAt} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/40">
                    {formatDate(invite.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopy(invite)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          copiedId === invite.id
                            ? "bg-[#5DD3A8]/20 text-[#5DD3A8]"
                            : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                        }`}
                      >
                        {copiedId === invite.id ? "Copiado!" : "Copiar link"}
                      </button>
                      <button
                        onClick={() => setQrLink(inviteLink(invite.id))}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                      >
                        QR Code
                      </button>
                      {/* Botão de email — oculto para convites já aceitos */}
                      {invite.usedAt == null && (
                        <button
                          onClick={() => handleSendEmail(invite)}
                          disabled={sendingEmailId === invite.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            emailSentId === invite.id
                              ? "bg-[#5DD3A8]/20 text-[#5DD3A8]"
                              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                          }`}
                        >
                          {sendingEmailId === invite.id
                            ? "Enviando..."
                            : emailSentId === invite.id
                            ? "Enviado!"
                            : "Enviar email"}
                        </button>
                      )}
                      {/* Badge permanente se email já foi enviado */}
                      {invite.email_sent_at && invite.usedAt == null && emailSentId !== invite.id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full">
                          <span>✉</span> Email enviado
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modais */}
      {showAddModal && (
        <AddCollaboratorModal
          companyId={companyId}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {qrLink && (
        <QrModal link={qrLink} onClose={() => setQrLink(null)} />
      )}
    </div>
  );
}
