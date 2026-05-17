import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { ISPCSnapshot } from "@veglia/shared";

// ─── Benchmark de setor (hardcoded para MVP) ──────────────────────────────────

const SECTOR_BENCHMARK = {
  score: 58,
  label: "Empresas similares (50–500 col.)",
};

// ─── Score gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "#5DD3A8" : score >= 40 ? "#C9A96E" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-32 h-32 rounded-full flex items-center justify-center border-4"
        style={{ borderColor: color }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{score}</p>
          <p className="text-[10px] text-white/30">/100</p>
        </div>
      </div>
      <p
        className="text-sm font-semibold"
        style={{ color }}
      >
        {score >= 70 ? "Excelente" : score >= 40 ? "Em desenvolvimento" : "Atencao necessaria"}
      </p>
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function ISPC() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const [snapshots, setSnapshots] = useState<ISPCSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "ispc_snapshots"),
      where("company_id", "==", companyId),
      orderBy("period", "desc"),
      limit(6)
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => d.data() as ISPCSnapshot);
      setSnapshots(docs);
      setLoading(false);
    });
  }, [companyId]);

  const latest = snapshots[0] ?? null;
  const score = latest?.score ?? 0;
  const breakdown = latest?.breakdown ?? { education: 0, vaccination: 0, prevention: 0 };

  // Historico para grafico (ultimos 6 meses, ordem cronologica)
  const history = [...snapshots].reverse();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Indice de Saude Preventiva Corporativa
        </h1>
        <p className="text-sm text-white/40 mt-0.5">
          ISPC — score consolidado de saude preventiva da sua empresa
        </p>
      </div>

      {snapshots.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-12 text-center">
          <p className="text-white/30 text-sm">
            O ISPC e calculado automaticamente no primeiro dia de cada mes.
          </p>
          <p className="text-white/20 text-xs mt-2">
            Primeiro calculo disponivel no inicio do proximo mes.
          </p>
        </div>
      ) : (
        <>
          {/* Score atual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gauge */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
              <ScoreGauge score={score} />
              <p className="text-xs text-white/30 text-center">
                Periodo: {latest?.period ?? "—"}
              </p>
            </div>

            {/* Breakdown por categoria */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white">Breakdown por categoria</h2>

              {[
                { label: "Educacao (trilhas e compliance)", value: breakdown.education, icon: "◎" },
                { label: "Vacinacao (cobertura da equipe)", value: breakdown.vaccination, icon: "◈" },
                { label: "Prevencao (score composto)", value: breakdown.prevention, icon: "◇" },
              ].map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#5DD3A8]">{cat.icon}</span>
                    <span className="text-xs text-white/60 flex-1">{cat.label}</span>
                    <span className="text-sm font-semibold text-white">{cat.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cat.value}%`,
                        background:
                          cat.value >= 70
                            ? "#5DD3A8"
                            : cat.value >= 40
                            ? "#C9A96E"
                            : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Benchmark */}
              <div className="border-t border-white/5 pt-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">Benchmark do setor</p>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/20 rounded-full"
                      style={{ width: `${SECTOR_BENCHMARK.score}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-white/30">{SECTOR_BENCHMARK.score}</p>
                  <p className="text-[10px] text-white/20">{SECTOR_BENCHMARK.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span
                  className={
                    score >= SECTOR_BENCHMARK.score ? "text-[#5DD3A8]" : "text-[#C9A96E]"
                  }
                >
                  {score >= SECTOR_BENCHMARK.score
                    ? `+${score - SECTOR_BENCHMARK.score} pontos acima do benchmark`
                    : `${SECTOR_BENCHMARK.score - score} pontos abaixo do benchmark`}
                </span>
              </div>
            </div>
          </div>

          {/* Historico */}
          {history.length > 1 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Historico mensal</h2>
              <div className="flex items-end gap-3 h-24">
                {history.map((snap) => {
                  const h = Math.max(8, (snap.score / 100) * 88);
                  return (
                    <div key={snap.period} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] text-white/40">{snap.score}</span>
                      <div
                        className="w-full rounded-t-md bg-[#5DD3A8]/40 transition-all"
                        style={{ height: `${h}px` }}
                      />
                      <span className="text-[9px] text-white/25">
                        {snap.period.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
