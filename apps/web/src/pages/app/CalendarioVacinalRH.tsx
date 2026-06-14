import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Referência: Calendário de Vacinação do Adulto (SBIm 2026/27) ─────────────
// Conteúdo de referência. A indicação individual depende de avaliação médica.
// Validado pela Dra. Amanda Conde Perez Fernandes (SBIm).

interface VacinaSBIm {
  nome: string;
  indicacao: string;
  esquema: string;
  destaque?: boolean;
}

const CALENDARIO_SBIM: VacinaSBIm[] = [
  { nome: "Influenza (Gripe)", indicacao: "Todos os adultos", esquema: "1 dose anual" },
  { nome: "Hepatite B", indicacao: "Não vacinados / esquema incompleto", esquema: "3 doses (0 · 1 · 6 meses)" },
  { nome: "dT / dTpa (Tétano e Difteria)", indicacao: "Todos os adultos", esquema: "Reforço a cada 10 anos · dTpa para gestantes" },
  { nome: "HPV", indicacao: "Adultos até 45 anos", esquema: "Até 3 doses conforme idade", destaque: true },
  { nome: "Tríplice viral (Sarampo, Caxumba, Rubéola)", indicacao: "Adultos até 59 anos sem comprovação", esquema: "1 a 2 doses conforme histórico" },
  { nome: "Febre Amarela", indicacao: "Áreas de risco / viagem", esquema: "Dose única" },
  { nome: "Pneumocócicas (VPC + VPP23)", indicacao: "60+ ou grupos de risco", esquema: "Conforme avaliação" },
  { nome: "Herpes Zóster", indicacao: "Adultos 50+", esquema: "2 doses" },
  { nome: "Varicela (Catapora)", indicacao: "Suscetíveis sem histórico", esquema: "2 doses" },
  { nome: "COVID-19", indicacao: "Conforme recomendação vigente", esquema: "Reforços periódicos" },
];

// ─── Tipos de dados reais ─────────────────────────────────────────────────────

type StatusVacina = "up_to_date" | "overdue" | "pending";

interface VaccinationRecord {
  employee_id: string;
  employee_name?: string;
  vaccine_name: string;
  status?: StatusVacina;
}

interface UserDoc {
  uid: string;
  role?: string;
}

