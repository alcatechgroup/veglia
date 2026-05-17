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
];

export const DECISOES_PENDENTES: Decisao[] = [
  { num: "P03", decisao: "Captação seed: T2 ou T3?", recomendacao: "T3 com MRR provado", owner: "CEO", deadline: "Sem 4", status: "pendente" },
  { num: "P05", decisao: "Produção audiovisual: interna ou freelance?", recomendacao: "Freelance dedicado R$ 25–35k pelos 12 vídeos", owner: "CEO", deadline: "Sem 1", status: "pendente" },
  { num: "P06", decisao: "Term sheet: incluir ESOP pool 10–15%?", recomendacao: "Sim (preparar para captação T3)", owner: "Sociedade", deadline: "Sem 2", status: "pendente" },
];
