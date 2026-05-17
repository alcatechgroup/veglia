import { useState } from "react";
import { MATERIAIS, TAG_COLORS, type Material, type MaterialTag } from "@/data/materiais";

const ALL_TAGS: MaterialTag[] = ["estratégia", "design", "comunicação", "produto", "conteúdo"];

export default function Materiais() {
  const [activeTag, setActiveTag] = useState<MaterialTag | "todos">("todos");
  const [viewer, setViewer] = useState<Material | null>(null);

  const filtered = activeTag === "todos"
    ? MATERIAIS
    : MATERIAIS.filter((m) => m.tag === activeTag);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Documentos · Artefatos · Refs
        </p>
        <h1 className="text-3xl font-bold text-white">Materiais</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <FilterBtn label="Todos" active={activeTag === "todos"} onClick={() => setActiveTag("todos")} />
        {ALL_TAGS.filter((t) => MATERIAIS.some((m) => m.tag === t)).map((t) => (
          <FilterBtn key={t} label={t} active={activeTag === t} onClick={() => setActiveTag(t)} />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <MaterialCard key={m.id} material={m} onOpen={() => setViewer(m)} />
        ))}
      </div>

      {/* Viewer modal */}
      {viewer && (
        <ViewerModal material={viewer} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
        active
          ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
          : "bg-white/5 text-white/40 border border-white/10 hover:text-white/70"
      }`}
    >
      {label}
    </button>
  );
}

function MaterialCard({ material: m, onOpen }: { material: Material; onOpen: () => void }) {
  const tagStyle = TAG_COLORS[m.tag];
  const canPreview = m.type === "html" || m.type === "pdf";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/8 transition-all">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${tagStyle}`}>
          {m.tag}
        </span>
        <span className="text-[10px] text-white/25 uppercase font-mono">{m.type}</span>
      </div>
      <div className="flex-1">
        <p className="text-white/80 font-medium text-sm leading-snug">{m.title}</p>
        <p className="text-white/35 text-xs mt-1.5 leading-relaxed">{m.description}</p>
      </div>
      <div className="flex gap-2 mt-auto">
        {canPreview && (
          <button
            onClick={onOpen}
            className="flex-1 py-2 rounded-xl bg-[#5DD3A8]/10 text-[#5DD3A8] text-xs font-medium hover:bg-[#5DD3A8]/20 transition-colors"
          >
            Visualizar
          </button>
        )}
        <a
          href={`/docs/${m.path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-xl bg-white/5 text-white/40 text-xs font-medium hover:bg-white/10 hover:text-white/70 transition-colors text-center"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}

function ViewerModal({ material: m, onClose }: { material: Material; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B2545]">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex-1 min-w-0">
          <p className="text-white/80 font-medium text-sm truncate">{m.title}</p>
          <p className="text-white/30 text-xs capitalize">{m.tag}</p>
        </div>
        <a
          href={`/docs/${m.path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#5DD3A8]/70 hover:text-[#5DD3A8] transition-colors shrink-0 flex items-center gap-1"
        >
          Abrir em nova aba
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
      </div>
      {/* iframe */}
      <iframe
        src={`/docs/${m.path}`}
        className="flex-1 w-full border-0 bg-white"
        title={m.title}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