interface VaccineRequest {
  id: string;
  requester_name?: string;
  vaccine_name: string;
  note?: string;
  status: string;
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = "#5DD3A8" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex-1 min-w-0">
      <p className="text-xs text-white/40 font-medium mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── CalendarioVacinalRH ──────────────────────────────────────────────────────

export default function CalendarioVacinalRH() {
  const { claims } = useAuth();
  const companyId = claims?.company_id;

  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [colaboradores, setColaboradores] = useState<UserDoc[]>([]);
  const [requests, setRequests] = useState<VaccineRequest[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "vaccination_records"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => d.data() as VaccinationRecord));
    });
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "users"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      setColaboradores(
        snap.docs.map((d) => d.data() as UserDoc).filter((u) => u.role === "collaborator")
      );
    });
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "vaccine_requests"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VaccineRequest, "id">) })));
    });
  }, [companyId]);

  // ── Resumo de cobertura real ──
  const resumo = useMemo(() => {
    const totalColab = colaboradores.length;
    const comRegistro = new Set(records.map((r) => r.employee_id)).size;
    const emDia = records.filter((r) => r.status === "up_to_date").length;
    const vencidos = records.filter((r) => r.status === "overdue").length;

    // Cobertura por vacina (agrupa pelos nomes realmente registrados)
    const porVacina = new Map<string, { colaboradores: Set<string>; emDia: number; vencidos: number }>();
    records.forEach((r) => {
      const k = r.vaccine_name || "—";
      if (!porVacina.has(k)) porVacina.set(k, { colaboradores: new Set(), emDia: 0, vencidos: 0 });
      const e = porVacina.get(k)!;
      e.colaboradores.add(r.employee_id);
      if (r.status === "up_to_date") e.emDia++;
      if (r.status === "overdue") e.vencidos++;
    });

    return {
      totalColab,
      comRegistro,
      emDia,
      vencidos,
      cobertura: totalColab ? Math.round((comRegistro / totalColab) * 100) : 0,
      porVacina: Array.from(porVacina.entries()).map(([nome, v]) => ({
        nome,
        colaboradores: v.colaboradores.size,
        emDia: v.emDia,
        vencidos: v.vencidos,
      })),
    };
  }, [records, colaboradores]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">Saúde · Vacinação</p>
        <h1 className="text-2xl font-bold text-white">Calendário Vacinal</h1>
        <p className="text-sm text-white/40 mt-1">
          Calendário de referência SBIm para adultos e cobertura vacinal da sua empresa.
          O registro por colaborador é feito em{" "}
          <Link to="/app/compliance/vacinacao" className="text-[#5DD3A8] hover:underline">Compliance · Vacinação</Link>.
        </p>
      </div>

      {/* Resumo de cobertura real */}
      <div className="flex gap-4 flex-wrap">
        <KpiCard label="Colaboradores" value={String(resumo.totalColab)} sub="cadastrados na empresa" color="#C9DCE8" />
        <KpiCard label="Com registro vacinal" value={String(resumo.comRegistro)} sub={`${resumo.cobertura}% de cobertura`} color="#5DD3A8" />
        <KpiCard label="Registros em dia" value={String(resumo.emDia)} color="#5DD3A8" />
        <KpiCard label="Doses vencidas" value={String(resumo.vencidos)} sub="exigem atenção" color="#E05252" />
      </div>

      {/* Solicitações de vacina dos colaboradores */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
            Solicitações de vacina · colaboradores
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm text-white/85 font-medium">{r.vaccine_name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {r.requester_name ?? "Colaborador"}{r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-[#C9A96E]/15 text-[#C9A96E] shrink-0">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 italic">
            Atenda agendando uma campanha em{" "}
            <Link to="/app/in-company" className="text-[#5DD3A8]/70 hover:text-[#5DD3A8]">In-Company VaciVitta</Link>.
          </p>
        </div>
      )}

      {/* Cobertura por vacina (real) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Cobertura por vacina</h2>
        {resumo.porVacina.length === 0 ? (
          <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/25 rounded-2xl px-5 py-4">
            <p className="text-sm text-[#C9A96E] font-medium">Nenhum registro vacinal ainda.</p>
            <p className="text-xs text-white/50 mt-1">
              Registre vacinas dos colaboradores em{" "}
              <Link to="/app/compliance/vacinacao" className="text-[#5DD3A8] hover:underline">Compliance · Vacinação</Link> para acompanhar a cobertura aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {resumo.porVacina.map((v) => (
              <div key={v.nome} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <p className="text-sm text-white/80 font-medium">{v.nome}</p>
                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="text-white/50">{v.colaboradores} colaborador{v.colaboradores !== 1 ? "es" : ""}</span>
                  <span className="text-[#5DD3A8]">{v.emDia} em dia</span>
                  {v.vencidos > 0 && <span className="text-[#E05252]">{v.vencidos} vencida{v.vencidos !== 1 ? "s" : ""}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendário de referência SBIm */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Calendário de referência · adulto (SBIm)</h2>
          <span className="text-[10px] font-semibold text-[#C9A96E]/70 bg-[#C9A96E]/8 border border-[#C9A96E]/20 px-2 py-0.5 rounded-full tracking-wide">
            Validado pela Dra. Amanda Conde · SBIm
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-xs font-medium text-white/40 px-5 py-3">Vacina</th>
                  <th className="text-left text-xs font-medium text-white/40 px-5 py-3">Indicação</th>
                  <th className="text-left text-xs font-medium text-white/40 px-5 py-3">Esquema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {CALENDARIO_SBIM.map((v) => (
                  <tr key={v.nome} className={v.destaque ? "bg-[#5DD3A8]/5" : ""}>
                    <td className="px-5 py-3 font-medium text-white/85">
                      {v.nome}
                      {v.destaque && <span className="ml-2 text-[10px] text-[#5DD3A8] bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 px-1.5 py-0.5 rounded">previne câncer</span>}
                    </td>
                    <td className="px-5 py-3 text-white/55">{v.indicacao}</td>
                    <td className="px-5 py-3 text-white/55">{v.esquema}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-white/30 italic">
          Referência geral. A indicação individual depende de idade, histórico e avaliação médica.
          Campanhas in-company podem ser solicitadas em{" "}
          <Link to="/app/in-company" className="text-[#5DD3A8]/70 hover:text-[#5DD3A8]">In-Company VaciVitta</Link>.
        </p>
      </div>
    </div>
  );
}
