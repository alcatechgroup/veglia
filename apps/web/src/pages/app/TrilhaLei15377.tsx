import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { VegliaPlayer } from "@veglia/video-player";
import {
  LEI_15377_MODULES,
  COURSE_ID,
  COURSE_TITLE,
  PASSING_SCORE,
} from "@/data/courses";
import { useVideoIds } from "@/hooks/useVideoIds";
import type { Enrollment, ModuleProgress, QuizQuestion } from "@veglia/shared";

// ─── Quiz ─────────────────────────────────────────────────────────────────────

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number, passed: boolean) => void;
}

function Quiz({ questions, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? Math.round(
        (questions.filter((q) => answers[q.id] === q.correctIndex).length /
          questions.length) *
          100
      )
    : 0;

  const passed = score >= PASSING_SCORE;

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
    onComplete(score, passed);
  };

  if (submitted) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="text-center py-4">
          {passed ? (
            <>
              <div className="text-4xl mb-3">✓</div>
              <p className="text-lg font-semibold text-[#5DD3A8]">Aprovado!</p>
              <p className="text-sm text-white/50 mt-1">
                Você acertou {score}% — mínimo exigido: {PASSING_SCORE}%
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">✗</div>
              <p className="text-lg font-semibold text-[#C9A96E]">Tente novamente</p>
              <p className="text-sm text-white/50 mt-1">
                Você acertou {score}% — mínimo exigido: {PASSING_SCORE}%
              </p>
              <button
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="mt-4 bg-white/10 hover:bg-white/15 text-white/70 font-medium px-5 py-2 rounded-xl text-sm transition-colors"
              >
                Refazer quiz
              </button>
            </>
          )}
        </div>
        {submitted && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            {questions.map((q) => {
              const chosen = answers[q.id];
              const correct = q.correctIndex;
              const isRight = chosen === correct;
              return (
                <div key={q.id} className="text-sm">
                  <p className="text-white/70 mb-1">{q.text}</p>
                  <p className={isRight ? "text-[#5DD3A8]" : "text-red-400"}>
                    {isRight ? "✓" : "✗"} {q.options[chosen ?? correct]}
                    {!isRight && (
                      <span className="text-white/40 ml-2">
                        (correto: {q.options[correct]})
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
      <h3 className="text-sm font-semibold text-white">Quiz do módulo</h3>
      {questions.map((q, qi) => (
        <div key={q.id}>
          <p className="text-sm text-white/80 mb-3">
            {qi + 1}. {q.text}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  answers[q.id] === oi
                    ? "bg-[#5DD3A8]/20 border border-[#5DD3A8]/40 text-white"
                    : "bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < questions.length}
        className="w-full bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        Confirmar respostas
      </button>
    </div>
  );
}

// ─── Trilha Lei 15.377 ────────────────────────────────────────────────────────

export default function TrilhaLei15377() {
  const { firebaseUser, claims } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid ?? "";
  const enrollmentId = `${uid}_${COURSE_ID}`;

  const { videoIds } = useVideoIds();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>(LEI_15377_MODULES[0].id);
  const [showQuiz, setShowQuiz] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [certToast, setCertToast] = useState(false);

  // Observa enrollment em tempo real
  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "enrollments", enrollmentId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setEnrollment(snap.data() as Enrollment);
      } else {
        setEnrollment(null);
      }
      setEnrollmentLoading(false);
    });
    return unsub;
  }, [uid, enrollmentId]);

  // Inicializa enrollment se não existir
  useEffect(() => {
    if (!uid || !claims?.company_id || enrollmentLoading) return;
    if (enrollment) return;

    const ref = doc(db, "enrollments", enrollmentId);
    setDoc(
      ref,
      {
        uid,
        company_id: claims.company_id,
        course_id: COURSE_ID,
        started_at: Date.now(),
        completed_at: null,
        certificate_url: null,
        modules: {},
      },
      { merge: true }
    );
  }, [uid, claims, enrollment, enrollmentLoading, enrollmentId]);

  const getModuleProgress = useCallback(
    (moduleId: string): ModuleProgress | null => {
      return enrollment?.modules?.[moduleId] ?? null;
    },
    [enrollment]
  );

  const isModuleUnlocked = useCallback(
    (moduleId: string): boolean => {
      const idx = LEI_15377_MODULES.findIndex((m) => m.id === moduleId);
      if (idx === 0) return true;
      const prev = LEI_15377_MODULES[idx - 1];
      const prevProgress = getModuleProgress(prev.id);
      return prevProgress?.quiz_passed === true;
    },
    [getModuleProgress]
  );

  const handleWatched = useCallback(() => {
    setShowQuiz(true);
  }, []);

  const handleQuizComplete = useCallback(
    async (score: number, passed: boolean) => {
      if (!uid || !claims?.company_id) return;

      const ref = doc(db, "enrollments", enrollmentId);
      const now = Date.now();

      const update: Record<string, unknown> = {
        [`modules.${activeModuleId}.quiz_score`]: score,
        [`modules.${activeModuleId}.quiz_passed`]: passed,
        [`modules.${activeModuleId}.quiz_completed_at`]: now,
        updated_at: serverTimestamp(),
      };

      // Se passou no último módulo — marcar curso como concluído
      const isLast = LEI_15377_MODULES[LEI_15377_MODULES.length - 1].id === activeModuleId;
      if (passed && isLast) {
        update.completed_at = now;
        // Garantir company_id presente no enrollment — exigido por generateCertificate
        update.company_id = claims.company_id;
      }

      await setDoc(ref, update, { merge: true });

      if (passed) {
        // Se último módulo, dispara geração de certificado
        const isLast = LEI_15377_MODULES[LEI_15377_MODULES.length - 1].id === activeModuleId;
        if (isLast) {
          try {
            const functions = getFunctions(app, "southamerica-east1");
            const generateCert = httpsCallable(functions, "generateCertificate");
            await generateCert({ courseId: COURSE_ID });
            setCertToast(true);
            setTimeout(() => {
              setCertToast(false);
              navigate("/app/certificados");
            }, 3000);
          } catch {
            // Falha silenciosa — usuário pode tentar novamente pela tela de certificado
          }
        }

        setShowQuiz(false);
        // Avança para próximo módulo se existir
        const currentIdx = LEI_15377_MODULES.findIndex((m) => m.id === activeModuleId);
        const next = LEI_15377_MODULES[currentIdx + 1];
        if (next) setActiveModuleId(next.id);
      }
    },
    [uid, claims, enrollmentId, activeModuleId]
  );

  const activeModule = LEI_15377_MODULES.find((m) => m.id === activeModuleId)!;
  const activeProgress = getModuleProgress(activeModuleId);
  const courseComplete = !!enrollment?.completed_at;

  // Merge Firestore videoIds over hardcoded values — key mapping: m01..m04
  const lei15377IdMap: Record<string, string | undefined> = {
    m01: videoIds?.lei15377?.m01,
    m02: videoIds?.lei15377?.m02,
    m03: videoIds?.lei15377?.m03,
    m04: videoIds?.lei15377?.m04,
  };

  function resolveVideoId(moduleId: string, hardcoded: string): string {
    return lei15377IdMap[moduleId] ?? hardcoded;
  }

  return (
    <div className="space-y-6">
      {/* Toast de certificado gerado */}
      {certToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-[#5DD3A8] text-[#0B2545] font-semibold px-5 py-3.5 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
          <span className="text-lg">✓</span>
          <div>
            <p className="text-sm font-bold">Certificado gerado!</p>
            <p className="text-xs font-medium opacity-70">Redirecionando para seus certificados...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
          Trilha de Compliance
        </p>
        <h1 className="text-2xl font-bold text-white">{COURSE_TITLE}</h1>
        <p className="text-sm text-white/40 mt-1">
          Powered by{" "}
          <span className="text-[#5DD3A8]/60 font-semibold">VaciVitta</span> ·
          Validado pela Dra. Amanda Conde
        </p>
      </div>

      {courseComplete && (
        <div className="flex items-center gap-3 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-2xl px-5 py-4">
          <span className="text-2xl">✓</span>
          <div>
            <p className="text-sm font-semibold text-[#5DD3A8]">Trilha concluida!</p>
            <p className="text-xs text-white/40 mt-0.5">
              Seu certificado de compliance esta sendo gerado.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar módulos */}
        <aside className="w-64 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                Módulos
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {LEI_15377_MODULES.map((mod, idx) => {
                const progress = getModuleProgress(mod.id);
                const unlocked = isModuleUnlocked(mod.id);
                const done = progress?.quiz_passed === true;
                const isActive = mod.id === activeModuleId;

                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      if (!unlocked) return;
                      setActiveModuleId(mod.id);
                      setShowQuiz(false);
                    }}
                    disabled={!unlocked}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                      isActive
                        ? "bg-[#5DD3A8]/10"
                        : unlocked
                        ? "hover:bg-white/5"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <span
                      className={`mt-0.5 text-base shrink-0 ${
                        done
                          ? "text-[#5DD3A8]"
                          : isActive
                          ? "text-white"
                          : "text-white/30"
                      }`}
                    >
                      {done ? "✓" : isActive ? "→" : unlocked ? "○" : "○"}
                    </span>
                    <div>
                      <p
                        className={`text-xs font-medium leading-snug ${
                          isActive ? "text-white" : "text-white/50"
                        }`}
                      >
                        {idx + 1}. {mod.title}
                      </p>
                      {done && (
                        <p className="text-[10px] text-[#5DD3A8]/60 mt-0.5">Concluido</p>
                      )}
                      {!unlocked && (
                        <p className="text-[10px] text-white/25 mt-0.5">Bloqueado</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 space-y-5">
          {/* Vídeo */}
          {!showQuiz && (
            <>
              <VegliaPlayer
                videoId={resolveVideoId(activeModule.id, activeModule.videoId)}
                courseId={COURSE_ID}
                moduleId={activeModule.id}
                moduleTitle={`Módulo ${LEI_15377_MODULES.findIndex((m) => m.id === activeModule.id) + 1}: ${activeModule.title}`}
                uid={uid}
                companyId={claims?.company_id ?? ""}
                onWatched={handleWatched}
              />
              {activeProgress?.watched_at && !activeProgress.quiz_passed && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Fazer quiz
                  </button>
                </div>
              )}
              {activeProgress?.quiz_passed && (
                <div className="flex items-center gap-2 text-sm text-[#5DD3A8]/70">
                  <span>✓</span>
                  <span>Módulo concluído com {activeProgress.quiz_score}%</span>
                </div>
              )}
            </>
          )}

          {/* Quiz */}
          {showQuiz && (
            <Quiz
              questions={activeModule.quizQuestions}
              onComplete={handleQuizComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
