# Vegl.ia · Command Center

> **Sistema operacional preventivo corporativo do Brasil.**
> Powered by Vacivitta · Construído via RRevela · Plataforma tripartite.

Este é o repositório master do projeto Vegl.ia. Todos os documentos estratégicos, operacionais, de design, conteúdo educacional e código convivem aqui. Este CLAUDE.md é a memória de longo prazo do projeto — leia primeiro antes de qualquer trabalho.

---

## 1. Contexto rápido

**O que é a Vegl.ia.** Plataforma B2B de Compliance Preventivo Corporativo ancorada na Lei 15.377/2026. Não é uma edtech — é a infraestrutura de um ecossistema operacional de prevenção contínua, combinando healthtech + edtech + IA + dados + corporate health + behavioral science.

**Tese expandida.** 22 funcionalidades em 6 camadas, executadas em 4 fases ao longo de 12 meses. MRR projetado: R$ 35k no T1 → R$ 900k+ no T4. Ver `docs/strategy/01-roadmap-estrategico-produto.pdf` para o documento mestre.

**Estrutura societária.** Tripartite igualitária:
- **Rodolfo Nascimento** (33,33%) — CEO, tech lead, RRevela, Alcatech.ia
- **Fábio** (33,33%) — comercial, relacionamento Top Formaturas (20 anos)
- **Thiago** (33,33%) — Vacivitta, ecossistema operacional

**Autoridade médica.** Dra. Amanda Conde Perez Fernandes — pediatra, neonatologista, nutróloga, membro SBIm, diretora médica Vacivitta. Ativo central da marca para validação técnica e conteúdo.

**Modelo comercial.** GTM White Label B2B2B via HR carriers — VR como âncora, depois Alelo, Ticket, Sólides, TOTVS RH, LG. Setup fee + revenue share. Compliance é a porta de entrada.

---

## 2. Onde estão as coisas

```
veglia-platform/
├── CLAUDE.md                  ← este arquivo (memória do projeto)
├── README.md                  ← guia de uso para novos colaboradores
│
├── .claude/
│   ├── agents/                ← sub-agents especializados (ceo, dev, comunicacao, edu)
│   ├── commands/              ← slash commands customizados (/sprint-status, /briefing-equipe)
│   └── settings/              ← configuração do ambiente
│
├── docs/
│   ├── strategy/              ← roadmap mestre, tese expandida, arquitetura
│   ├── product/               ← spec das 22 funcionalidades (1 .docx por feature)
│   ├── design/                ← brandbook, iconografia, landing, MVP UX
│   ├── communication/         ← manifestos, prompts, copys
│   └── operations/            ← term sheet, decisões societárias, scripts utilitários
│
├── content/
│   ├── lei-15377/             ← 4 módulos educacionais Lei 15.377/2026
│   ├── nr-1/                  ← 2 módulos NR-1 (GRO/PGR + psicossocial)
│   └── roteiros/              ← roteiros de produção audiovisual
│
├── apps/
│   └── web/                   ← React + Vite (Fase 1 MVP)
│
├── packages/
│   ├── ui/                    ← Design system Linecraft
│   ├── shared/                ← Tipos TypeScript, utils
│   ├── firebase-config/       ← Init Firebase
│   └── video-player/          ← VegliaPlayer (YouTube IFrame wrapper)
│
├── functions/                 ← Cloud Functions Node 20
│
├── apps/
│   └── web/
│       └── src/
│           └── hooks/         ← Hooks customizados (useVideoIds, etc.)
│
└── assets/
    ├── images/                ← Fotos do banco (Freepik etc.)
    └── brand/
        ├── (assets gerais)    ← Assets oficiais da marca
        └── linkedin/          ← Logo 400×400, banner 1584×396, post PNG/MD
```

---

## 3. Stack técnica confirmada

**Frontend.** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + design system Linecraft próprio.

**Backend.** Firebase completo:
- **Auth** (Email + Google OAuth + custom claims multi-tenant)
- **Firestore** (NoSQL, isolamento por `company_id`)
- **Storage** (certificados, logos white label, documentos)
- **Hosting** (SPA + custom domains app.vegl.ia)
- **Cloud Functions** (Node 20 — geração de certificado SHA-256, cron de lembretes, OCR)

