import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { COURSE_ID, COURSE_TITLE } from "@/data/courses";
import { NR1_COURSE_ID, NR1_COURSE_TITLE } from "@/data/coursesNr1";
import type { Enrollment } from "@veglia/shared";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TrailStatus = "pendente" | "andamento" | "concluido";

interface TrailCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  totalModules: number;
  enrollment: Enrollment | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(enrollment: Enrollment | null): TrailStatus {
  if (!enrollment) return "pendente";
  if (enrollment.completed_at) return "concluido";
  const hasProgress = Object.keys(enrollment.modules ?? {}).length > 0;
  return hasProgress ? "andamento" : "pendente";
}

function getModulesCompleted(enrollment: Enrollment | null): number {
  if (!enrollment) return 0;
  return Object.values(enrollment.modules ?? {}).filter((m) => m.quiz_passed).length;
}

// ─── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TrailStatus }) {
  if (status === "concluido") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5DD3A8] bg-[#5DD3A8]/10 px-2.5 py-1 rounded-full">
        <span>✓</span> Concluido
      </span>
    );
  }
  if (status === "andamento") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C9A96E] bg-[#C9A96E]/10 px-2.5 py-1 rounded-full">
        <span>⚡</span> Em andamento
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
      <span>○</span> Pendente
    </span>
  );
}

// ─── Card da trilha ───────────────────────────────────────────────────────────

function TrailCardItem({ card }: { card: TrailCard }) {
  const status = getStatus(card.enrollment);
  const completed = getModulesCompleted(card.enrollment);
  const progressPct = card.totalModules > 0 ? Math.round((completed / card.totalModules) * 100) : 0;
  const hasCertificate = !!card.enrollment?.certificate_url;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/[0.07] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5DD3A8]/10 flex items-center justify-center text-xl shrink-0">
            {card.icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white leading-snug">{card.title}</h2>
            <p className="text-xs text-white/40 mt-0.5">{card.totalModules} módulos</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Descrição */}
      <p className="text-xs text-white/50 leading-relaxed">{card.description}</p>

      {/* Barra de progresso */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-white/30">Progresso</span>
          <span className="text-[11px] text-white/40">
            {completed}/{card.totalModules} módulos
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5DD3A8] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2 pt-1">
        {status === "concluido" ? (
          <>
            <Link
              to={card.path}
              className="flex-1 text-center bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-xs transition-colors"
            >
              Ver trilha
            </Link>
            {hasCertificate ? (
              <a
                href={card.enrollment!.certificate_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Baixar certificado
              </a>
            ) : (
              <Link
                to="/app/certificados"
                className="flex-1 text-center bg-[#5DD3A8]/10 hover:bg-[#5DD3A8]/20 text-[#5DD3A8] font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Ver certificado
              </Link>
            )}
          </>
        ) : status === "andamento" ? (
          <Link
            to={card.path}
            className="flex-1 text-center bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            Continuar trilha
          </Link>
        ) : (
          <Link
            to={card.path}
            className="flex-1 text-center bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            Iniciar trilha
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Trilhas Hub ──────────────────────────────────────────────────────────────

export default function Trilhas() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? "";

  const [enrollmentLei, setEnrollmentLei] = useState<Enrollment | null>(null);
  const [enrollmentNr1, setEnrollmentNr1] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    let resolvedCount = 0;
    const checkDone = () => {
      resolvedCount++;
      if (resolvedCount >= 2) setLoading(false);
    };

    const unsubLei = onSnapshot(doc(db, "enrollments", `${uid}_${COURSE_ID}`), (snap) => {
      setEnrollmentLei(snap.exists() ? (snap.data() as Enrollment) : null);
      checkDone();
    });

    const unsubNr1 = onSnapshot(doc(db, "enrollments", `${uid}_${NR1_COURSE_ID}`), (snap) => {
      setEnrollmentNr1(snap.exists() ? (snap.data() as Enrollment) : null);
      checkDone();
    });

    return () => {
      unsubLei();
      unsubNr1();
    };
  }, [uid]);

  const cards: TrailCard[] = [
    {
      id: COURSE_ID,
      title: COURSE_TITLE,
      description:
        "Entenda a Lei 15.377/2026, suas obrigações como colaborador e como a vacinação corporativa protege você e sua equipe.",
      icon: "◎",
      path: "/app/trilha/lei-15377",
      totalModules: 4,
      enrollment: enrollmentLei,
    },
    {
      id: NR1_COURSE_ID,
      title: NR1_COURSE_TITLE,
      description:
        "Conheça a NR-1 revisada, o Gerenciamento de Riscos Ocupacionais (GRO) e o Programa de Gerenciamento de Riscos (PGR).",
      icon: "⬡",
      path: "/app/trilha/nr-1",
      totalModules: 2,
      enrollment: enrollmentNr1,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-white/30 text-sm">Carregando trilhas...</p>
      </div>
    );
  }

  const totalConcluidas = cards.filter(
    (c) => getStatus(c.enrollment) === "concluido"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
          Plataforma
        </p>
        <h1 className="text-2xl font-bold text-white">Minhas Trilhas</h1>
        <p className="text-sm text-white/40 mt-1">
          {totalConcluidas} de {cards.length} trilhas concluidas ·{" "}
          <span className="text-[#5DD3A8]/60">Powered by VaciVitta</span>
        </p>
      </div>

      {/* Grid de trilhas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map((card) => (
          <TrailCardItem key={card.id} card={card} />
        ))}
      </div>

      {/* Links freemium */}
      <div className="border-t border-white/5 pt-6">
        <p className="text-xs text-white/30 mb-3">Ferramentas gratuitas</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/diagnostico"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-[#5DD3A8] border border-white/10 hover:border-[#5DD3A8]/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Diagnóstico de risco
          </a>
          <a
            href="/calculadora-vacinal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-[#5DD3A8] border border-white/10 hover:border-[#5DD3A8]/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Calculadora vacinal
          </a>
        </div>
      </div>
    </div>
  );
}
