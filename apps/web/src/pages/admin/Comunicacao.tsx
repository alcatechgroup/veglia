import { useState, useCallback } from "react";
import {
  COM_ITEMS,
  PERFIS,
  POSTS_LINKEDIN,
  CARROSSEIS,
  ASSETS_MARCA,
  type ComItem,
  type PerfilCopy,
  type PostLinkedIn,
  type Carrossel,
  type AssetMarca,
} from "@/data/comunicacao";

// ─── localStorage ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "veglia_com_checklist";

function buildDefaults(): Record<string, boolean> {
  return Object.fromEntries(COM_ITEMS.map((i) => [i.id, i.done]));
}

function loadChecked(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  const defaults = buildDefaults();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    // ignore
  }
  return defaults;
}

// ─── Hook de checklist local ──────────────────────────────────────────────────

function useComChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { checked, toggle };
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  return { copy, copiedId };
}

// ─── Tipos de tab ─────────────────────────────────────────────────────────────

type Tab = "perfis" | "posts" | "carrosseis";

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Comunicacao() {
  const { checked, toggle } = useComChecklist();
  const { copy, copiedId } = useCopy();
  const [activeTab, setActiveTab] = useState<Tab>("perfis");

  const total = COM_ITEMS.length;
  const done = COM_ITEMS.filter((i) => checked[i.id]).length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Sprint 1 · Frente
        </p>
        <h1 className="text-3xl font-bold text-white">Comunicacao</h1>
        <p className="text-white/40 mt-1 text-sm">
          Landing page, redes sociais, copy de perfis, posts LinkedIn e carrosseis Instagram.
        </p>
      </div>

      {/* ── Secao 1: Checklist ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-white/60 text-xs tracking-widest uppercase font-semibold mb-4">
          Status de tarefas
        </h2>

        {/* Barra de progresso */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-sm">
              {done} de {total} tarefas —{" "}
              <span className="text-[#5DD3A8] font-semibold">{pct}% completo</span>
            </p>
            <p className="text-[#5DD3A8] font-bold text-lg">{pct}%</p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5DD3A8] to-[#2DA67D] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Grid de checkboxes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {COM_ITEMS.map((item) => (
              <CheckRow
                key={item.id}
                item={item}
                checked={!!checked[item.id]}
                onToggle={toggle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Secao 2: Copy pronto ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-white/60 text-xs tracking-widest uppercase font-semibold mb-4">
          Copy pronto
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {(["perfis", "posts", "carrosseis"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#5DD3A8]/20 text-[#5DD3A8]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab === "perfis" && "Perfis"}
              {tab === "posts" && "Posts LinkedIn"}
              {tab === "carrosseis" && "Carrosseis"}
            </button>
          ))}
        </div>

        {/* Tab: Perfis */}
        {activeTab === "perfis" && (
          <div className="grid gap-4">
            {PERFIS.map((perfil) => (
              <PerfilCard
                key={perfil.id}
                perfil={perfil}
                copiedId={copiedId}
                onCopy={copy}
              />
            ))}
          </div>
        )}

        {/* Tab: Posts LinkedIn */}
        {activeTab === "posts" && (
          <div className="grid gap-4">
            {POSTS_LINKEDIN.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                copiedId={copiedId}
                onCopy={copy}
              />
            ))}
          </div>
        )}

        {/* Tab: Carrosseis */}
        {activeTab === "carrosseis" && (
          <div className="grid gap-4">
            {CARROSSEIS.map((carrossel) => (
              <CarrosselCard key={carrossel.id} carrossel={carrossel} />
            ))}
          </div>
        )}
      </section>

      {/* ── Secao 3: Assets de marca ────────────────────────────────────────── */}
      <section>
        <h2 className="text-white/60 text-xs tracking-widest uppercase font-semibold mb-4">
          Assets de marca
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ASSETS_MARCA.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── CheckRow ─────────────────────────────────────────────────────────────────

function CheckRow({
  item,
  checked,
  onToggle,
}: {
  item: ComItem;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label className="flex items-start gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/3 transition-colors group">
      <div className="mt-0.5 shrink-0">
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            checked
              ? "bg-[#5DD3A8] border-[#5DD3A8]"
              : "border-white/20 group-hover:border-white/40"
          }`}
          onClick={() => onToggle(item.id)}
        >
          {checked && (
            <svg className="w-3 h-3 text-[#0B2545]" fill="none" viewBox="0 0 12 12">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      <span
        className={`text-sm leading-relaxed ${
          checked ? "line-through text-white/25" : "text-white/65"
        }`}
      >
        {item.label}
      </span>
    </label>
  );
}

// ─── PerfilCard ───────────────────────────────────────────────────────────────

function PerfilCard({
  perfil,
  copiedId,
  onCopy,
}: {
  perfil: PerfilCopy;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-white/80 font-medium text-sm">{perfil.titulo}</p>
        <CopyButton id={perfil.id} text={perfil.conteudo} copiedId={copiedId} onCopy={onCopy} />
      </div>
      <pre className="text-white/45 text-xs leading-relaxed whitespace-pre-wrap font-sans">
        {perfil.conteudo}
      </pre>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  copiedId,
  onCopy,
}: {
  post: PostLinkedIn;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-white/80 font-medium text-sm">{post.titulo}</p>
        <CopyButton id={post.id} text={post.conteudo} copiedId={copiedId} onCopy={onCopy} />
      </div>
      <pre className="text-white/45 text-xs leading-relaxed whitespace-pre-wrap font-sans">
        {post.conteudo}
      </pre>
    </div>
  );
}

// ─── CarrosselCard ────────────────────────────────────────────────────────────

function CarrosselCard({ carrossel }: { carrossel: Carrossel }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-white/80 font-medium text-sm">{carrossel.titulo}</p>
        <a
          href={carrossel.canvaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C9A96E]/15 text-[#C9A96E] hover:bg-[#C9A96E]/25 transition-colors"
        >
          Ver design
        </a>
      </div>
      <div className="space-y-1.5">
        {carrossel.slides.map((slide) => (
          <div key={slide.numero} className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-md bg-white/8 text-white/30 text-[10px] flex items-center justify-center font-mono">
              {slide.numero}
            </span>
            <div>
              <span className="text-white/55 text-xs font-medium">{slide.titulo}</span>
              <span className="text-white/30 text-xs"> — {slide.descricao}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AssetCard ────────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: AssetMarca }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <span className="text-2xl leading-none text-[#5DD3A8]">{asset.icone}</span>
      <div className="flex-1">
        <p className="text-white/80 font-medium text-sm mb-0.5">{asset.titulo}</p>
        <p className="text-white/35 text-xs leading-relaxed">{asset.descricao}</p>
      </div>
      <a
        href={asset.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-[#5DD3A8] hover:text-[#5DD3A8]/80 transition-colors"
      >
        Abrir →
      </a>
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({
  id,
  text,
  copiedId,
  onCopy,
}: {
  id: string;
  text: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const copied = copiedId === id;
  return (
    <button
      onClick={() => onCopy(id, text)}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? "bg-[#5DD3A8]/20 text-[#5DD3A8]"
          : "bg-white/8 text-white/45 hover:bg-white/15 hover:text-white/70"
      }`}
    >
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}
