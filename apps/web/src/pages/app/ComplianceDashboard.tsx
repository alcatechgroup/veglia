import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

interface ComplianceScore {
  vaccination_coverage: number;
  training_compliance: number;
  mental_health_score: number;
  ergonomics_score: number;
  overall_score: number;
  risk_level: "alto" | "atencao" | "bom" | "excelencia";
  updated_at: number;
}

interface VaccinationRecord {
  employee_id: string;
  employee_name?: string;
  vaccine_name: string;
  next_dose_date: number;
  status: "up_to_date" | "pending" | "overdue";
}

// TrainingCompletion type reserved for future sub-pages

interface AuditEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskConfig(level: ComplianceScore["risk_level"]) {
  const configs = {
    alto: { label: "Alto Risco", color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30" },
    atencao: { label: "Atenção", color: "#C9A96E", bg: "bg-[#C9A96E]/10", border: "border-[#C9A96E]/30" },
    bom: { label: "Boa Maturidade", color: "#5DD3A8", bg: "bg-[#5DD3A8]/10", border: "border-[#5DD3A8]/30" },
    excelencia: { label: "Excelência", color: "#5DD3A8", bg: "bg-[#5DD3A8]/15", border: "border-[#5DD3A8]/40" },
  };
  return configs[level] ?? configs.atencao;
}

function derivedRiskLevel(score: number): ComplianceScore["risk_level"] {
  if (score >= 91) return "excelencia";
  if (score >= 71) return "bom";
  if (score >= 41) return "atencao";
  return "alto";
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="60" y="65" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

function DimensionBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-semibold text-white">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Hook: score de compliance ────────────────────────────────────────────────

function useComplianceScore(companyId: string) {
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    // Lê da collection compliance_scores/{company_id}
    const unsubUsers = onSnapshot(
      query(collection(db, "users"), where("company_id", "==", companyId)),
      (usersSnap) => {
        const total = usersSnap.size;
        if (total === 0) {
          setScore({
            vaccination_coverage: 0,
            training_compliance: 0,
            mental_health_score: 50,
            ergonomics_score: 50,
            overall_score: 0,
            risk_level: "alto",
            updated_at: Date.now(),
          });
          setLoading(false);
          return;
        }

        // Calcula treinamento a partir de enrollments concluídos
        onSnapshot(
          query(
            collection(db, "enrollments"),
            where("company_id", "==", companyId)
          ),
          (enrollSnap) => {
            const completed = enrollSnap.docs.filter(
              (d) => d.data().completed_at != null
            ).length;

            const trainingCompliance =
              total > 0 ? Math.round((completed / total) * 100) : 0;

            // Calcula vacinação de health_passports
            onSnapshot(
              query(
                collection(db, "health_passports"),
                where("company_id", "==", companyId)
              ),
              (passSnap) => {
                const vaccinated = passSnap.docs.filter(
                  (d) =>
                    ((d.data().vaccinations as unknown[]) ?? []).length > 0
                ).length;

                const vaccinationCoverage =
                  total > 0
                    ? Math.round((vaccinated / total) * 100)
                    : 0;

                const overall = Math.round(
                  vaccinationCoverage * 0.35 +
                    trainingCompliance * 0.35 +
                    50 * 0.15 + // mental_health — mock 50 por enquanto
                    50 * 0.15 // ergonomics — mock 50
                );

                setScore({
                  vaccination_coverage: vaccinationCoverage,
                  training_compliance: trainingCompliance,
                  mental_health_score: 50,
                  ergonomics_score: 50,
                  overall_score: overall,
                  risk_level: derivedRiskLevel(overall),
                  updated_at: Date.now(),
                });
                setLoading(false);
              }
            );
          }
        );
      }
    );

    return unsubUsers;
  }, [companyId]);

  return { score, loading };
}

// ─── Hook: alertas de vencimento ──────────────────────────────────────────────

function useUpcomingAlerts(companyId: string) {
  const [alerts, setAlerts] = useState<VaccinationRecord[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const thirtyDays = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const q = query(
      collection(db, "vaccination_records"),
      where("company_id", "==", companyId),
      where("status", "in", ["pending", "overdue"])
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as VaccinationRecord & { id: string }))
        .filter((r) => !r.next_dose_date || r.next_dose_date <= thirtyDays)
        .slice(0, 5);
      setAlerts(data);
    });
  }, [companyId]);

  return alerts;
}

// ─── Hook: trilha de auditoria ────────────────────────────────────────────────

