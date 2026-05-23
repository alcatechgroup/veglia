import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

interface KnowledgeItem {
  id: string;
  keywords: string[];
  response: string;
  order: number;
  active: boolean;
}

const DEFAULT_ITEMS: KnowledgeItem[] = [
  {
    id: "lei",
    keywords: ["lei", "15377", "obrigação", "obrigatorio", "multa", "fiscalização"],
    response:
      "A Lei 15.377/2026 obriga toda empresa com funcionários CLT a comunicar campanhas de vacinação, orientar sobre prevenção de cânceres e documentar tudo de forma auditável. Empresas sem conformidade estão sujeitas a autuação pelo Ministério do Trabalho.",
    order: 1,
    active: true,
  },
  {
    id: "preco",
    keywords: ["preço", "plano", "custo", "valor", "quanto"],
    response:
      "O plano Essencial começa em R$29,90/mês para até 30 vidas. Para equipes maiores: R$29,90 + R$0,49 por vida (até 1.000) ou R$0,39 por vida (acima de 1.000). Quer que eu te conecte com nosso time para uma proposta personalizada?",
    order: 2,
    active: true,
  },
  {
    id: "vacivitta",
    keywords: ["vacivitta", "vacina", "imunização", "campanha vacinal"],
    response:
      "A Vegl.ia é powered by Vacivitta, com 10 anos de operação real em saúde corporativa. Você pode agendar campanhas de vacinação in-company diretamente pela plataforma, com equipe especializada indo até a sua empresa.",
    order: 3,
    active: true,
  },
  {
    id: "certificado",
    keywords: ["certificado", "comprovante", "prova", "auditoria", "documento"],
    response:
      "Cada treinamento concluído gera um certificado digital com hash SHA-256, válido para auditorias do Ministério do Trabalho e eSocial. O RH exporta o relatório completo com um clique.",
    order: 4,
    active: true,
  },
  {
    id: "demo",
    keywords: ["demo", "demonstração", "ver", "testar", "conhecer"],
    response:
      "Posso te conectar com nosso time para uma demo de 30 minutos. Quer agendar? Me passa seu nome e e-mail que entramos em contato.",
    order: 5,
    active: true,
  },
];

const DEFAULT_SETTINGS = {
  greeting:
    "Oi! Sou a Vela, assistente da Vegl.ia. Posso te ajudar com dúvidas sobre compliance trabalhista e a Lei 15.377. Como posso ajudar?",
  fallback:
    "Não tenho certeza sobre isso ainda. Quer conversar com nosso time? Me passa seu e-mail e entraremos em contato.",
  conversion_kw: ["quero", "interesse", "como faço", "preciso", "ajuda", "contato", "falar", "demo"],
};

export default function AdminVela() {
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>(DEFAULT_ITEMS);
  const [greeting, setGreeting] = useState(DEFAULT_SETTINGS.greeting);
  const [fallback, setFallback] = useState(DEFAULT_SETTINGS.fallback);
  const [conversionKw, setConversionKw] = useState(DEFAULT_SETTINGS.conversion_kw.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, "vela_config", "knowledge_base")),
      getDoc(doc(db, "vela_config", "settings")),
    ])
      .then(([kbSnap, settingsSnap]) => {
        if (kbSnap.exists() && (kbSnap.data().items as unknown[])?.length > 0) {
          setItems(kbSnap.data().items as KnowledgeItem[]);
        }
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          if (s.greeting) setGreeting(s.greeting as string);
          if (s.fallback) setFallback(s.fallback as string);
          if (s.conversion_kw) setConversionKw((s.conversion_kw as string[]).join(", "));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const uid = firebaseUser?.uid ?? "";
    const now = Date.now();
    try {
      await Promise.all([
        setDoc(doc(db, "vela_config", "knowledge_base"), {
          items: items.map((item, i) => ({ ...item, order: i + 1 })),
          updated_at: now,
          updated_by: uid,
        }),
        setDoc(doc(db, "vela_config", "settings"), {
          greeting,
          fallback,
          conversion_kw: conversionKw
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          updated_at: now,
          updated_by: uid,
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newItem: KnowledgeItem = {
      id: crypto.randomUUID(),
      keywords: [],
      response: "",
      order: items.length + 1,
      active: true,
    };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
  };

  const updateItem = (id: string, patch: Partial<KnowledgeItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/30 text-sm">Carregando configuração…</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Atendente Virtual
        </p>
        <h1 className="text-2xl font-bold text-white">Configuração da Vela</h1>
        <p className="text-white/40 text-sm mt-1">
          As respostas editadas aqui serão lidas pela Vela na landing page em tempo real.
        </p>
      </div>

      {/* Configurações gerais */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">
          Configurações gerais
        </h2>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Saudação automática (aparece após 3s)
          </label>
          <textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 resize-none focus:outline-none focus:border-[#5DD3A8]/40"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Resposta padrão (quando não há match)
          </label>
          <textarea
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 resize-none focus:outline-none focus:border-[#5DD3A8]/40"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Palavras-chave de conversão (disparam captura de lead, separadas por vírgula)
          </label>
          <input
            type="text"
            value={conversionKw}
            onChange={(e) => setConversionKw(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#5DD3A8]/40"
          />
        </div>
      </div>

      {/* Knowledge base */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">
            Base de conhecimento ({items.length} respostas)
          </h2>
          <button
            onClick={addItem}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#5DD3A8]/15 text-[#5DD3A8] hover:bg-[#5DD3A8]/25 transition-colors"
          >
            + Nova resposta
          </button>
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-white/5 border rounded-xl p-4 transition-all ${
              editingId === item.id ? "border-[#5DD3A8]/30" : "border-white/8"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] text-white/40 mb-1 uppercase tracking-wide">
                  Palavras-chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={item.keywords.join(", ")}
                  onChange={(e) =>
                    updateItem(item.id, {
                      keywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    })
                  }
                  onFocus={() => setEditingId(item.id)}
                  placeholder="ex: lei, 15377, obrigação"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#5DD3A8]/40"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <button
                  onClick={() => updateItem(item.id, { active: !item.active })}
                  className={`text-[10px] px-2 py-1 rounded border ${
                    item.active
                      ? "border-[#5DD3A8]/30 text-[#5DD3A8]/70"
                      : "border-white/15 text-white/30"
                  }`}
                  title={item.active ? "Ativo" : "Inativo"}
                >
                  {item.active ? "● Ativo" : "○ Inativo"}
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-white/25 hover:text-red-400 transition-colors text-xs px-2 py-1"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 mb-1 uppercase tracking-wide">
                Resposta
              </label>
              <textarea
                value={item.response}
                onChange={(e) => updateItem(item.id, { response: e.target.value })}
                onFocus={() => setEditingId(item.id)}
                rows={3}
                placeholder="Escreva a resposta que a Vela dará quando detectar essas palavras-chave…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 resize-none focus:outline-none focus:border-[#5DD3A8]/40"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pb-8">
        {saved && <span className="text-xs text-[#5DD3A8]">&#10003; Configuração salva</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#5DD3A8] text-[#0B2545] disabled:opacity-50 hover:bg-[#4BC495] transition-colors"
        >
          {saving ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}
