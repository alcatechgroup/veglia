import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DimensionScore {
  score: number;
  label: string;
  description: string;
  color: string;
}

interface PreventiveIndex {
  overall_score: number;
  classification: "alto_risco" | "atencao" | "bom" | "excelencia";
  dimensions: {
    vaccination: DimensionScore;
    education: DimensionScore;
    mental_health: DimensionScore;
    ergonomics: DimensionScore;
  };
  estimated_impact: {
    absenteeism_reduction_pct: number;
    annual_savings_brl: number;
  };
  updated_at: number;
}

interface ISPCSnapshot {
  period: string;
  score: number;
}

// ─── Config visual ─────────────────────────────────────────────────────────────

function classConfig(c: PreventiveIndex["classification"]) {
  return {
    excelencia: { label: "Excelência", color: "#5DD3A8", bg: "bg-[#5DD3A8]/10", border: "border-[#5DD3A8]/30" },
    bom: { label: "Boa Maturidade", color: "#5DD3A8", bg: "bg-[#5DD3A8]/8", border: "border-[#5DD3A8]/20" },
    atencao: { label: "Atenção", color: "#C9A96E", bg: "bg-[#C9A96E]/10", border: "border-[#C9A96E]/30" },
    alto_risco: { label: "Alto Risco", color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30" },
  }[c];
}

// ─── Hook: calcula índice ao vivo ─────────────────────────────────────────────

function usePreventiveIndex(companyId: string) {
  const [index, setIndex] = useState<PreventiveIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ISPCSnapshot[]>([]);

  useEffect(() => {
    if (!companyId) return;

    // Busca snapshots históricos do ISPC
    const histQ = query(
      collection(db, "ispc_snapshots"),
      where("company_id", "==", companyId),
      orderBy("period", "desc"),
      limit(6)
    );
    const unsubHist = onSnapshot(histQ, (snap) => {
      setHistory(
        snap.docs
          .map((d) => ({ period: d.data().period as string, score: d.data().score as number }))
          .reverse()
      );
    });

    // Calcula índice ao vivo a partir dos dados disponíveis
    let usersCount = 0;
    let enrolledCount = 0;
    let completedCount = 0;
    let vaccinatedCount = 0;
    let assessedCount = 0;

    const unsubUsers = onSnapshot(
      query(collection(db, "users"), where("company_id", "==", companyId)),
      (usersSnap) => {
        usersCount = usersSnap.size;
        recalc();
      }
    );

    const unsubEnroll = onSnapshot(
      query(collection(db, "enrollments"), where("company_id", "==", companyId)),
      (snap) => {
        enrolledCount = snap.size;
        completedCount = snap.docs.filter((d) => d.data().completed_at != null).length;
        recalc();
      }
    );

    const unsubVax = onSnapshot(
      query(collection(db, "vaccination_records"), where("company_id", "==", companyId)),
      (snap) => {
        const uniqueVaccinated = new Set(snap.docs.map((d) => d.data().employee_id as string));
        vaccinatedCount = uniqueVaccinated.size;
        recalc();
      }
    );

    const unsubAssess = onSnapshot(
      query(collection(db, "health_assessments"), where("company_id", "==", companyId)),
      (snap) => {
        assessedCount = snap.size;
        recalc();
      }
    );

    function recalc() {
      const total = Math.max(usersCount, 1);
      const education = Math.min(100, Math.round((completedCount / total) * 100));
      const vaccination = Math.min(100, Math.round((vaccinatedCount / total) * 100));
      const mental_health = assessedCount > 0 ? Math.min(100, Math.round((assessedCount / total) * 80 + 20)) : 40;
      const ergonomics = 50; // mock até NR-1 ter tracking específico

      const overall = Math.round(
        education * 0.35 +
          vaccination * 0.35 +
          mental_health * 0.15 +
          ergonomics * 0.15
      );

      let classification: PreventiveIndex["classification"];
      if (overall >= 91) classification = "excelencia";
      else if (overall >= 71) classification = "bom";
      else if (overall >= 41) classification = "atencao";
      else classification = "alto_risco";

      // Impacto estimado (baseado em benchmarks de compliance preventivo)
      const absenteeism_reduction_pct = Math.round(overall * 0.3);
      const headcount = usersCount;
      const avg_salary_brl = 4500;
      const annual_savings_brl = Math.round(
        (absenteeism_reduction_pct / 100) * headcount * avg_salary_brl * 12 * 0.05
      );

      setIndex({
        overall_score: overall,
        classification,
        dimensions: {
          vaccination: {
            score: vaccination,
            label: "Cobertura Vacinal",
            description: `${vaccinatedCount} de ${usersCount} colaboradores vacinados`,
            color: "#5DD3A8",
          },
          education: {
            score: education,
            label: "Engajamento Educacional",
            description: `${completedCount} trilhas concluídas de ${enrolledCount} iniciadas`,
            color: "#5DD3A8",
          },
          mental_health: {
            score: mental_health,
            label: "Saúde Mental",
            description: `${assessedCount} diagnósticos realizados`,
            color: "#C9A96E",
          },
          ergonomics: {
            score: ergonomics,
            label: "Saúde Ocupacional",
            description: "Baseado nas trilhas NR-1 concluídas",
            color: "#C9A96E",
          },
        },
        estimated_impact: {
          absenteeism_reduction_pct,
          annual_savings_brl,
        },
        updated_at: Date.now(),
      });
      setLoading(false);
    }

    return () => {
      unsubHist();
      unsubUsers();
      unsubEnroll();
      unsubVax();
      unsubAssess();
    };
  }, [companyId]);

  return { index, loading, history };
}

// ─── Barra de dimensão ────────────────────────────────────────────────────────

function DimBar({
  dim,
}: {
  dim: DimensionScore & { key: string };
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">{dim.label}</p>
        <p className="text-xl font-bold" style={{ color: dim.color }}>
          {dim.score}%
        </p>
      </div>
      <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${dim.score}%`, backgroundColor: dim.color }}
        />
      </div>
      <p className="text-xs text-white/35">{dim.description}</p>
    </div>
  );
}

// ─── Mini gráfico de histórico ────────────────────────────────────────────────

function HistoryChart({ data }: { data: ISPCSnapshot[] }) {
  if (data.length < 2) {
    return (
      <p className="text-xs text-white/25 text-center py-4">
        Histórico disponível após o primeiro mês completo de uso.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.score), 100);
  const h = 60;
  const w = 300;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.score / max) * h;
    return `${x},${y}`;
  });

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h + 20}`}
        className="w-full max-w-sm"
        style={{ minWidth: "200px" }}
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#5DD3A8"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - (d.score / max) * h;
          return (
            <g key={d.period}>
              <circle cx={x} cy={y} r="3" fill="#5DD3A8" />
              <text x={x} y={h + 15} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">
                {d.period.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function IndicePreventivo() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const { index, loading, history } = usePreventiveIndex(companyId);
  const risk = index ? classConfig(index.classification) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Índice de Saúde Preventiva Corporativa
        </h1>
        <p className="text-sm text-white/40 mt-0.5">
          Score 0–100 calculado em tempo real · 4 dimensões de maturidade preventiva
        </p>
      </div>

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
          <p className="text-white/30 text-sm">Calculando índice...</p>
        </div>
      ) : index ? (
        <>
          {/* Score principal */}
          <div className={`rounded-2xl border p-8 ${risk?.bg} ${risk?.border}`}>
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: risk?.color }}>
                  {risk?.label}
                </p>
                <p className="text-7xl font-bold text-white leading-none">
                  {index.overall_score}
                </p>
                <p className="text-sm text-white/40 mt-2">
                  Atualizado agora ·{" "}
                  {new Date(index.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </div>

              {/* Impacto financeiro estimado */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-right min-w-[200px]">
                <p className="text-xs text-white/40 mb-1">Redução estimada de absenteísmo</p>
                <p className="text-2xl font-bold text-[#5DD3A8]">
                  {index.estimated_impact.absenteeism_reduction_pct}%
                </p>
                <p className="text-xs text-white/30 mt-1 mb-3">com o plano completo</p>
                <p className="text-xs text-white/40">Economia estimada / ano</p>
                <p className="text-lg font-bold text-[#C9A96E]">
                  R${" "}
                  {index.estimated_impact.annual_savings_brl.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>

          {/* Dimensões */}
          <div>
            <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wide">
              Breakdown por dimensão
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(index.dimensions).map(([key, dim]) => (
                <DimBar key={key} dim={{ ...dim, key }} />
              ))}
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">
              Evolução histórica (ISPC)
            </h2>
            <HistoryChart data={history} />
          </div>

          {/* Gaps e recomendações */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">
              Sugestões para melhorar o índice
            </h2>
            {Object.entries(index.dimensions)
              .filter(([, dim]) => dim.score < 70)
              .sort(([, a], [, b]) => a.score - b.score)
              .map(([key, dim]) => {
                const gap = 70 - dim.score;
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 bg-[#C9A96E]/5 border border-[#C9A96E]/15 rounded-xl p-4"
                  >
                    <span className="text-[#C9A96E] mt-0.5">⚠</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {dim.label} está em {dim.score}%
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Aumentar em {gap} pontos elevaria seu índice ao nível "Boa Maturidade".{" "}
                        {key === "vaccination" && "Registre mais vacinações e promova campanhas."}
                        {key === "education" && "Incentive colaboradores a concluírem as trilhas."}
                        {key === "mental_health" && "Aplique o diagnóstico preventivo para todos."}
                        {key === "ergonomics" && "Complete a trilha NR-1 com a equipe."}
                      </p>
                    </div>
                  </div>
                );
              })}
            {Object.values(index.dimensions).every((d) => d.score >= 70) && (
              <p className="text-sm text-[#5DD3A8]">
                ✓ Todas as dimensões atingiram o nível mínimo de maturidade. Continue mantendo!
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
