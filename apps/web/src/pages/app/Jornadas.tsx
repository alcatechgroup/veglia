import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { Journey, UserJourney } from "@veglia/shared";

// ─── Dados de jornadas (config global seed) ───────────────────────────────────

const JOURNEY_SEEDS: Omit<Journey, "id">[] = [
  {
    name: "Novo Colaborador",
    description:
      "Onboarding completo de saude: entenda seus direitos, vacinas obrigatorias e saude mental no trabalho.",
    target_profile: ["collaborator"],
    steps: [
      { trilha_id: "lei-15377", order: 1, required: true },
      { trilha_id: "nr-1", order: 2, required: true },
    ],
    badge_id: "onboarding-complete",
  },
  {
    name: "Gestor de Equipe",
    description:
      "Para lideres: NR-1 obrigacoes do gestor, GRO/PGR, saude psicossocial da equipe e compliance corporativo.",
    target_profile: ["rh", "admin_rh"],
    steps: [
      { trilha_id: "nr-1", order: 1, required: true },
      { trilha_id: "lei-15377", order: 2, required: true },
    ],
    badge_id: "gestor-compliant",
  },
  {
    name: "Saude Feminina",
    description:
      "HPV, cancer de mama, saude hormonal e prevencao. Conteudo validado pela Dra. Amanda Conde.",
    target_profile: ["collaborator"],
    steps: [{ trilha_id: "lei-15377", order: 1, required: true }],
    badge_id: "saude-feminina",
  },
  {
    name: "50+",
    description:
      "Prevencao de cancer, osteoporose, saude cardiovascular. Guia de saude para colaboradores acima de 50 anos.",
    target_profile: ["collaborator"],
    steps: [{ trilha_id: "lei-15377", order: 1, required: true }],
    badge_id: "cinquenta-mais",
  },
];

// Mapeia trilha_id para label amigavel
const TRILHA_LABELS: Record<string, string> = {
  "lei-15377": "Trilha Lei 15.377/2026",
  "nr-1": "Trilha NR-1",
};

