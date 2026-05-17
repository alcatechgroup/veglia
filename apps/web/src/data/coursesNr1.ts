import type { CourseModule } from "@veglia/shared";

// ─── NR-1 Course data ─────────────────────────────────────────────────────────
// videoId "dQw4w9WgXcQ" é placeholder até os vídeos da Dra. Amanda ficarem prontos.
// Para substituir: trocar apenas o campo videoId de cada módulo.

export const NR1_MODULES: CourseModule[] = [
  {
    id: "nr1-m01",
    title: "O que é a NR-1 e por que importa",
    videoId: "dQw4w9WgXcQ",
    order: 1,
    quizQuestions: [
      {
        id: "q1",
        text: "O que significa GRO na NR-1?",
        options: [
          "Gestão de Riscos Ocupacionais",
          "Grupo de Regulação Operacional",
          "Gerenciamento de Recursos Organizacionais",
          "Guia de Registro Oficial",
        ],
        correctIndex: 0,
      },
      {
        id: "q2",
        text: "A NR-1 revisada tornou obrigatório o gerenciamento de qual tipo de risco?",
        options: [
          "Risco físico",
          "Risco químico",
          "Risco psicossocial",
          "Risco biológico",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        text: "O PGR é um documento obrigatório para empresas com quantos funcionários?",
        options: [
          "Acima de 500",
          "Acima de 100",
          "Todas as empresas",
          "Acima de 50",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "nr1-m02",
    title: "GRO, PGR e seus direitos",
    videoId: "dQw4w9WgXcQ",
    order: 2,
    quizQuestions: [
      {
        id: "q1",
        text: "O PGR deve ser revisado com qual frequência mínima?",
        options: [
          "A cada 5 anos",
          "A cada 2 anos",
          "Anualmente",
          "Apenas quando houver acidente",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        text: "Qual é o papel do trabalhador no GRO?",
        options: [
          "Nenhum, é responsabilidade do RH",
          "Participar da identificação de riscos",
          "Apenas assinar o documento",
          "Fiscalizar a empresa",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        text: "Riscos psicossociais incluem:",
        options: [
          "Apenas assédio moral",
          "Apenas estresse",
          "Sobrecarga, assédio, violência e organizacionais",
          "Apenas burnout",
        ],
        correctIndex: 2,
      },
    ],
  },
];

export const NR1_COURSE_ID = "nr-1";
export const NR1_COURSE_TITLE = "NR-1: Gestão de Riscos Ocupacionais";
export const NR1_PASSING_SCORE = 70; // %
