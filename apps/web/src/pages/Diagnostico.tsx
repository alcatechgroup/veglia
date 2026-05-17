import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Dados do questionário ────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  options: string[];
  weights: number[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Quantos funcionários sua empresa tem?",
    options: ["1–49", "50–100", "101–500", "500+"],
    weights: [0, 1, 2, 3],
  },
  {
    id: "q2",
    text: "Sua empresa já realizou campanha de vacinação?",
    options: ["Nunca", "Uma vez", "Anualmente", "Não sei"],
    weights: [3, 2, 0, 2],
  },
  {
    id: "q3",
    text: "Você conhece a Lei 15.377/2026?",
    options: [
      "Nunca ouvi falar",
      "Já ouvi mas não sei detalhes",
      "Conheço parcialmente",
      "Conheço bem",
    ],
    weights: [3, 2, 1, 0],
  },
  {
    id: "q4",
    text: "Sua empresa tem controle do calendário vacinal dos funcionários?",
    options: [
      "Não tem controle",
      "Controle informal",
      "Planilha própria",
      "Sistema dedicado",
    ],
    weights: [3, 2, 1, 0],
  },
  {
    id: "q5",
    text: "Quantas notificações de saúde ocupacional sua empresa recebeu nos últimos 2 anos?",
    options: ["Nenhuma", "1–2", "3–5", "Mais de 5"],
    weights: [0, 1, 2, 3],
  },
  {
    id: "q6",
    text: "Sua empresa possui SIPAT regularmente?",
    options: [
      "Não realiza",
      "Irregularmente",
      "Anualmente",
      "Semestral ou mais",
    ],
    weights: [2, 1, 0, 0],
  },
  {
    id: "q7",
    text: "Existe algum profissional de saúde ocupacional na empresa?",
    options: [
      "Não",
      "Terceirizado eventual",
      "SESMT parcial",
      "SESMT completo",
    ],
    weights: [2, 1, 1, 0],
  },
  {
    id: "q8",
    text: "Qual é o principal objetivo ao buscar essa ferramenta?",
    options: [
      "Evitar multas",
      "Cuidar dos funcionários",
      "Exigência de cliente/parceiro",
      "Benchmark de mercado",
    ],
    weights: [2, 0, 1, 0],
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RiskLevel = "baixo" | "medio" | "alto";

interface RiskResult {
  level: RiskLevel;
  score: number;
  label: string;
  description: string;
  recommendation: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateRisk(answers: Record<string, number>): RiskResult {
  const score = QUESTIONS.reduce((acc, q) => {
    const idx = answers[q.id];
    return acc + (idx !== undefined ? q.weights[idx] : 0);
  }, 0);

  if (score <= 8) {
    return {
      level: "baixo",
      score,
      label: "Baixo risco",
      description:
        "Sua empresa demonstra maturidade em saúde ocupacional. Ainda assim, a Lei 15.377/2026 exige formalização dos processos.",
      recommendation:
        "Mantenha o programa de compliance ativo e documente tudo para auditorias.",
      color: "#5DD3A8",
      bgColor: "bg-[#5DD3A8]/10",
      borderColor: "border-[#5DD3A8]/30",
    };
  } else if (score <= 14) {
    return {
      level: "medio",
      score,
      label: "Risco moderado",
      description:
        "Há lacunas relevantes no programa de saúde da sua empresa. A Lei 15.377/2026 já está em vigor e sua empresa pode estar exposta a multas.",
      recommendation:
        "Recomendamos iniciar o plano de compliance imediatamente para regularizar a situação antes de uma auditoria.",
      color: "#C9A96E",
      bgColor: "bg-[#C9A96E]/10",
      borderColor: "border-[#C9A96E]/30",
    };
  } else {
    return {
      level: "alto",
      score,
      label: "Alto risco",
      description:
        "Sua empresa apresenta exposição significativa à Lei 15.377/2026. O risco de notificação e multa é elevado.",
      recommendation:
        "Sua empresa precisa iniciar o plano de compliance agora. Nossa equipe pode ajudar em 48h.",
      color: "#ef4444",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    };
  }
}

// ─── Formulário de contato pós-diagnóstico ────────────────────────────────────

interface ContactFormProps {
  score: number;
  riskLevel: RiskLevel;
}

function ContactForm({ score, riskLevel }: ContactFormProps) {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await addDoc(collection(db, "diagnostic_results"), {
        nome: nome.trim(),
        empresa: empresa.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        score,
        risk_level: riskLevel,
        created_at: serverTimestamp(),
        source: "diagnostico_freemium",
      });
      setSubmitted(true);
    } catch {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-[#0B2545]/10 p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="text-[#0B2545] font-semibold text-sm">Recebemos sua solicitação!</p>
        <p className="text-[#0B2545]/50 text-xs mt-1">
          Entraremos em contato em até 24h para agendar sua demo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#0B2545]/10 p-6">
      <h3 className="text-sm font-semibold text-[#0B2545] mb-1">
        Solicitar demo para sua empresa
      </h3>
      <p className="text-xs text-[#0B2545]/50 mb-4">
        Nossa equipe entra em contato em até 24h.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          required
          className="w-full border border-[#0B2545]/15 rounded-xl px-4 py-2.5 text-sm text-[#0B2545] placeholder-[#0B2545]/30 focus:outline-none focus:border-[#5DD3A8] transition-colors"
        />
        <input
          type="text"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Nome da empresa"
          required
          className="w-full border border-[#0B2545]/15 rounded-xl px-4 py-2.5 text-sm text-[#0B2545] placeholder-[#0B2545]/30 focus:outline-none focus:border-[#5DD3A8] transition-colors"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail corporativo"
          required
          className="w-full border border-[#0B2545]/15 rounded-xl px-4 py-2.5 text-sm text-[#0B2545] placeholder-[#0B2545]/30 focus:outline-none focus:border-[#5DD3A8] transition-colors"
        />
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="w-full border border-[#0B2545]/15 rounded-xl px-4 py-2.5 text-sm text-[#0B2545] placeholder-[#0B2545]/30 focus:outline-none focus:border-[#5DD3A8] transition-colors"
        />

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0B2545] hover:bg-[#1A3A5C] disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {submitting ? "Enviando..." : "Solicitar demo gratuita"}
        </button>
      </form>

      <div className="mt-3 text-center">
        <a href="/login" className="text-xs text-[#5DD3A8] hover:underline">
          Já tenho conta, entrar →
        </a>
      </div>
    </div>
  );
}

// ─── Recomendações por nivel de risco ─────────────────────────────────────────

const TRILHA_RECOMMENDATIONS: Record<RiskLevel, Array<{ id: string; label: string; path: string }>> = {
  alto: [
    { id: "lei-15377", label: "Trilha Lei 15.377/2026 — obrigatoria", path: "/app/trilha/lei-15377" },
    { id: "nr-1", label: "Trilha NR-1 — GRO/PGR", path: "/app/trilha/nr-1" },
  ],
  medio: [
    { id: "lei-15377", label: "Trilha Lei 15.377/2026", path: "/app/trilha/lei-15377" },
  ],
  baixo: [
    { id: "nr-1", label: "Trilha NR-1 — manutencao", path: "/app/trilha/nr-1" },
  ],
};

// ─── Diagnóstico principal ────────────────────────────────────────────────────

export default function Diagnostico() {
  const { firebaseUser, claims } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const total = QUESTIONS.length;
  const progress = Math.round((currentQuestion / total) * 100);
  const q = QUESTIONS[currentQuestion];

  const persistResultForLoggedUser = async (result: RiskResult) => {
    const uid = firebaseUser?.uid;
    const companyId = claims?.company_id;
    if (!uid || !companyId) return;

    const scorePercent = Math.round(((24 - result.score) / 24) * 100);
    const recs = TRILHA_RECOMMENDATIONS[result.level].map((r) => r.label);

    await setDoc(
      doc(db, "diagnostic_results", uid),
      {
        user_id: uid,
        company_id: companyId,
        score: scorePercent,
        raw_score: result.score,
        category: result.level === "baixo" ? "high" : result.level === "medio" ? "medium" : "low",
        recommendations: recs,
        completed_at: Date.now(),
        source: "in_app",
      },
      { merge: true }
    );
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = { ...answers, [q.id]: optionIndex };
    setAnswers(newAnswers);

    if (currentQuestion < total - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowResult(true);
      const r = calculateRisk(newAnswers);
      persistResultForLoggedUser(r);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const result = showResult ? calculateRisk(answers) : null;

  return (
    <div className="min-h-screen bg-[#FBF8F1]">
      {/* Header */}
      <header className="border-b border-[#0B2545]/8 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold text-[#0B2545] tracking-tight">Vegl</span>
            <span className="text-xl font-bold text-[#C9A96E]">.</span>
            <span className="text-xl font-bold text-[#5DD3A8]">ia</span>
          </div>
          <span className="text-xs text-[#0B2545]/40">Diagnóstico gratuito</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {!showResult ? (
          <>
            {/* Intro + progresso */}
            <div className="mb-8">
              <p className="text-xs text-[#5DD3A8] font-semibold uppercase tracking-wide mb-2">
                Diagnóstico de risco — Lei 15.377/2026
              </p>
              <h1 className="text-2xl font-bold text-[#0B2545] mb-1">
                Avalie o risco de compliance da sua empresa
              </h1>
              <p className="text-sm text-[#0B2545]/50">
                8 perguntas · resultado imediato e gratuito
              </p>
            </div>

            {/* Barra de progresso */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#0B2545]/40">
                  Pergunta {currentQuestion + 1} de {total}
                </span>
                <span className="text-xs text-[#0B2545]/40">{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#0B2545]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5DD3A8] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Pergunta */}
            <div className="bg-white rounded-2xl border border-[#0B2545]/8 p-7 mb-5 shadow-sm">
              <p className="text-base font-semibold text-[#0B2545] mb-6 leading-relaxed">
                {q.text}
              </p>
              <div className="space-y-2.5">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                      answers[q.id] === idx
                        ? "bg-[#5DD3A8]/10 border-[#5DD3A8]/40 text-[#0B2545] font-medium"
                        : "bg-[#FBF8F1] border-[#0B2545]/10 text-[#0B2545]/70 hover:bg-[#5DD3A8]/5 hover:border-[#5DD3A8]/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegação */}
            {currentQuestion > 0 && (
              <button
                onClick={handleBack}
                className="text-xs text-[#0B2545]/40 hover:text-[#0B2545]/70 transition-colors"
              >
                ← Voltar
              </button>
            )}
          </>
        ) : (
          result && (
            <>
              {/* Resultado */}
              <div className="mb-6">
                <p className="text-xs text-[#5DD3A8] font-semibold uppercase tracking-wide mb-2">
                  Resultado do diagnóstico
                </p>
                <h1 className="text-2xl font-bold text-[#0B2545] mb-6">
                  Diagnóstico concluido
                </h1>
              </div>

              {/* Badge de risco */}
              <div
                className={`rounded-2xl border ${result.bgColor} ${result.borderColor} p-7 mb-5`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ background: `${result.color}20`, color: result.color }}
                  >
                    {result.level === "baixo" ? "✓" : result.level === "medio" ? "!" : "✗"}
                  </div>
                  <div>
                    <p
                      className="text-lg font-bold"
                      style={{ color: result.color }}
                    >
                      {result.label}
                    </p>
                    <p className="text-xs text-[#0B2545]/50">
                      Score: {result.score}/24 pontos
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#0B2545]/70 mb-3">{result.description}</p>
                <p className="text-sm font-medium text-[#0B2545]">
                  {result.recommendation}
                </p>
              </div>

              {/* Recomendacoes de trilhas — apenas para usuarios logados */}
              {firebaseUser && (
                <div className="bg-[#0B2545] rounded-2xl p-6 mb-5">
                  <p className="text-sm font-semibold text-white mb-1">
                    Trilhas recomendadas para voce
                  </p>
                  <p className="text-xs text-white/40 mb-4">
                    Com base no seu diagnostico, priorize estas trilhas:
                  </p>
                  <div className="space-y-2">
                    {TRILHA_RECOMMENDATIONS[result.level].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate(t.path)}
                        className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-left transition-colors"
                      >
                        <span className="text-[#5DD3A8]">◈</span>
                        <span className="text-sm text-white/80">{t.label}</span>
                        <span className="ml-auto text-white/30 text-xs">Iniciar</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário de contato — apenas para nao logados */}
              {!firebaseUser && <ContactForm score={result.score} riskLevel={result.level} />}

              {/* Refazer */}
              <div className="mt-5 text-center">
                <button
                  onClick={() => {
                    setAnswers({});
                    setCurrentQuestion(0);
                    setShowResult(false);
                  }}
                  className="text-xs text-[#0B2545]/40 hover:text-[#0B2545]/70 transition-colors"
                >
                  Refazer diagnóstico
                </button>
              </div>
            </>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-6 pb-8 text-center">
        <p className="text-[10px] text-[#0B2545]/25">
          Powered by <span className="text-[#5DD3A8]/60 font-semibold">VaciVitta</span> ·
          Vegl.ia — Compliance Vacinal Corporativo
        </p>
      </footer>
    </div>
  );
}
