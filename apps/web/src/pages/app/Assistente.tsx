import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: number;
}

// ─── Sugestoes iniciais ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Quais vacinas preciso tomar em 2026?",
  "O que a Lei 15.377 exige da minha empresa?",
  "Como melhorar meu score de saude?",
  "O que e NR-1 e como me afeta?",
];

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Assistente() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega histórico de mensagens
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "ai_chats", uid, "messages"),
      orderBy("created_at", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
        );
        setLoadingHistory(false);
      },
      () => setLoadingHistory(false)
    );
    return unsub;
  }, [uid]);

  // Auto-scroll para o final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const functions = getFunctions(app, "southamerica-east1");
      const chat = httpsCallable<{ message: string }, { response: string }>(
        functions,
        "chatWithVeglia"
      );
      await chat({ message: text.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar mensagem";
      if (msg.includes("não configurado")) {
        setError("O assistente IA ainda nao esta configurado neste ambiente. Configure ANTHROPIC_API_KEY nas Cloud Functions.");
      } else if (msg.includes("Limite")) {
        setError("Limite diario de mensagens atingido. Tente novamente amanha.");
      } else {
        setError("Erro ao enviar mensagem. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assistente Vegl.ia</h1>
          <p className="text-sm text-white/40 mt-0.5">
            IA preventiva validada pela Dra. Amanda Conde
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-3 py-2">
          <div className="w-1.5 h-1.5 bg-[#5DD3A8] rounded-full animate-pulse" />
          <span className="text-xs font-medium text-[#5DD3A8]">Ativo</span>
        </div>
      </div>

      {/* Area de chat */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#5DD3A8] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-6 py-4">
              {/* Mensagem de boas-vindas */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#5DD3A8]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#5DD3A8] text-sm">◎</span>
                </div>
                <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 max-w-md">
                  <p className="text-sm text-white/80">
                    Ola! Sou a Vegl.ia IA, seu assistente de saude preventiva.
                    Posso ajudar com duvidas sobre vacinacao, Lei 15.377, NR-1, compliance
                    e saude no trabalho.
                  </p>
                  <p className="text-xs text-white/30 mt-2">
                    Lembre: para diagnosticos individuais, consulte sempre um medico.
                  </p>
                </div>
              </div>

              {/* Sugestoes */}
              <div>
                <p className="text-xs text-white/30 mb-3 px-1">Sugestoes para comecar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-[#C9A96E]/20"
                      : "bg-[#5DD3A8]/20"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      msg.role === "user" ? "text-[#C9A96E]" : "text-[#5DD3A8]"
                    }`}
                  >
                    {msg.role === "user" ? "◑" : "◎"}
                  </span>
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl max-w-lg ${
                    msg.role === "user"
                      ? "bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-tr-none"
                      : "bg-white/5 rounded-tl-none"
                  }`}
                >
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p className="text-[10px] text-white/20 mt-1.5">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#5DD3A8]/20 flex items-center justify-center shrink-0">
                <span className="text-[#5DD3A8] text-sm">◎</span>
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Pergunte sobre saude preventiva, vacinacao, compliance..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? "..." : "→"}
            </button>
          </form>
          <p className="text-[10px] text-white/20 mt-2 text-center">
            Nao substitui consulta medica · Duvidas clinicas: procure seu medico
          </p>
        </div>
      </div>
    </div>
  );
}
