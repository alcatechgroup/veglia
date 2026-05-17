import { useEffect, useState } from "react";

/* ── Types matching the actual Cowork export schema ── */
interface CoworkMemory {
  exported_at: string;
  exported_by: string;
  project: { name: string; tagline: string; thesis_short: string; current_stage: string; active_window: string; category: string };
  context: {
    regulatory_trigger: { primary: string; description: string };
    ownership: { equity_split: Record<string, number>; vesting: string };
    people: { name: string; role: string; background?: string; credentials?: string }[];
    business_model: { type: string; gtm_strategy: string; anchor_partner: string };
  };
  decisions: {
    made: { id: string; decision: string; approved_at?: string; executed_at?: string; rationale?: string; document?: string }[];
    pending: { id: string; question: string; recommendation: string; owner: string; deadline: string }[];
  };
  deliverables: {
    strategy: { id: string; name: string; type: string; summary?: string; delivered_at: string }[];
    design: { id: string; name: string; type: string; summary?: string; delivered_at: string }[];
    communication: { id: string; name: string; type: string; summary?: string; delivered_at: string }[];
    content: { modules: { id: string; name: string; track: string }[] };
  };
  timeline: { date: string; event: string; category: string; future?: boolean }[];
  moat_competitivo: { id: string; moat: string; description: string }[];
  risks: { id: string; risk: string; mitigation: string }[];
  principles: string[];
  next_actions_48h: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  strategy:       "text-[#C9A96E]  border-[#C9A96E]/30  bg-[#C9A96E]/8",
  design:         "text-[#A78BFA]  border-[#A78BFA]/30  bg-[#A78BFA]/8",
  tech:           "text-[#5DD3A8]  border-[#5DD3A8]/30  bg-[#5DD3A8]/8",
  infrastructure: "text-[#C9DCE8]  border-[#C9DCE8]/30  bg-[#C9DCE8]/8",
  operations:     "text-orange-400 border-orange-400/30 bg-orange-400/8",
  brand:          "text-pink-400   border-pink-400/30   bg-pink-400/8",
  content:        "text-emerald-400 border-emerald-400/30 bg-emerald-400/8",
  checkpoint:     "text-white/40   border-white/15      bg-white/5",
  milestone:      "text-[#5DD3A8]  border-[#5DD3A8]/40  bg-[#5DD3A8]/10",
};

