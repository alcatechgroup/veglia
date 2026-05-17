export interface CheckItem {
  id: string;
  label: string;
  frente: "CEO" | "Dev" | "Comunicacao" | "Conteudo";
  defaultDone?: boolean;
}

export const SPRINT_ITEMS: CheckItem[] = [
  // ── CEO ──────────────────────────────────────────────────────────────────────
  { id: "ceo-01", label: "Registrar domínio vegl.ia", frente: "CEO", defaultDone: true },
  { id: "ceo-02", label: "Registrar domínio veglia.com.br", frente: "CEO", defaultDone: true },
  { id: "ceo-03", label: "Call exploratória com VR realizada", frente: "CEO", defaultDone: true },
  { id: "ceo-04", label: "Ativar Firebase Blaze (Cloud Functions)", frente: "CEO", defaultDone: true },
  { id: "ceo-05", label: "Contratar dev React/Firebase PJ", frente: "CEO" },
  { id: "ceo-06", label: "Contratar produtor audiovisual freelance", frente: "CEO" },
  { id: "ceo-07", label: "Agendar reunião de apresentação VR", frente: "CEO" },

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
  { id: "dev-11", label: "Firestore Rules multi-tenant", frente: "Dev", defaultDone: true },
  { id: "dev-12", label: "Deploy em produção (veglia-6e734.web.app)", frente: "Dev", defaultDone: true },
  { id: "dev-13", label: "Seed de demo (empresa + 6 usuários)", frente: "Dev", defaultDone: true },
  { id: "dev-14", label: "Integração OneDrive → Firebase documentada", frente: "Dev", defaultDone: true },
  { id: "dev-15", label: "Cloud Functions: syncUserClaims, createCompany, acceptInvite, generateCertificate, sendInviteEmail", frente: "Dev", defaultDone: true },
  { id: "dev-16", label: "PDF do certificado com SHA-256 + Storage (pdf-lib)", frente: "Dev", defaultDone: true },
  { id: "dev-17", label: "Tela /app/convites — gestão de convites + QR Code", frente: "Dev", defaultDone: true },
  { id: "dev-18", label: "Tela /app/relatorio — compliance exportável em CSV", frente: "Dev", defaultDone: true },
  { id: "dev-19", label: "hook useComplianceData — join users+enrollments+invites", frente: "Dev", defaultDone: true },
  { id: "dev-20", label: "sendInviteEmail com identidade visual Vegl.ia (Ethereal/SMTP)", frente: "Dev", defaultDone: true },
  { id: "dev-21", label: "Custom domain app.vegl.ia", frente: "Dev" },
  { id: "dev-22", label: "Deploy Cloud Functions no Firebase", frente: "Dev", defaultDone: true },
  { id: "dev-23", label: "Painel RH — TrilhasRH (/app/trilhas-rh) com player YouTube privado", frente: "Dev", defaultDone: true },
  { id: "dev-24", label: "Painel RH — Calendário Vacinal Corporativo (/app/calendario-vacinal)", frente: "Dev", defaultDone: true },
  { id: "dev-25", label: "Painel RH — Solicitação In-Company VaciVitta (/app/in-company)", frente: "Dev", defaultDone: true },
  { id: "dev-26", label: "Deck de pitch VR em HTML no Admin (/admin/pitch) + export PDF", frente: "Dev", defaultDone: true },
  { id: "dev-27", label: "Correção de imagens da landing page no Admin (caminho imagens/ → /images/)", frente: "Dev", defaultDone: true },
  { id: "dev-28", label: "Validação UX + testes — 5 bugs corrigidos (Fragment key, tooltip, aria, data min, Safari CSV)", frente: "Dev", defaultDone: true },

  // ── Comunicação ───────────────────────────────────────────────────────────────
  { id: "com-01", label: "Landing page institucional no ar (veglia.com.br)", frente: "Comunicacao" },
  { id: "com-02", label: "Perfil LinkedIn Page Vegl.ia criado", frente: "Comunicacao" },
  { id: "com-03", label: "Perfil Instagram @vegl.ia criado", frente: "Comunicacao" },
  { id: "com-04", label: "4 posts LinkedIn publicados", frente: "Comunicacao" },
  { id: "com-05", label: "4 carrosséis Instagram publicados", frente: "Comunicacao" },
  { id: "com-06", label: "Deck de pitch VR finalizado", frente: "Comunicacao", defaultDone: true },

  // ── Conteúdo ──────────────────────────────────────────────────────────────────
  { id: "cnt-01", label: "6 roteiros percurso Colaborador escritos (Lei 15.377 + NR-1)", frente: "Conteudo", defaultDone: true },
  { id: "cnt-02", label: "6 roteiros percurso Gestor de RH escritos (Lei 15.377 + NR-1)", frente: "Conteudo", defaultDone: true },
  { id: "cnt-03", label: "Dra. Amanda valida roteiros Colaborador (4 Lei + 2 NR-1)", frente: "Conteudo" },
  { id: "cnt-04", label: "Dra. Amanda valida roteiros Gestor de RH", frente: "Conteudo" },
  { id: "cnt-05", label: "1º vídeo educacional gravado com Dra. Amanda", frente: "Conteudo" },
];

export const FRENTES = {
  CEO: { label: "CEO · Rodolfo", color: "bg-champagne/20 text-champagne border-champagne/30" },
  Dev: { label: "Dev · Técnico", color: "bg-mint/15 text-mint-deep border-mint/30" },
  Comunicacao: { label: "Comunicação", color: "bg-sky/30 text-mid-blue border-sky" },
  Conteudo: { label: "Conteúdo · Dra. Amanda", color: "bg-purple-100 text-purple-700 border-purple-200" },
};
