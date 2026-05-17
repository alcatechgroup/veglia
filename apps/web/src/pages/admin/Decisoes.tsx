import { DECISOES_TOMADAS, DECISOES_PENDENTES } from "@/data/decisoes";

export default function Decisoes() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Registro permanente
        </p>
        <h1 className="text-3xl font-bold text-white">Decisões</h1>
      </div>

      {/* Pendentes */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-white/70 font-semibold text-sm uppercase tracking-widest">
            Pendentes
          </h2>
          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
            {DECISOES_PENDENTES.length} abertas
          </span>
        </div>
        <div className="space-y-3">
          {DECISOES_PENDENTES.map((d) => (
            <div key={d.num} className="bg-white/5 border border-orange-500/15 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-orange-400/70 mt-0.5 w-8 shrink-0">{d.num}</span>
                  <p className="text-white/75 font-medium text-sm">{d.decisao}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.owner && (
                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                      {d.owner}
                    </span>
                  )}
                  {d.deadline && (
                    <span className="text-[10px] text-orange-400/70 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {d.deadline}
                    </span>
                  )}
                </div>
              </div>
              {d.recomendacao && (
                <div className="ml-11 flex items-start gap-2">
                  <span className="text-[#5DD3A8]/50 text-xs mt-0.5">→</span>
                  <p className="text-[#5DD3A8]/70 text-xs">{d.recomendacao}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tomadas */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-white/70 font-semibold text-sm uppercase tracking-widest">
            Aprovadas / Executadas
          </h2>
          <span className="text-xs bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/25 px-2 py-0.5 rounded-full">
            {DECISOES_TOMADAS.length} registradas
          </span>
        </div>
        <div className="space-y-2">
          {DECISOES_TOMADAS.map((d) => (
            <div key={d.num} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-start gap-3">
              <span className="text-xs font-mono text-white/20 mt-0.5 w-8 shrink-0">{d.num}</span>
              <p className="text-white/55 text-sm flex-1">{d.decisao}</p>
              <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full border ${
                d.status === "executada"
                  ? "bg-[#5DD3A8]/10 text-[#5DD3A8]/70 border-[#5DD3A8]/20"
                  : "bg-white/8 text-white/30 border-white/10"
              }`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