**Vídeo.** YouTube canal "Não Listado" + IFrame Player API + tracking customizado no Firestore. Custo de banda: zero. Player roda dentro de componente React `VegliaPlayer` — usuário nunca sai da plataforma.

**Repositório.** Monorepo `veglia-platform` no GitHub Organization. Turbo para workspaces. CI/CD via GitHub Actions: deploy automático em PR (staging) e em merge para main (prod).

**Padrões.** TypeScript em tudo. Vitest para testes. Husky + lint-staged em pre-commit. Tailwind via CSS variables para suportar White Label.

---

## 4. Padrões de execução

### Princípios de produto

- **MVP é F01–F06.** Não incluir Gamificação (F09) ou Jornadas (F08) antes da Fase 2. Disciplina narrativa é o que mata projetos ambiciosos.
- **Compliance é a porta de entrada.** Toda decisão de produto pergunta: "isso ajuda a vender o plano de Compliance B2B?"
- **Vacivitta é credibilidade embutida.** Toda landing page, dashboard ou material aparece com selo "Powered by Vacivitta".
- **Dra. Amanda valida.** Nenhum conteúdo educacional sai sem validação dela. Autoridade médica nunca é comprometida por velocidade.

### Princípios de código

- **Multi-tenant por padrão.** Todo novo documento Firestore precisa de `company_id` e Security Rules que isolem por custom claim.
- **Não usar localStorage para dados sensíveis.** Persistência é Firestore. localStorage só para UI (tema, idioma).
- **Cloud Functions são o backend de regra de negócio.** Nada de regra de negócio no client.
- **Vídeos são embedded YouTube, nunca hospedados no Storage.** Custo de banda é proibitivo em escala.

### Princípios de comunicação

- **Voz da marca:** "Quem vela, cuida." — direto, didático, com autoridade médica calorosa.
- **Tom evita jargão técnico.** RH não é dev. Compliance é dor real, não buzzword.
- **Conteúdo público sempre cita Lei 15.377 quando relevante.** É o gatilho de mercado.

---

## 5. Decisões já tomadas

| # | Decisão | Status | Documento |
|---|---|---|---|
| 01 | MVP estrito em F01–F06 | Aprovada 2026-05-09 | docs/strategy/02-briefing-tese-expandida.html |
| 02 | Stack Firebase + GitHub + YouTube embedded | Aprovada 2026-05-09 | docs/strategy/04-arquitetura-prototipo.html |
| 03 | 33,33% × 3 sócios igualitário | Aprovada (term sheet inicial) | docs/operations/ |
| 04 | Tripartite + cláusula de receitas adjacentes | Aprovada (cláusula 07 term sheet) | docs/operations/ |
| 05 | Identidade Vegl.ia (Twilight + Mint + Champagne, V mint, ponto champagne) | Aprovada 2026-05-08 | docs/design/01-brandbook.html |
| 06 | Sistema Linecraft de iconografia (1.5px, geometria circular) | Aprovada 2026-05-08 | docs/design/02-iconografia-linecraft.html |
| 07 | VaciVitta com V duplo em mint (rebranding) | Aprovada 2026-05-09 | docs/design/07-vacivitta-simbolo-marca.html |
| 08 | Repositório GitHub `veglia` criado | Executada 2026-05-09 | github.com/veglia/veglia-platform |
| 09 | Projeto Firebase `veglia` criado | Executada 2026-05-09 | console.firebase.google.com |
| 10 | Firestore criado (database principal) | Executada 2026-05-09 | (database default) |
| 11 | Domínios vegl.ia + veglia.com.br registrados | Executada 2026-05-09 | — |
| 12 | Call exploratória VR realizada — aguardando agenda da 1ª reunião | Executada 2026-05-09 | — |
| 13 | Firebase Blaze ativado (Functions + Storage desbloqueados) | Executada 2026-05-10 | — |
| 14 | Cloud Functions: syncUserClaims, generateCertificate (PDF SHA-256), sendInviteEmail | Executada 2026-05-10 | — |
| 15 | Telas /app/convites (QR Code) e /app/relatorio (CSV) entregues | Executada 2026-05-10 | — |
| 16 | Deck de pitch VR: Canva 10 slides + HTML interativo no Admin + export PDF | Executada 2026-05-10 | /admin/pitch |
| 17 | Interface RH assinante: TrilhasRH + Calendário Vacinal + In-Company VaciVitta | Executada 2026-05-11 | /app/trilhas-rh · /app/calendario-vacinal · /app/in-company |
| 18 | Validação UX + testes: 5 bugs corrigidos (Fragment key, tooltip, aria, data dinâmica, Safari CSV) | Executada 2026-05-11 | — |
| 19 | Assets LinkedIn criados e exportados como PNG (logo 400×400, banner 1584×396, post imagem 1200×627, post texto MD) | Executada 2026-05-16 | assets/brand/linkedin/ |
| 20 | Botão "Área dos Sócios" removido da landing page | Executada 2026-05-16 | apps/web/public/landing.html |
| 21 | Seção "Quem está construindo" removida da landing page | Executada 2026-05-16 | apps/web/public/landing.html · docs/design/04-landing-page-completa.html |
| 22 | Painel Admin /admin/conteudo criado para atualizar videoIds YouTube sem redeploy | Executada 2026-05-16 | apps/web/src/pages/admin/GerenciarConteudo.tsx |
| 23 | useVideoIds hook: videoIds buscados do Firestore /config/videoIds com fallback hardcoded | Executada 2026-05-16 | apps/web/src/hooks/useVideoIds.ts |
| 24 | VegliaPlayer: previewMode prop adicionada (sem gravar enrollment falso no preview RH) | Executada 2026-05-16 | packages/video-player/src/VegliaPlayer.tsx |
| 25 | VegliaPlayer: tracking contínuo watch_percent_last (poll 5s, threshold 5%) | Executada 2026-05-16 | packages/video-player/src/VegliaPlayer.tsx |
| 26 | Reestruturação de acesso: /acesso (RH clientes CNPJ+email+senha), /login (admin interno), /admin protegido por role=admin | Executada 2026-05-16 | AcessoRH.tsx · App.tsx · Login.tsx |
| 27 | Landing page: botão "Acesso RH" na nav + "Já é cliente?" no hero | Executada 2026-05-16 | apps/web/public/landing.html |
| 28 | firebase.json reestruturado para array multi-site + rewrite /acesso adicionado | Executada 2026-05-16 | firebase.json |
| 29 | Dark/light theme toggle na landing page com persistência localStorage | Executada 2026-05-16 | apps/web/public/landing.html |
| 30 | Deploy Firebase Hosting realizado com sucesso | Executada 2026-05-16 | https://veglia-6e734.web.app |

