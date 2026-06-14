import { useState, useEffect, useMemo, type FormEvent } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// Vacinas de referência (SBIm adulto) — para os selects
const VACINAS = [
  "Influenza (Gripe)",
  "Hepatite B",
  "dT / dTpa (Tétano e Difteria)",
  "HPV",
  "Tríplice viral (Sarampo, Caxumba, Rubéola)",
  "Febre Amarela",
  "Pneumocócicas",
  "Herpes Zóster",
  "Varicela (Catapora)",
  "COVID-19",
  "Outra",
];

type StatusVacina = "up_to_date" | "overdue" | "pending";

interface VaccinationRecord {
  id: string;
  vaccine_name: string;
  date?: number | null;
  next_dose_date?: number | null;
  status?: StatusVacina;
}

interface VaccineRequest {
  id: string;
  vaccine_name: string;
  status: string;
  note?: string;
}

export default function MinhasVacinas() {
  const { firebaseUser, vegliaUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id;
  const nome = vegliaUser?.displayName ?? firebaseUser?.displayName ?? firebaseUser?.email ?? "Colaborador";

  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [requests, setRequests] = useState<VaccineRequest[]>([]);

  // Formulário de registro
  const [vacina, setVacina] = useState(VACINAS[0]);
  const [dataAplicacao, setDataAplicacao] = useState("");
  const [proximaDose, setProximaDose] = useState("");
  const [savingRec, setSavingRec] = useState(false);
  const [recMsg, setRecMsg] = useState("");

  // Formulário de solicitação ao RH
  const [reqVacina, setReqVacina] = useState(VACINAS[0]);
  const [reqNota, setReqNota] = useState("");
  const [savingReq, setSavingReq] = useState(false);
  const [reqMsg, setReqMsg] = useState("");

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "vaccination_records"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VaccinationRecord, "id">) })));
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "vaccine_requests"), where("requested_by", "==", uid));
    return onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VaccineRequest, "id">) })));
    });
  }, [uid]);

  const now = useMemo(() => Date.now(), []);

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid || !companyId || !dataAplicacao) return;
    setSavingRec(true);
    setRecMsg("");
    try {
      const nextMs = proximaDose ? new Date(proximaDose).getTime() : null;
      const status: StatusVacina = nextMs && nextMs < now ? "overdue" : "up_to_date";
      await addDoc(collection(db, "vaccination_records"), {
        uid,
        employee_id: uid,
        employee_name: nome,
        company_id: companyId,
        vaccine_name: vacina,
        date: new Date(dataAplicacao).getTime(),
        next_dose_date: nextMs,
        status,
        source: "self_report",
        created_at: serverTimestamp(),
      });
      setDataAplicacao("");
      setProximaDose("");
      setRecMsg("Vacina registrada.");
    } catch {
      setRecMsg("Erro ao registrar. Tente novamente.");
    } finally {
      setSavingRec(false);
      setTimeout(() => setRecMsg(""), 4000);
    }
  };

  const solicitar = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid || !companyId) return;
    setSavingReq(true);
    setReqMsg("");
    try {
      await addDoc(collection(db, "vaccine_requests"), {
        company_id: companyId,
        requested_by: uid,
        requester_name: nome,
        vaccine_name: reqVacina,
        note: reqNota.trim(),
        status: "solicitado",
        created_at: serverTimestamp(),
      });
      setReqNota("");
      setReqMsg("Solicitacao enviada ao RH.");
    } catch {
      setReqMsg("Erro ao enviar. Tente novamente.");
    } finally {
      setSavingReq(false);
      setTimeout(() => setReqMsg(""), 4000);
    }
  };

  const fmt = (ms?: number | null) => (ms ? new Date(ms).toLocaleDateString("pt-BR") : "—");
  const isOverdue = (r: VaccinationRecord) =>
    r.status === "overdue" || (!!r.next_dose_date && r.next_dose_date < now);

  const atrasadas = records.filter(isOverdue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">Saúde · Você</p>
        <h1 className="text-2xl font-bold text-white">Minhas Vacinas</h1>
        <p className="text-sm text-white/40 mt-1">
          Informe as vacinas que você já tomou, acompanhe o que está em atraso e solicite vacinas ao RH.
        </p>
      </div>

      {/* Alerta de atrasadas */}
      {atrasadas.length > 0 && (
        <div className="bg-[#E05252]/10 border border-[#E05252]/25 rounded-2xl px-5 py-4">
          <p className="text-sm text-[#E05252] font-semibold">
            {atrasadas.length} vacina{atrasadas.length !== 1 ? "s" : ""} em atraso
          </p>
          <p className="text-xs text-white/50 mt-1">
            {atrasadas.map((r) => r.vaccine_name).join(" · ")}. Procure um posto de saúde ou solicite ao seu RH.
          </p>
        </div>
      )}

      {/* Registrar vacina */}
      <form onSubmit={registrar} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Registrar uma vacina</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Vacina</label>
            <select
              value={vacina}
              onChange={(e) => setVacina(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/40"
            >
              {VACINAS.map((v) => <option key={v} value={v} className="bg-[#0B2545]">{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Data de aplicação</label>
            <input
              type="date" value={dataAplicacao} required
              onChange={(e) => setDataAplicacao(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/40"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Próxima dose (opcional)</label>
            <input
              type="date" value={proximaDose}
              onChange={(e) => setProximaDose(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/40"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={savingRec || !dataAplicacao}
            className="bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {savingRec ? "Salvando…" : "Registrar"}
          </button>
          {recMsg && <span className="text-xs text-white/50">{recMsg}</span>}
        </div>
      </form>

      {/* Minhas vacinas registradas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Vacinas registradas</h2>
        {records.length === 0 ? (
          <p className="text-sm text-white/30 py-3">Você ainda não registrou vacinas.</p>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {records.map((r) => {
              const overdue = isOverdue(r);
              return (
                <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="text-sm text-white/85 font-medium">{r.vaccine_name}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Aplicada em {fmt(r.date)}{r.next_dose_date ? ` · próxima ${fmt(r.next_dose_date)}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${overdue ? "bg-[#E05252]/15 text-[#E05252]" : "bg-[#5DD3A8]/15 text-[#5DD3A8]"}`}>
                    {overdue ? "Em atraso" : "Em dia"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solicitar vacina ao RH */}
      <form onSubmit={solicitar} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Solicitar vacina ao RH</h2>
          <p className="text-sm text-white/40 mt-0.5">Peça ao RH uma vacina ou uma campanha. Sua solicitação aparece para o time de RH.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Vacina desejada</label>
            <select
              value={reqVacina}
              onChange={(e) => setReqVacina(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/40"
            >
              {VACINAS.map((v) => <option key={v} value={v} className="bg-[#0B2545]">{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Observação (opcional)</label>
            <input
              type="text" value={reqNota}
              onChange={(e) => setReqNota(e.target.value)}
              placeholder="Ex: prefiro no período da manhã"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/40"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={savingReq}
            className="bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {savingReq ? "Enviando…" : "Solicitar ao RH"}
          </button>
          {reqMsg && <span className="text-xs text-white/50">{reqMsg}</span>}
        </div>

        {requests.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <p className="text-xs text-white/40">Suas solicitações:</p>
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-white/60">{r.vaccine_name}</span>
                <span className="text-[#C9A96E]">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
