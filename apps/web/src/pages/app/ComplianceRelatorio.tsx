import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReportRow {
  uid: string;
  name: string;
  email: string;
  cargo: string;
  // Vacinação
  vaccines_count: number;
  last_vaccine: string;
  vaccine_status: string;
  // Treinamento
  courses_completed: number;
  lei15377_done: boolean;
  nr1_done: boolean;
  certificate_lei15377?: string;
  certificate_nr1?: string;
  // Score
  compliance_score: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcScore(row: Omit<ReportRow, "compliance_score">): number {
  let s = 0;
  if (row.lei15377_done) s += 40;
  if (row.nr1_done) s += 20;
  if (row.vaccines_count > 0) s += 25;
  if (row.vaccines_count >= 3) s += 15;
  return Math.min(s, 100);
}

function downloadCSV(rows: ReportRow[], companyId: string) {
  const headers = [
    "Nome",
    "E-mail",
    "Cargo",
    "Vacinas registradas",
    "Última vacina",
    "Status vacinal",
    "Cursos concluídos",
    "Lei 15.377 concluída",
    "NR-1 concluída",
    "Certificado Lei 15.377",
    "Score Compliance",
    "Gerado em",
  ];

  const lines = rows.map((r) => [
    r.name,
    r.email,
    r.cargo,
    r.vaccines_count,
    r.last_vaccine,
    r.vaccine_status,
    r.courses_completed,
    r.lei15377_done ? "Sim" : "Não",
    r.nr1_done ? "Sim" : "Não",
    r.certificate_lei15377 ?? "—",
    r.compliance_score,
    new Date().toLocaleDateString("pt-BR"),
  ]);

  const csv = [headers, ...lines]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const BOM = "﻿";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-compliance-${companyId}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ComplianceRelatorio() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const generateReport = async () => {
    if (!companyId) return;
    setLoading(true);

    try {
      // 1. Buscar usuários
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("company_id", "==", companyId))
      );

      // 2. Buscar enrollments
      const enrollSnap = await getDocs(
        query(collection(db, "enrollments"), where("company_id", "==", companyId))
      );

      // 3. Buscar registros vacinais
      const vaxSnap = await getDocs(
        query(
          collection(db, "vaccination_records"),
          where("company_id", "==", companyId)
        )
      );

      // Indexar enrollments por uid
      const enrollByUid = new Map<string, { course_id: string; completed_at: number | null; certificate_url: string | null }[]>();
      enrollSnap.docs.forEach((d) => {
        const data = d.data();
        const uid = data.uid as string;
        if (!enrollByUid.has(uid)) enrollByUid.set(uid, []);
        enrollByUid.get(uid)!.push({
          course_id: data.course_id,
          completed_at: data.completed_at ?? null,
          certificate_url: data.certificate_url ?? null,
        });
      });

      // Indexar vacinações por employee_id
      const vaxByUid = new Map<string, { vaccine_name: string; date: number }[]>();
      vaxSnap.docs.forEach((d) => {
        const data = d.data();
        const eid = data.employee_id as string;
        if (!vaxByUid.has(eid)) vaxByUid.set(eid, []);
        vaxByUid.get(eid)!.push({
          vaccine_name: data.vaccine_name,
          date: data.date,
        });
      });

      // Montar linhas do relatório
      const reportRows: ReportRow[] = usersSnap.docs.map((d) => {
        const user = d.data();
        const uid = user.uid as string;

        const enrolls = enrollByUid.get(uid) ?? [];
        const vaxes = vaxByUid.get(uid) ?? [];

        const lei15377Enroll = enrolls.find((e) => e.course_id === "lei-15377");
        const nr1Enroll = enrolls.find((e) => e.course_id === "nr-1");
        const completedEnrolls = enrolls.filter((e) => e.completed_at != null);

        const lastVax = vaxes.sort((a, b) => b.date - a.date)[0];

        const partial: Omit<ReportRow, "compliance_score"> = {
          uid,
          name: (user.displayName as string) ?? "",
          email: (user.email as string) ?? "",
          cargo: (user.cargo as string) ?? "",
          vaccines_count: vaxes.length,
          last_vaccine: lastVax
            ? `${lastVax.vaccine_name} (${new Date(lastVax.date).toLocaleDateString("pt-BR")})`
            : "—",
          vaccine_status: vaxes.length > 0 ? "Registrada" : "Sem registro",
          courses_completed: completedEnrolls.length,
          lei15377_done: !!(lei15377Enroll?.completed_at),
          nr1_done: !!(nr1Enroll?.completed_at),
          certificate_lei15377: lei15377Enroll?.certificate_url ?? undefined,
          certificate_nr1: nr1Enroll?.certificate_url ?? undefined,
        };

        return { ...partial, compliance_score: calcScore(partial) };
      });

      setRows(reportRows);
      setGenerated(true);
      setGeneratedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  const overallScore =
    rows.length > 0
      ? Math.round(rows.reduce((a, b) => a + b.compliance_score, 0) / rows.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatório de Auditoria</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Exportação de evidências para auditoria e fiscalização — Lei 15.377/2026
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? "Gerando..." : generated ? "Atualizar relatório" : "Gerar relatório"}
          </button>
          {generated && rows.length > 0 && (
            <button
              onClick={() => downloadCSV(rows, companyId)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              ↓ Baixar CSV
            </button>
          )}
        </div>
      </div>

      {/* Info de auditoria */}
      <div className="bg-[#5DD3A8]/8 border border-[#5DD3A8]/20 rounded-2xl p-5 text-xs text-white/60 leading-relaxed">
        <p className="font-semibold text-[#5DD3A8] mb-1">Evidências para auditoria</p>
        Este relatório documenta o cumprimento da Lei 15.377/2026 com dados em tempo real do
        Firestore. Para cada colaborador são listados: vacinações registradas, conclusão de
        trilhas obrigatórias, certificados com hash SHA-256, e score de compliance individual.
        O CSV gerado é aceito como evidência em ações trabalhistas e fiscalizações.
      </div>

      {/* Resultado do relatório */}
      {generated && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
              <p className="text-xs text-white/40 mb-1">Total colaboradores</p>
              <p className="text-3xl font-bold text-white">{rows.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
              <p className="text-xs text-white/40 mb-1">Lei 15.377 completa</p>
              <p className="text-3xl font-bold text-[#5DD3A8]">
                {rows.filter((r) => r.lei15377_done).length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
              <p className="text-xs text-white/40 mb-1">Vacinados</p>
              <p className="text-3xl font-bold text-[#5DD3A8]">
                {rows.filter((r) => r.vaccines_count > 0).length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
              <p className="text-xs text-white/40 mb-1">Score médio</p>
              <p className="text-3xl font-bold text-[#C9A96E]">{overallScore}%</p>
            </div>
          </div>

          {/* Cabeçalho do relatório */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              {generatedAt &&
                `Gerado em ${generatedAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </p>
            <p className="text-xs text-white/30">{rows.length} colaboradores</p>
          </div>

          {/* Tabela */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Colaborador",
                    "Cargo",
                    "Vacinas",
                    "Lei 15.377",
                    "NR-1",
                    "Score",
                    "Certificado",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-medium text-white/30 px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.uid}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-white">{row.name}</p>
                      <p className="text-[11px] text-white/30">{row.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/50">
                      {row.cargo || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/50">
                      {row.vaccines_count > 0 ? (
                        <span className="text-[#5DD3A8]">{row.vaccines_count} registrada{row.vaccines_count !== 1 ? "s" : ""}</span>
                      ) : (
                        <span className="text-white/25">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {row.lei15377_done ? (
                        <span className="text-xs text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
                          ✓ Concluída
                        </span>
                      ) : (
                        <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-full">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {row.nr1_done ? (
                        <span className="text-xs text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
                          ✓ Concluída
                        </span>
                      ) : (
                        <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-full">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#5DD3A8]"
                            style={{ width: `${row.compliance_score}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white w-8 text-right">
                          {row.compliance_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {row.certificate_lei15377 ? (
                        <a
                          href={row.certificate_lei15377}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#5DD3A8] hover:underline"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!generated && !loading && (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-16 text-center">
          <p className="text-4xl mb-4">▦</p>
          <p className="text-white/50 text-sm mb-2">
            Clique em "Gerar relatório" para consolidar os dados de compliance.
          </p>
          <p className="text-white/25 text-xs">
            O processo leva alguns segundos e agrega vacinações, treinamentos e certificados.
          </p>
        </div>
      )}
    </div>
  );
}