## 6. Decisões pendentes

| # | Pergunta | Recomendação | Owner | Deadline |
|---|---|---|---|---|
| P03 | Captação seed: T2 ou T3? | **T3** com MRR provado | CEO | Sem 4 |
| P04 | Diagnóstico (F02) e Calculadora (F04) gratuitos? | **Sim, permanentemente** (motor de aquisição) | CEO | Sem 2 |
| P05 | Produção audiovisual: interna ou freelance? | **Freelance dedicado** R$ 25–35k pelos 12 vídeos | CEO | Sem 1 |
| P06 | Term sheet: incluir ESOP pool 10–15%? | **Sim** (preparar para captação T3) | Sociedade | Sem 2 |
| P07 | Ordem de approach: VR / Alelo / Ticket? | **VR primeiro** (relacionamento Rodolfo) | CEO + Fábio | Sem 2 |

---

## 7. Quem faz o quê

| Papel | Responsável | Cobertura |
|---|---|---|
| **CEO / Tech Lead / Estratégia** | Rodolfo | Arquitetura, decisões societárias, captação, autoridade |
| **Comercial / Relacionamento** | Fábio | Pipeline B2B, parcerias com carriers, top formaturas |
| **Operação / Saúde** | Thiago | Integração Vacivitta, autoridade médica, operação |
| **Autoridade médica** | Dra. Amanda | Validação de conteúdo, presença pública, vídeos |
| **Dev frontend/backend** | A contratar (PJ 3m) | Implementação Sprint 1–3 |
| **Produtor audiovisual** | A contratar (freelance 90d) | Gravação dos 12 vídeos roteirizados |
| **Designer (apoio externo)** | Já tem brandbook | Manutenção do design system + telas |
| **Copy** | Rodolfo + apoio | UX writing, posts LinkedIn, pitch decks |

---

## 8. Cronograma macro (12 meses)