const TRILHA_ROUTES: Record<string, string> = {
  "lei-15377": "/app/trilha/lei-15377",
  "nr-1": "/app/trilha/nr-1",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelLabel(current: number, total: number): string {
  if (current >= total) return "Concluida";
  if (current === 0) return "Nao iniciada";
  return `Etapa ${current} de ${total}`;
}

// ─── Card de jornada ──────────────────────────────────────────────────────────

interface JourneyCardProps {
  journey: Journey;
  userJourney: UserJourney | null;
  onStart: (journeyId: string) => void;
}

function JourneyCard({ journey, userJourney, onStart }: JourneyCardProps) {
  const navigate = useNavigate();
  const totalSteps = journey.steps.length;
  const completedSteps = userJourney?.steps_completed.length ?? 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const isCompleted = userJourney?.completed_at != null;
  const isStarted = userJourney != null;

  const iconMap: Record<string, string> = {
    "Novo Colaborador": "◑",
    "Gestor de Equipe": "◈",
    "Saude Feminina": "◎",
    "50+": "◆",
  };

  const nextStep = journey.steps.find(
    (s) => !userJourney?.steps_completed.includes(s.trilha_id)
  );

  return (
    <div
      className={`bg-white/5 border rounded-2xl p-5 space-y-4 transition-colors ${
        isCompleted
          ? "border-[#5DD3A8]/25"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl text-[#5DD3A8] shrink-0 mt-0.5">
          {iconMap[journey.name] ?? "◎"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white leading-snug">{journey.name}</h3>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full shrink-0">
                Concluida
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">{journey.description}</p>
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-2">
        {journey.steps.map((step) => {
          const done = userJourney?.steps_completed.includes(step.trilha_id) ?? false;
          const isNext = nextStep?.trilha_id === step.trilha_id;
          return (
            <div
              key={step.trilha_id}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                done
                  ? "bg-[#5DD3A8]/10"
                  : isNext && isStarted
                  ? "bg-white/5 border border-[#5DD3A8]/20"
                  : "bg-white/5"
              }`}
            >
              <span className={done ? "text-[#5DD3A8]" : "text-white/25"}>
                {done ? "✓" : `${step.order}.`}
              </span>
              <span className={done ? "text-[#5DD3A8]/80" : "text-white/50"}>
                {TRILHA_LABELS[step.trilha_id] ?? step.trilha_id}
              </span>
              {step.required && (
                <span className="ml-auto text-[10px] text-white/25">obrigatoria</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de progresso */}
      {isStarted && (
        <div>
          <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
            <span>{levelLabel(completedSteps, totalSteps)}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5DD3A8] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Acao */}
      {!isStarted ? (
        <button
          onClick={() => onStart(journey.id)}
          className="w-full bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Iniciar jornada
        </button>
      ) : isCompleted ? (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-[#5DD3A8]/70">
          <span>Jornada concluida com sucesso</span>
        </div>
      ) : nextStep ? (
        <button
          onClick={() => navigate(TRILHA_ROUTES[nextStep.trilha_id] ?? "/app/trilhas")}
          className="w-full bg-white/10 hover:bg-white/15 text-white/70 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          Continuar: {TRILHA_LABELS[nextStep.trilha_id] ?? nextStep.trilha_id}
        </button>
      ) : null}
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Jornadas() {
  const { firebaseUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [userJourneys, setUserJourneys] = useState<Map<string, UserJourney>>(new Map());
  const [loading, setLoading] = useState(true);

  // Carrega config global de jornadas (ou usa seed local se Firestore vazio)
  useEffect(() => {
    const q = query(collection(db, "journeys"));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        // Seed de demonstracao com IDs determinísticos
        setJourneys(
          JOURNEY_SEEDS.map((s, i) => ({ id: `journey-${i + 1}`, ...s }))
        );
      } else {
        setJourneys(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Journey)));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Carrega progresso do usuario
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "user_journeys"),
      where("user_id", "==", uid)
    );
    return onSnapshot(q, (snap) => {
      const map = new Map<string, UserJourney>();
      snap.docs.forEach((d) => {
        const data = d.data() as UserJourney;
        map.set(data.journey_id, data);
      });
      setUserJourneys(map);
    });
  }, [uid]);

  // Checar trilhas concluidas para atualizar user_journey
  useEffect(() => {
    if (!uid || !companyId || journeys.length === 0) return;

    const checkCompletions = async () => {
      const enrollSnap = await getDocs(
        query(
          collection(db, "enrollments"),
          where("uid", "==", uid),
          where("company_id", "==", companyId)
        )
      );

      const completedTrilhas = new Set<string>();
      enrollSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.completed_at) completedTrilhas.add(data.course_id as string);
      });

      if (completedTrilhas.size === 0) return;

      // Para cada user_journey ativa, verifica novos steps concluidos
      for (const [journeyId, uj] of userJourneys.entries()) {
        const journey = journeys.find((j) => j.id === journeyId);
        if (!journey) continue;

        const newCompleted = journey.steps
          .filter((s) => completedTrilhas.has(s.trilha_id))
          .map((s) => s.trilha_id);

        const changed =
          newCompleted.length !== uj.steps_completed.length ||
          newCompleted.some((id) => !uj.steps_completed.includes(id));

        if (!changed) continue;

        const allRequired = journey.steps
          .filter((s) => s.required)
          .every((s) => newCompleted.includes(s.trilha_id));

        const docId = `${uid}_${journeyId}`;
        await setDoc(
          doc(db, "user_journeys", docId),
          {
            steps_completed: newCompleted,
            current_step: newCompleted.length,
            ...(allRequired && !uj.completed_at ? { completed_at: Date.now() } : {}),
          },
          { merge: true }
        );
      }
    };

    checkCompletions();
  }, [uid, companyId, journeys, userJourneys]);

  const handleStart = async (journeyId: string) => {
    if (!uid || !companyId) return;
    const docId = `${uid}_${journeyId}`;
    await setDoc(
      doc(db, "user_journeys", docId),
      {
        user_id: uid,
        journey_id: journeyId,
        company_id: companyId,
        current_step: 0,
        started_at: Date.now(),
        steps_completed: [],
      },
      { merge: true }
    );
  };

  const completedCount = Array.from(userJourneys.values()).filter(
    (uj) => uj.completed_at != null
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Jornadas de Aprendizagem</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Trilhas personalizadas por perfil e fase de vida
        </p>
      </div>

      {/* Stats */}
      {userJourneys.size > 0 && (
        <div className="flex gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xs text-white/40">Em progresso</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {userJourneys.size - completedCount}
            </p>
          </div>
          <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-4 py-3">
            <p className="text-xs text-[#5DD3A8]/60">Concluidas</p>
            <p className="text-lg font-bold text-[#5DD3A8] mt-0.5">{completedCount}</p>
          </div>
        </div>
      )}

      {/* Grid de jornadas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journeys.map((j) => (
            <JourneyCard
              key={j.id}
              journey={j}
              userJourney={userJourneys.get(j.id) ?? null}
              onStart={handleStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
