import { useState } from "react";
import { VegliaPlayer } from "@veglia/video-player";

// ─── Tipos internos ────────────────────────────────────────────────────────────

interface Modulo {
  id: string;
  titulo: string;
  duracao: string;
  videoId: string;
  concluido: number; // % de colaboradores que concluíram
}

interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  badge: string;
  badgeColor: string;
  modulos: Modulo[];
  totalColaboradores: number;
}

interface Colaborador {
  nome: string;
  cargo: string;
  lei: number;
  nr1: number;
  cor: string;
}

// ─── Dados mock ────────────────────────────────────────────────────────────────

const TRILHAS: Trilha[] = [
  {
    id: "lei-15377",
    titulo: "Lei 15.377/2026 — Compliance Obrigatório",
    descricao: "Vacinação adulta, prevenção de cânceres e saúde mental no trabalho",
    badge: "Obrigatória",
    badgeColor: "#5DD3A8",
    modulos: [
      { id: "m1", titulo: "O que muda com a Lei 15.377/2026", duracao: "5 min", videoId: "dQw4w9WgXcQ", concluido: 87 },
      { id: "m2", titulo: "Por que vacinas adultas importam", duracao: "5 min", videoId: "dQw4w9WgXcQ", concluido: 72 },
      { id: "m3", titulo: "Prevenção de cânceres acessível", duracao: "5 min", videoId: "dQw4w9WgXcQ", concluido: 61 },
      { id: "m4", titulo: "Saúde mental e riscos psicossociais", duracao: "5 min", videoId: "dQw4w9WgXcQ", concluido: 54 },
    ],
    totalColaboradores: 150,
  },
  {
    id: "nr-1",
    titulo: "NR-1 Revisada — Riscos Psicossociais",
    descricao: "GRO, PGR e obrigações do empregador na nova NR-1",
    badge: "Regulatória",
    badgeColor: "#C9A96E",
    modulos: [
      { id: "m5", titulo: "O que é NR-1 e o que mudou", duracao: "5 min", videoId: "dQw4w9WgXcQ", concluido: 43 },
      { id: "m6", titulo: "GRO, PGR e participação do colaborador", duracao: "5 min", videoId: "dQw4w9WgXcQ", concluido: 38 },
    ],
    totalColaboradores: 150,
  },
];

const COLABORADORES_MOCK: Colaborador[] = [
  { nome: "Ana Paula S.", cargo: "Analista", lei: 100, nr1: 100, cor: "#5DD3A8" },
  { nome: "Carlos M.", cargo: "Coordenador", lei: 75, nr1: 50, cor: "#C9A96E" },
  { nome: "Fernanda L.", cargo: "Assistente", lei: 100, nr1: 0, cor: "#C9DCE8" },
  { nome: "João R.", cargo: "Gerente", lei: 50, nr1: 100, cor: "#5DD3A8" },
  { nome: "Mariana C.", cargo: "Analista Sr.", lei: 25, nr1: 0, cor: "#ef4444" },
  { nome: "Pedro A.", cargo: "Estagiário", lei: 0, nr1: 0, cor: "#ef4444" },
];

// ─── ProgressBar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: string;
}

