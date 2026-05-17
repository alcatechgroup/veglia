import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VaccinationRecord {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name?: string;
  vaccine_name: string;
  date: number;
  batch?: string;
  manufacturer?: string;
  next_dose_date?: number;
  status: "up_to_date" | "pending" | "overdue";
}

interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  cargo?: string;
  company_id: string;
}

// ─── Modal adicionar registro ─────────────────────────────────────────────────

function AddVaccinationModal({
  companyId,
  users,
  onClose,
}: {
  companyId: string;
  users: UserDoc[];
  onClose: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [vaccineName, setVaccineName] = useState("");
  const [date, setDate] = useState("");
  const [batch, setBatch] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [nextDoseDate, setNextDoseDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const VACCINE_OPTIONS = [
    "Influenza",
    "Hepatite B",
    "dTpa (adulto)",
    "dT (adulto)",
    "COVID-19",
    "Febre Amarela",
    "HPV",
    "Tríplice viral (SCR)",
    "Pneumocócica 23V",
    "Varicela",
    "Herpes Zoster",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const dateMs = new Date(date).getTime();
      const nextDoseMs = nextDoseDate ? new Date(nextDoseDate).getTime() : null;
      const now = Date.now();
      const employee = users.find((u) => u.uid === employeeId);

      const status: VaccinationRecord["status"] =
        !nextDoseMs || nextDoseMs > now
          ? "up_to_date"
          : nextDoseMs < now
          ? "overdue"
          : "pending";

      await addDoc(collection(db, "vaccination_records"), {
        company_id: companyId,
        employee_id: employeeId,
        employee_name: employee?.displayName ?? "",
        vaccine_name: vaccineName,
        date: dateMs,
        batch: batch.trim() || null,
        manufacturer: manufacturer.trim() || null,
        next_dose_date: nextDoseMs,
        status,
        created_at: serverTimestamp(),
      });

      // Registrar evento de auditoria
      await addDoc(collection(db, "audit_events"), {
        company_id: companyId,
        employee_id: employeeId,
        event_type: "vaccination_registered",
        payload: {
          vaccine_name: vaccineName,
          date: dateMs,
          description: `Vacina ${vaccineName} registrada para ${employee?.displayName ?? employeeId}`,
        },
        timestamp: Date.now(),
      });

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar vacinação.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4 text-center">
          <div className="text-4xl mb-3 text-[#5DD3A8]">✓</div>
          <p className="text-white font-semibold mb-1">Vacinação registrada!</p>
          <p className="text-white/40 text-sm mb-5">
            O registro foi salvo e a trilha de auditoria atualizada.
          </p>
          <button
            onClick={onClose}
            className="bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Registrar vacinação</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Colaborador */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">
              Colaborador *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            >
              <option value="" className="bg-[#0B2545]">
                Selecione o colaborador
              </option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid} className="bg-[#0B2545]">
                  {u.displayName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Vacina */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">
              Vacina *
            </label>
            <select
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            >
              <option value="" className="bg-[#0B2545]">
                Selecione a vacina
              </option>
              {VACCINE_OPTIONS.map((v) => (
                <option key={v} value={v} className="bg-[#0B2545]">
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Data de aplicação */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">
              Data de aplicação *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            />
          </div>

          {/* Lote e fabricante — linha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">
                Lote
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="Ex: ABC1234"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">
                Fabricante
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Ex: Butantan"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>
          </div>

          {/* Próxima dose */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">
              Próxima dose (opcional)
            </label>
            <input
              type="date"
              value={nextDoseDate}
              onChange={(e) => setNextDoseDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !employeeId || !vaccineName || !date}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function VaxBadge({ status }: { status: VaccinationRecord["status"] }) {
  if (status === "up_to_date") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
        ✓ Em dia
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded-full">
        ⚠ Pendente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
      ✗ Vencida
    </span>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ComplianceVacinacao() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "todos" | VaccinationRecord["status"]
  >("todos");

  // Carrega usuários
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "users"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => d.data() as UserDoc));
    });
  }, [companyId]);

  // Carrega registros vacinais
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "vaccination_records"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      setRecords(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaccinationRecord))
      );
      setLoading(false);
    });
  }, [companyId]);

  const filtered =
    filterStatus === "todos"
      ? records
      : records.filter((r) => r.status === filterStatus);

  const counts = {
    up_to_date: records.filter((r) => r.status === "up_to_date").length,
    pending: records.filter((r) => r.status === "pending").length,
    overdue: records.filter((r) => r.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Controle Vacinal</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Registro e monitoramento de vacinação dos colaboradores
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Registrar vacina
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Em dia", value: counts.up_to_date, color: "text-[#5DD3A8]" },
          { label: "Pendentes", value: counts.pending, color: "text-[#C9A96E]" },
          { label: "Vencidas", value: counts.overdue, color: "text-red-400" },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5"
          >
            <p className="text-xs text-white/40 mb-1">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(
          [
            ["todos", "Todos"],
            ["up_to_date", "Em dia"],
            ["pending", "Pendentes"],
            ["overdue", "Vencidas"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterStatus(v)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              filterStatus === v
                ? "bg-[#5DD3A8]/15 border-[#5DD3A8]/40 text-[#5DD3A8]"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            Carregando registros...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-white/30 text-sm">
              {filterStatus === "todos"
                ? "Nenhum registro de vacinação encontrado."
                : `Nenhum registro com status "${filterStatus}".`}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-[#5DD3A8] text-sm hover:underline"
            >
              Registrar primeira vacinação
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3">
                  Colaborador
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Vacina
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Data
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Próxima dose
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-white">
                      {rec.employee_name ?? rec.employee_id}
                    </p>
                    {rec.batch && (
                      <p className="text-[11px] text-white/30">Lote: {rec.batch}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/70">
                    {rec.vaccine_name}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">
                    {rec.date
                      ? new Date(rec.date).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">
                    {rec.next_dose_date
                      ? new Date(rec.next_dose_date).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <VaxBadge status={rec.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddVaccinationModal
          companyId={companyId}
          users={users}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
