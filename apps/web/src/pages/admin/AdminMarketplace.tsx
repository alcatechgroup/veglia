import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import type { MarketplaceItem, MarketplaceRequest } from "@veglia/shared";

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<MarketplaceItem["category"], string> = {
  consultation: "Consulta",
  exam: "Exame",
  vaccine: "Vacinacao",
  plan: "Plano de Saude",
};

const REQUEST_STATUS_LABELS: Record<MarketplaceRequest["status"], string> = {
  pending: "Aguardando",
  processing: "Em andamento",
  completed: "Concluido",
  cancelled: "Cancelado",
};

const REQUEST_STATUS_COLORS: Record<MarketplaceRequest["status"], string> = {
  pending: "text-white/40 bg-white/5",
  processing: "text-[#C9A96E] bg-[#C9A96E]/10",
  completed: "text-[#5DD3A8] bg-[#5DD3A8]/10",
  cancelled: "text-red-400/60 bg-red-500/10",
};

// ─── Modal de item ────────────────────────────────────────────────────────────

interface ItemModalProps {
  initial?: Partial<MarketplaceItem>;
  onSave: (data: Omit<MarketplaceItem, "id">) => Promise<void>;
  onClose: () => void;
}

function ItemModal({ initial, onSave, onClose }: ItemModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<MarketplaceItem["category"]>(
    initial?.category ?? "vaccine"
  );
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : ""
  );
  const [available, setAvailable] = useState(initial?.available !== false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !provider.trim()) return;
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        provider: provider.trim(),
        description: description.trim(),
        category,
        price: price !== "" ? parseFloat(price) : undefined,
        available,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">
            {initial?.name ? "Editar item" : "Novo item"}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-lg">
            x
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Provedor *</label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
              placeholder="Ex: VaciVitta"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Descricao</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketplaceItem["category"])}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                {(Object.entries(CATEGORY_LABELS) as [MarketplaceItem["category"], string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Preco (R$)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="Consultar"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="accent-[#5DD3A8]"
            />
            <span className="text-xs text-white/60">Disponivel para solicitacao</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !provider.trim()}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function AdminMarketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [requests, setRequests] = useState<(MarketplaceRequest & { item_name?: string })[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MarketplaceItem | null>(null);
  const [tab, setTab] = useState<"catalog" | "requests">("catalog");

  useEffect(() => {
    return onSnapshot(collection(db, "marketplace_items"), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceItem)));
      setLoadingItems(false);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "marketplace_requests"), (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as MarketplaceRequest & { item_name?: string }))
        .sort((a, b) => b.created_at - a.created_at);
      setRequests(docs);
      setLoadingReqs(false);
    });
  }, []);

  const handleCreate = async (data: Omit<MarketplaceItem, "id">) => {
    await addDoc(collection(db, "marketplace_items"), data);
  };

  const handleUpdate = async (data: Omit<MarketplaceItem, "id">) => {
    if (!editing) return;
    await updateDoc(doc(db, "marketplace_items", editing.id), { ...data });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover este item do marketplace?")) return;
    await deleteDoc(doc(db, "marketplace_items", id));
  };

  const handleUpdateRequestStatus = async (
    reqId: string,
    status: MarketplaceRequest["status"]
  ) => {
    await updateDoc(doc(db, "marketplace_requests", reqId), { status });
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Marketplace</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Catalogo de servicos + solicitacoes dos clientes
          </p>
        </div>
        {tab === "catalog" && (
          <button
            onClick={() => { setShowModal(true); setEditing(null); }}
            className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <span>+</span>
            Novo item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "catalog", label: "Catalogo" },
          {
            id: "requests",
            label: `Solicitacoes${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "catalog" | "requests")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === t.id
                ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Catalogo */}
      {tab === "catalog" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loadingItems ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-white/30 text-sm">Nenhum item no catalogo.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full font-medium">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      {!item.available && (
                        <span className="text-[11px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          Indisponivel
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/40">{item.provider}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.price === 0 ? (
                      <span className="text-sm font-semibold text-[#5DD3A8]">Gratis</span>
                    ) : item.price != null ? (
                      <span className="text-sm font-semibold text-white">
                        R$ {item.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">A consultar</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => { setEditing(item); setShowModal(false); }}
                      className="text-xs text-[#5DD3A8] hover:text-[#4BC495]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-400/60 hover:text-red-400"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Solicitacoes */}
      {tab === "requests" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loadingReqs ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-white/30 text-sm">Nenhuma solicitacao ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {requests.map((req) => (
                <div key={req.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {req.item_name ?? req.item_id}
                    </p>
                    <p className="text-xs text-white/30">
                      {new Date(req.created_at).toLocaleDateString("pt-BR")} ·{" "}
                      {req.user_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                        REQUEST_STATUS_COLORS[req.status]
                      }`}
                    >
                      {REQUEST_STATUS_LABELS[req.status]}
                    </span>
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, "processing")}
                        className="text-xs text-[#C9A96E] hover:text-[#b8954f]"
                      >
                        Iniciar
                      </button>
                    )}
                    {req.status === "processing" && (
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, "completed")}
                        className="text-xs text-[#5DD3A8] hover:text-[#4BC495]"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {(showModal || editing) && (
        <ItemModal
          initial={editing ?? undefined}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
