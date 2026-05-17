export type FeatureStatus = "done" | "in-progress" | "planned";

export interface Feature {
  code: string;
  name: string;
  description: string;
  phase: "T1" | "T2" | "T3" | "T4";
  status: FeatureStatus;
  doc?: string; // filename em docs/product/
}

export const FEATURES: Feature[] = [
  // ── T1 · MVP ───────────────────────────────────────────────────────────────
  {
    code: "F01",
    name: "Plataforma de Compliance em Saúde",
    description: "Auth multi-tenant, onboarding de empresa, isolamento por company_id",
    phase: "T1",
    status: "in-progress",
    doc: "Plataforma de Compliance em Saúde.docx",
  },
  {
    code: "F02",
    name: "Diagnóstico Preventivo Inicial",
    description: "Questionário de risco com score e recomendação de trilha. Freemium.",
    phase: "T1",
    status: "planned",
    doc: "Diagnóstico Preventivo Inicial.docx",
  },
  {
    code: "F03",
    name: "Trilha Educacional Lei 15.377",
    description: "4 módulos em vídeo + quiz. Conteúdo escrito, aguarda produção audiovisual.",
    phase: "T1",
    status: "planned",
    doc: "Plataforma de Compliance em Saúde.docx",
  },
  {
    code: "F04",
    name: "Calculadora de Calendário Vacinal",
    description: "Calendário SBIm 2026/27 integrado. Freemium, motor de aquisição.",
    phase: "T1",
    status: "planned",
    doc: "Calculadora Inteligente de Calendário Vacinal.docx",
  },
  {
    code: "F05",
    name: "Certificação para Empresas",
    description: "PDF com hash SHA-256, gerado por Cloud Function após trilha concluída.",
    phase: "T1",
    status: "planned",
    doc: "Certificação para Empresas.docx",
  },
  {
    code: "F06",
    name: "Dashboard RH",
    description: "Visão gerencial: % compliance, lista de colaboradores, download de certificados.",
    phase: "T1",
    status: "planned",
    doc: "Plataforma de Compliance em Saúde.docx",
  },
  // ── T2 · Diferenciação ────────────────────────────────────────────────────
  {
    code: "F07",
    name: "Canal de Conteúdo Médico Autoritativo",
    description: "Feed curado com validação Dra. Amanda. Artigos, vídeos e recomendações.",
    phase: "T2",
    status: "planned",
    doc: "Canal de Conteúdo Médico Autoritativo.docx",
  },
  {
    code: "F08",
    name: "Jornadas de Vida",
    description: "Trilhas personalizadas por perfil (gestante, 40+, pediatria).",
    phase: "T2",
    status: "planned",
    doc: "Jornadas de Vida.docx",
  },
  {
    code: "F09",
    name: "Gamificação Corporativa",
    description: "Pontos, badges e ranking por empresa. Engajamento contínuo.",
    phase: "T2",
    status: "planned",
    doc: "Gamificação Corporativa.docx",
  },
  {
    code: "F10",
    name: "Motor de Campanhas Inteligentes",
    description: "Lembretes automáticos de vacinas, check-ups e datas sazonais.",
    phase: "T2",
    status: "planned",
    doc: "Motor de Campanhas Inteligentes.docx",
  },
  {
    code: "F11",
    name: 'Modo "SIPAT Automática"',
    description: "Geração automática de pauta e material para SIPAT anual.",
    phase: "T2",
    status: "planned",
    doc: 'Modo "SIPAT Automática".docx',
  },
  {
    code: "F12",
    name: "Universidade Corporativa White Label",
    description: "Trilhas customizadas por empresa com branding próprio.",
    phase: "T2",
    status: "planned",
    doc: "Universidade Corporativa White Label.docx",
  },
  {
    code: "F13",
    name: "Passaporte de Saúde Digital",
    description: "Carteira digital do colaborador com histórico vacinal e check-ups.",
    phase: "T2",
    status: "planned",
    doc: "Passaporte de Saúde Digital.docx",
  },
  {
    code: "F14",
    name: "IA Preventiva Personalizada",
    description: "Recomendações por IA baseadas no perfil de saúde do colaborador.",
    phase: "T2",
    status: "planned",
    doc: "IA Preventiva Personalizada.docx",
  },
  // ── T3 · Escala ───────────────────────────────────────────────────────────
  {
    code: "F15",
    name: "Índice de Saúde Preventiva Corporativa",
    description: "Score de saúde da empresa para benchmarking de mercado.",
    phase: "T3",
    status: "planned",
    doc: "Índice de Saúde Preventiva Corporativa.docx",
  },
  {
    code: "F16",
    name: "Central de Saúde Familiar",
    description: "Extensão B2C: dependentes do colaborador na mesma plataforma.",
    phase: "T3",
    status: "planned",
    doc: "Central de Saúde Familiar.docx",
  },
  {
    code: "F17",
    name: "Concierge Preventiva Digital",
    description: "Agendamento e orientação de serviços de saúde via plataforma.",
    phase: "T3",
    status: "planned",
    doc: "Concierge Preventiva Digital.docx",
  },
  {
    code: "F18",
    name: "Marketplace de Saúde",
    description: "Clínicas, laboratórios e fornecedores no ecossistema Vegl.ia.",
    phase: "T3",
    status: "planned",
    doc: "Marketplace de Saúde.docx",
  },
  {
    code: "F19",
    name: "Ecossistema de Benefícios Preventivos",
    description: "Integração com VR, Alelo, Ticket e outros carriers de benefício.",
    phase: "T3",
    status: "planned",
    doc: "Ecossistema de Benefícios Preventivos.docx",
  },
  // ── T4 · Moat ─────────────────────────────────────────────────────────────
  {
    code: "F20",
    name: "Plataforma de Dados Epidemiológicos",
    description: "Inteligência coletiva anônima por setor/região para insights de mercado.",
    phase: "T4",
    status: "planned",
    doc: "Plataforma de Dados Epidemiológicos.docx",
  },
  {
    code: "F21",
    name: "Plataforma de Expansão Física Inteligente",
    description: "Mapeamento geográfico de demanda para abertura de clínicas Vacivitta.",
    phase: "T4",
    status: "planned",
    doc: "Plataforma de Expansão Física Inteligente.docx",
  },
  {
    code: "F22",
    name: "Plataforma Multi-Saúde",
    description: "Hub integrado de todos os verticais de saúde do ecossistema.",
    phase: "T4",
    status: "planned",
    doc: "PLATAFORMA MULTI-SAÚDE.docx",
  },
];

export const PHASES = {
  T1: { label: "T1 · MVP · Fundação", months: "Meses 1–3", mrr: "R$ 35k", empresas: "50" },
  T2: { label: "T2 · Diferenciação", months: "Meses 4–6", mrr: "R$ 120k", empresas: "150" },
  T3: { label: "T3 · Escala", months: "Meses 7–9", mrr: "R$ 350k", empresas: "400" },
  T4: { label: "T4 · Moat", months: "Meses 10–12+", mrr: "R$ 900k+", empresas: "1.000+" },
};
