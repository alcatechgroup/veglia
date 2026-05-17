import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { SipatEvent } from "@veglia/shared";

// ─── Template SIPAT ───────────────────────────────────────────────────────────

const SIPAT_TEMPLATE_DAYS = [
  {
    day: 1,
    title: "Abertura e Conscientizacao",
    description: "Palestra de abertura, apresentacao do programa, trilha Lei 15.377",
  },
  {
    day: 2,
    title: "Saude Mental e NR-1",
    description: "Workshop saude psicossocial, obrigacoes NR-1, roda de conversa",
  },
  {
    day: 3,
    title: "Vacinacao e Prevencao",
    description: "Calendario vacinal, dicas de prevencao, stand VaciVitta",
  },
  {
    day: 4,
    title: "Ergonomia e Acidentes",
    description: "Treinamento pratico de ergonomia, simulacao de emergencia",
  },
  {
    day: 5,
    title: "Encerramento e Certificacao",
    description: "Quiz final, emissao de certificados de participacao, encerramento",
  },
];

// ─── Modal criar SIPAT ────────────────────────────────────────────────────────

interface NewSipatModalProps {
  companyId: string;
  createdBy: string;
  onClose: () => void;
}

function NewSipatModal({ companyId, createdBy, onClose }: NewSipatModalProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    setLoading(true);
    setError(null);

    try {
      const starts = new Date(startDate).getTime();
      const ends = starts + 4 * 24 * 60 * 60 * 1000; // 5 dias

      await addDoc(collection(db, "sipat_events"), {
        company_id: companyId,
        year,
        status: "draft",
        starts_at: starts,
        ends_at: ends,
        participants: [],
        created_by: createdBy,
        created_at: Date.now(),
        template_days: SIPAT_TEMPLATE_DAYS,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar SIPAT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Criar SIPAT Automatica</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Programa de 5 dias pre-configurado com trilhas e certificados
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
          >
            x
          </button>
        </div>

        {/* Preview do template */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-5 space-y-2">
          <p className="text-xs font-medium text-white/50 mb-3">Programacao automatica (5 dias)</p>
          {SIPAT_TEMPLATE_DAYS.map((d) => (
            <div key={d.day} className="flex items-start gap-3 text-xs">
              <span className="text-[#5DD3A8] font-semibold shrink-0 w-10">Dia {d.day}</span>
              <div>
                <p className="text-white/70 font-medium">{d.title}</p>
                <p className="text-white/30">{d.description}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2024}
                max={2030}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Data de inicio *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
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
              disabled={loading || !startDate}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Criando..." : "Criar SIPAT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card SIPAT ───────────────────────────────────────────────────────────────

interface SipatCardProps {
  sipat: SipatEvent & { template_days?: typeof SIPAT_TEMPLATE_DAYS };
}

function SipatCard({ sipat }: SipatCardProps) {
  const statusColors = {
    draft: "text-white/40 bg-white/5 border-white/10",
    active: "text-[#5DD3A8] bg-[#5DD3A8]/10 border-[#5DD3A8]/25",
    completed: "text-white/30 bg-white/5 border-white/10",
  };

  const statusLabels = {
    draft: "Rascunho",
    active: "Ativa",
    completed: "Encerrada",
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">SIPAT {sipat.year}</h3>
          <p className="text-xs text-white/40 mt-0.5">
            {new Date(sipat.starts_at).toLocaleDateString("pt-BR")} —{" "}
            {new Date(sipat.ends_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <span
          className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border ${
            statusColors[sipat.status]
          }`}
        >
          {statusLabels[sipat.status]}
        </span>
      </div>

      {/* Dias do programa */}
      <div className="space-y-1.5">
        {SIPAT_TEMPLATE_DAYS.map((d) => (
          <div key={d.day} className="flex items-center gap-3 text-xs py-1.5 px-3 bg-white/5 rounded-lg">
            <span className="text-[#5DD3A8] font-semibold w-8 shrink-0">D{d.day}</span>
            <span className="text-white/60">{d.title}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-center">
          <p className="text-base font-bold text-white">{sipat.participants?.length ?? 0}</p>
          <p className="text-[10px] text-white/30">Participantes</p>
        </div>
        {sipat.report_url && (
          <a
            href={sipat.report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-3 py-2 text-center text-xs text-[#5DD3A8] hover:bg-[#5DD3A8]/20 transition-colors"
          >
            Ver relatorio
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Sipat() {
  const { claims, firebaseUser } = useAuth();
  const companyId = claims?.company_id ?? "";
  const uid = firebaseUser?.uid ?? "";

  const [sipats, setSipats] = useState<(SipatEvent & { template_days?: typeof SIPAT_TEMPLATE_DAYS })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "sipat_events"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as SipatEvent & { template_days?: typeof SIPAT_TEMPLATE_DAYS }))
        .sort((a, b) => b.year - a.year);
      setSipats(docs);
      setLoading(false);
    });
  }, [companyId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SIPAT Automatica</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Crie sua SIPAT com 1 clique — 5 dias pre-configurados com trilhas e certificados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span>+</span>
          Nova SIPAT
        </button>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-4 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-2xl px-5 py-4">
        <span className="text-[#5DD3A8] text-xl shrink-0">◎</span>
        <div>
          <p className="text-sm font-semibold text-[#5DD3A8]">SIPAT em conformidade com a NR-1</p>
          <p className="text-xs text-white/50 mt-1">
            A plataforma gera automaticamente o cronograma de 5 dias, envia convites para os
            colaboradores, rastreia participacao e emite certificados ao final. Relatorio em
            formato aceito pelo MTE.
          </p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-64 animate-pulse" />
          ))}
        </div>
      ) : sipats.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-12 text-center">
          <p className="text-white/30 text-sm mb-3">Nenhuma SIPAT cadastrada.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-[#5DD3A8] text-sm hover:underline"
          >
            Criar primeira SIPAT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sipats.map((s) => (
            <SipatCard key={s.id} sipat={s} />
          ))}
        </div>
      )}

      {showModal && (
        <NewSipatModal
          companyId={companyId}
          createdBy={uid}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
