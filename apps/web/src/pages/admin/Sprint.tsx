import { SPRINT_ITEMS, SPRINT_META, FRENTES, type CheckItem } from "@/data/sprint";
import { useChecklist } from "@/hooks/useChecklist";

const FRENTE_KEYS = ["CEO", "Dev", "Comunicacao", "Conteudo"] as const;

const TAG_STYLES: Record<string, string> = {
  hoje:    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  urgente: "bg-red-500/20 text-red-400 border-red-500/30",
  novo:    "bg-mint/20 text-mint border-mint/30",
};

export default function Sprint() {
  const { checked, toggle } = useChecklist();

  const total = SPRINT_ITEMS.length;
  const done  = SPRINT_ITEMS.filter((i) => checked[i.id]).length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          {SPRINT_META.inicio} → {SPRINT_META.fim} · Semana {SPRINT_META.semana} de {SPRINT_META.totalSemanas}
        </p>
        <h1 className="text-3xl font-bold text-white">Sprint {SPRINT_META.numero}</h1>
        <p className="text-white/40 mt-1 text-sm max-w-xl">{SPRINT_META.objetivo}</p>
      </div>

      {/* Progress */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-sm">{done} de {total} itens concluídos</p>
          <p className="text-[#5DD3A8] font-bold text-lg">{pct}%</p>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5DD3A8] to-[#2DA67D] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Semana progress */}
        <div className="flex gap-1.5 mt-4">
          {Array.from({ length: SPRINT_META.totalSemanas }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < SPRINT_META.semana ? "bg-[#5DD3A8]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="text-white/30 text-xs mt-1.5">Semana atual: {SPRINT_META.semana}</p>
      </div>

      {/* Próximos marcos */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Próximos marcos</p>
        <div className="space-y-2">
          {SPRINT_META.proximosMarcos.map((marco, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[#5DD3A8] text-xs font-mono mt-0.5 w-28 shrink-0">{marco.data}</span>
              <span className="text-white/60 text-sm">{marco.descricao}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Frentes */}
      <div className="space-y-6">
        {FRENTE_KEYS.map((frente) => {
          const items     = SPRINT_ITEMS.filter((i) => i.frente === frente);
          const frenteDone = items.filter((i) => checked[i.id]).length;
          const info      = FRENTES[frente];
          const frentePct = Math.round((frenteDone / items.length) * 100);

          return (
            <div key={frente} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <p className="text-white/70 font-medium text-sm">{info.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${info.color}`}>
                    {frenteDone}/{items.length}
                  </span>
                </div>
                <span className="text-white/35 text-xs font-mono">{frentePct}%</span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map((item) => (
                  <CheckRow key={item.id} item={item} checked={!!checked[item.id]} onToggle={toggle} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

function CheckRow({
  item, checked, onToggle,
}: {
  item: CheckItem; checked: boolean; onToggle: (id: string) => void;
}) {
  return (
    <label className="flex items-start gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/3 transition-colors group">
      <div className="mt-0.5 shrink-0">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            checked
              ? "bg-[#5DD3A8] border-[#5DD3A8]"
              : "border-white/20 group-hover:border-white/40"
          }`}
          onClick={() => onToggle(item.id)}
        >
          {checked && (
            <svg className="w-3 h-3 text-[#0B2545]" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className={`flex-1 text-sm leading-relaxed ${checked ? "line-through text-white/25" : "text-white/65"}`}>
        {item.label}
      </span>
      {item.tag && !checked && (
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide ${TAG_STYLES[item.tag] ?? ""}`}>
          {item.tag}
        </span>
      )}
    </label>
  );
}
