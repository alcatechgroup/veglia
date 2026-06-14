import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Percurso de aprendizado: gestor de RH ou colaborador CLT. */
export type Percurso = "rh" | "colaborador";

/**
 * Slot de vídeo de um módulo. Cada módulo tem um vídeo por percurso.
 * Aceita também `string` legado (estrutura antiga, 1 vídeo por módulo) para
 * compatibilidade com documentos gravados antes da separação de percursos.
 */
export type VideoSlot = { rh?: string; colaborador?: string } | string;

export interface VideoIdsConfig {
  lei15377: {
    m01: VideoSlot;
    m02: VideoSlot;
    m03: VideoSlot;
    m04: VideoSlot;
  };
  nr1: {
    m01: VideoSlot;
    m02: VideoSlot;
  };
}

interface UseVideoIdsResult {
  videoIds: VideoIdsConfig | null;
  loading: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Mapeia o role do usuário para o percurso de conteúdo.
 * `collaborator` (e o legado `colaborador`) → percurso colaborador.
 * Qualquer papel de gestão (admin, admin_rh, rh, rh_filial) → percurso RH.
 */
export function percursoFromRole(role?: string | null): Percurso {
  return role === "collaborator" || role === "colaborador" ? "colaborador" : "rh";
}

/**
 * Resolve o videoId de um slot para o percurso desejado.
 * Ordem de fallback: percurso pedido → outro percurso → undefined.
 * Aceita slot legado em formato string (vale para os dois percursos).
 */
export function resolveSlotVideoId(
  slot: VideoSlot | undefined,
  percurso: Percurso
): string | undefined {
  if (!slot) return undefined;
  if (typeof slot === "string") return slot || undefined;
  const other: Percurso = percurso === "rh" ? "colaborador" : "rh";
  return slot[percurso] || slot[other] || undefined;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Busca os videoIds de `/config/videoIds` no Firestore.
 *
 * Retorna null enquanto carrega ou se o documento não existir.
 * O consumidor deve fazer fallback para os videoIds hardcoded quando null.
 *
 * Estrutura esperada no Firestore (1 vídeo por percurso):
 *   /config/videoIds
 *     lei15377: { m01: { rh: "ytId", colaborador: "ytId" }, m02: {...}, ... }
 *     nr1:      { m01: { rh: "ytId", colaborador: "ytId" }, m02: {...} }
 */
export function useVideoIds(): UseVideoIdsResult {
  const [videoIds, setVideoIds] = useState<VideoIdsConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchVideoIds() {
      try {
        const ref = doc(db, "config", "videoIds");
        const snap = await getDoc(ref);

        if (cancelled) return;

        if (snap.exists()) {
          setVideoIds(snap.data() as VideoIdsConfig);
        } else {
          // Documento não existe ainda — fallback para hardcoded
          setVideoIds(null);
        }
      } catch {
        // Erro de rede ou permissão — fallback para hardcoded silenciosamente
        if (!cancelled) setVideoIds(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVideoIds();

    return () => {
      cancelled = true;
    };
  }, []);

  return { videoIds, loading };
}
