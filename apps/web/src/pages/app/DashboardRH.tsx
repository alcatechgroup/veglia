import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { useComplianceData } from "@/hooks/useComplianceData";
import type { CollaboradorCompliance } from "@/hooks/useComplianceData";

// ─── Modal Adicionar Colaborador ──────────────────────────────────────────────

interface AddCollaboratorModalProps {
  companyId: string;
  onClose: () => void;
}

export function AddCollaboratorModal({ companyId, onClose }: AddCollaboratorModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const docRef = await addDoc(collection(db, "invites"), {
        company_id: companyId,
        email: email.trim().toLowerCase(),
        role: "collaborator",
        displayName: name.trim(),
        cargo: cargo.trim(),
        createdAt: serverTimestamp(),
        usedAt: null,
      });
      const link = `${window.location.origin}/aceitar-convite?token=${docRef.id}`;
      setInviteLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (inviteLink) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Convite criado!</h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/25 rounded-xl p-3">
              <p className="text-xs font-medium text-[#5DD3A8] mb-2">Link de convite</p>
              <p className="text-xs text-white/80 break-all font-mono leading-relaxed">
                {inviteLink}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-all ${
                copied
                  ? "bg-[#4BC495] text-[#0B2545] cursor-default"
                  : "bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545]"
              }`}
            >
              {copied ? "Link copiado!" : "Copiar link"}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Adicionar colaborador</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Cargo</label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Analista de RH"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Salvando..." : "Convidar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-[#5DD3A8]" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: CollaboradorCompliance["status"] }) {
  if (status === "completo") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
        <span>✓</span> Completo
      </span>
    );
  }
  if (status === "em_andamento") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded-full">
        <span>⚠</span> Em andamento
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
      <span>○</span> Pendente
    </span>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export default function DashboardRH() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";
  const [showModal, setShowModal] = useState(false);

  const { users, loading, percentCompliance, totalCertificados, pendingInvites } =
    useComplianceData(companyId);

  const total = users.length;
  const emAndamento = users.filter((u) => u.status === "em_andamento").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard RH</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Compliance Vacinal — Lei 15.377/2026
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Adicionar colaborador
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Compliance ativo"
          value={loading ? "—" : `${percentCompliance}%`}
          sub={loading ? "carregando..." : `${totalCertificados} de ${total} colaboradores`}
          accent
        />
        <KpiCard
          label="Total colaboradores"
          value={loading ? "—" : total}
          sub="registrados na plataforma"
        />
        <KpiCard
          label="Certificados emitidos"
          value={loading ? "—" : totalCertificados}
          sub="Lei 15.377/2026"
        />
        <KpiCard
          label="Em andamento"
          value={loading ? "—" : emAndamento}
          sub="trilhas iniciadas"
        />
        <KpiCard
          label="Convites pendentes"
          value={loading ? "—" : pendingInvites}
          sub="aguardando aceite"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Colaboradores</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            Carregando...
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-white/30 text-sm">Nenhum colaborador cadastrado.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-[#5DD3A8] text-sm hover:underline"
            >
              Adicionar o primeiro colaborador
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3">Nome</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Cargo</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Certificado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row, idx) => (
                <tr
                  key={row.uid}
                  className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${
                    idx % 2 === 0 ? "" : "bg-white/[0.02]"
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-white">{row.name}</p>
                      <p className="text-[11px] text-white/30">{row.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">{row.cargo ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/40">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AddCollaboratorModal
          companyId={companyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
