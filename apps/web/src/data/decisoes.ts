export interface Decisao {
  num: string;
  decisao: string;
  status: "aprovada" | "pendente" | "executada";
  doc?: string;
  owner?: string;
  deadline?: string;
  recomendacao?: string;
}

export const DECISOES_TOMADAS: Decisao[] = [
  { num: "D01", decisao: "MVP estrito em F01–F06", status: "aprovada", doc: "docs/strategy/02-briefing-tese-expandida.html" },
  { num: "D02", decisao: "Stack Firebase + GitHub + YouTube embedded", status: "aprovada", doc: "docs/strategy/04-arquitetura-prototipo.html" },
  { num: "D03", decisao: "33,33% × 3 sócios igualitário", status: "aprovada" },
  { num: "D04", decisao: "Tripartite + cláusula de receitas adjacentes (cláusula 07)", status: "aprovada" },
  { num: "D05", decisao: "Identidade Vegl.ia: Twilight + Mint + Champagne, V mint, ponto champagne", status: "aprovada", doc: "docs/design/01-brandbook.html" },
  { num: "D06", decisao: "Sistema Linecraft de iconografia (1.5px, geometria circular)", status: "aprovada", doc: "docs/design/02-iconografia-linecraft.html" },
  { num: "D07", decisao: "VaciVitta com V duplo em mint (rebranding)", status: "aprovada", doc: "docs/design/07-vacivitta-simbolo-marca.html" },
  { num: "D08", decisao: "Repositório GitHub veglia/veglia-platform criado", status: "executada" },
  { num: "D09", decisao: "Projeto Firebase veglia-6e734 criado", status: "executada" },
  { num: "D10", decisao: "Firestore criado (database default)", status: "executada" },
  { num: "D11", decisao: "Deploy v1.0 em produção (veglia-6e734.web.app)", status: "executada" },
  { num: "D12", decisao: "Domínios vegl.ia + veglia.com.br registrados", status: "executada" },
  { num: "D13", decisao: "Call exploratória VR realizada", status: "executada" },
  { num: "D14", decisao: "12 roteiros escritos (Colaborador + Gestor de RH)", status: "executada" },
  { num: "D15", decisao: "Firebase Blaze ativado — Functions + Storage desbloqueados", status: "executada" },
  { num: "D16", decisao: "Cloud Functions implementadas: syncUserClaims, generateCertificate (PDF), sendInviteEmail", status: "executada" },
  { num: "D17", decisao: "Telas /app/convites (QR Code) e /app/relatorio (export CSV) entregues", status: "executada" },
  { num: "D18", decisao: "Deck de pitch VR criado — 10 slides, Canva, PDF exportado", status: "executada" },
  { num: "D19", decisao: "Deck de pitch VR em HTML no Admin — navegação por teclado, export PDF e download HTML", status: "executada" },
  { num: "D20", decisao: "Interface RH assinante: TrilhasRH + Calendário Vacinal + In-Company VaciVitta implementadas", status: "executada" },
  { num: "D21", decisao: "Correção imagens landing page Admin (imagens/ → /images/) + fotos sócios com fallback CSS", status: "executada" },
  { num: "D22", decisao: "Conteúdo gravado: 9 módulos / 18 aulas em 4K + 9 PDFs (6 do MVP + 3 de T2)", status: "executada" },
  { num: "D23", decisao: "Dois percursos por módulo (RH/Colaborador): vídeo exibido conforme o papel do usuário", status: "executada" },
  { num: "D24", decisao: "16 videoIds gravados em /config/videoIds (12 MVP + 4 T2)", status: "executada" },
  { num: "D25", decisao: "BUG corrigido: client chamava functions em southamerica-east1; corrigido para us-central1", status: "executada" },
  { num: "D26", decisao: "BUG corrigido: callable (onCall) sem invoker público — 11 functions recriadas (delete+deploy)", status: "executada" },
  { num: "D27", decisao: "createCompany passa a setar role admin_rh (era admin); admin reservado aos sócios", status: "executada" },
  { num: "D28", decisao: "Três portas: /acessorh (RH), /colaborador, /command (time). Aliases /acesso e /login mantidos", status: "executada" },
  { num: "D29", decisao: "Provisionamento SaaS: provisionClient (admin-only) + tela /admin/provisionar com link de senha por e-mail", status: "executada" },
  { num: "D30", decisao: "Empresa 01 de teste (RHHUB) provisionada: RH admin_rh + colaborador", status: "executada" },
  { num: "D31", decisao: "Módulo RH sem mockups: Trilhas, Calendário Vacinal e In-Company ligados a dados reais", status: "executada" },
  { num: "D32", decisao: "Colaborador: Minhas Vacinas (auto-report + atrasadas + solicitar vacina ao RH)", status: "executada" },
  { num: "D33", decisao: "Fluxo das trilhas: galeria de módulos → assistir → quiz (quiz só após visualização)", status: "executada" },
  { num: "D34", decisao: "Hardening da rule users: aceite de convite validado contra convite (anti-escalonamento de privilégio)", status: "executada" },
  { num: "D35", decisao: "Tema clean (light) como padrão do app, sidebar navy para contraste + toggle claro/escuro", status: "executada" },
  { num: "D36", decisao: "Áreas 'Em breve' ocultas do app; Epidemiologia exposta também ao RH", status: "executada" },
];

export const DECISOES_PENDENTES: Decisao[] = [
  { num: "P03", decisao: "Captação seed: T2 ou T3?", recomendacao: "T3 com MRR provado", owner: "CEO", deadline: "Sem 4", status: "pendente" },
  { num: "P06", decisao: "Term sheet: incluir ESOP pool 10–15%?", recomendacao: "Sim (preparar para captação T3)", owner: "Sociedade", deadline: "Sem 2", status: "pendente" },
  { num: "P07", decisao: "Integração WhatsApp: wa.me (sem infra) ou Evolution API?", recomendacao: "Começar com wa.me; Evolution quando houver volume", owner: "CEO", deadline: "Próximo", status: "pendente" },
  { num: "P08", decisao: "SMTP real para e-mails (convite/onboarding saírem do modo demo Ethereal)", recomendacao: "Configurar SMTP corporativo", owner: "Dev", deadline: "Próximo", status: "pendente" },
];