function ProgressBar({ value, color = "#5DD3A8", height = "h-1.5" }: ProgressBarProps) {
  return (
    <div className={`w-full bg-white/10 rounded-full ${height} overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── VideoPreviewModal ─────────────────────────────────────────────────────────

interface VideoPreviewModalProps {
  modulo: Modulo;
  onClose: () => void;
}

function VideoPreviewModal({ modulo, onClose }: VideoPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[#0d1f38] border border-white/10 rounded-2xl p-6 space-y-4">
        {/* Header do modal */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
              Pre-visualizacao
            </p>
            <h3 className="text-base font-semibold text-white leading-snug">
              {modulo.titulo}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white/40 hover:text-white/80 transition-colors text-xl leading-none mt-0.5"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Aviso canal privado */}
        <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-[#C9A96E]">
            ◈ Canal privado · Este video e exclusivo para assinantes Vegl.ia
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            O colaborador assiste a mesma experiencia — com tracking automatico de conclusao e quiz ao final.
          </p>
        </div>

        {/* Player — previewMode evita gravar enrollment falso no Firestore */}
        <VegliaPlayer
          videoId={modulo.videoId}
          courseId="preview-rh"
          moduleId={modulo.id}
          moduleTitle={modulo.titulo}
          uid="rh-preview"
          companyId=""
          previewMode={true}
        />

        {/* Chips informativos */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            `⏱ ${modulo.duracao}`,
            "◆ Quiz ao final",
            "✓ Certificado automatico",
            "◑ Tracking Firestore",
          ].map((chip) => (
            <span
              key={chip}
              className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl px-3 py-1"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ColaboradoresTable ────────────────────────────────────────────────────────

interface ColaboradoresTableProps {
  colaboradores: Colaborador[];
}

function ColaboradoresTable({ colaboradores }: ColaboradoresTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4">Nome</th>
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4">Cargo</th>
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4 min-w-[120px]">
              Lei 15.377
            </th>
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4 min-w-[120px]">
              NR-1
            </th>
            <th className="text-left text-xs font-medium text-white/40 pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {colaboradores.map((col) => {
            const bothDone = col.lei === 100 && col.nr1 === 100;
            const neitherStarted = col.lei === 0 && col.nr1 === 0;
            const status = bothDone ? "Completo" : neitherStarted ? "Pendente" : "Em progresso";
            const statusColor = bothDone
              ? "text-[#5DD3A8]"
              : neitherStarted
              ? "text-red-400/80"
              : "text-[#C9A96E]";
            const statusBg = bothDone
              ? "bg-[#5DD3A8]/10"
              : neitherStarted
              ? "bg-red-400/10"
              : "bg-[#C9A96E]/10";

            return (
              <tr key={col.nome} className="group">
                <td className="py-3 pr-4 font-medium text-white/80">{col.nome}</td>
                <td className="py-3 pr-4 text-white/40 text-xs">{col.cargo}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={col.lei} color="#5DD3A8" />
                    <span className="text-xs text-white/40 w-8 shrink-0">{col.lei}%</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={col.nr1} color="#C9A96E" />
                    <span className="text-xs text-white/40 w-8 shrink-0">{col.nr1}%</span>
                  </div>
                </td>
                <td className="py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-xl ${statusColor} ${statusBg}`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── ModuloRow ─────────────────────────────────────────────────────────────────

interface ModuloRowProps {
  modulo: Modulo;
  index: number;
  onPreview: (modulo: Modulo) => void;
}

function ModuloRow({ modulo, index, onPreview }: ModuloRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-t border-white/5 first:border-0">
      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-white/40 font-medium">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <p className="text-sm text-white/80 font-medium truncate">{modulo.titulo}</p>
          <span className="text-xs text-white/30 shrink-0">{modulo.duracao}</span>
        </div>
        <div className="flex items-center gap-2">
          <ProgressBar value={modulo.concluido} color="#5DD3A8" height="h-1" />
          <span className="text-xs text-white/40 shrink-0 w-24">
            {modulo.concluido}% concluido
          </span>
        </div>
      </div>

      <button
        onClick={() => onPreview(modulo)}
        className="shrink-0 flex items-center gap-1.5 text-xs text-[#5DD3A8] hover:text-[#4BC495] bg-[#5DD3A8]/10 hover:bg-[#5DD3A8]/20 border border-[#5DD3A8]/20 px-3 py-1.5 rounded-xl transition-colors font-medium"
      >
        <span className="text-[10px]">▶</span>
        Ver video
      </button>
    </div>
  );
}

// ─── TrilhaCard ────────────────────────────────────────────────────────────────

interface TrilhaCardProps {
  trilha: Trilha;
  onPreview: (modulo: Modulo) => void;
}

function TrilhaCard({ trilha, onPreview }: TrilhaCardProps) {
  const [modulosAbertos, setModulosAbertos] = useState(false);
  const [tabelaAberta, setTabelaAberta] = useState(false);

  const progressoGeral = Math.round(
    trilha.modulos.reduce((acc, m) => acc + m.concluido, 0) / trilha.modulos.length
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
      {/* Topo: badge + botao pre-visualizar */}
      <div className="flex items-start justify-between gap-4">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-xl"
          style={{
            color: trilha.badgeColor,
            backgroundColor: `${trilha.badgeColor}18`,
            border: `1px solid ${trilha.badgeColor}30`,
          }}
        >
          {trilha.badge}
        </span>
        <button
          onClick={() => onPreview(trilha.modulos[0])}
          className="shrink-0 flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-colors font-medium"
        >
          <span className="text-[10px]">▶</span>
          Pre-visualizar trilha
        </button>
      </div>

      {/* Titulo e descricao */}
      <div>
        <h2 className="text-base font-semibold text-white leading-snug">{trilha.titulo}</h2>
        <p className="text-sm text-white/40 mt-1">{trilha.descricao}</p>
      </div>

      {/* Barra de progresso geral */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/40 font-medium">Progresso geral da empresa</p>
          <span className="text-xs font-semibold" style={{ color: trilha.badgeColor }}>
            {progressoGeral}%
          </span>
        </div>
        <ProgressBar value={progressoGeral} color={trilha.badgeColor} height="h-2" />
      </div>

      {/* Accordion de modulos */}
      <div>
        <button
          onClick={() => setModulosAbertos((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          <span
            className={`transition-transform duration-200 ${modulosAbertos ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          {trilha.modulos.length} modulo{trilha.modulos.length !== 1 ? "s" : ""}
        </button>

        {modulosAbertos && (
          <div className="mt-3">
            {trilha.modulos.map((mod, idx) => (
              <ModuloRow
                key={mod.id}
                modulo={mod}
                index={idx}
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botao tabela de colaboradores */}
      <div className="border-t border-white/5 pt-4">
        <button
          onClick={() => setTabelaAberta((v) => !v)}
          className="text-xs text-[#5DD3A8]/70 hover:text-[#5DD3A8] transition-colors font-medium flex items-center gap-1"
        >
          Ver progresso detalhado
          <span
            className={`transition-transform duration-200 inline-block ${tabelaAberta ? "rotate-90" : ""}`}
          >
            →
          </span>
        </button>

        {tabelaAberta && (
          <ColaboradoresTable colaboradores={COLABORADORES_MOCK} />
        )}
      </div>
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}

function KpiCard({ label, value, sub, accentColor = "#5DD3A8" }: KpiCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex-1 min-w-0">
      <p className="text-xs text-white/40 font-medium mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accentColor }}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── TrilhasRH ────────────────────────────────────────────────────────────────

export default function TrilhasRH() {
  const [modalState, setModalState] = useState<{ open: boolean; modulo: Modulo | null }>({
    open: false,
    modulo: null,
  });

  const openPreview = (modulo: Modulo) => {
    setModalState({ open: true, modulo });
  };

  const closePreview = () => {
    setModalState({ open: false, modulo: null });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
          Trilhas de Compliance · RH
        </p>
        <h1 className="text-2xl font-bold text-white">Trilhas de Compliance</h1>
        <p className="text-sm text-white/40 mt-1">
          Acompanhe o progresso de cada trilha em toda a empresa · pre-visualize os conteudos
          antes de enviar ao time
        </p>
      </div>

      {/* KPI row */}
      <div className="flex gap-4 flex-wrap">
        <KpiCard
          label="Trilhas ativas"
          value="2"
          sub="Lei 15.377 + NR-1"
          accentColor="#5DD3A8"
        />
        <KpiCard
          label="Treinados Lei 15.377"
          value="87"
          sub="de 150 colaboradores"
          accentColor="#5DD3A8"
        />
        <KpiCard
          label="Treinados NR-1"
          value="43"
          sub="de 150 colaboradores"
          accentColor="#C9A96E"
        />
        <KpiCard
          label="Conclusoes esta semana"
          value="12"
          sub="novos certificados emitidos"
          accentColor="#C9DCE8"
        />
      </div>

      {/* Grid de trilhas */}
      <div className="space-y-6">
        {TRILHAS.map((trilha) => (
          <TrilhaCard key={trilha.id} trilha={trilha} onPreview={openPreview} />
        ))}
      </div>

      {/* Modal de pre-visualizacao */}
      {modalState.open && modalState.modulo && (
        <VideoPreviewModal modulo={modalState.modulo} onClose={closePreview} />
      )}
    </div>
  );
}
