import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Enrollment {
  id: string;
  uid: string;
  company_id: string;
  course_id: string;
  started_at: number;
  completed_at: number | null;
  certificate_url: string | null;
  certificate_hash: string | null;
}

interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  cargo?: string;
}

interface EnhancedEnrollment {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  cargo?: string;
  course_id: string;
  course_title: string;
  started_at: number;
  completed_at: number | null;
  certificate_url: string | null;
  status: "completo" | "em_andamento" | "pendente";
}

// ─── Mapeamento de cursos ─────────────────────────────────────────────────────

const COURSE_TITLES: Record<string, string> = {
  "lei-15377": "Compliance Vacinal — Lei 15.377/2026",
  "nr-1": "NR-1 — Gestão de Riscos Ocupacionais",
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ComplianceTreinamentos() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<Map<string, UserDoc>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "todos" | "completo" | "em_andamento" | "pendente"
  >("todos");
  const [filterCourse, setFilterCourse] = useState<string>("todos");

  // Carrega usuários
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "users"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      const map = new Map<string, UserDoc>();
      snap.docs.forEach((d) => {
        const u = d.data() as UserDoc;
        map.set(u.uid, u);
      });
      setUsers(map);
    });
  }, [companyId]);

  // Carrega enrollments
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "enrollments"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      setEnrollments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment))
      );
      setLoading(false);
    });
  }, [companyId]);

  // Join enriched
  const enhanced: EnhancedEnrollment[] = enrollments.map((e) => {
    const user = users.get(e.uid);
    const status: EnhancedEnrollment["status"] = e.completed_at
      ? "completo"
      : e.started_at
      ? "em_andamento"
      : "pendente";
    return {
      id: e.id,
      uid: e.uid,
      displayName: user?.displayName ?? e.uid,
      email: user?.email ?? "",
      cargo: user?.cargo,
      course_id: e.course_id,
      course_title: COURSE_TITLES[e.course_id] ?? e.course_id,
      started_at: e.started_at,
      completed_at: e.completed_at,
      certificate_url: e.certificate_url,
      status,
    };
  });

  const filtered = enhanced.filter((e) => {
    if (filterStatus !== "todos" && e.status !== filterStatus) return false;
    if (filterCourse !== "todos" && e.course_id !== filterCourse) return false;
    return true;
  });

  const counts = {
    completo: enhanced.filter((e) => e.status === "completo").length,
    em_andamento: enhanced.filter((e) => e.status === "em_andamento").length,
    pendente: enhanced.filter((e) => e.status === "pendente").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Treinamentos e Certificados</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Controle de conclusão de trilhas e certificados emitidos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Certificados emitidos", value: counts.completo, color: "text-[#5DD3A8]" },
          { label: "Em andamento", value: counts.em_andamento, color: "text-[#C9A96E]" },
          { label: "Não iniciados", value: counts.pendente, color: "text-white/50" },
        ].map((k) => (
          <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
            <p className="text-xs text-white/40 mb-1">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
        >
          <option value="todos" className="bg-[#0B2545]">
            Todos os cursos
          </option>
          {Object.entries(COURSE_TITLES).map(([id, title]) => (
            <option key={id} value={id} className="bg-[#0B2545]">
              {title}
            </option>
          ))}
        </select>

        {(
          [
            ["todos", "Todos"],
            ["completo", "Completos"],
            ["em_andamento", "Em andamento"],
            ["pendente", "Pendentes"],
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
            Carregando treinamentos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            Nenhum registro encontrado com os filtros selecionados.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3">
                  Colaborador
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Trilha
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Iniciou em
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Concluiu em
                </th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">
                  Certificado
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-white">{e.displayName}</p>
                    <p className="text-[11px] text-white/30">{e.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white/70">{e.course_title}</p>
                    <p className="text-[11px] text-white/30">{e.course_id}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">
                    {e.started_at
                      ? new Date(e.started_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">
                    {e.completed_at
                      ? new Date(e.completed_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {e.certificate_url ? (
                      <a
                        href={e.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#5DD3A8] hover:underline font-medium"
                      >
                        Baixar PDF
                      </a>
                    ) : e.status === "completo" ? (
                      <span className="text-xs text-[#C9A96E]">Gerando...</span>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
