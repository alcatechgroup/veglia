import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { Campaign, CampaignType, CampaignStatus } from "@veglia/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(type: CampaignType): string {
  const map: Record<CampaignType, string> = {
    vaccination: "Vacinação",
    education: "Educação",
    prevention: "Prevenção",
  };
  return map[type];
}

function statusLabel(status: CampaignStatus): string {
  const map: Record<CampaignStatus, string> = {
    draft: "Rascunho",
    active: "Ativa",
    completed: "Encerrada",
  };
  return map[status];
}

function statusColor(status: CampaignStatus): string {
  const map: Record<CampaignStatus, string> = {
    draft: "text-white/40 bg-white/5 border-white/10",
    active: "text-[#5DD3A8] bg-[#5DD3A8]/10 border-[#5DD3A8]/25",
    completed: "text-white/30 bg-white/5 border-white/10",
  };
  return map[status];
}

function progressPercent(stats: Campaign["stats"]): number {
  const total = stats.invited;
  if (!total) return 0;
  return Math.round((stats.completed / total) * 100);
}

// ─── Modal Nova Campanha ──────────────────────────────────────────────────────

interface NewCampaignModalProps {
  companyId: string;
  createdBy: string;
  onClose: () => void;
}

function NewCampaignModal({ companyId, createdBy, onClose }: NewCampaignModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("vaccination");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startsAt || !endsAt) return;
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "campaigns"), {
        company_id: companyId,
        name: name.trim(),
        type,
        status: "draft" as CampaignStatus,
        starts_at: new Date(startsAt).getTime(),
        ends_at: new Date(endsAt).getTime(),
        created_by: createdBy,
        created_at: Date.now(),
        stats: { invited: 0, enrolled: 0, completed: 0 },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar campanha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Nova campanha</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
          >
            x
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Nome da campanha *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Campanha de Vacinação Q2 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CampaignType)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            >
              <option value="vaccination">Vacinação</option>
              <option value="education">Educação</option>
              <option value="prevention">Prevenção</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Início *</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Fim *</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>
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
              disabled={loading || !name.trim() || !startsAt || !endsAt}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Salvando..." : "Criar campanha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card de Campanha ─────────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaign;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const navigate = useNavigate();
  const pct = progressPercent(campaign.stats);

  const typeIcon: Record<CampaignType, string> = {
    vaccination: "◈",
    education: "◎",
    prevention: "◇",
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl text-[#5DD3A8] mt-0.5 shrink-0">
            {typeIcon[campaign.type]}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white leading-snug">{campaign.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">{typeLabel(campaign.type)}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border shrink-0 ${statusColor(campaign.status)}`}
        >
          {statusLabel(campaign.status)}
        </span>
      </div>

      {/* Datas */}
      <div className="flex gap-4 text-xs text-white/40">
        <span>Inicio: {new Date(campaign.starts_at).toLocaleDateString("pt-BR")}</span>
        <span>Fim: {new Date(campaign.ends_at).toLocaleDateString("pt-BR")}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Convidados", value: campaign.stats.invited },
          { label: "Inscritos", value: campaign.stats.enrolled },
          { label: "Concluidos", value: campaign.stats.completed },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-xl px-3 py-2 text-center">
            <p className="text-base font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      <div>
        <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
          <span>Adesao</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5DD3A8] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Acao */}
      {campaign.type === "vaccination" && campaign.status === "active" && (
        <button
          onClick={() => navigate("/app/in-company")}
          className="w-full text-center text-xs font-medium text-[#5DD3A8] hover:text-[#4BC495] py-1 transition-colors"
        >
          Agendar In-Company VaciVitta
        </button>
      )}
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Campanhas() {
  const { claims, firebaseUser } = useAuth();
  const companyId = claims?.company_id ?? "";
  const uid = firebaseUser?.uid ?? "";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "campaigns"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
      docs.sort((a, b) => b.created_at - a.created_at);
      setCampaigns(docs);
      setLoading(false);
    });
  }, [companyId]);

  const filtered =
    filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  const filterTabs: { id: CampaignStatus | "all"; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "active", label: "Ativas" },
    { id: "draft", label: "Rascunho" },
    { id: "completed", label: "Encerradas" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas de Saude</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Motor de campanhas preventivas corporativas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Nova campanha
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
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
          </button>
        ))}
      </div>

      {/* Grid de campanhas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 h-56 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-12 text-center">
          <p className="text-white/30 text-sm mb-3">Nenhuma campanha encontrada.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-[#5DD3A8] text-sm hover:underline"
          >
            Criar primeira campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}

      {showModal && (
        <NewCampaignModal
          companyId={companyId}
          createdBy={uid}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