| Trimestre | Meses | Foco | Features | KPI alvo |
|---|---|---|---|---|
| **T1 · MVP · Fundação** | 1–3 | Compliance Lei 15.377 | F01, F02, F03, F04, F05, F06 | 50 empresas · 2.000 col. · MRR R$ 35k · NPS >50 |
| **T2 · Diferenciação** | 4–6 | Educação + IA inicial | F07, F08, F09, F10, F11, F12, F13, F14 | 150 empresas · 8k col. · MRR R$ 120k · NPS >60 |
| **T3 · Escala** | 7–9 | B2C + marketplace | F15, F16, F17, F18, F19 | 400 empresas · 25k col. · MRR R$ 350k · NPS >65 |
| **T4 · Moat** | 10–12+ | Dados e IA preditiva | F20, F21, F22 | 1.000+ empresas · 80k+ col. · MRR R$ 900k+ · NPS >70 |

Detalhamento completo em `docs/strategy/01-roadmap-estrategico-produto.pdf`.

---

## 9. Sprint 1 ativo (semanas 1–4 · 09/05–09/06)

**Critério de sucesso final:** demo do MVP funcional para a VR + presença pública construída + Dra. Amanda gravada + 5 reuniões comerciais agendadas + 30+ leads no formulário.

Detalhamento por frente em `docs/strategy/03-roadmap-operacional-30dias.html`.

### Frente CEO (Rodolfo)
- [ ] Aprovar 5 decisões societárias (semana 1)
- [ ] Registrar domínios vegl.ia e veglia.com.br
- [ ] Contratar dev React/Firebase PJ
- [ ] Call exploratória com VR

### Frente Dev (Rodolfo + dev contratado)
- [ ] Setup Firebase Blaze + monorepo + CI/CD
- [ ] Auth multi-tenant + design system Linecraft
- [ ] VegliaPlayer (YouTube IFrame + tracking)
- [ ] Módulo Vacinação ponta a ponta
- [x] Dashboard RH MVP em staging.vegl.ia

### Frente Comunicação
- [x] Landing page institucional no ar (deployada em 16/05 — https://veglia-6e734.web.app)
- [x] Assets LinkedIn criados (logo 400×400, banner 1584×396, post imagem + texto MD)
- [ ] Perfis LinkedIn Page + Instagram @vegl.ia
- [ ] 8 posts publicados (4 LinkedIn + 4 carrosseis IG)
- [ ] Gravação 1º vídeo educacional com Dra. Amanda

---

## 10. URLs da plataforma

| Ambiente | URL | Destino |
|---|---|---|
| Produção | https://veglia-6e734.web.app | Firebase Hosting ativo |
| Landing Page | www.veglia.com.br (pendente DNS) | landing.html |
| Acesso RH | www.veglia.com.br/acesso | Login clientes CNPJ+email+senha |
| Admin interno | www.veglia.com.br/login | Socios/admin role=admin |
| App colaborador | www.veglia.com.br/app/trilhas | Plataforma logada |
| Command Center | www.veglia.com.br/admin | role=admin obrigatório |

---

## 11. Comandos úteis

Use os slash commands abaixo no Claude Code:

- `/sprint-status` — relatório do progresso do sprint atual
- `/briefing-equipe` — gera briefing por agente do xquads
- `/content-semana` — sugere posts da semana para LinkedIn + Instagram
- `/decisao-ceo` — registra uma nova decisão estratégica neste CLAUDE.md
- `/feature-spec [F##]` — abre o spec da feature pelo código (F01–F22)

Ou invoque diretamente os sub-agents:

- `@ceo` — análise estratégica e decisões
- `@dev` — implementação técnica
- `@comunicacao` — copy, posts, marketing
- `@edu` — design instrucional, trilhas educacionais

---

## 12. Princípios não negociáveis

1. **Disciplina sobre as 22 features.** Nada que não esteja no MVP entra no MVP.
2. **Skin in the game sempre.** Sócios primeiro, capital depois.
3. **Vacivitta como marca-mãe.** Vegl.ia nunca aparece desconectada do ecossistema.
4. **Compliance Lei 15.377 é a entrada, não o produto.** A plataforma tem valor intrínseco.
5. **Dra. Amanda valida antes de publicar.** Conteúdo médico nunca é improvisado.
6. **Multi-tenant desde a primeira linha de código.** Não é refactor — é fundamento.

---

**Última atualização:** 2026-05-16 · Fase ativa: T1 MVP · Sprint: Semana 2 de 12.
