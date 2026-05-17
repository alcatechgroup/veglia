import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import type { ContentFeedItem, ContentType, ContentCategory } from "@veglia/shared";

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  vaccination: "Vacinacao",
  mental_health: "Saude Mental",
  nutrition: "Nutricao",
  prevention: "Prevencao",
};

const TYPE_LABELS: Record<ContentType, string> = {
  video: "Video",
  article: "Artigo",
};

// ─── Formulario de item ───────────────────────────────────────────────────────

interface ItemFormProps {
  initial?: Partial<ContentFeedItem>;
  onSave: (data: Omit<ContentFeedItem, "id">) => Promise<void>;
  onCancel: () => void;
}

function ItemForm({ initial, onSave, onCancel }: ItemFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [type, setType] = useState<ContentType>(initial?.type ?? "article");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [category, setCategory] = useState<ContentCategory>(initial?.category ?? "vaccination");
  const [author, setAuthor] = useState(initial?.author ?? "Dra. Amanda Conde");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        summary: summary.trim().slice(0, 200),
        type,
        url: url.trim(),
        category,
        author: author.trim(),
        published_at: initial?.published_at ?? Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Titulo *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
          placeholder="Titulo do conteudo"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Resumo (max 200 chars)</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, 200))}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 resize-none"
          placeholder="Resumo breve do conteudo..."
        />
        <p className="text-[10px] text-white/25 mt-0.5 text-right">{summary.length}/200</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
          >
            <option value="article">Artigo</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ContentCategory)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
          >
            {(Object.entries(CATEGORY_LABELS) as [ContentCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">URL / Link *</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Autor</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
          placeholder="Dra. Amanda Conde"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim() || !url.trim()}
          className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function AdminCanal() {
  const [items, setItems] = useState<ContentFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContentFeedItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "content_feed"), orderBy("published_at", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContentFeedItem)));
      setLoading(false);
    });
  }, []);

  const handleCreate = async (data: Omit<ContentFeedItem, "id">) => {
    await addDoc(collection(db, "content_feed"), { ...data, active: true });
    setShowForm(false);
  };

  const handleUpdate = async (data: Omit<ContentFeedItem, "id">) => {
    if (!editing) return;
    await updateDoc(doc(db, "content_feed", editing.id), { ...data });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover este item do canal?")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "content_feed", id));
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (item: ContentFeedItem & { active?: boolean }) => {
    await updateDoc(doc(db, "content_feed", item.id), {
      active: !item.active,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Canal de Saude</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Publicar e editar conteudo medico do canal — validado pela Dra. Amanda
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span>+</span>
          Novo conteudo
        </button>
      </div>

      {/* Formulario inline */}
      {(showForm || editing) && (
        <div className="bg-[#0B2545] border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            {editing ? "Editar conteudo" : "Novo conteudo"}
          </h2>
          <ItemForm
            initial={editing ?? undefined}
            onSave={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* Aviso editorial */}
      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <span className="text-[#5DD3A8] shrink-0">◎</span>
        <p className="text-xs text-white/50">
          Todo conteudo publicado aqui fica visiivel para todos os colaboradores de todas as empresas.
          Garanta validacao da Dra. Amanda antes de publicar qualquer informacao medica.
        </p>
      </div>

      {/* Lista de conteudos */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Conteudo publicado ({items.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-white/30 text-sm">Nenhum conteudo publicado ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-[#5DD3A8] text-sm hover:underline"
            >
              Criar primeiro conteudo
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((item) => {
              const itemWithActive = item as ContentFeedItem & { active?: boolean };
              const isActive = itemWithActive.active !== false;
              return (
                <div
                  key={item.id}
                  className={`px-6 py-4 flex items-start gap-4 transition-colors ${
                    !isActive ? "opacity-50" : ""
                  } hover:bg-white/[0.02]`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-medium text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="text-[11px] text-white/30">
                        {TYPE_LABELS[item.type]}
                      </span>
                      {!isActive && (
                        <span className="text-[11px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white leading-snug">{item.title}</p>
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{item.summary}</p>
                    <p className="text-[11px] text-white/25 mt-1">
                      {item.author} ·{" "}
                      {new Date(item.published_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleActive(itemWithActive)}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      {isActive ? "Inativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => { setEditing(item); setShowForm(false); }}
                      className="text-xs text-[#5DD3A8] hover:text-[#4BC495] transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      {deleting === item.id ? "..." : "Remover"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
