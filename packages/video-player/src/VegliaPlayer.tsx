import { useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@veglia/firebase-config";

// Declaração do namespace global injetado pelo YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: YTPlayerOptions
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
  };
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

// Singleton: carrega o script YT IFrame API apenas uma vez
let apiLoaded = false;
let apiReady = false;
const pendingCallbacks: Array<() => void> = [];

function loadYouTubeAPI(onReady: () => void): void {
  if (apiReady) {
    onReady();
    return;
  }

  pendingCallbacks.push(onReady);

  if (!apiLoaded) {
    apiLoaded = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      pendingCallbacks.forEach((cb) => cb());
      pendingCallbacks.length = 0;
    };
  }
}

// IDs de vídeo que indicam conteúdo ainda não disponível
const PLACEHOLDER_VIDEO_IDS = new Set(["dQw4w9WgXcQ", ""]);

function isPlaceholder(videoId: string): boolean {
  return PLACEHOLDER_VIDEO_IDS.has(videoId);
}

// ─── Estado visual "Vídeo em produção" ────────────────────────────────────────

interface VideoComingSoonProps {
  moduleTitle?: string;
  /** Chamado uma vez na montagem para não bloquear o progresso no demo */
  onWatched?: () => void;
}

function VideoComingSoon({ moduleTitle, onWatched }: VideoComingSoonProps) {
  // Dispara onWatched uma única vez na montagem para liberar o botão do quiz no demo
  useLayoutEffect(() => {
    onWatched?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0B2545]">
      {moduleTitle && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2.5 bg-gradient-to-b from-[#0B2545]/90 to-transparent pointer-events-none">
          <p className="text-sm font-medium text-white/80 truncate">{moduleTitle}</p>
        </div>
      )}
      <div className="w-full aspect-video flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#5DD3A8]/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
              stroke="#5DD3A8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-white/60 text-sm font-medium">Vídeo em produção</p>
        <p className="text-white/30 text-xs">Disponível em breve</p>
        <p className="text-[#5DD3A8]/70 text-xs mt-2">
          Você já pode prosseguir para o quiz →
        </p>
      </div>
    </div>
  );
}

interface VegliaPlayerProps {
  videoId: string;
  courseId: string;
  moduleId: string;
  moduleTitle?: string;
  /** uid do colaborador autenticado */
  uid: string;
  /** company_id do colaborador — obrigatório para isolamento multi-tenant no Firestore */
  companyId: string;
  /**
   * Quando true, o vídeo toca normalmente mas nenhum dado é gravado no Firestore.
   * Usado na pré-visualização do RH para evitar criar enrollments falsos.
   * onWatched ainda é chamado normalmente.
   */
  previewMode?: boolean;
  /** Chamado quando o módulo é marcado como assistido (80%) */
  onWatched?: () => void;
}

export function VegliaPlayer({
  videoId,
  courseId,
  moduleId,
  moduleTitle,
  uid,
  companyId,
  previewMode = false,
  onWatched,
}: VegliaPlayerProps) {
  // Todos os hooks ANTES de qualquer return condicional — Rules of Hooks.
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchedRef = useRef(false);
  // Último watch_percent salvo — evita writes desnecessários
  const lastSavedPercentRef = useRef<number>(-1);

  const placeholder = isPlaceholder(videoId);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const markWatched = useCallback(async () => {
    if (watchedRef.current) return;
    watchedRef.current = true;
    stopPoll();

    // Em previewMode não gravamos no Firestore — apenas disparamos o callback.
    if (!previewMode) {
      // Caminho: enrollments/{uid_courseId} — acesso direto do colaborador.
      // A Cloud Function de certificado lê pelo uid depois.
      const enrollmentId = `${uid}_${courseId}`;
      const enrollRef = doc(db, "enrollments", enrollmentId);

      await setDoc(
        enrollRef,
        {
          uid,
          company_id: companyId,
          course_id: courseId,
          [`modules.${moduleId}.watched_at`]: Date.now(),
          [`modules.${moduleId}.quiz_passed`]: false,
          [`modules.${moduleId}.quiz_score`]: null,
          [`modules.${moduleId}.quiz_completed_at`]: null,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
    }

    onWatched?.();
  }, [uid, companyId, courseId, moduleId, previewMode, onWatched, stopPoll]);

  const startPoll = useCallback(
    (player: YTPlayer) => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();

        if (duration <= 0) return;

        const ratio = currentTime / duration;

        // Marca como assistido ao atingir 80%
        if (ratio >= 0.8) {
          markWatched();
          return;
        }

        // Tracking contínuo de watch_percent — somente fora do previewMode
        if (!previewMode) {
          const percent = Math.round(ratio * 100);
          // Só grava se a diferença for >= 5% em relação ao último valor salvo
          if (percent - lastSavedPercentRef.current >= 5) {
            lastSavedPercentRef.current = percent;
            const enrollmentId = `${uid}_${courseId}`;
            const enrollRef = doc(db, "enrollments", enrollmentId);
            try {
              await setDoc(
                enrollRef,
                {
                  company_id: companyId,
                  [`modules.${moduleId}.watch_percent_last`]: percent,
                  updated_at: serverTimestamp(),
                },
                { merge: true }
              );
            } catch {
              // Falha silenciosa — não interrompe a experiência do usuário
            }
          }
        }
      }, 5000);
    },
    [uid, companyId, courseId, moduleId, previewMode, markWatched, stopPoll]
  );

  // Effect para vídeo real: inicializa o player YouTube.
  // Não executa quando for placeholder.
  useEffect(() => {
    if (placeholder) return;

    // Reseta estado ao trocar de vídeo
    watchedRef.current = false;
    lastSavedPercentRef.current = -1;

    loadYouTubeAPI(() => {
      if (!containerRef.current) return;

      // Destrói player anterior se existir
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // O YT.Player precisa de um elemento filho para substituir
      const mountEl = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(mountEl);

      playerRef.current = new window.YT.Player(mountEl, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          color: "white",
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              startPoll(event.target);
            } else {
              stopPoll();
            }
            // Vídeo chegou ao fim → marcar como assistido diretamente
            if (state === window.YT.PlayerState.ENDED) {
              markWatched();
            }
          },
        },
      });
    });

    return () => {
      stopPoll();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, placeholder, startPoll, stopPoll, markWatched]);

  // Render condicional APÓS todos os hooks.
  // Placeholder: delega ao VideoComingSoon (que dispara onWatched internamente).
  if (placeholder) {
    return <VideoComingSoon moduleTitle={moduleTitle} onWatched={onWatched} />;
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0B2545]">
      {moduleTitle && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2.5 bg-gradient-to-b from-[#0B2545]/90 to-transparent pointer-events-none">
          <p className="text-sm font-medium text-white/80 truncate">{moduleTitle}</p>
        </div>
      )}
      {/* aspect-video = 16:9 */}
      <div className="aspect-video w-full">
        <div ref={containerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
      </div>
    </div>
  );
}
