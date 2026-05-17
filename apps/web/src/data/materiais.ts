export type MaterialTag = "estratégia" | "design" | "produto" | "conteúdo" | "comunicação" | "operações";

export interface Material {
  id: string;
  title: string;
  description: string;
  tag: MaterialTag;
  path: string; // relativo a /project-docs
  type: "html" | "pdf" | "docx" | "md";
}

export const MATERIAIS: Material[] = [
  // Estratégia
  {
    id: "str-01",
    title: "Roadmap Estratégico de Produto",
    description: "Documento mestre com 22 features, 4 fases e projeções de MRR.",
    tag: "estratégia",
    path: "strategy/01-roadmap-estrategico-produto.pdf",
    type: "pdf",
  },
  {
    id: "str-02",
    title: "Briefing · Tese Expandida",
    description: "Visão completa da plataforma: posicionamento, mercado e modelo.",
    tag: "estratégia",
    path: "strategy/02-briefing-tese-expandida.html",
    type: "html",
  },
  {
    id: "str-03",
    title: "Roadmap Operacional 30 Dias",
    description: "Sprint 1 detalhado por frente: CEO, Dev, Comunicação e Conteúdo.",
    tag: "estratégia",
    path: "strategy/03-roadmap-operacional-30dias.html",
    type: "html",
  },
  {
    id: "str-04",
    title: "Arquitetura do Protótipo",
    description: "Stack técnica, decisões de arquitetura e próximos passos.",
    tag: "estratégia",
    path: "strategy/04-arquitetura-prototipo.html",
    type: "html",
  },
  {
    id: "str-07",
    title: "Tese de Monetização Vacivitta",
    description: "Modelo de receita, GTM e projeções financeiras.",
    tag: "estratégia",
    path: "strategy/07-tese-monetizacao-vacivitta.html",
    type: "html",
  },
  // Design
  {
    id: "des-01",
    title: "Brandbook Vegl.ia",
    description: "Paleta Twilight/Mint/Champagne, tipografia, logotipo e aplicações.",
    tag: "design",
    path: "design/01-brandbook.html",
    type: "html",
  },
  {
    id: "des-02",
    title: "Iconografia Linecraft",
    description: "Sistema de ícones 1.5px com geometria circular. Guia de uso.",
    tag: "design",
    path: "design/02-iconografia-linecraft.html",
    type: "html",
  },
  {
    id: "des-03",
    title: "Hero · Neuracore",
    description: "Seção hero da landing page com conceito visual Neuracore.",
    tag: "design",
    path: "design/03-hero-neuracore.html",
    type: "html",
  },
  {
    id: "des-04",
    title: "Landing Page Completa",
    description: "Versão completa da landing page institucional veglia.com.br.",
    tag: "design",
    path: "design/04-landing-page-completa.html",
    type: "html",
  },
  {
    id: "des-05",
    title: "MVP App + Pedagogia",
    description: "Design do app e arquitetura pedagógica das trilhas educacionais.",
    tag: "design",
    path: "design/05-mvp-app-pedagogia.html",
    type: "html",
  },
  {
    id: "des-07",
    title: "VaciVitta · Símbolo de Marca",
    description: "Rebranding VaciVitta: V duplo em mint, logotipo e aplicações.",
    tag: "design",
    path: "design/07-vacivitta-simbolo-marca.html",
    type: "html",
  },
  // Design — Landing
  {
    id: "des-08",
    title: "Landing Page v2 · Definitiva",
    description: "Landing page B2B completa: hero Lei 15.377, como funciona, Vacivitta, planos, FAQ e formulário de lead.",
    tag: "design",
    path: "design/08-landing-page-v2.html",
    type: "html",
  },
  // Comunicação
  {
    id: "com-01",
    title: "Manifesto · Posts LinkedIn/Instagram",
    description: "Voz da marca, posts formatados e calendário editorial.",
    tag: "comunicação",
    path: "communication/01-manifesto-posts.md",
    type: "md",
  },
];

export const TAG_COLORS: Record<MaterialTag, string> = {
  estratégia: "bg-twilight/10 text-twilight border-twilight/20",
  design: "bg-mint/15 text-mint-deep border-mint/30",
  produto: "bg-champagne/15 text-champagne border-champagne/30",
  conteúdo: "bg-purple-100 text-purple-700 border-purple-200",
  comunicação: "bg-sky/30 text-mid-blue border-sky",
  operações: "bg-orange-100 text-orange-700 border-orange-200",
};