function useAuditEvents(companyId: string) {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "audit_events"),
      where("company_id", "==", companyId),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEvent))
      );
    });
  }, [companyId]);

  return events;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ComplianceDashboard() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const { score, loading } = useComplianceScore(companyId);
  const alerts = useUpcomingAlerts(companyId);
  const auditEvents = useAuditEvents(companyId);

  const risk = score ? riskConfig(score.risk_level) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance em Saúde</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Lei 15.377/2026 — Monitoramento em tempo real
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/app/compliance/relatorio"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <span>▦</span>
            Exportar relatório
          </Link>
          <Link
            to="/app/compliance/vacinacao"
            className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <span>+</span>
            Registrar vacinação
          </Link>
        </div>
      </div>

      {/* Score principal + dimensões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card score geral */}
        <div className={`rounded-2xl border p-6 flex flex-col items-center justify-center gap-4 ${risk?.bg ?? "bg-white/5"} ${risk?.border ?? "border-white/10"}`}>
          {loading ? (
            <div className="text-white/30 text-sm">Calculando score...</div>
          ) : (
            <>
              <ScoreRing score={score?.overall_score ?? 0} color={risk?.color ?? "#5DD3A8"} />
              <div className="text-center">
                <p
                  className="text-lg font-bold"
                  style={{ color: risk?.color }}
                >
                  {risk?.label}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Índice de Compliance Geral
                </p>
              </div>
            </>
          )}
        </div>

        {/* Dimensões */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white mb-2">
            Breakdown por dimensão
          </h2>
          {loading ? (
            <div className="text-white/30 text-sm">Carregando...</div>
          ) : (
            <>
              <DimensionBar
                label="Cobertura Vacinal"
                value={score?.vaccination_coverage ?? 0}
                color="#5DD3A8"
              />
              <DimensionBar
                label="Compliance Educacional (Trilhas)"
                value={score?.training_compliance ?? 0}
                color="#5DD3A8"
              />
              <DimensionBar
                label="Saúde Mental"
                value={score?.mental_health_score ?? 50}
                color="#C9A96E"
              />
              <DimensionBar
                label="Ergonomia / SST"
                value={score?.ergonomics_score ?? 50}
                color="#C9A96E"
              />
            </>
          )}
        </div>
      </div>

      {/* Links para sub-páginas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            to: "/app/compliance/vacinacao",
            icon: "◈",
            label: "Controle Vacinal",
            sub: "Registros por colaborador",
          },
          {
            to: "/app/compliance/treinamentos",
            icon: "◎",
            label: "Treinamentos",
            sub: "Cursos e certificados",
          },
          {
            to: "/app/compliance/relatorio",
            icon: "▦",
            label: "Relatório de Auditoria",
            sub: "CSV / PDF exportável",
          },
          {
            to: "/app/relatorio",
            icon: "◆",
            label: "Relatório de Colaboradores",
            sub: "Status individual",
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-5 transition-colors group"
          >
            <span className="text-2xl text-[#5DD3A8] block mb-3">{item.icon}</span>
            <p className="text-sm font-semibold text-white group-hover:text-[#5DD3A8] transition-colors">
              {item.label}
            </p>
            <p className="text-xs text-white/35 mt-0.5">{item.sub}</p>
          </Link>
        ))}
      </div>

      {/* Alertas de vencimento */}
      {alerts.length > 0 && (
        <div className="bg-[#C9A96E]/8 border border-[#C9A96E]/25 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#C9A96E] text-base">⚠</span>
            <h2 className="text-sm font-semibold text-[#C9A96E]">
              Atenção: vacinas vencendo em 30 dias
            </h2>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-white font-medium">
                    {alert.vaccine_name}
                  </p>
                  {alert.employee_name && (
                    <p className="text-xs text-white/40">{alert.employee_name}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    alert.status === "overdue"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-[#C9A96E]/20 text-[#C9A96E]"
                  }`}
                >
                  {alert.status === "overdue" ? "Vencida" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trilha de auditoria */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Trilha de Auditoria</h2>
          <span className="text-xs text-white/30">Últimos 10 eventos</span>
        </div>
        {auditEvents.length === 0 ? (
          <div className="px-6 py-8 text-center text-white/25 text-sm">
            Nenhum evento de auditoria registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {auditEvents.map((ev) => (
              <div key={ev.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70 font-medium">{ev.event_type}</p>
                  {ev.payload?.description != null && (
                    <p className="text-xs text-white/30">{String(ev.payload.description as string | number | boolean)}</p>
                  )}
                </div>
                <span className="text-xs text-white/25">
                  {new Date(ev.timestamp).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
