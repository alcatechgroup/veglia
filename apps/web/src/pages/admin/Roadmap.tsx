import { useState } from "react";
import { FEATURES, PHASES, type Feature } from "@/data/roadmap";

const PHASE_KEYS = ["T1", "T2", "T3", "T4"] as const;

const STATUS_STYLE: Record<Feature["status"], string> = {
  done: "bg-[#5DD3A8]/20 text-[#5DD3A8] border-[#5DD3A8]/30",
  "in-progress": "bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/30",
  planned: "bg-white/8 text-white/35 border-white/10",
};

const STATUS_LABEL: Record<Feature["status"], string> = {
  done: "Concluída",
  "in-progress": "Em progresso",
  planned: "Planejada",
};

export default function Roadmap() {
  const [activePhase, setActivePhase] = useState<string>("T1");

  const phaseFeatures = FEATURES.filter((f) => f.phase === activePhase);
  const phase = PHASES[activePhase as keyof typeof PHASES];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          22 features · 4 fases · 12 meses
        </p>
        <h1 className="text-3xl font-bold text-white">Roadmap de Produto</h1>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-2 mb-8">
        {PHASE_KEYS.map((p) => (
          <button
            key={p}
            onClick={() => setActivePhase(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activePhase === p
                ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/70"
            }`}
          >
            {p}
            {p === "T1" && (
              <span className="ml-2 text-[10px] bg-[#5DD3A8]/20 text-[#5DD3A8] px-1.5 py-0.5 rounded-full">
                Ativo
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Phase header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-white/80 font-semibold">{phase.label}</p>
          <p className="text-white/35 text-sm mt-0.5">{phase.months}</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[#5DD3A8] font-bold text-lg">{phase.mrr}</p>
            <p className="text-white/30 text-xs">MRR alvo</p>
          </div>
          <div>
            <p className="text-[#C9A96E] font-bold text-lg">{phase.empresas}</p>
            <p className="text-white/30 text-xs">Empresas</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-3">
        {phaseFeatures.map((f) => (
          <div
            key={f.code}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4 hover:bg-white/7 transition-all"
          >
            <span className="text-xs font-bold text-white/25 font-mono mt-0.5 w-8 shrink-0">
              {f.code}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white/85 font-medium text-sm">{f.name}</p>
              <p className="text-white/35 text-xs mt-1 leading-relaxed">{f.description}</p>
            </div>
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLE[f.status]}`}>
              {STATUS_LABEL[f.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
