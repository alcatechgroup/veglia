import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@veglia/firebase-config";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ComplianceScore {
  company_id: string;
  overall_score: number;
  risk_level: "alto" | "atencao" | "bom" | "excelencia";
  training_compliance: number;
  vaccination_coverage: number;
  updated_at: number;
}

interface ISPCSnapshot {
  company_id: string;
  period: string;
  score: number;
  breakdown: { education: number; vaccination: number; prevention: number };
  created_at: number;
}

interface PlatformStats {
  total_companies: number;
  total_users: number;
  total_certificates: number;
  total_enrollments: number;
  avg_compliance_score: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "text-[#5DD3A8]";
  if (score >= 60) return "text-[#C9A96E]";
  return "text-red-400";
}

function riskLabel(level: ComplianceScore["risk_level"]): string {
  const map = { alto: "Alto Risco", atencao: "Atencao", bom: "Bom", excelencia: "Excelencia" };
  return map[level] ?? level;
}

function riskColor(level: ComplianceScore["risk_level"]): string {
  const map = {
    alto: "text-red-400",
    atencao: "text-[#C9A96E]",
    bom: "text-[#5DD3A8]",
    excelencia: "text-[#5DD3A8]",
  };
  return map[level] ?? "text-white/50";
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Analytics() {
  const [stats, setStats] = useState<PlatformStats>({
    total_companies: 0,
    total_users: 0,
    total_certificates: 0,
    total_enrollments: 0,
    avg_compliance_score: 0,
  });
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [ispcSnapshots, setIspcSnapshots] = useState<ISPCSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega dados agregados
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    let companies = 0;
    let users = 0;
    let certificates = 0;
    let enrollments = 0;

    const u1 = onSnapshot(collection(db, "companies"), (snap) => {
      companies = snap.size;
      setStats((prev) => ({ ...prev, total_companies: companies }));
    });

    const u2 = onSnapshot(collection(db, "users"), (snap) => {
      users = snap.size;
      setStats((prev) => ({ ...prev, total_users: users }));
    });

    const u3 = onSnapshot(collection(db, "certificates"), (snap) => {
      certificates = snap.size;
      setStats((prev) => ({ ...prev, total_certificates: certificates }));
    });

    const u4 = onSnapshot(collection(db, "enrollments"), (snap) => {
      enrollments = snap.size;
      setStats((prev) => ({ ...prev, total_enrollments: enrollments }));
      setLoading(false);
    });

    const u5 = onSnapshot(collection(db, "compliance_scores"), (snap) => {
      const scores = snap.docs.map((d) => d.data() as ComplianceScore);
      setComplianceScores(scores);
      if (scores.length > 0) {
        const avg = Math.round(
          scores.reduce((sum, s) => sum + s.overall_score, 0) / scores.length
        );
        setStats((prev) => ({ ...prev, avg_compliance_score: avg }));
      }
    });

    const u6 = onSnapshot(
      query(collection(db, "ispc_snapshots"), orderBy("created_at", "desc"), limit(12)),
      (snap) => {
        setIspcSnapshots(snap.docs.map((d) => d.data() as ISPCSnapshot));
      }
    );

    unsubs.push(u1, u2, u3, u4, u5, u6);
    return () => unsubs.forEach((u) => u());
  }, []);

  // Agrupa ISPC por período (média de todas as empresas)
  const ispcByPeriod = ispcSnapshots.reduce<Record<string, number[]>>((acc, snap) => {
    if (!acc[snap.period]) acc[snap.period] = [];
    acc[snap.period].push(snap.score);
    return acc;
  }, {});

  const ispcTrend = Object.entries(ispcByPeriod)
    .map(([period, scores]) => ({
      period,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-6);

  const riskDistribution = {
    excelencia: complianceScores.filter((s) => s.risk_level === "excelencia").length,
    bom: complianceScores.filter((s) => s.risk_level === "bom").length,
    atencao: complianceScores.filter((s) => s.risk_level === "atencao").length,
    alto: complianceScores.filter((s) => s.risk_level === "alto").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics da Plataforma</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Metricas agregadas e anonimizadas — visao do ecossistema Vegl.ia
        </p>
      </div>

      {/* KPIs principais */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Empresas ativas", value: stats.total_companies, icon: "◈", color: "text-[#5DD3A8]" },
            { label: "Colaboradores", value: stats.total_users.toLocaleString("pt-BR"), icon: "◑", color: "text-white" },
            {
              label: "Certificados emitidos",
              value: stats.total_certificates.toLocaleString("pt-BR"),
              icon: "◆",
              color: "text-[#C9A96E]",
            },
            {
              label: "Score medio compliance",
              value: `${stats.avg_compliance_score}/100`,
              icon: "◎",
              color: scoreColor(stats.avg_compliance_score),
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2"
            >
              <span className={`text-xl ${kpi.color}`}>{kpi.icon}</span>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-white/40">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribuicao de risco */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Distribuicao de Risco — Empresas</h2>
          {complianceScores.length === 0 ? (
            <p className="text-xs text-white/30">Nenhum dado de compliance ainda.</p>
          ) : (
            <div className="space-y-3">
              {(
                [
                  { level: "excelencia", label: "Excelencia", color: "bg-[#5DD3A8]" },
                  { level: "bom", label: "Bom", color: "bg-[#5DD3A8]/60" },
                  { level: "atencao", label: "Atencao", color: "bg-[#C9A96E]" },
                  { level: "alto", label: "Alto Risco", color: "bg-red-500" },
                ] as const
              ).map(({ level, label, color }) => {
                const count = riskDistribution[level];
                const pct =
                  complianceScores.length > 0
                    ? Math.round((count / complianceScores.length) * 100)
                    : 0;
                return (
                  <div key={level} className="flex items-center gap-3 text-xs">
                    <span className="text-white/50 w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white/40 w-10 text-right">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tendencia ISPC */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Tendencia ISPC — Ultimos 6 meses</h2>
          {ispcTrend.length === 0 ? (
            <p className="text-xs text-white/30">
              Historico disponivel apos o primeiro calculo mensal (cron dia 1).
            </p>
          ) : (
            <div className="space-y-2">
              {ispcTrend.map(({ period, avg }) => (
                <div key={period} className="flex items-center gap-3 text-xs">
                  <span className="text-white/40 w-16 shrink-0 font-mono">{period}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        avg >= 80 ? "bg-[#5DD3A8]" : avg >= 60 ? "bg-[#C9A96E]" : "bg-red-500"
                      }`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                  <span className={`w-10 text-right font-semibold ${scoreColor(avg)}`}>
                    {avg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de scores por empresa */}
      {complianceScores.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">
              Score de Compliance por Empresa
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {complianceScores
              .sort((a, b) => b.overall_score - a.overall_score)
              .map((s) => (
                <div key={s.company_id} className="px-6 py-3 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/30 font-mono">
                      {s.company_id.slice(0, 12)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex gap-3 text-xs text-white/30">
                      <span>Edu: {s.training_compliance}%</span>
                      <span>Vac: {s.vaccination_coverage}%</span>
                    </div>
                    <span className={`text-xs font-medium ${riskColor(s.risk_level)}`}>
                      {riskLabel(s.risk_level)}
                    </span>
                    <p className={`text-lg font-bold ${scoreColor(s.overall_score)} w-12 text-right`}>
                      {s.overall_score}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Nota de privacidade */}
      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <span className="text-white/30 shrink-0">◎</span>
        <p className="text-xs text-white/40">
          Dados exibidos sao anonimizados e agregados. Nenhuma informacao individual e exposta.
          Visivel apenas para administradores da plataforma (role=admin).
        </p>
      </div>
    </div>
  );
}
