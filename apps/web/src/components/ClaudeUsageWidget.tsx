const AGENTS = [
  { id: "po",          label: "@po",          role: "Product Owner",          color: "#5DD3A8", invocacoes: 59,  entregavel: "Brief de produto, hierarquia de seções, KPIs MVP" },
  { id: "dev",         label: "@dev",          role: "Dev · Firebase · React",  color: "#C9DCE8", invocacoes: 41,  entregavel: "Monorepo, auth multi-tenant, admin platform, deploy" },
  { id: "designer",    label: "@designer",     role: "Design · UI · Brand",     color: "#C9A96E", invocacoes: 31,  entregavel: "Landing page HTML, brandbook, componentes visuais" },
  { id: "copy",        label: "@copy",         role: "Copywriter B2B",          color: "#A78BFA", invocacoes: 27,  entregavel: "Todos os textos da landing: hero, planos, FAQ, CTA" },
  { id: "ceo",         label: "@ceo",          role: "Estratégia · Decisões",   color: "#F59E0B", invocacoes: 15,  entregavel: "Análise de mercado, decisões societárias, GTM" },
  { id: "comunicacao", label: "@comunicacao",  role: "Comunicação · Marketing", color: "#34D399", invocacoes: 7,   entregavel: "Voz da marca, posts LinkedIn, manifesto" },
  { id: "pesquisador", label: "@pesquisador",  role: "Pesquisa · Inteligência", color: "#60A5FA", invocacoes: 5,   entregavel: "Google Trends, análise Lei 15.377, contexto de mercado" },
  { id: "edu",         label: "@edu",          role: "Educação · Trilhas",      color: "#F472B6", invocacoes: 5,   entregavel: "Arquitetura pedagógica, módulos educacionais" },
];

const STATS = [
  { label: "Horas de execução", value: "1h 28m", sub: "sessão ativa · Claude Code" },
  { label: "Agentes no projeto", value: "8",     sub: "Framework Alcatech Group" },
  { label: "Tokens gerados",    value: "631K",   sub: "output tokens" },
  { label: "Cache lido",        value: "43M",    sub: "tokens via prompt cache" },
  { label: "Arquivos criados",  value: "47",     sub: "Write operations" },
  { label: "Mensagens",         value: "472",    sub: "187 user · 285 assistant" },
];

export default function ClaudeUsageWidget() {
  const totalInvocacoes = AGENTS.reduce((s, a) => s + a.invocacoes, 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#5DD3A8]/15 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#5DD3A8" strokeWidth="1.5"/>
              <path d="M4.5 7c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5" stroke="#5DD3A8" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="7" cy="7" r="1" fill="#5DD3A8"/>
            </svg>
          </div>
          <div>
            <p className="text-white/80 text-sm font-semibold">Claude Code · Consumo da Sessão</p>
            <p className="text-white/30 text-xs mt-0.5">Projeto Vegl.ia · Sprint 1 · claude-sonnet-4-6</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#5DD3A8]/60 bg-[#5DD3A8]/8 border border-[#5DD3A8]/15 px-2 py-1 rounded-md">
          1 sessão ativa
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-white/8">
        {STATS.map((s) => (
          <div key={s.label} className="px-4 py-4 text-center">
            <p className="text-lg font-bold text-white/90">{s.value}</p>
            <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{s.label}</p>
            <p className="text-[9px] text-white/20 mt-0.5 leading-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">
              Framework Alcatech Group
            </p>
            <p className="text-white/20 text-[10px] mt-0.5">
              Tech Lead &amp; Curador · <span className="text-[#C9A96E]/60">Rodolfo Nascimento</span>
            </p>
          </div>
          <span className="text-[10px] text-white/25">{totalInvocacoes} invocações totais</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {AGENTS.map((a) => {
            const pct = Math.round((a.invocacoes / totalInvocacoes) * 100);
            return (
              <div key={a.id} className="bg-white/3 border border-white/8 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                    style={{ color: a.color, background: `${a.color}15` }}
                  >
                    {a.label}
                  </span>
                  <span className="text-[10px] text-white/25">{a.invocacoes}×</span>
                </div>
                <p className="text-white/55 text-[11px] font-medium leading-none">{a.role}</p>
                <p className="text-white/25 text-[10px] leading-snug">{a.entregavel}</p>
                {/* mini bar */}
                <div className="h-1 rounded-full bg-white/8 mt-auto">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: a.color, opacity: 0.6 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