export default function Historico() {
  const [data, setData] = useState<CoworkMemory | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"timeline" | "decisoes" | "entregaveis" | "estrategia">("timeline");

  useEffect(() => {
    fetch("/cowork-memory.json")
      .then((r) => r.json())
      .then((d) => { if (d.exported_at) setData(d); })
      .catch(() => setError(true));
  }, []);

  if (error) return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-sm">
        Erro ao carregar cowork-memory.json.
      </div>
    </div>
  );

  if (!data) return (
    <div className="max-w-5xl mx-auto flex items-center gap-3 pt-20 justify-center">
      <div className="w-5 h-5 border-2 border-[#5DD3A8]/40 border-t-[#5DD3A8] rounded-full animate-spin" />
      <p className="text-white/30 text-sm">Carregando memória do Cowork…</p>
    </div>
  );

  const past = data.timeline.filter((t) => !t.future);
  const future = data.timeline.filter((t) => t.future);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Memória da Empresa · Framework Alcatech Group · {data.exported_by}
        </p>
        <h1 className="text-3xl font-bold text-white">{data.project.name} · Memória da Empresa</h1>
        <p className="text-white/40 mt-1 text-sm">{data.project.thesis_short}</p>
      </div>

      {/* Meta strip */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1">Estágio</p>
          <p className="text-white/80 text-sm font-semibold">{data.project.current_stage}</p>
          <p className="text-white/30 text-xs mt-0.5">{data.project.active_window}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1">Exportado em</p>
          <p className="text-white/80 text-sm font-semibold">{data.exported_at}</p>
          <p className="text-white/30 text-xs mt-0.5">{data.project.category}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1">GTM</p>
          <p className="text-white/80 text-sm font-semibold">{data.context.business_model.anchor_partner}</p>
          <p className="text-white/30 text-xs mt-0.5">{data.context.business_model.gtm_strategy}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/8 pb-4">
        {(["timeline", "decisoes", "entregaveis", "estrategia"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t
                ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
                : "bg-white/5 text-white/35 border border-white/8 hover:text-white/60"
            }`}
          >
            {t === "decisoes" ? "Decisões" : t === "entregaveis" ? "Entregáveis" : t === "estrategia" ? "Estratégia" : "Timeline"}
          </button>
        ))}
      </div>

      {/* ── TIMELINE ── */}
      {tab === "timeline" && (
        <div className="space-y-6">
          <Section label="Histórico executado" count={past.length}>
            <div className="space-y-2.5">
              {past.map((t, i) => (
                <TimelineRow key={i} item={t} />
              ))}
            </div>
          </Section>
          <Section label="Marco planejados" count={future.length}>
            <div className="space-y-2.5">
              {future.map((t, i) => (
                <TimelineRow key={i} item={t} dimmed />
              ))}
            </div>
          </Section>
          {/* Next actions */}
          <Section label="Próximas ações · 48h" count={data.next_actions_48h.length}>
            <div className="space-y-2">
              {data.next_actions_48h.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-white/60 text-sm">{a}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── DECISÕES ── */}
      {tab === "decisoes" && (
        <div className="space-y-6">
          <Section label="Decisões aprovadas" count={data.decisions.made.length}>
            <div className="space-y-3">
              {data.decisions.made.map((d) => (
                <div key={d.id} className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl p-4">
                  <span className="text-[10px] font-mono text-[#5DD3A8]/50 w-8 shrink-0 mt-0.5">{d.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/75 text-sm font-medium">{d.decision}</p>
                    {d.rationale && <p className="text-white/35 text-xs mt-1 leading-relaxed">{d.rationale}</p>}
                    {d.document && <p className="text-white/20 text-[10px] font-mono mt-1.5">{d.document}</p>}
                  </div>
                  <span className="text-[10px] text-white/25 shrink-0">{d.approved_at ?? d.executed_at}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section label="Decisões pendentes" count={data.decisions.pending.length}>
            <div className="space-y-3">
              {data.decisions.pending.map((d) => (
                <div key={d.id} className="flex items-start gap-3 bg-white/3 border border-[#C9A96E]/15 rounded-xl p-4">
                  <span className="text-[10px] font-mono text-[#C9A96E]/50 w-8 shrink-0 mt-0.5">{d.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/75 text-sm font-medium">{d.question}</p>
                    <p className="text-[#5DD3A8]/60 text-xs mt-1">↳ {d.recommendation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white/25 text-[10px]">{d.owner}</p>
                    <p className="text-[#C9A96E]/50 text-[10px] mt-0.5">{d.deadline}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── ENTREGÁVEIS ── */}
      {tab === "entregaveis" && (
        <div className="space-y-6">
          {[
            { label: "Estratégia", items: data.deliverables.strategy, color: "#C9A96E" },
            { label: "Design", items: data.deliverables.design, color: "#A78BFA" },
            { label: "Comunicação", items: data.deliverables.communication, color: "#34D399" },
          ].map(({ label, items, color }) => (
            <Section key={label} label={label} count={items.length}>
              <div className="grid grid-cols-2 gap-3">
                {items.map((d) => (
                  <div key={d.id} className="bg-white/3 border border-white/8 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ color, background: `${color}15` }}>{d.type}</span>
                      <span className="text-[10px] text-white/25">{d.delivered_at}</span>
                    </div>
                    <p className="text-white/75 text-sm font-medium">{d.name}</p>
                    {d.summary && <p className="text-white/35 text-xs mt-1 leading-relaxed">{d.summary}</p>}
                  </div>
                ))}
              </div>
            </Section>
          ))}
          <Section label="Módulos educacionais" count={data.deliverables.content.modules.length}>
            <div className="grid grid-cols-3 gap-3">
              {data.deliverables.content.modules.map((m) => (
                <div key={m.id} className="bg-white/3 border border-white/8 rounded-xl p-3">
                  <span className="text-[10px] font-mono text-emerald-400/60 bg-emerald-400/10 px-2 py-0.5 rounded">{m.track}</span>
                  <p className="text-white/65 text-xs font-medium mt-2">{m.name}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ── ESTRATÉGIA ── */}
      {tab === "estrategia" && (
        <div className="space-y-6">
          {/* People */}
          <Section label="Time" count={data.context.people.length}>
            <div className="grid grid-cols-2 gap-3">
              {data.context.people.map((p) => (
                <div key={p.name} className="bg-white/3 border border-white/8 rounded-xl p-4">
                  <p className="text-white/80 text-sm font-semibold">{p.name}</p>
                  <p className="text-[#5DD3A8]/60 text-xs mt-0.5">{p.role}</p>
                  {p.background && <p className="text-white/30 text-xs mt-1.5 leading-relaxed">{p.background}</p>}
                  {p.credentials && <p className="text-white/30 text-xs mt-1.5 leading-relaxed">{p.credentials}</p>}
                </div>
              ))}
            </div>
          </Section>
          {/* Moat */}
          <Section label="Moat Competitivo" count={data.moat_competitivo.length}>
            <div className="space-y-3">
              {data.moat_competitivo.map((m) => (
                <div key={m.id} className="flex gap-3 bg-white/3 border border-white/8 rounded-xl p-4">
                  <span className="text-[10px] font-mono text-[#C9A96E]/50 w-8 shrink-0 mt-0.5">{m.id}</span>
                  <div>
                    <p className="text-white/75 text-sm font-semibold">{m.moat}</p>
                    <p className="text-white/35 text-xs mt-1 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          {/* Risks */}
          <Section label="Riscos & Mitigações" count={data.risks.length}>
            <div className="space-y-3">
              {data.risks.map((r) => (
                <div key={r.id} className="flex gap-3 bg-white/3 border border-white/8 rounded-xl p-4">
                  <span className="text-[10px] font-mono text-orange-400/50 w-8 shrink-0 mt-0.5">{r.id}</span>
                  <div>
                    <p className="text-white/70 text-sm font-medium">{r.risk}</p>
                    <p className="text-[#5DD3A8]/50 text-xs mt-1 leading-relaxed">↳ {r.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          {/* Principles */}
          <Section label="Princípios não negociáveis" count={data.principles.length}>
            <div className="space-y-2">
              {data.principles.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[#5DD3A8] text-sm shrink-0 mt-0.5">·</span>
                  <p className="text-white/55 text-sm">{p}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">{label}</p>
        <span className="text-[10px] text-white/20">{count} itens</span>
      </div>
      {children}
    </div>
  );
}

function TimelineRow({ item, dimmed }: { item: { date: string; event: string; category: string }; dimmed?: boolean }) {
  const cls = CATEGORY_COLORS[item.category] ?? "text-white/40 border-white/10 bg-white/5";
  return (
    <div className={`flex items-start gap-4 ${dimmed ? "opacity-45" : ""}`}>
      <span className="text-[10px] font-mono text-[#C9A96E]/50 w-24 shrink-0 mt-1">{item.date}</span>
      <div className="w-px self-stretch bg-white/8 shrink-0" />
      <div className="flex-1 flex items-start gap-3 pb-0.5">
        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono shrink-0 mt-0.5 ${cls}`}>{item.category}</span>
        <p className="text-white/60 text-sm leading-snug">{item.event}</p>
      </div>
    </div>
  );
}
