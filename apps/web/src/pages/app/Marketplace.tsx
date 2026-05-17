import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { MarketplaceItem, MarketplaceRequest } from "@veglia/shared";

// ─── Catalogo seed ────────────────────────────────────────────────────────────

const CATALOG_SEED: Omit<MarketplaceItem, "id">[] = [
  {
    name: "Vacina In-Company VaciVitta",
    provider: "VaciVitta",
    price: undefined,
    description:
      "Agendamento de vacinacao coletiva no local de trabalho. Influenza, Hepatite, HPV e mais.",
    category: "vaccine",
    available: true,
  },
  {
    name: "Consulta de Orientacao Nutricional",
    provider: "Parceiro Nutri",
    price: 0,
    description:
      "Sessao de 45 minutos com nutricionista parceiro. Orientacoes de saude preventiva.",
    category: "consultation",
    available: true,
  },
  {
    name: "Exame Periodico Completo",
    provider: "VaciVitta",
    price: undefined,
    description:
      "Hemograma completo, glicemia, colesterol, pressao arterial. Atende NR-7.",
    category: "exam",
    available: true,
  },
  {
    name: "Plano de Saude Empresarial",
    provider: "Parceiro Saude",
    price: undefined,
    description:
      "Opcoes de plano coletivo empresarial a partir de 5 colaboradores. Cotacao gratuita.",
    category: "plan",
    available: true,
  },
];

const CATEGORY_ICONS: Record<MarketplaceItem["category"], string> = {
  consultation: "◎",
  exam: "◈",
  vaccine: "◑",
  plan: "◆",
};

const CATEGORY_LABELS: Record<MarketplaceItem["category"], string> = {
  consultation: "Consulta",
  exam: "Exame",
  vaccine: "Vacinacao",
  plan: "Plano de Saude",
};

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Marketplace() {
  const { firebaseUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [myRequests, setMyRequests] = useState<MarketplaceRequest[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<string | null>(null);
  const [filter, setFilter] = useState<MarketplaceItem["category"] | "all">("all");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "marketplace_items"), (snap) => {
      if (snap.empty) {
        setItems(CATALOG_SEED.map((s, i) => ({ id: `item-${i + 1}`, ...s })));
      } else {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceItem)));
      }
      setLoadingItems(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "marketplace_requests"),
      where("user_id", "==", uid)
    );
    return onSnapshot(q, (snap) => {
      setMyRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketplaceRequest)));
    });
  }, [uid]);

  const handleRequest = async (item: MarketplaceItem) => {
    if (!uid || !companyId || requesting) return;
    setRequesting(item.id);
    try {
      await addDoc(collection(db, "marketplace_requests"), {
        user_id: uid,
        company_id: companyId,
        item_id: item.id,
        item_name: item.name,
        provider: item.provider,
        status: "pending",
        created_at: Date.now(),
      });
      setRequested(item.id);
      setTimeout(() => setRequested(null), 3000);
    } finally {
      setRequesting(null);
    }
  };

  const filtered =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  const hasRequested = (itemId: string) =>
    myRequests.some((r) => r.item_id === itemId);

  const filterTabs: { id: MarketplaceItem["category"] | "all"; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "vaccine", label: "Vacinacao" },
    { id: "consultation", label: "Consulta" },
    { id: "exam", label: "Exame" },
    { id: "plan", label: "Plano de Saude" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Marketplace de Saude</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Servicos preventivos para voce e sua empresa
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === tab.id
                ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de itens */}
      {loadingItems ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const alreadyRequested = hasRequested(item.id);
            const isRequesting = requesting === item.id;
            const justRequested = requested === item.id;

            return (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-[#5DD3A8] shrink-0 mt-0.5">
                    {CATEGORY_ICONS[item.category]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white leading-snug">{item.name}</h3>
                      <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>
                    <p className="text-xs text-[#5DD3A8]/60 mt-0.5">{item.provider}</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>

                <div className="flex items-center justify-between">
                  {item.price === 0 ? (
                    <span className="text-sm font-semibold text-[#5DD3A8]">Gratis</span>
                  ) : item.price != null ? (
                    <span className="text-sm font-semibold text-white">
                      R$ {item.price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-white/30">Consultar valor</span>
                  )}

                  <button
                    onClick={() => handleRequest(item)}
                    disabled={isRequesting || alreadyRequested || !item.available}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:cursor-not-allowed ${
                      alreadyRequested
                        ? "bg-[#5DD3A8]/20 text-[#5DD3A8] border border-[#5DD3A8]/30"
                        : justRequested
                        ? "bg-[#5DD3A8] text-[#0B2545]"
                        : isRequesting
                        ? "bg-white/10 text-white/40"
                        : "bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545]"
                    }`}
                  >
                    {alreadyRequested
                      ? "Solicitado"
                      : justRequested
                      ? "Enviado!"
                      : isRequesting
                      ? "..."
                      : "Solicitar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Minhas solicitacoes */}
      {myRequests.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Minhas solicitacoes</h2>
          </div>
          <div className="divide-y divide-white/5">
            {myRequests.map((req) => (
              <div key={req.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">{(req as MarketplaceRequest & { item_name?: string }).item_name ?? req.item_id}</p>
                  <p className="text-xs text-white/30">
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    req.status === "completed"
                      ? "text-[#5DD3A8] bg-[#5DD3A8]/10"
                      : req.status === "processing"
                      ? "text-[#C9A96E] bg-[#C9A96E]/10"
                      : "text-white/40 bg-white/5"
                  }`}
                >
                  {req.status === "pending"
                    ? "Aguardando"
                    : req.status === "processing"
                    ? "Em andamento"
                    : req.status === "completed"
                    ? "Concluido"
                    : "Cancelado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
