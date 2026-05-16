import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoIdsConfig {
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

type ModuleKey = keyof VideoIdsConfig["lei15377"] | keyof VideoIdsConfig["nr1"];

interface ModuleDefinition {
  course: "lei15377" | "nr1";
  key: ModuleKey;
  label: string;
  order: number;
}

const PLACEHOLDER_ID = "dQw4w9WgXcQ";

const MODULES: ModuleDefinition[] = [
  { course: "lei15377", key: "m01", label: "Lei 15.377 — Módulo 1: O que muda com a Lei 15.377", order: 1 },
  { course: "lei15377", key: "m02", label: "Lei 15.377 — Módulo 2: Obrigações do empregador", order: 2 },
  { course: "lei15377", key: "m03", label: "Lei 15.377 — Módulo 3: Calendário Vacinal SBIm 2026", order: 3 },
  { course: "lei15377", key: "m04", label: "Lei 15.377 — Módulo 4: Documentação e auditoria", order: 4 },
  { course: "nr1", key: "m01", label: "NR-1 — Módulo 1: O que é a NR-1 e por que importa", order: 1 },
  { course: "nr1", key: "m02", label: "NR-1 — Módulo 2: GRO, PGR e seus direitos", order: 2 },
];

const EMPTY_CONFIG: VideoIdsConfig = {
  lei15377: { m01: "", m02: "", m03: "", m04: "" },
  nr1: { m01: "", m02: "" },
};

function isPublished(videoId: string): boolean {
  return videoId.length > 0 && videoId !== PLACEHOLDER_ID;
}

// ─── ModuleCard ───────────────────────────────────────────────────────────────

interface ModuleCardProps {
  module: ModuleDefinition;
  currentId: string;
  onSave: (course: "lei15377" | "nr1", key: ModuleKey, videoId: string) => Promise<void>;
}

function ModuleCard({ module, currentId, onSave }: ModuleCardProps) {
  const [inputValue, setInputValue] = useState(currentId);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Sync when parent data changes (e.g. initial load)
  useEffect(() => {
    setInputValue(currentId);
  }, [currentId]);

  const published = isPublished(inputValue);
  const thumbnailUrl = published
    ? `https://img.youtube.com/vi/${inputValue}/mqdefault.jpg`
    : null;

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(module.course, module.key, inputValue.trim());
      setFeedback({ type: "success", message: "Video ID salvo com sucesso." });
    } catch {
      setFeedback({ type: "error", message: "Erro ao salvar. Verifique as permissoes." });
    } finally {
      setSaving(false);
      // Auto-hide feedback after 4s
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Header: badge de curso + badge de status */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <span
            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
              module.course === "lei15377"
                ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/25"
                : "bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/25"
            }`}
          >
            {module.course === "lei15377" ? "Lei 15.377/2026" : "NR-1"}
          </span>
          <p className="text-sm font-medium text-white/80 leading-snug pr-4">{module.label}</p>
        </div>

        {published ? (
          <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/25">
            Publicado
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25">
            Placeholder
          </span>
        )}
      </div>

      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="w-full rounded-xl overflow-hidden border border-white/10">
          <img
            src={thumbnailUrl}
            alt={`Thumbnail do modulo ${module.key}`}
            className="w-full h-auto object-cover"
            onError={(e) => {
              // Esconde imagem se o thumbnail não carregar (vídeo privado/inexistente)
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Input + botão salvar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Cole o Video ID do YouTube (ex: dQw4w9WgXcQ)"
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/40 focus:bg-white/8 transition-colors"
          aria-label={`Video ID do modulo ${module.label}`}
        />
        <button
          onClick={handleSave}
          disabled={saving || inputValue.trim() === currentId}
          className="shrink-0 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? "..." : "Salvar"}
        </button>
      </div>

      {/* Feedback inline */}
      {feedback && (
        <p
          className={`text-xs font-medium px-3 py-2 rounded-xl ${
            feedback.type === "success"
              ? "bg-[#5DD3A8]/10 text-[#5DD3A8] border border-[#5DD3A8]/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

// ─── GerenciarConteudo ────────────────────────────────────────────────────────

export default function GerenciarConteudo() {
  const [config, setConfig] = useState<VideoIdsConfig>(EMPTY_CONFIG);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Carrega configuração atual do Firestore
  useEffect(() => {
    async function load() {
      try {
        const ref = doc(db, "config", "videoIds");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<VideoIdsConfig>;
          setConfig({
            lei15377: {
              m01: data.lei15377?.m01 ?? "",
              m02: data.lei15377?.m02 ?? "",
              m03: data.lei15377?.m03 ?? "",
              m04: data.lei15377?.m04 ?? "",
            },
            nr1: {
              m01: data.nr1?.m01 ?? "",
              m02: data.nr1?.m02 ?? "",
            },
          });
        }
      } catch {
        setPageError("Nao foi possivel carregar a configuracao. Verifique as permissoes do Firestore.");
      } finally {
        setPageLoading(false);
      }
    }

    load();
  }, []);

  const handleSave = async (
    course: "lei15377" | "nr1",
    key: ModuleKey,
    videoId: string
  ) => {
    const ref = doc(db, "config", "videoIds");
    await setDoc(
      ref,
      {
        [course]: {
          [key]: videoId,
        },
      },
      { merge: true }
    );

    // Atualiza estado local para refletir o novo valor salvo
    setConfig((prev) => ({
      ...prev,
      [course]: {
        ...prev[course],
        [key]: videoId,
      },
    }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
          Admin · Conteudo
        </p>
        <h1 className="text-2xl font-bold text-white">Gerenciar Conteudo</h1>
        <p className="text-sm text-white/40 mt-1">
          Atualize os Video IDs do YouTube para cada modulo. O sistema exibe o video novo
          imediatamente apos salvar — sem rebuild.
        </p>
      </div>

      {/* Instrucoes */}
      <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/25 rounded-2xl px-5 py-4 space-y-2">
        <p className="text-xs font-semibold text-[#C9A96E]">Como usar</p>
        <ol className="text-xs text-white/50 space-y-1 list-decimal list-inside leading-relaxed">
          <li>Publique o video no YouTube como "Nao listado".</li>
          <li>Copie apenas o ID do video (ex: <code className="text-white/70 bg-white/10 px-1 rounded">dQw4w9WgXcQ</code>) — nao a URL completa.</li>
          <li>Cole no campo do modulo correspondente e clique em Salvar.</li>
        </ol>
      </div>

      {/* Estados de carregamento / erro */}
      {pageLoading && (
        <div className="text-sm text-white/40 py-8 text-center">Carregando configuracao...</div>
      )}

      {pageError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
          <p className="text-sm text-red-400">{pageError}</p>
        </div>
      )}

      {/* Cards de modulos */}
      {!pageLoading && !pageError && (
        <>
          {/* Trilha Lei 15.377 */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
              Trilha — Lei 15.377/2026
            </h2>
            {MODULES.filter((m) => m.course === "lei15377").map((module) => (
              <ModuleCard
                key={`${module.course}-${module.key}`}
                module={module}
                currentId={config.lei15377[module.key as keyof VideoIdsConfig["lei15377"]] ?? ""}
                onSave={handleSave}
              />
            ))}
          </div>

          {/* Trilha NR-1 */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
              Trilha — NR-1: Riscos Psicossociais
            </h2>
            {MODULES.filter((m) => m.course === "nr1").map((module) => (
              <ModuleCard
                key={`${module.course}-${module.key}`}
                module={module}
                currentId={config.nr1[module.key as keyof VideoIdsConfig["nr1"]] ?? ""}
                onSave={handleSave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
