import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoIdsConfig {
  lei15377: {
    m01: string;
    m02: string;
    m03: string;
    m04: string;
  };
  nr1: {
    m01: string;
    m02: string;
  };
}

interface UseVideoIdsResult {
  videoIds: VideoIdsConfig | null;
  loading: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Busca os videoIds de `/config/courses` (doc "videoIds") no Firestore.
 *
 * Retorna null enquanto carrega ou se o documento não existir.
 * O consumidor deve fazer fallback para os videoIds hardcoded quando null.
 *
 * Estrutura esperada no Firestore:
 *   /config/courses  (doc ID: "videoIds")
 *     lei15377: { m01: "ytId", m02: "ytId", m03: "ytId", m04: "ytId" }
 *     nr1: { m01: "ytId", m02: "ytId" }
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
