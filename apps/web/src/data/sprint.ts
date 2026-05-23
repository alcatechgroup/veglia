export interface CheckItem {
  id: string;
  label: string;
  frente: "CEO" | "Dev" | "Comunicacao" | "Conteudo";
  defaultDone?: boolean;
  tag?: string; // optional badge: "novo", "hoje", "urgente"
}

export const SPRINT_ITEMS: CheckItem[] = [
  // ── CEO ──────────────────────────────────────────────────────────────────────
  { id: "ceo-01", label: "Registrar domínio vegl.ia", frente: "CEO", defaultDone: true },
  { id: "ceo-02", label: "Registrar domínio veglia.com.br", frente: "CEO", defaultDone: true },
  { id: "ceo-03", label: "Call exploratória com VR realizada", frente: "CEO", defaultDone: true },
  { id: "ceo-04", label: "Ativar Firebase Blaze (Cloud Functions)", frente: "CEO", defaultDone: true },
  { id: "ceo-05", label: "Contratar dev React/Firebase PJ", frente: "CEO" },
  { id: "ceo-06", label: "Contratar produtor audiovisual freelance", frente: "CEO" },
  { id: "ceo-07", label: "1ª reunião formal VR agendada (call essa semana)", frente: "CEO", tag: "urgente" },
  { id: "ceo-08", label: "DNS veglia.com.br → Firebase Hosting (configurar)", frente: "CEO", tag: "urgente" },
  { id: "ceo-09", label: "Criar empresa seed no Firestore (demo VR)", frente: "CEO", tag: "urgente" },
  { id: "ceo-10", label: "ANTHROPIC_API_KEY configurada no Secret Manager Firebase", frente: "CEO", defaultDone: true },

  // ── Dev ───────────────────────────────────────────────────────────────────────
  { id: "dev-01", label: "Monorepo + Turbo + CI/CD no ar", frente: "Dev", defaultDone: true },
  { id: "dev-02", label: "Auth multi-tenant + custom claims", frente: "Dev", defaultDone: true },
  { id: "dev-03", label: "Design system Linecraft + Tailwind (CSS variables white label)", frente: "Dev", defaultDone: true },
  { id: "dev-04", label: "VegliaPlayer (YouTube IFrame + tracking Firestore)", frente: "Dev", defaultDone: true },
  { id: "dev-05", label: "Trilha Lei 15.377 completa (4 módulos + quiz + certificado)", frente: "Dev", defaultDone: true },
  { id: "dev-06", label: "Trilha NR-1 completa (2 módulos + quiz)", frente: "Dev", defaultDone: true },
  { id: "dev-07", label: "Dashboard RH MVP (enrollments + compliance real)", frente: "Dev", defaultDone: true },
  { id: "dev-08", label: "Páginas freemium: /diagnostico e /calculadora-vacinal", frente: "Dev", defaultDone: true },
  { id: "dev-09", label: "Página /aceitar-convite (onboarding colaborador)", frente: "Dev", defaultDone: true },
  { id: "dev-10", label: "Admin Command Center (6 seções + Roteiros)", frente: "Dev", defaultDone: true },
  { id: "dev-11", label: "Firestore Rules multi-tenant (9 novas coleções)", frente: "Dev", defaultDone: true },
  { id: "dev-12", label: "Deploy em produção (veglia-6e734.web.app)", frente: "Dev", defaultDone: true },
  { id: "dev-13", label: "Seed de demo (empresa + 6 usuários)", frente: "Dev", defaultDone: true },
  { id: "dev-14", label: "Integração OneDrive → Firebase (Power Automate + Widget Admin)", frente: "Dev", defaultDone: true },
  { id: "dev-15", label: "Cloud Functions: syncUserClaims, createCompany, acceptInvite, generateCertificate, sendInviteEmail", frente: "Dev", defaultDone: true },
  { id: "dev-16", label: "PDF do certificado com SHA-256 + Storage (pdf-lib)", frente: "Dev", defaultDone: true },
  { id: "dev-17", label: "Tela /app/convites — gestão de convites + QR Code", frente: "Dev", defaultDone: true },
  { id: "dev-18", label: "Tela /app/relatorio — compliance exportável em CSV", frente: "Dev", defaultDone: true },
  { id: "dev-19", label: "hook useComplianceData — join users+enrollments+invites", frente: "Dev", defaultDone: true },
  { id: "dev-20", label: "sendInviteEmail com identidade visual Vegl.ia", frente: "Dev", defaultDone: true },
  { id: "dev-21", label: "Custom domain app.vegl.ia", frente: "Dev" },
  { id: "dev-22", label: "Deploy Cloud Functions (14 functions ativas)", frente: "Dev", defaultDone: true },
  { id: "dev-23", label: "Painel RH — TrilhasRH (/app/trilhas-rh)", frente: "Dev", defaultDone: true },
  { id: "dev-24", label: "Painel RH — Calendário Vacinal Corporativo (/app/calendario-vacinal)", frente: "Dev", defaultDone: true },
  { id: "dev-25", label: "Painel RH — Solicitação In-Company VaciVitta (/app/in-company)", frente: "Dev", defaultDone: true },
  { id: "dev-26", label: "Deck de pitch VR em HTML no Admin (/admin/pitch) + export PDF", frente: "Dev", defaultDone: true },
  { id: "dev-27", label: "Validação UX + testes — 5 bugs corrigidos", frente: "Dev", defaultDone: true },
  // Sprint 2–4: novas telas e Cloud Functions
  { id: "dev-28", label: "F07 Campanhas: /app/campanhas (CRUD + stats)", frente: "Dev", defaultDone: true },
  { id: "dev-29", label: "F08 Jornadas: /app/jornadas (steps + progresso)", frente: "Dev", defaultDone: true },
  { id: "dev-30", label: "F09 Gamificação: /app/conquistas (pontos + badges + level)", frente: "Dev", defaultDone: true },
  { id: "dev-31", label: "F10 Diagnóstico v2: resultados + recomendações IA", frente: "Dev", defaultDone: true },
  { id: "dev-32", label: "F11 Passaporte Vacinal: /app/passaporte (QR + histórico)", frente: "Dev", defaultDone: true },
  { id: "dev-33", label: "F12 ISPC: /app/ispc + /admin/epidemiologia", frente: "Dev", defaultDone: true },
  { id: "dev-34", label: "F13 SIPAT: /admin/sipat (eventos + participantes)", frente: "Dev", defaultDone: true },
  { id: "dev-35", label: "F14 White Label: /admin/white-label (tema + logo + domínio)", frente: "Dev", defaultDone: true },
  { id: "dev-36", label: "F15 Marketplace: /app/marketplace + /admin/marketplace", frente: "Dev", defaultDone: true },
  { id: "dev-37", label: "F16 Canal de Conteúdo: /app/canal + /admin/canal", frente: "Dev", defaultDone: true },
  { id: "dev-38", label: "F18 Notificações: /app/notificacoes (in-app)", frente: "Dev", defaultDone: true },
  { id: "dev-39", label: "F19 Benefícios: /app/beneficios + /admin/beneficios", frente: "Dev", defaultDone: true },
  { id: "dev-40", label: "F21 Dependentes: /app/familia (cadastro + vacinação)", frente: "Dev", defaultDone: true },
  { id: "dev-41", label: "Atendente Vela (chat widget landing page + captura leads)", frente: "Dev", defaultDone: true },
  { id: "dev-42", label: "Kanban Leads (/admin/leads) com drag-and-drop + timeline", frente: "Dev", defaultDone: true },
  { id: "dev-43", label: "IA chatWithVeglia (Claude Anthropic via Secret Manager)", frente: "Dev", defaultDone: true },
  { id: "dev-44", label: "Pricing landing page atualizado (R$29,90 + por-vida)", frente: "Dev", defaultDone: true },
  { id: "dev-45", label: "Git remote migrado para alcatechgroup/veglia", frente: "Dev", defaultDone: true },
  { id: "dev-46", label: "Registrar videoIds Dra. Amanda em /admin/conteudo", frente: "Dev", tag: "hoje" },
  { id: "dev-47", label: "firebase login --reauth + redeploy staging após gravação", frente: "Dev", tag: "hoje" },

  // ── Comunicação ───────────────────────────────────────────────────────────────
  { id: "com-01", label: "Landing page no ar (veglia-6e734.web.app — DNS pendente)", frente: "Comunicacao", defaultDone: true },
  { id: "com-02", label: "Assets LinkedIn criados (logo 400×400, banner, post)", frente: "Comunicacao", defaultDone: true },
  { id: "com-03", label: "Deck comercial Alelo/VR — PDF premium", frente: "Comunicacao", defaultDone: true },
  { id: "com-04", label: "Roteiros slide 11 (CTA final) reescritos", frente: "Comunicacao", defaultDone: true },
  { id: "com-05", label: "Perfil LinkedIn Page Vegl.ia criado", frente: "Comunicacao" },
  { id: "com-06", label: "Perfil Instagram @vegl.ia criado", frente: "Comunicacao" },
  { id: "com-07", label: "4 posts LinkedIn publicados", frente: "Comunicacao" },
  { id: "com-08", label: "4 carrosséis Instagram publicados", frente: "Comunicacao" },

  // ── Conteúdo ──────────────────────────────────────────────────────────────────
  { id: "cnt-01", label: "6 roteiros percurso Colaborador escritos (Lei 15.377 + NR-1)", frente: "Conteudo", defaultDone: true },
  { id: "cnt-02", label: "6 roteiros percurso Gestor de RH escritos (Lei 15.377 + NR-1)", frente: "Conteudo", defaultDone: true },
  { id: "cnt-03", label: "Dra. Amanda valida roteiros Colaborador (4 Lei + 2 NR-1)", frente: "Conteudo" },
  { id: "cnt-04", label: "Dra. Amanda valida roteiros Gestor de RH", frente: "Conteudo" },
  { id: "cnt-05", label: "Gravação vídeos com Dra. Amanda (hoje 22/05)", frente: "Conteudo", tag: "hoje" },
  { id: "cnt-06", label: "Edição + upload YouTube canal Não Listado", frente: "Conteudo" },
  { id: "cnt-07", label: "videoIds registrados no /admin/conteudo (Firestore)", frente: "Conteudo" },
];

export const FRENTES = {
  CEO: { label: "CEO · Rodolfo", color: "bg-champagne/20 text-champagne border-champagne/30" },
  Dev: { label: "Dev · Técnico", color: "bg-mint/15 text-mint-deep border-mint/30" },
  Comunicacao: { label: "Comunicação", color: "bg-sky/30 text-mid-blue border-sky" },
  Conteudo: { label: "Conteúdo · Dra. Amanda", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export const SPRINT_META = {
  numero: 1,
  semana: 3,
  totalSemanas: 4,
  inicio: "2026-05-09",
  fim: "2026-06-09",
  objetivo: "Demo MVP funcional para VR + presença pública + Dra. Amanda gravada + 30+ leads",
  proximosMarcos: [
    { data: "22/05 (hoje)", descricao: "Gravação Dra. Amanda — 1º vídeo educacional" },
    { data: "Esta semana", descricao: "Call 1ª reunião formal com VR" },
    { data: "Pendente", descricao: "DNS veglia.com.br → Firebase Hosting" },
    { data: "Sem 4", descricao: "Demo MVP ao vivo para VR" },
  ],
};
