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
import { useVideoIds, percursoFromRole, resolveSlotVideoId } from "@/hooks/useVideoIds";
import type { VideoSlot } from "@/hooks/useVideoIds";
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
  const [view, setView] = useState<"gallery" | "module">("gallery");
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

  // Marca o módulo como assistido (libera o botão "Fazer quiz"), SEM abrir o quiz.
  const handleWatched = useCallback(() => {
    if (!uid) return;
    const ref = doc(db, "enrollments", enrollmentId);
    setDoc(
      ref,
      { modules: { [activeModuleId]: { watched_at: Date.now() } }, updated_at: serverTimestamp() },
      { merge: true }
    ).catch(() => {/* silencia erro de permissão no preview */});
  }, [uid, enrollmentId, activeModuleId]);

  // Abre um módulo a partir da galeria
  const openModule = useCallback((moduleId: string) => {
    setActiveModuleId(moduleId);
    setShowQuiz(false);
    setView("module");
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
            const functions = getFunctions(app, "us-central1");
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
        // Volta para a galeria de módulos (mostra progresso + próximo liberado)
        setView("gallery");
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

  // Percurso do usuário (RH/gestor vs colaborador) define qual vídeo é exibido
  const percurso = percursoFromRole(claims?.role);

  // Merge Firestore videoIds (por percurso) sobre os valores hardcoded — key mapping: m01..m04
  const lei15377SlotMap: Record<string, VideoSlot | undefined> = {
    m01: videoIds?.lei15377?.m01,
    m02: videoIds?.lei15377?.m02,
    m03: videoIds?.lei15377?.m03,
    m04: videoIds?.lei15377?.m04,
  };

  function resolveVideoId(moduleId: string, hardcoded: string): string {
    return resolveSlotVideoId(lei15377SlotMap[moduleId], percurso) ?? hardcoded;
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

      {/* ── Galeria de módulos ── */}
      {view === "gallery" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {LEI_15377_MODULES.map((mod, idx) => {
            const progress = getModuleProgress(mod.id);
            const unlocked = isModuleUnlocked(mod.id);
            const done = progress?.quiz_passed === true;
            return (
              <button
                key={mod.id}
                onClick={() => unlocked && openModule(mod.id)}
                disabled={!unlocked}
                className={`text-left bg-white/5 border rounded-2xl p-5 transition-all ${
                  unlocked
                    ? "border-white/10 hover:border-[#5DD3A8]/40 hover:-translate-y-0.5 cursor-pointer"
                    : "border-white/5 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-sm font-bold text-white/70">
                    {idx + 1}
                  </span>
                  {done ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-[#5DD3A8]/15 text-[#5DD3A8]">Concluído</span>
                  ) : unlocked ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-[#0A6CDC]/12 text-[#5DD3A8]">Disponível</span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-white/5 text-white/30">Bloqueado</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug">{idx + 1}. {mod.title}</h3>
                <p className="text-xs text-white/40 mt-1">{mod.quizQuestions.length} perguntas no quiz</p>
                {done && (
                  <p className="text-[11px] text-[#5DD3A8]/70 mt-2">Concluído com {progress?.quiz_score}%</p>
                )}
                {unlocked && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#5DD3A8] mt-3 font-semibold">
                    {done ? "Rever módulo" : "Assistir"} <span className="text-[10px]">→</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Módulo (player → quiz) ── */}
      {view === "module" && (
        <div className="space-y-5">
          <button
            onClick={() => { setView("gallery"); setShowQuiz(false); }}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            ← Voltar aos módulos
          </button>

          <div>
            <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-0.5">
              Módulo {LEI_15377_MODULES.findIndex((m) => m.id === activeModule.id) + 1}
            </p>
            <h2 className="text-lg font-bold text-white">{activeModule.title}</h2>
          </div>

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
              {activeProgress?.quiz_passed ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-[#5DD3A8]/70">
                    <span>✓</span>
                    <span>Módulo concluído com {activeProgress.quiz_score}%</span>
                  </div>
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    Refazer quiz
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-white/40">
                    {activeProgress?.watched_at ? "Assistido. Faça o quiz para concluir o módulo." : "Assista ao vídeo para liberar o quiz."}
                  </p>
                  <button
                    onClick={() => setShowQuiz(true)}
                    disabled={!activeProgress?.watched_at}
                    className="bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Fazer quiz
                  </button>
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
      )}
    </div>
  );
}
