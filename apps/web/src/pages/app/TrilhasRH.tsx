import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { VegliaPlayer } from "@veglia/video-player";
import { useVideoIds, percursoFromRole, resolveSlotVideoId } from "@/hooks/useVideoIds";
import { LEI_15377_MODULES, COURSE_ID } from "@/data/courses";
import { NR1_MODULES, NR1_COURSE_ID } from "@/data/coursesNr1";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface ModuloView {
  id: string;
  titulo: string;
  videoId: string;
  concluido: number; // % de colaboradores que passaram no quiz do módulo
}

interface TrilhaView {
  id: string;
  courseId: string;
  route: string;
  titulo: string;
  descricao: string;
  badge: string;
  badgeColor: string;
  modulos: ModuloView[];
}

interface ColaboradorView {
  uid: string;
  nome: string;
  cargo: string;
  lei: number; // % de módulos da Lei concluídos
  nr1: number; // % de módulos da NR-1 concluídos
}

interface EnrollmentDoc {
  uid: string;
  course_id: string;
  completed_at?: number | null;
  modules?: Record<string, { quiz_passed?: boolean }>;
}

interface UserDoc {
  uid: string;
  displayName?: string;
  email?: string;
  cargo?: string;
  role?: string;
}

// ─── Helpers de progresso ─────────────────────────────────────────────────────

