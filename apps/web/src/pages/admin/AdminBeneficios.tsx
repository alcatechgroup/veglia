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
import type { Benefit } from "@veglia/shared";

// ─── Modal de beneficio ───────────────────────────────────────────────────────

interface BenefitModalProps {
  initial?: Partial<Benefit>;
  onSave: (data: Omit<Benefit, "id">) => Promise<void>;
  onClose: () => void;
}

function BenefitModal({ initial, onSave, onClose }: BenefitModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [howToAccess, setHowToAccess] = useState(initial?.how_to_access ?? "");
  const [limitPerUser, setLimitPerUser] = useState<string>(
    initial?.limit_per_user != null ? String(initial.limit_per_user) : ""
  );
  const [plans, setPlans] = useState<Benefit["plans"]>(
    initial?.plans ?? ["starter", "pro", "enterprise"]
  );
  const [loading, setLoading] = useState(false);

  const togglePlan = (plan: "starter" | "pro" | "enterprise") => {
    setPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        how_to_access: howToAccess.trim(),
        limit_per_user: limitPerUser !== "" ? parseInt(limitPerUser) : undefined,
        plans,
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
            {initial?.name ? "Editar beneficio" : "Novo beneficio"}
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
            <label className="block text-xs font-medium text-white/50 mb-1">Descricao</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Como acessar</label>
            <input
              type="text"
              value={howToAccess}
              onChange={(e) => setHowToAccess(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
              placeholder="Instrucoes para o colaborador"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">
              Limite por colaborador
            </label>
            <input
              type="number"
              value={limitPerUser}
              onChange={(e) => setLimitPerUser(e.target.value)}
              min="1"
              placeholder="Sem limite"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Planos incluidos</label>
            <div className="flex gap-2">
              {(["starter", "pro", "enterprise"] as const).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => togglePlan(plan)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    plans.includes(plan)
                      ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border-[#5DD3A8]/30"
                      : "bg-white/5 text-white/30 border-white/10"
                  }`}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </button>
              ))}
            </div>
          </div>
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
              disabled={loading || !name.trim()}
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

export default function AdminBeneficios() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Benefit | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, "benefits"), (snap) => {
      setBenefits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Benefit)));
      setLoading(false);
    });
  }, []);

  const handleCreate = async (data: Omit<Benefit, "id">) => {
    await addDoc(collection(db, "benefits"), data);
  };

  const handleUpdate = async (data: Omit<Benefit, "id">) => {
    if (!editing) return;
    await updateDoc(doc(db, "benefits", editing.id), { ...data });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remover este beneficio?")) return;
    await deleteDoc(doc(db, "benefits", id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalogo de Beneficios</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Beneficios preventivos exibidos para os colaboradores
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditing(null); }}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span>+</span>
          Novo beneficio
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : benefits.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-white/30 text-sm">Nenhum beneficio cadastrado.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-[#5DD3A8] text-sm hover:underline"
            >
              Criar primeiro beneficio
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {benefits.map((b) => (
              <div key={b.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {b.plans.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{b.description}</p>
                  {b.limit_per_user != null && (
                    <p className="text-[11px] text-white/25 mt-0.5">
                      Limite: {b.limit_per_user}x por colaborador
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { setEditing(b); setShowModal(false); }}
                    className="text-xs text-[#5DD3A8] hover:text-[#4BC495]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
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

      {/* Modal */}
      {(showModal || editing) && (
        <BenefitModal
          initial={editing ?? undefined}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
