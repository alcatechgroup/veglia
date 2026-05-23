import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

type EmployeeStatus =
  | "importado"
  | "convite_enviado"
  | "acesso_aceito"
  | "em_andamento"
  | "concluido"
  | "certificado_emitido";

interface Employee {
  id: string;
  displayName: string;
  email: string;
  cargo?: string;
  filial_id?: string | null;
  departamento?: string | null;
  employee_status: EmployeeStatus;
  progress_pct?: number;
  last_activity_at?: number;
  email_sent_at?: number | null;
  usedAt?: number | null;
  createdAt: number;
}

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  importado: { label: "Importado", color: "text-white/40", bg: "bg-white/5" },
  convite_enviado: { label: "Convite enviado", color: "text-sky-400", bg: "bg-sky-500/10" },
  acesso_aceito: { label: "Acesso aceito", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  em_andamento: { label: "Em andamento", color: "text-amber-400", bg: "bg-amber-500/10" },
  concluido: { label: "Concluído", color: "text-green-400", bg: "bg-green-500/10" },
  certificado_emitido: { label: "Certificado emitido", color: "text-[#5DD3A8]", bg: "bg-[#5DD3A8]/10" },
};

export default function ColaboradoresRH() {
  const { claims } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendingBatch, setSendingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<{ sent: number; errors: number } | null>(null);
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const companyId = claims?.company_id;
    if (!companyId) return;
    const q = query(
      collection(db, "invites"),
      where("company_id", "==", companyId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Employee)));
      setLoading(false);
    });
  }, [claims?.company_id]);

  const filtered = employees.filter((emp) => {
    const matchSearch =
      !search ||
      emp.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || emp.employee_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counters = {
    total: employees.length,
    comAcesso: employees.filter((e) =>
      ["acesso_aceito", "em_andamento", "concluido", "certificado_emitido"].includes(e.employee_status)
    ).length,
    certificados: employees.filter((e) => e.employee_status === "certificado_emitido").length,
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const pendentes = filtered.filter((e) => e.employee_status === "importado").map((e) => e.id);
    setSelected(new Set(pendentes));
  };

  const handleSendBatch = async () => {
    if (selected.size === 0) return;
    const ok = window.confirm(`Enviar convite para ${selected.size} funcionário(s) selecionado(s)?`);
    if (!ok) return;
    setSendingBatch(true);
    const toSend = employees.filter((e) => selected.has(e.id) && e.employee_status === "importado");
    const fns = getFunctions();
    const sendInviteEmail = httpsCallable(fns, "sendInviteEmail");
    let sent = 0;
    let errors = 0;
    for (const emp of toSend) {
      try {
        await sendInviteEmail({
          inviteId: emp.id,
          toEmail: emp.email,
          toName: emp.displayName,
          companyName: "",
        });
        sent++;
      } catch {
        errors++;
      }
    }
    setBatchResult({ sent, errors });
    setSelected(new Set());
    setSendingBatch(false);
    setTimeout(() => setBatchResult(null), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Gestão de Equipe
        </p>
        <h1 className="text-2xl font-bold text-white">Colaboradores</h1>

        {/* Counters */}
        <div className="flex gap-6 mt-4">
          {[
            { label: "Total importados", value: counters.total },
            { label: "Com acesso", value: counters.comAcesso },
            { label: "Certificados emitidos", value: counters.certificados },
          ].map((c) => (
            <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + batch actions */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="flex-1 min-w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#5DD3A8]/40"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EmployeeStatus | "")}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_CONFIG) as EmployeeStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <button
          onClick={selectAll}
          className="text-xs px-3 py-2.5 rounded-xl border border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 transition-colors"
        >
          Selecionar pendentes
        </button>
        {selected.size > 0 && (
          <button
            onClick={handleSendBatch}
            disabled={sendingBatch}
            className="text-xs px-4 py-2.5 rounded-xl bg-[#5DD3A8]/15 text-[#5DD3A8] hover:bg-[#5DD3A8]/25 transition-colors disabled:opacity-50"
          >
            {sendingBatch ? "Enviando…" : `Enviar convite (${selected.size})`}
          </button>
        )}
        {batchResult && (
          <span className="text-xs text-[#5DD3A8]">
            &#10003; {batchResult.sent} enviados
            {batchResult.errors > 0 ? `, ${batchResult.errors} erros` : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Carregando colaboradores…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30 text-sm">Nenhum colaborador encontrado.</p>
            <p className="text-white/20 text-xs mt-1">
              Importe uma planilha CSV ou envie convites individualmente.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    className="accent-[#5DD3A8]"
                    checked={
                      selected.size > 0 &&
                      selected.size ===
                        filtered.filter((e) => e.employee_status === "importado").length
                    }
                    onChange={() =>
                      selected.size > 0 ? setSelected(new Set()) : selectAll()
                    }
                  />
                </th>
                {["Nome", "E-mail", "Cargo", "Status", "Progresso", "Última atividade"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] text-white/30 uppercase tracking-wider font-medium"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((emp) => {
                const status = STATUS_CONFIG[emp.employee_status] ?? STATUS_CONFIG.importado;
                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-white/3 cursor-pointer transition-colors"
                    onClick={() => setDrawerEmployee(emp)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(emp.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="accent-[#5DD3A8]"
                        checked={selected.has(emp.id)}
                        onChange={() => {}}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white/80 font-medium">
                        {emp.displayName || emp.email.split("@")[0]}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/45">{emp.email}</td>
                    <td className="px-4 py-3 text-xs text-white/40">{emp.cargo || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full font-medium ${status.color} ${status.bg}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(emp.progress_pct ?? 0) > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#5DD3A8] rounded-full"
                              style={{ width: `${emp.progress_pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/40">{emp.progress_pct}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30">
                      {emp.last_activity_at
                        ? new Date(emp.last_activity_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer — timeline do colaborador */}
      {drawerEmployee && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setDrawerEmployee(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0B2545] border-l border-white/10 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">
                {drawerEmployee.displayName}
              </h2>
              <button
                onClick={() => setDrawerEmployee(null)}
                className="text-white/30 hover:text-white/70 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/40 mb-1">{drawerEmployee.email}</p>
            <p className="text-xs text-white/30 mb-6">
              {drawerEmployee.cargo || "Sem cargo"}
              {drawerEmployee.departamento ? ` · ${drawerEmployee.departamento}` : ""}
            </p>

            {/* Status badge */}
            <div className="mb-6">
              {(() => {
                const s =
                  STATUS_CONFIG[drawerEmployee.employee_status] ?? STATUS_CONFIG.importado;
                return (
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${s.color} ${s.bg}`}
                  >
                    {s.label}
                  </span>
                );
              })()}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Timeline</p>
              {[
                { label: "Importado", date: drawerEmployee.createdAt, always: true },
                { label: "Convite enviado", date: drawerEmployee.email_sent_at, always: false },
                { label: "Acesso aceito", date: drawerEmployee.usedAt, always: false },
                {
                  label: "Início da trilha",
                  date: (drawerEmployee.progress_pct ?? 0) > 0 ? drawerEmployee.last_activity_at : null,
                  always: false,
                },
                {
                  label: "Certificado emitido",
                  date:
                    drawerEmployee.employee_status === "certificado_emitido"
                      ? drawerEmployee.last_activity_at
                      : null,
                  always: false,
                },
              ]
                .filter((t) => t.always || t.date)
                .map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#5DD3A8]/60 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-white/70">{t.label}</p>
                      {t.date && (
                        <p className="text-xs text-white/30">
                          {new Date(t.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Progresso */}
            {(drawerEmployee.progress_pct ?? 0) > 0 && (
              <div className="mt-6 p-4 bg-white/5 border border-white/8 rounded-xl">
                <p className="text-xs text-white/50 mb-2">Progresso na trilha</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5DD3A8] rounded-full transition-all"
                    style={{ width: `${drawerEmployee.progress_pct}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1.5">
                  {drawerEmployee.progress_pct}% concluído
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
