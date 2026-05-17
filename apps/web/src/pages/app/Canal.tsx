import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import type { ContentFeedItem, ContentCategory } from "@veglia/shared";

// ─── Seed de conteudo (demonstracao) ─────────────────────────────────────────

const CONTENT_SEED: Omit<ContentFeedItem, "id">[] = [
  {
    title: "Vacinacao no trabalho: o que a Lei 15.377/2026 exige",
    summary:
      "A nova legislacao obriga empregadores a facilitar o acesso dos colaboradores a vacinas do calendario nacional. Entenda as responsabilidades.",
    type: "article",
    url: "https://veglia.com.br",
    category: "vaccination",
    published_at: Date.now() - 2 * 24 * 60 * 60 * 1000,
    author: "Dra. Amanda Conde",
  },
  {
    title: "Saude mental no ambiente corporativo — NR-1 e o papel do gestor",
    summary:
      "A revisao da NR-1 inclui riscos psicossociais como obrigacao do GRO. Veja como implementar.",
    type: "article",
    url: "https://veglia.com.br",
    category: "mental_health",
    published_at: Date.now() - 5 * 24 * 60 * 60 * 1000,
    author: "Dra. Amanda Conde",
  },
  {
    title: "Calendario vacinal do adulto 2026 — o que nao pode faltar",
    summary:
      "Influenza, Hepatite B, HPV, COVID-19 bivalente e mais. Guia atualizado com as recomendacoes da SBIm.",
    type: "video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    category: "vaccination",
    published_at: Date.now() - 7 * 24 * 60 * 60 * 1000,
    author: "Dra. Amanda Conde",
  },
  {
    title: "5 habitos de nutricao para aumentar a imunidade",
    summary:
      "Dieta balanceada como pilar de saude preventiva. Dicas praticas para o dia a dia corporativo.",
    type: "article",
    url: "https://veglia.com.br",
    category: "nutrition",
    published_at: Date.now() - 10 * 24 * 60 * 60 * 1000,
    author: "Dra. Amanda Conde",
  },
];

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  vaccination: "Vacinacao",
  mental_health: "Saude Mental",
  nutrition: "Nutricao",
  prevention: "Prevencao",
};

const CATEGORY_COLORS: Record<ContentCategory, string> = {
  vaccination: "text-[#5DD3A8] bg-[#5DD3A8]/10",
  mental_health: "text-sky-400 bg-sky-400/10",
  nutrition: "text-[#C9A96E] bg-[#C9A96E]/10",
  prevention: "text-purple-400 bg-purple-400/10",
};

// ─── Card de conteudo ─────────────────────────────────────────────────────────

interface ContentCardProps {
  item: ContentFeedItem;
}

function ContentCard({ item }: ContentCardProps) {
  const isVideo = item.type === "video";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/25 transition-colors block"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${
            CATEGORY_COLORS[item.category]
          }`}
        >
          {CATEGORY_LABELS[item.category]}
        </span>
        <span className="text-[11px] text-white/25">
          {isVideo ? "Video" : "Artigo"}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-[#5DD3A8] transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-white/50 mt-2 leading-relaxed">{item.summary}</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/30">
        <span>{item.author}</span>
        <span>
          {new Date(item.published_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>

      {isVideo && (
        <div className="flex items-center gap-2 text-xs font-medium text-[#5DD3A8] group-hover:text-[#4BC495] transition-colors">
          <span>Assistir video</span>
          <span className="text-base">→</span>
        </div>
      )}
    </a>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Canal() {
  const [items, setItems] = useState<ContentFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentCategory | "all">("all");

  useEffect(() => {
    const q = query(collection(db, "content_feed"), orderBy("published_at", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setItems(
          CONTENT_SEED.map((s, i) => ({ id: `content-${i + 1}`, ...s })).sort(
            (a, b) => b.published_at - a.published_at
          )
        );
      } else {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContentFeedItem)));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered =
    filter === "all" ? items : items.filter((i) => i.category === filter);

  const filterTabs: { id: ContentCategory | "all"; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "vaccination", label: "Vacinacao" },
    { id: "mental_health", label: "Saude Mental" },
    { id: "nutrition", label: "Nutricao" },
    { id: "prevention", label: "Prevencao" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Canal de Saude</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Conteudo medico autoritativo curado pela Dra. Amanda Conde
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-3 py-2">
          <span className="text-xs font-semibold text-[#5DD3A8]">Powered by VaciVitta</span>
        </div>
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

      {/* Grid de conteudo */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-12 text-center">
          <p className="text-white/30 text-sm">Nenhum conteudo nessa categoria ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Aviso editorial */}
      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <span className="text-white/30 text-sm shrink-0">◎</span>
        <p className="text-xs text-white/30">
          Todo conteudo publicado neste canal e revisado pela{" "}
          <span className="text-white/50">Dra. Amanda Conde Perez Fernandes</span> —
          pediatra, neonatologista, membro da SBIm. Nenhum conteudo substitui consulta medica.
        </p>
      </div>
    </div>
  );
}
