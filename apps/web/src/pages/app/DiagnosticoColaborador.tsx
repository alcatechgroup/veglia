import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Schema do questionário ───────────────────────────────────────────────────
// Spec F02: 20 perguntas máx, 4 min

interface Question {
  id: string;
  text: string;
  category: "sleep" | "exercise" | "stress" | "smoking" | "alcohol" | "diet" | "vaccine" | "chronic";
  options: string[];
  /** Pontuação subtraída do score (0 = ótimo, 25 = crítico). Escala preventiva: + = melhor. */
  scores: number[];
}

const QUESTIONS: Question[] = [
  {
    id: "q_sleep",
    text: "Com que frequência você dorme 7 ou mais horas por noite?",
    category: "sleep",
    options: ["Quase nunca (menos de 3x/sem)", "Às vezes (3–4x/sem)", "Frequentemente (5–6x/sem)", "Sempre (7 noites/sem)"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_exercise",
    text: "Quantos dias por semana você pratica atividade física moderada ou intensa?",
    category: "exercise",
    options: ["Nunca", "1–2 dias", "3–4 dias", "5 ou mais dias"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_stress",
    text: "Como você avalia seu nível de estresse no trabalho?",
    category: "stress",
    options: ["Muito alto — quase sempre estressado", "Alto — estressado com frequência", "Moderado — gerenciável", "Baixo — raramente estressado"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_smoking",
    text: "Você fuma ou já fumou no último ano?",
    category: "smoking",
    options: ["Sim, fumo atualmente", "Parei há menos de 1 ano", "Não fumo há mais de 1 ano", "Nunca fumei"],
    scores: [0, 40, 70, 100],
  },
  {
    id: "q_alcohol",
    text: "Com que frequência você consume bebida alcoólica?",
    category: "alcohol",
    options: ["Diariamente ou quase", "Algumas vezes por semana", "Ocasionalmente (1–2x/mês)", "Raramente ou nunca"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_diet",
    text: "Como você descreve sua alimentação habitual?",
    category: "diet",
    options: ["Muito desequilibrada (fast food frequente)", "Parcialmente equilibrada", "Equilibrada com deslizes ocasionais", "Saudável e variada"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_vaccine_flu",
    text: "Você tomou a vacina da gripe (Influenza) nos últimos 12 meses?",
    category: "vaccine",
    options: ["Não", "Não lembro", "Sim"],
    scores: [0, 20, 100],
  },
  {
    id: "q_vaccine_covid",
    text: "Seu esquema vacinal contra COVID-19 está atualizado?",
    category: "vaccine",
    options: ["Não tomei nenhuma dose", "Esquema primário incompleto", "Esquema primário completo", "Completo com reforço(s)"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_chronic",
    text: "Você possui alguma doença crônica diagnosticada?",
    category: "chronic",
    options: ["Sim, 2 ou mais condições", "Sim, 1 condição", "Não tenho diagnóstico mas tenho sintomas", "Não"],
    scores: [0, 40, 60, 100],
  },
  {
    id: "q_checkup",
    text: "Com que frequência você realiza check-up médico preventivo?",
    category: "chronic",
    options: ["Nunca realizo", "A cada 3+ anos", "Anualmente", "A cada 6 meses ou menos"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_water",
    text: "Você bebe em média 2 litros de água por dia?",
    category: "diet",
    options: ["Raramente (menos de 1L)", "Às vezes (1–1,5L)", "Frequentemente (1,5–2L)", "Sempre (2L ou mais)"],
    scores: [0, 33, 66, 100],
  },
  {
    id: "q_mental",
    text: "Como está sua saúde mental nas últimas 4 semanas?",
    category: "stress",
    options: ["Muito ruim — sintomas intensos", "Ruim — frequentes dificuldades", "Razoável — dificuldades ocasionais", "Boa ou excelente"],
    scores: [0, 25, 66, 100],
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RiskFlag = "cardiovascular" | "metabolico" | "burnout" | "imunologico";

interface AssessmentResult {
  preventive_score: number;
  classification: "alto_risco" | "atencao" | "bom" | "excelencia";
  risk_flags: RiskFlag[];
  recommendations: Array<{ type: "vaccine" | "habit" | "medical" | "course"; priority: "alta" | "media" | "baixa"; title: string; action: string }>;
}

// ─── Cálculo do score (server-side na Fase 2, client OK para MVP) ─────────────

function computeResult(answers: Record<string, number>): AssessmentResult {
  const scores = QUESTIONS.map((q) => {
    const idx = answers[q.id] ?? -1;
    return idx >= 0 ? q.scores[idx] : 50;
  });

  const preventive_score = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  let classification: AssessmentResult["classification"];
  if (preventive_score >= 91) classification = "excelencia";
  else if (preventive_score >= 71) classification = "bom";
  else if (preventive_score >= 41) classification = "atencao";
  else classification = "alto_risco";

  // Risk flags
  const risk_flags: RiskFlag[] = [];
  const getScore = (id: string) => {
    const q = QUESTIONS.find((q) => q.id === id);
    const idx = answers[id] ?? -1;
    return idx >= 0 && q ? q.scores[idx] : 50;
  };

  // Cardiovascular: exercício baixo + dieta ruim
  if (getScore("q_exercise") < 40 || getScore("q_smoking") < 50) {
    risk_flags.push("cardiovascular");
  }
  // Metabólico: dieta + água + álcool
  if (getScore("q_diet") < 40 && getScore("q_alcohol") < 50) {
    risk_flags.push("metabolico");
  }
  // Burnout: estresse alto + sono ruim
  if (getScore("q_stress") < 40 || getScore("q_mental") < 40) {
    risk_flags.push("burnout");
  }
  // Imunológico: vacinas desatualizadas
  if (getScore("q_vaccine_flu") < 50 || getScore("q_vaccine_covid") < 50) {
    risk_flags.push("imunologico");
  }

  // Recomendações baseadas nos flags e scores
  const recommendations: AssessmentResult["recommendations"] = [];

  if (getScore("q_vaccine_flu") < 50) {
    recommendations.push({
      type: "vaccine",
      priority: "alta",
      title: "Vacina da Influenza",
      action: "Agende sua vacina da gripe anual — obrigatória pela Lei 15.377/2026",
    });
  }
  if (getScore("q_vaccine_covid") < 66) {
    recommendations.push({
      type: "vaccine",
      priority: "alta",
      title: "Vacina COVID-19",
      action: "Complete ou atualize seu esquema vacinal contra COVID-19",
    });
  }
  if (getScore("q_exercise") < 40) {
    recommendations.push({
      type: "habit",
      priority: "alta",
      title: "Atividade física regular",
      action: "Inicie com 30 min de caminhada 3x/semana — reduz risco cardiovascular em 30%",
    });
  }
  if (getScore("q_stress") < 40 || getScore("q_mental") < 40) {
    recommendations.push({
      type: "course",
      priority: "alta",
      title: "Trilha Saúde Mental",
      action: "Complete a trilha de saúde mental na plataforma — 4 módulos, 20 min",
    });
  }
  if (getScore("q_checkup") < 50) {
    recommendations.push({
      type: "medical",
      priority: "media",
      title: "Check-up preventivo",
      action: "Agende um check-up médico anual — identifica riscos precocemente",
    });
  }
  if (getScore("q_sleep") < 50) {
    recommendations.push({
      type: "habit",
      priority: "media",
      title: "Higiene do sono",
      action: "7–9 horas por noite reduzem risco de burnout, obesidade e doenças cardíacas",
    });
  }
  if (getScore("q_diet") < 50) {
    recommendations.push({
      type: "habit",
      priority: "media",
      title: "Alimentação equilibrada",
      action: "Reduza ultraprocessados e aumente frutas/vegetais — meta: 5 porções/dia",
    });
  }

  // Garante mínimo 3 recomendações
  if (recommendations.length < 3) {
    recommendations.push({
      type: "course",
      priority: "baixa",
      title: "Trilha Lei 15.377/2026",
      action: "Conheça seus direitos e obrigações de saúde preventiva no trabalho",
    });
  }

  return { preventive_score, classification, risk_flags, recommendations };
}

// ─── Config visual por classificação ─────────────────────────────────────────

function classConfig(c: AssessmentResult["classification"]) {
  const m = {
    excelencia: { label: "Excelência Preventiva", color: "#5DD3A8", icon: "✦" },
    bom: { label: "Boa Saúde Preventiva", color: "#5DD3A8", icon: "✓" },
    atencao: { label: "Atenção Recomendada", color: "#C9A96E", icon: "⚠" },
    alto_risco: { label: "Alto Risco Preventivo", color: "#ef4444", icon: "✗" },
  };
  return m[c];
}

const FLAG_LABELS: Record<RiskFlag, string> = {
  cardiovascular: "Risco Cardiovascular",
  metabolico: "Risco Metabólico",
  burnout: "Risco de Burnout",
  imunologico: "Proteção Imunológica Baixa",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DiagnosticoColaborador() {
  const { firebaseUser, claims } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "quiz" | "result" | "previous">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [prevResult, setPrevResult] = useState<AssessmentResult & { completed_at: number } | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(true);

  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  // Verificar se já existe assessment anterior
  useEffect(() => {
    if (!uid) { setLoadingPrev(false); return; }
    const ref = doc(db, "health_assessments", uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPrevResult({
          preventive_score: data.preventive_score,
          classification: data.classification,
          risk_flags: data.risk_flags ?? [],
          recommendations: data.recommendations ?? [],
          completed_at: data.completed_at,
        });
        setPhase("previous");
      }
      setLoadingPrev(false);
    });
  }, [uid]);

  const progress = Math.round((currentQ / QUESTIONS.length) * 100);
  const q = QUESTIONS[currentQ];

  const handleAnswer = async (optIdx: number) => {
    const newAnswers = { ...answers, [q.id]: optIdx };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      // Concluiu — calcular e persistir
      const r = computeResult(newAnswers);
      setResult(r);
      setPhase("result");

      if (uid && companyId) {
        const answersFlat: Record<string, string> = {};
        QUESTIONS.forEach((question) => {
          const idx = newAnswers[question.id];
          if (idx !== undefined) {
            answersFlat[question.category] = question.options[idx];
          }
        });

        await setDoc(
          doc(db, "health_assessments", uid),
          {
            company_id: companyId,
            employee_id: uid,
            version: 1,
            completed_at: Date.now(),
            answers: answersFlat,
            risk_flags: r.risk_flags,
            preventive_score: r.preventive_score,
            classification: r.classification,
            recommendations: r.recommendations,
            // Próxima reavaliação: 90 dias
            next_assessment_at: Date.now() + 90 * 24 * 60 * 60 * 1000,
          },
          { merge: true }
        );
      }
    }
  };

  // ── Tela de loading ──────────────────────────────────────────────────────────
  if (loadingPrev) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-white/30 text-sm">Carregando...</p>
      </div>
    );
  }

  // ── Resultado anterior ───────────────────────────────────────────────────────
  if (phase === "previous" && prevResult) {
    const cfg = classConfig(prevResult.classification);
    const nextDate = new Date(prevResult.completed_at + 90 * 24 * 60 * 60 * 1000);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnóstico Preventivo</h1>
          <p className="text-sm text-white/40 mt-0.5">Seu perfil de saúde preventiva</p>
        </div>

        {/* Score card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-6xl font-bold mb-2" style={{ color: cfg.color }}>
            {prevResult.preventive_score}
          </p>
          <p className="text-sm font-semibold mb-1" style={{ color: cfg.color }}>
            {cfg.label}
          </p>
          <p className="text-xs text-white/30">
            Avaliado em {new Date(prevResult.completed_at).toLocaleDateString("pt-BR")} ·
            Próxima: {nextDate.toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Risk flags */}
        {prevResult.risk_flags.length > 0 && (
          <div className="bg-[#C9A96E]/8 border border-[#C9A96E]/20 rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#C9A96E] mb-3 uppercase tracking-wide">
              Alertas identificados
            </p>
            <div className="flex flex-wrap gap-2">
              {prevResult.risk_flags.map((flag) => (
                <span
                  key={flag}
                  className="text-xs bg-[#C9A96E]/15 text-[#C9A96E] px-3 py-1 rounded-full"
                >
                  {FLAG_LABELS[flag]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            Recomendações para você
          </p>
          {prevResult.recommendations.slice(0, 3).map((rec, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3"
            >
              <span className="text-[#5DD3A8] mt-0.5">
                {rec.type === "vaccine" ? "◈" : rec.type === "course" ? "◎" : rec.type === "medical" ? "◇" : "○"}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{rec.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{rec.action}</p>
                <span
                  className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    rec.priority === "alta"
                      ? "bg-red-500/15 text-red-400"
                      : rec.priority === "media"
                      ? "bg-[#C9A96E]/15 text-[#C9A96E]"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  Prioridade {rec.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA refazer */}
        <button
          onClick={() => {
            setPhase("intro");
            setAnswers({});
            setCurrentQ(0);
            setResult(null);
          }}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium py-3 rounded-xl text-sm transition-colors"
        >
          Refazer diagnóstico
        </button>
      </div>
    );
  }

  // ── Intro ────────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnóstico Preventivo</h1>
          <p className="text-sm text-white/40 mt-0.5">Personalize sua jornada de saúde</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-5">
          <div className="text-5xl text-[#5DD3A8]">◇</div>
          <div>
            <h2 className="text-lg font-bold text-white mb-2">
              Avalie seu perfil preventivo
            </h2>
            <p className="text-sm text-white/50 leading-relaxed">
              12 perguntas · menos de 4 minutos · score 0–100 com recomendações personalizadas.
              Avaliação reavaliada automaticamente a cada 90 dias.
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-white/35">
            {["Vacinas", "Hábitos", "Estresse", "Saúde mental"].map((tag) => (
              <span key={tag} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5DD3A8]" />
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => setPhase("quiz")}
            className="w-full bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Iniciar diagnóstico
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progresso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Diagnóstico Preventivo</p>
            <span className="text-xs text-white/30">
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5DD3A8] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pergunta */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
          <p className="text-base font-semibold text-white mb-6 leading-relaxed">
            {q.text}
          </p>
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm border transition-all bg-white/5 border-white/10 text-white/70 hover:bg-[#5DD3A8]/10 hover:border-[#5DD3A8]/30 hover:text-white"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ((p) => p - 1)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            ← Pergunta anterior
          </button>
        )}
      </div>
    );
  }

  // ── Resultado ────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const cfg = classConfig(result.classification);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Seu resultado</h1>
          <p className="text-sm text-white/40 mt-0.5">Diagnóstico Preventivo concluído</p>
        </div>

        {/* Score */}
        <div
          className="rounded-2xl border p-8 text-center"
          style={{
            backgroundColor: `${cfg.color}10`,
            borderColor: `${cfg.color}30`,
          }}
        >
          <div
            className="text-6xl font-bold mb-2"
            style={{ color: cfg.color }}
          >
            {result.preventive_score}
          </div>
          <p className="text-lg font-bold mb-1" style={{ color: cfg.color }}>
            {cfg.label}
          </p>
          <p className="text-xs text-white/40">
            Preventive Health Score — escala 0 a 100
          </p>
        </div>

        {/* Risk flags */}
        {result.risk_flags.length > 0 && (
          <div className="bg-[#C9A96E]/8 border border-[#C9A96E]/20 rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#C9A96E] mb-3 uppercase tracking-wide">
              Áreas de atenção identificadas
            </p>
            <div className="flex flex-wrap gap-2">
              {result.risk_flags.map((flag) => (
                <span
                  key={flag}
                  className="text-xs bg-[#C9A96E]/15 text-[#C9A96E] px-3 py-1 rounded-full"
                >
                  {FLAG_LABELS[flag]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">
            {result.recommendations.length} recomendações personalizadas
          </p>
          {result.recommendations.map((rec, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3"
            >
              <span className="text-[#5DD3A8] mt-0.5 text-lg">
                {rec.type === "vaccine" ? "◈" : rec.type === "course" ? "◎" : rec.type === "medical" ? "◇" : "○"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{rec.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{rec.action}</p>
                {rec.type === "course" && (
                  <button
                    onClick={() => navigate("/app/trilhas")}
                    className="mt-2 text-xs text-[#5DD3A8] hover:underline"
                  >
                    Acessar trilhas →
                  </button>
                )}
                {rec.type === "vaccine" && (
                  <button
                    onClick={() => navigate("/app/calendario-vacinal")}
                    className="mt-2 text-xs text-[#5DD3A8] hover:underline"
                  >
                    Ver calendário vacinal →
                  </button>
                )}
              </div>
              <span
                className={`shrink-0 self-start text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  rec.priority === "alta"
                    ? "bg-red-500/15 text-red-400"
                    : rec.priority === "media"
                    ? "bg-[#C9A96E]/15 text-[#C9A96E]"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {rec.priority === "alta" ? "Alta" : rec.priority === "media" ? "Média" : "Baixa"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/25 text-center">
          Diagnóstico salvo · Reavaliação automática em 90 dias
        </p>
      </div>
    );
  }

  return null;
}
