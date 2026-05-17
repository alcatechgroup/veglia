import type { CourseModule } from "@veglia/shared";

// Dados hardcoded para o MVP — substituir por Firestore na Fase 2
// videoId "dQw4w9WgXcQ" é placeholder até os vídeos da Dra. Amanda ficarem prontos
export const LEI_15377_MODULES: CourseModule[] = [
  {
    id: "m01",
    title: "O que muda com a Lei 15.377",
    videoId: "dQw4w9WgXcQ",
    order: 1,
    quizQuestions: [
      {
        id: "m01q1",
        text: "A Lei 15.377/2026 torna obrigatória para empresas com mais de quantos colaboradores a implementação de programa de saúde preventiva?",
        options: ["10 colaboradores", "20 colaboradores", "50 colaboradores", "100 colaboradores"],
        correctIndex: 1,
      },
      {
        id: "m01q2",
        text: "Qual é o prazo máximo para as empresas se adequarem à Lei 15.377 após sua publicação?",
        options: ["3 meses", "6 meses", "12 meses", "24 meses"],
        correctIndex: 2,
      },
      {
        id: "m01q3",
        text: "Qual órgão fiscaliza o cumprimento da Lei 15.377 nas empresas?",
        options: ["ANVISA", "Ministério do Trabalho e Emprego", "Ministério da Saúde", "CVM"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "m02",
    title: "Obrigações do empregador",
    videoId: "dQw4w9WgXcQ",
    order: 2,
    quizQuestions: [
      {
        id: "m02q1",
        text: "O empregador é obrigado a manter registro de vacinação atualizado de todos os colaboradores?",
        options: ["Sim, para todos os cargos", "Apenas para cargos de risco", "Não, é facultativo", "Apenas para empresas de saúde"],
        correctIndex: 0,
      },
      {
        id: "m02q2",
        text: "O que acontece com a empresa que descumprir as obrigações da Lei 15.377?",
        options: ["Advertência apenas", "Multa e interdição", "Apenas multa administrativa", "Nenhuma sanção prevista"],
        correctIndex: 2,
      },
      {
        id: "m02q3",
        text: "A lei exige que a empresa ofereça campanhas de vacinação com qual frequência mínima?",
        options: ["Mensal", "Trimestral", "Semestral", "Anual"],
        correctIndex: 3,
      },
    ],
  },
  {
    id: "m03",
    title: "Calendário Vacinal SBIm 2026",
    videoId: "dQw4w9WgXcQ",
    order: 3,
    quizQuestions: [
      {
        id: "m03q1",
        text: "Qual vacina é recomendada anualmente pelo calendário SBIm para adultos trabalhadores?",
        options: ["Febre Amarela", "Influenza", "Hepatite A", "Varicela"],
        correctIndex: 1,
      },
      {
        id: "m03q2",
        text: "O reforço de dTpa (difteria, tétano e coqueluche) deve ser realizado a cada:",
        options: ["5 anos", "10 anos", "15 anos", "Dose única"],
        correctIndex: 1,
      },
      {
        id: "m03q3",
        text: "Qual faixa etária tem prioridade na campanha de vacinação contra HPV segundo o SBIm 2026?",
        options: ["0 a 9 anos", "9 a 14 anos", "15 a 26 anos", "27 a 45 anos"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "m04",
    title: "Documentação e auditoria",
    videoId: "dQw4w9WgXcQ",
    order: 4,
    quizQuestions: [
      {
        id: "m04q1",
        text: "Por quanto tempo a empresa deve guardar os registros de vacinação dos colaboradores?",
        options: ["1 ano", "3 anos", "5 anos", "10 anos"],
        correctIndex: 2,
      },
      {
        id: "m04q2",
        text: "O certificado de compliance vacinal emitido pela Vegl.ia possui qual tipo de verificação de autenticidade?",
        options: ["QR Code simples", "Assinatura digital SHA-256", "Carimbo físico", "Registro em cartório"],
        correctIndex: 1,
      },
      {
        id: "m04q3",
        text: "Durante uma auditoria trabalhista, quais documentos comprovam o cumprimento da Lei 15.377?",
        options: [
          "Apenas carteiras de vacinação físicas",
          "Relatório digital com hash de verificação e registros individuais",
          "Declaração verbal do RH",
          "Somente laudo médico",
        ],
        correctIndex: 1,
      },
    ],
  },
];

export const COURSE_ID = "lei-15377";
export const COURSE_TITLE = "Compliance Vacinal — Lei 15.377/2026";
export const PASSING_SCORE = 70; // %