/** Conta módulos aprovados de um enrollment. */
function passedCount(enr: EnrollmentDoc | undefined, moduleIds: string[]): number {
  if (!enr?.modules) return 0;
  return moduleIds.filter((mid) => enr.modules?.[mid]?.quiz_passed).length;
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "#5DD3A8", height = "h-1.5" }: { value: number; color?: string; height?: string }) {
  return (
    <div className={`w-full bg-white/10 rounded-full ${height} overflow-hidden`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accentColor = "#5DD3A8" }: { label: string; value: string; sub?: string; accentColor?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex-1 min-w-0">
      <p className="text-xs text-white/40 font-medium mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accentColor }}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── VideoPreviewModal (vídeo real, percurso RH) ──────────────────────────────

function VideoPreviewModal({ modulo, onClose }: { modulo: ModuloView; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-4xl bg-[#0d1f38] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">Pré-visualização · versão RH</p>
            <h3 className="text-base font-semibold text-white leading-snug">{modulo.titulo}</h3>
          </div>
          <button onClick={onClose} className="shrink-0 text-white/40 hover:text-white/80 transition-colors text-xl leading-none mt-0.5" aria-label="Fechar modal">✕</button>
        </div>

        <VegliaPlayer
          videoId={modulo.videoId}
          courseId="preview-rh"
          moduleId={modulo.id}
          moduleTitle={modulo.titulo}
          uid="rh-preview"
          companyId=""
          previewMode={true}
        />

        <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl px-4 py-3">
          <p className="text-xs text-white/50 leading-relaxed">
            Esta é a versão Gestor RH do módulo. O colaborador assiste à versão dele, com quiz e certificado ao final.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ColaboradoresTable (dados reais) ─────────────────────────────────────────

function ColaboradoresTable({ colaboradores }: { colaboradores: ColaboradorView[] }) {
  if (colaboradores.length === 0) {
    return <p className="text-xs text-white/30 mt-4 py-3">Nenhum colaborador com progresso registrado ainda.</p>;
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4">Nome</th>
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4">Cargo</th>
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4 min-w-[120px]">Lei 15.377</th>
            <th className="text-left text-xs font-medium text-white/40 pb-3 pr-4 min-w-[120px]">NR-1</th>
            <th className="text-left text-xs font-medium text-white/40 pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {colaboradores.map((col) => {
            const bothDone = col.lei === 100 && col.nr1 === 100;
            const neitherStarted = col.lei === 0 && col.nr1 === 0;
            const status = bothDone ? "Completo" : neitherStarted ? "Pendente" : "Em progresso";
            const statusColor = bothDone ? "text-[#5DD3A8]" : neitherStarted ? "text-red-400/80" : "text-[#C9A96E]";
            const statusBg = bothDone ? "bg-[#5DD3A8]/10" : neitherStarted ? "bg-red-400/10" : "bg-[#C9A96E]/10";
            return (
              <tr key={col.uid} className="group">
                <td className="py-3 pr-4 font-medium text-white/80">{col.nome}</td>
                <td className="py-3 pr-4 text-white/40 text-xs">{col.cargo}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={col.lei} color="#5DD3A8" />
                    <span className="text-xs text-white/40 w-8 shrink-0">{col.lei}%</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={col.nr1} color="#C9A96E" />
                    <span className="text-xs text-white/40 w-8 shrink-0">{col.nr1}%</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-xl ${statusColor} ${statusBg}`}>{status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── ModuloRow ─────────────────────────────────────────────────────────────────

function ModuloRow({ modulo, index, onPreview }: { modulo: ModuloView; index: number; onPreview: (m: ModuloView) => void }) {
  return (
    <div className="flex items-center gap-4 py-3 border-t border-white/5 first:border-0">
      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-white/40 font-medium">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <p className="text-sm text-white/80 font-medium truncate">{modulo.titulo}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProgressBar value={modulo.concluido} color="#5DD3A8" height="h-1" />
          <span className="text-xs text-white/40 shrink-0 w-24">{modulo.concluido}% concluído</span>
        </div>
      </div>
      <button
        onClick={() => onPreview(modulo)}
        className="shrink-0 flex items-center gap-1.5 text-xs text-[#5DD3A8] hover:text-[#4BC495] bg-[#5DD3A8]/10 hover:bg-[#5DD3A8]/20 border border-[#5DD3A8]/20 px-3 py-1.5 rounded-xl transition-colors font-medium"
      >
        <span className="text-[10px]">▶</span> Ver vídeo
      </button>
    </div>
  );
}

// ─── TrilhaCard ────────────────────────────────────────────────────────────────

function TrilhaCard({ trilha, progressoGeral, colaboradores, onPreview }: {
  trilha: TrilhaView;
  progressoGeral: number;
  colaboradores: ColaboradorView[];
  onPreview: (m: ModuloView) => void;
}) {
  const [modulosAbertos, setModulosAbertos] = useState(false);
  const [tabelaAberta, setTabelaAberta] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-xl"
          style={{ color: trilha.badgeColor, backgroundColor: `${trilha.badgeColor}18`, border: `1px solid ${trilha.badgeColor}30` }}
        >
          {trilha.badge}
        </span>
        <Link
          to={trilha.route}
          className="shrink-0 flex items-center gap-1.5 text-xs text-[#0B2545] font-semibold bg-[#5DD3A8] hover:bg-[#4BC495] px-3 py-1.5 rounded-xl transition-colors"
        >
          Acessar trilha <span className="text-[10px]">→</span>
        </Link>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white leading-snug">{trilha.titulo}</h2>
        <p className="text-sm text-white/40 mt-1">{trilha.descricao}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/40 font-medium">Progresso geral da empresa</p>
          <span className="text-xs font-semibold" style={{ color: trilha.badgeColor }}>{progressoGeral}%</span>
        </div>
        <ProgressBar value={progressoGeral} color={trilha.badgeColor} height="h-2" />
      </div>

      <div>
        <button
          onClick={() => setModulosAbertos((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          <span className={`transition-transform duration-200 ${modulosAbertos ? "rotate-90" : ""}`}>▶</span>
          {trilha.modulos.length} módulo{trilha.modulos.length !== 1 ? "s" : ""}
        </button>
        {modulosAbertos && (
          <div className="mt-3">
            {trilha.modulos.map((mod, idx) => (
              <ModuloRow key={mod.id} modulo={mod} index={idx} onPreview={onPreview} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-4">
        <button
          onClick={() => setTabelaAberta((v) => !v)}
          className="text-xs text-[#5DD3A8]/70 hover:text-[#5DD3A8] transition-colors font-medium flex items-center gap-1"
        >
          Ver progresso detalhado
          <span className={`transition-transform duration-200 inline-block ${tabelaAberta ? "rotate-90" : ""}`}>→</span>
        </button>
        {tabelaAberta && <ColaboradoresTable colaboradores={colaboradores} />}
      </div>
    </div>
  );
}

// ─── TrilhasRH ────────────────────────────────────────────────────────────────

export default function TrilhasRH() {
  const { claims } = useAuth();
  const { videoIds } = useVideoIds();
  const percurso = percursoFromRole(claims?.role);
  const companyId = claims?.company_id;

  const [enrollments, setEnrollments] = useState<EnrollmentDoc[]>([]);
  const [colaboradores, setColaboradores] = useState<UserDoc[]>([]);
  const [modalModulo, setModalModulo] = useState<ModuloView | null>(null);

  // Enrollments da empresa (regras permitem RH ler por company_id)
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "enrollments"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      setEnrollments(snap.docs.map((d) => d.data() as EnrollmentDoc));
    });
  }, [companyId]);

  // Colaboradores da empresa
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "users"), where("company_id", "==", companyId));
    return onSnapshot(q, (snap) => {
      setColaboradores(
        snap.docs.map((d) => d.data() as UserDoc).filter((u) => u.role === "collaborator")
      );
    });
  }, [companyId]);

  const leiModuleIds = LEI_15377_MODULES.map((m) => m.id);
  const nr1ModuleIds = NR1_MODULES.map((m) => m.id);

  // Constrói as trilhas com videoIds reais (percurso RH) + % real por módulo
  const trilhas: TrilhaView[] = useMemo(() => {
    const denom = Math.max(colaboradores.length, 1);
    const moduloConcluido = (courseId: string, moduleId: string) => {
      const passed = enrollments.filter(
        (e) => e.course_id === courseId && e.modules?.[moduleId]?.quiz_passed
      ).length;
      return Math.round((passed / denom) * 100);
    };

    return [
      {
        id: "lei-15377",
        courseId: COURSE_ID,
        route: "/app/trilha/lei-15377",
        titulo: "Lei 15.377/2026 — Compliance Obrigatório",
        descricao: "Vacinação adulta, prevenção de cânceres e saúde mental no trabalho",
        badge: "Obrigatória",
        badgeColor: "#5DD3A8",
        modulos: LEI_15377_MODULES.map((m) => ({
          id: m.id,
          titulo: m.title,
          videoId: resolveSlotVideoId(videoIds?.lei15377?.[m.id as "m01" | "m02" | "m03" | "m04"], percurso) ?? m.videoId,
          concluido: moduloConcluido(COURSE_ID, m.id),
        })),
      },
      {
        id: "nr-1",
        courseId: NR1_COURSE_ID,
        route: "/app/trilha/nr-1",
        titulo: "NR-1 Revisada — Riscos Psicossociais",
        descricao: "GRO, PGR e obrigações do empregador na nova NR-1",
        badge: "Regulatória",
        badgeColor: "#C9A96E",
        modulos: NR1_MODULES.map((m) => {
          // módulo "nr1-m01" → chave de videoId "m01"
          const key = m.id.replace("nr1-", "") as "m01" | "m02";
          return {
            id: m.id,
            titulo: m.title,
            videoId: resolveSlotVideoId(videoIds?.nr1?.[key], percurso) ?? m.videoId,
            concluido: moduloConcluido(NR1_COURSE_ID, m.id),
          };
        }),
      },
    ];
  }, [videoIds, percurso, enrollments, colaboradores.length]);

  // Progresso geral por trilha = média do % de conclusão dos módulos
  const progressoPorTrilha = (t: TrilhaView) =>
    t.modulos.length ? Math.round(t.modulos.reduce((a, m) => a + m.concluido, 0) / t.modulos.length) : 0;

  // Tabela de colaboradores com % real por trilha
  const colaboradoresView: ColaboradorView[] = useMemo(() => {
    const byKey = new Map<string, EnrollmentDoc>();
    enrollments.forEach((e) => byKey.set(`${e.uid}_${e.course_id}`, e));
    return colaboradores.map((u) => {
      const leiEnr = byKey.get(`${u.uid}_${COURSE_ID}`);
      const nr1Enr = byKey.get(`${u.uid}_${NR1_COURSE_ID}`);
      return {
        uid: u.uid,
        nome: u.displayName || u.email || "Colaborador",
        cargo: u.cargo || "—",
        lei: Math.round((passedCount(leiEnr, leiModuleIds) / leiModuleIds.length) * 100),
        nr1: Math.round((passedCount(nr1Enr, nr1ModuleIds) / nr1ModuleIds.length) * 100),
      };
    });
  }, [enrollments, colaboradores, leiModuleIds, nr1ModuleIds]);

  // KPIs reais
  const totalColab = colaboradores.length;
  const leiCompletos = enrollments.filter((e) => e.course_id === COURSE_ID && e.completed_at).length;
  const nr1Completos = enrollments.filter((e) => e.course_id === NR1_COURSE_ID && e.completed_at).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">Trilhas de Compliance · RH</p>
        <h1 className="text-2xl font-bold text-white">Trilhas de Compliance</h1>
        <p className="text-sm text-white/40 mt-1">
          Acesse as trilhas, pré-visualize os conteúdos e acompanhe o progresso real da sua equipe.
        </p>
      </div>

      {/* KPI row — dados reais */}
      <div className="flex gap-4 flex-wrap">
        <KpiCard label="Trilhas ativas" value="2" sub="Lei 15.377 + NR-1" accentColor="#5DD3A8" />
        <KpiCard label="Concluíram Lei 15.377" value={String(leiCompletos)} sub={`de ${totalColab} colaboradores`} accentColor="#5DD3A8" />
        <KpiCard label="Concluíram NR-1" value={String(nr1Completos)} sub={`de ${totalColab} colaboradores`} accentColor="#C9A96E" />
        <KpiCard label="Colaboradores ativos" value={String(totalColab)} sub="cadastrados na empresa" accentColor="#C9DCE8" />
      </div>

      {totalColab === 0 && (
        <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/25 rounded-2xl px-5 py-4">
          <p className="text-sm text-[#C9A96E] font-medium">Nenhum colaborador cadastrado ainda.</p>
          <p className="text-xs text-white/50 mt-1">
            Cadastre sua equipe em <Link to="/app/importar" className="text-[#5DD3A8] hover:underline">Importar Funcionários</Link> ou <Link to="/app/convites" className="text-[#5DD3A8] hover:underline">Convites</Link> para começar a acompanhar o progresso.
          </p>
        </div>
      )}

      {/* Trilhas */}
      <div className="space-y-6">
        {trilhas.map((trilha) => (
          <TrilhaCard
            key={trilha.id}
            trilha={trilha}
            progressoGeral={progressoPorTrilha(trilha)}
            colaboradores={colaboradoresView}
            onPreview={setModalModulo}
          />
        ))}
      </div>

      {modalModulo && <VideoPreviewModal modulo={modalModulo} onClose={() => setModalModulo(null)} />}
    </div>
  );
}
