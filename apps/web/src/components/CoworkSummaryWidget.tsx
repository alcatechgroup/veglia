import { useEffect, useState } from "react";

interface Memory {
  exported_at: string;
  exported_by: string;
  project: {
    name: string; tagline: string; thesis_short: string; thesis_expanded: string;
    current_stage: string; active_window: string; category: string;
    powered_by: string; founded_via: string;
  };
  context: {
    regulatory_trigger: { primary: string; description: string; secondary: string[] };
    ownership: { equity_split: Record<string, number>; vesting: string };
    people: { name: string; role: string; background?: string; credentials?: string }[];
    business_model: { type: string; gtm_strategy: string; anchor_partner: string; secondary_partners: string[] };
  };
  moat_competitivo: { id: string; moat: string; description: string }[];
  decisions: { pending: { id: string; question: string; recommendation: string; owner: string; deadline: string }[] };
  next_actions_48h: string[];
  principles: string[];
}

export default function CoworkSummaryWidget() {
  const [data, setData] = useState<Memory | null>(null);

  useEffect(() => {
    fetch("/cowork-memory.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const { project, context, moat_competitivo, decisions, next_actions_48h } = data;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-[#5DD3A8]/60 bg-[#5DD3A8]/8 border border-[#5DD3A8]/15 px-2 py-0.5 rounded-md">
              Framework Alcatech Group · {data.exported_by}
            </span>
            <span className="text-[10px] text-white/20">{data.exported_at}</span>
          </div>
          <h2 className="text-white/90 text-base font-bold">{project.tagline}</h2>
          <p className="text-white/40 text-xs mt-0.5">{project.thesis_short}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[#5DD3A8] text-xs font-semibold">{project.current_stage}</p>
          <p className="text-white/25 text-[10px] mt-0.5">{project.active_window}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-white/8">

        {/* Tese expandida */}
        <div className="col-span-2 lg:col-span-1 p-5 border-b border-white/8 lg:border-b-0">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Tese</p>
          <p className="text-white/55 text-xs leading-relaxed">{project.thesis_expanded}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.category.split(" · ").map((c) => (
              <span key={c} className="text-[9px] text-white/30 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>

        {/* Gatilho regulatório + GTM */}
        <div className="p-5 border-b border-white/8 lg:border-b-0">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Gatilho · GTM</p>

          <div className="mb-4">
            <p className="text-[#C9A96E] text-xs font-bold">{context.regulatory_trigger.primary}</p>
            <p className="text-white/40 text-[10px] mt-0.5 leading-relaxed">{context.regulatory_trigger.description}</p>
            <div className="flex flex-col gap-0.5 mt-1.5">
              {context.regulatory_trigger.secondary.map((s) => (
                <span key={s} className="text-[9px] text-white/25">+ {s}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#5DD3A8] text-xs font-bold">{context.business_model.anchor_partner}</p>
            <p className="text-white/40 text-[10px] mt-0.5">{context.business_model.gtm_strategy}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {context.business_model.secondary_partners.map((p) => (
                <span key={p} className="text-[9px] text-white/20 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sociedade + Time */}
        <div className="p-5 border-b border-white/8 lg:border-b-0">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Sociedade</p>
          <div className="space-y-2.5">
            {context.people.slice(0, 4).map((p) => (
              <div key={p.name} className="flex items-start gap-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: "rgba(93,211,168,.15)", color: "#5DD3A8" }}
                >
                  {p.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-white/70 text-xs font-semibold leading-none">{p.name}</p>
                  <p className="text-white/30 text-[10px] mt-0.5 leading-snug truncate">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/8">
            <p className="text-white/20 text-[9px]">{context.ownership.vesting} · {Object.values(context.ownership.equity_split)[0]}% cada</p>
          </div>
        </div>
      </div>

      {/* Moat + Próximas ações */}
      <div className="grid grid-cols-2 divide-x divide-white/8 border-t border-white/8">

        {/* Moat top 3 */}
        <div className="p-5">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Moat Competitivo</p>
          <div className="space-y-2.5">
            {moat_competitivo.slice(0, 3).map((m) => (
              <div key={m.id} className="flex gap-2.5">
                <span className="text-[10px] font-mono text-[#C9A96E]/40 w-6 shrink-0">{m.id}</span>
                <div>
                  <p className="text-white/65 text-xs font-medium leading-snug">{m.moat}</p>
                  <p className="text-white/25 text-[10px] mt-0.5 leading-snug">{m.description.split(".")[0]}.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas ações + Decisões pendentes */}
        <div className="p-5">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Próximas ações · 48h</p>
          <div className="space-y-1.5 mb-4">
            {next_actions_48h.slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-white/50 text-[11px] leading-snug">{a}</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Decisões pendentes</p>
          <div className="space-y-1.5">
            {decisions.pending.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-start gap-2">
                <span className="text-[9px] font-mono text-orange-400/50 w-6 shrink-0 mt-0.5">{d.id}</span>
                <p className="text-white/40 text-[10px] leading-snug flex-1">{d.question.replace("?", "")}</p>
                <span className="text-[9px] text-white/20 shrink-0">{d.deadline.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
