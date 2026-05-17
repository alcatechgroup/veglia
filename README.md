# Vegl.ia — Command Center

> Plataforma de Compliance Preventivo Corporativo. Powered by Vacivitta.

Este é o command center oficial do projeto Vegl.ia. Aqui convivem documentos estratégicos, conteúdo educacional, design system, e o código da plataforma.

---

## Como começar

### 1. Clonar o repositório

```bash
git clone git@github.com:veglia/veglia-platform.git
cd veglia-platform
```

### 2. Abrir no Claude Code

```bash
claude
```

Ou se for VS Code com Claude Code extension:

```bash
code .
```

O CLAUDE.md mestre será carregado automaticamente como contexto persistente do projeto.

### 3. Estrutura de pastas

```
veglia-platform/
├── CLAUDE.md              ← memória do projeto · leia primeiro
├── README.md              ← este arquivo
│
├── .claude/
│   ├── agents/            ← sub-agents @ceo @dev @comunicacao @edu
│   ├── commands/          ← slash commands /sprint-status /briefing-equipe etc
│   └── settings/          ← configuração do ambiente
│
├── docs/
│   ├── strategy/          ← roadmap mestre, tese expandida, arquitetura
│   ├── product/           ← spec das 22 funcionalidades
│   ├── design/            ← brandbook, iconografia, landing
│   ├── communication/     ← manifestos, posts, prompts
│   └── operations/        ← term sheet, decisões societárias
│
├── content/
│   ├── lei-15377/         ← 4 módulos Lei 15.377/2026
│   ├── nr-1/              ← 2 módulos NR-1
│   └── roteiros/          ← roteiros de produção audiovisual
│
├── apps/web/              ← React + Vite (em construção)
├── packages/              ← design system, types, firebase config
├── functions/             ← Cloud Functions
└── assets/                ← imagens e brand
```

---

## Slash commands disponíveis

Use no Claude Code com `/` no início do prompt:

| Comando | O que faz |
|---|---|
| `/sprint-status` | Relatório do progresso do sprint atual nas 3 frentes |
| `/briefing-equipe [agente]` | Briefing semanal por agente ou para todos |
| `/content-semana` | Calendário editorial LinkedIn + Instagram da semana |
| `/decisao-ceo [decisão]` | Registra nova decisão estratégica no CLAUDE.md |
| `/feature-spec F##` | Abre o spec de uma das 22 funcionalidades (F01-F22) |

---

## Sub-agents disponíveis

Invoque com `@nome` no Claude Code:

| Agente | Quando usar |
|---|---|
| `@ceo` | Decisões estratégicas, parcerias, captação, prioridades |
| `@dev` | Implementação técnica, código, infraestrutura, debugging |
| `@comunicacao` | Copy, posts, landing, UX writing, pitch decks |
| `@edu` | Design instrucional, trilhas, quizzes, microlearning |

---

## Stack técnica

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting, Cloud Functions)
- **Vídeo:** YouTube Não Listado + IFrame Player API
- **Repo:** Monorepo com Turbo
- **CI/CD:** GitHub Actions

Detalhes completos em [`CLAUDE.md`](./CLAUDE.md) seção 3.

---

## Setup técnico (primeira vez)

### Pré-requisitos

```bash
node --version    # 20+
npm --version     # 10+
firebase --version  # 13+ (npm install -g firebase-tools)
gh --version      # GitHub CLI 2+
```

### Instalar dependências

```bash
npm install
```

### Configurar Firebase localmente

```bash
firebase login
firebase use veglia    # alias do projeto
```

### Rodar localmente

```bash
# Terminal 1: emuladores Firebase
firebase emulators:start

# Terminal 2: app web
cd apps/web && npm run dev
```

### Deploy

```bash
# Staging (auto via PR)
git push origin feat/minha-branch
gh pr create

# Produção (auto via merge para main)
git checkout main
git merge feat/minha-branch
git push origin main
```

---

## Convenções de commit

Conventional Commits:

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` mudança de documentação
- `refactor:` refatoração sem mudança funcional
- `chore:` tarefas de manutenção
- `test:` adição ou ajuste de testes

Exemplo:
```bash
git commit -m "feat(player): adiciona tracking de progresso no VegliaPlayer"
```

---

## Equipe

| Papel | Pessoa |
|---|---|
| CEO / Tech Lead | Rodolfo Nascimento |
| Comercial | Fábio |
| Operação Vacivitta | Thiago |
| Autoridade médica | Dra. Amanda Conde Perez Fernandes |

---

## Documentos-chave para começar

1. [`CLAUDE.md`](./CLAUDE.md) — memória do projeto
2. [`docs/strategy/01-roadmap-estrategico-produto.pdf`](./docs/strategy/01-roadmap-estrategico-produto.pdf) — roadmap mestre
3. [`docs/strategy/03-roadmap-operacional-30dias.html`](./docs/strategy/03-roadmap-operacional-30dias.html) — roadmap operacional sprint atual
4. [`docs/design/01-brandbook.html`](./docs/design/01-brandbook.html) — brandbook Vegl.ia
5. [`docs/design/04-landing-page-completa.html`](./docs/design/04-landing-page-completa.html) — landing page de referência

---

## Cronograma macro

| Sprint | Janela | Foco | Marco |
|---|---|---|---|
| **Sem 1** | 09–16 maio | Fundação técnica + lançamento público | Domínios · Firebase · landing · perfis sociais |
| **Sem 2** | 17–23 maio | Auth + design system + 1º conteúdo | VegliaPlayer · 5 posts · call VR |
| **Sem 3** | 24–30 maio | Módulo Vacinação ponta a ponta | Quiz · certificado · 1º vídeo gravado |
| **Sem 4** | 31 maio–09 junho | Painel RH + demo VR | Demo funcional · 30 leads |

---

## Princípios não negociáveis

1. **Disciplina sobre F01–F06.** Nada que não esteja no MVP entra no MVP.
2. **Multi-tenant desde a primeira linha.** Não é refactor — é fundamento.
3. **Compliance Lei 15.377 é a entrada, não o produto.** Plataforma tem valor intrínseco.
4. **Vídeos via YouTube embedded.** Storage é proibitivo em escala.
5. **Dra. Amanda valida antes de publicar.** Conteúdo médico nunca é improvisado.
6. **Vacivitta como marca-mãe.** Vegl.ia nunca aparece desconectada do ecossistema.

---

**Last updated:** 2026-05-09
**Active sprint:** T1 MVP · Semana 1 de 12
