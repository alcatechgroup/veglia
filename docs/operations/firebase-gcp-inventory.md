# Inventário de Recursos Firebase e GCP — Vegl.ia

**Projeto GCP:** `veglia-6e734`  
**Plano:** Blaze (pago)  
**Última atualização:** 2026-05-18

---

## 1. Firebase Authentication

| Provedor | Uso |
|----------|-----|
| Email + Senha | Login de colaboradores e RH |
| Google OAuth | Login alternativo |
| Anônimo | Integração Power Automate (OneDrive widget) |

**Custom Claims (JWT):**
- `company_id` — UUID da empresa; base do isolamento multi-tenant
- `role` — `"admin"` | `"admin_rh"` | `"rh"` | `"collaborator"`

**Sincronização:** Cloud Function `syncUserClaims` atualiza os claims automaticamente via trigger `onDocumentWritten` em `users/{uid}`.

---

## 2. Firestore

**Banco:** default (região us-central1)  
**Isolamento:** todas as coleções usam `company_id` como campo de partição; regras de segurança validam via `request.auth.token.company_id`.

### 2.1 Coleções

| Coleção | Estrutura chave | Propósito | Quem escreve |
|---------|-----------------|-----------|--------------|
| `companies` | `{company_id}` | Dados da empresa (nome, CNPJ, plano) | CF `createCompany` |
| `users` | `{uid}` | Perfil do colaborador (role, company_id) | Cliente (onboarding) + CF |
| `invites` | `{invite_id}` | Convites de ingresso (token UUID) | CF `createInvite` |
| `enrollments` | `{uid_courseId}` | Progresso em trilhas | CF `generateCertificate`, cliente |
| `certificates` | `{uid_courseId}` | Certificado individual (PDF + SHA-256) | CF `generateCertificate` |
| `health_passports` | `{userId}` | Carteira vacinal do colaborador | CF, cliente |
| `vaccination_records` | `{recordId}` | Registros individuais de vacinas | CF, cliente |
| `diagnostic_results` | `{id}` | Resultado do diagnóstico preventivo (F03) | Cliente |
| `health_assessments` | `{id}` | Avaliações de saúde (input score ISPC) | CF |
| `compliance_scores` | `{company_id}` | Score agregado de compliance da empresa | CF `syncComplianceScore` |
| `company_certificates` | `{company_id_year}` | Certificado de empresa verificada (PDF) | CF `generateCompanyCertificate` |
| `ispc_snapshots` | `{company_id_period}` | ISPC mensal (YYYY-MM) | CF `calculateISPC` |
| `notifications` | `{notifId}` | Notificações in-app por usuário | CF |
| `ai_chats` | `{userId}` | Sessão de chat com IA Vegl.ia | CF `chatWithVeglia` |
| `ai_chats/{userId}/messages` | `{msgId}` | Mensagens do chat (subcoleção) | CF `chatWithVeglia` |
| `user_points` | `{userId}` | Pontos e badges (gamificação F09) | CF `awardPoints` |
| `audit_events` | `{eventId}` | Eventos de auditoria da plataforma | CF |
| `leads` | `{leadId}` | Leads da landing page e chat Vela | CF `createLandingLead` |
| `config` | `videoIds`, `platform_config` | Configurações globais (video IDs por trilha) | Admin (painel /admin/conteudo) |
| `onedrive_docs` | `{docId}` | Docs sincronizados via Power Automate | Anônimo (Power Automate) |
| `content_feed` | `{id}` | Feed de conteúdo educacional | Admin |
| `marketplace` | `{id}` | Cursos/trilhas disponíveis no marketplace | Admin |
| `video_progress` | `{docId}` | Tracking granular de progresso por vídeo | Cliente (VegliaPlayer) |
| `journeys` | `{journey_id}` | Jornadas de aprendizado (F08 — T2) | Admin |

### 2.2 Índices Compostos (firestore.indexes.json)

| Coleção | Campos | Ordem |
|---------|--------|-------|
| `enrollments` | `company_id`, `course_id` | ASC, ASC |
| `enrollments` | `company_id`, `completed_at` | ASC, DESC |
| `invites` | `company_id`, `usedAt` | ASC, ASC |
| `invites` | `company_id`, `role` | ASC, ASC |
| `certificates` | `company_id`, `issued_at` | ASC, DESC |
| `users` | `company_id`, `role` | ASC, ASC |

### 2.3 Regras de Segurança (firestore.rules)

**Helpers declarados:**
- `isAuthenticated()` — token != null
- `myCompany()` — extrai `request.auth.token.company_id`
- `myRole()` — extrai `request.auth.token.role`
- `isAdmin()` — role == `'admin'`
- `isRH()` — role in `('admin', 'rh', 'admin_rh')`
- `belongsToCompany(id)` — autenticado + company_id confere

**Padrão geral:** escrita em coleções sensíveis bloqueada para o cliente; realizada via Admin SDK pelas Cloud Functions. Leitura sempre requer `company_id` do token JWT.

---

## 3. Cloud Storage

**Bucket:** `veglia-6e734.firebasestorage.app`

| Pasta | Conteúdo | Acesso |
|-------|----------|--------|
| `certificates/{uid_courseId}.pdf` | Certificado individual gerado via pdf-lib | URL pública (compartilhável) |
| `company_certificates/{company_id_year}.pdf` | Certificado de empresa verificada | URL pública (compartilhável) |
| `logos/{selectedId}/{filename}` | Logos white label | Upload via admin; leitura pública |

---

## 4. Cloud Functions (Node.js 20)

**Runtime:** Node 20  
**Região:** us-central1 (default)  
**Arquivo fonte:** `functions/src/index.ts`

### 4.1 Funções HTTPS — onCall (requerem autenticação)

| Função | Trigger | Propósito |
|--------|---------|-----------|
| `createCompany` | onCall | Cria empresa + admin em transação (onboarding) |
| `acceptInvite` | onCall | Registra colaborador via token de convite |
| `createInvite` | onCall | Cria convites e dispara email (RH) |
| `sendInviteEmail` | onCall | Envia email de convite via Nodemailer |
| `generateCertificate` | onCall | Gera PDF de certificado individual (SHA-256) |
| `generateCompanyCertificate` | onCall | Gera PDF de certificado de empresa (score ≥ 40) |
| `awardPoints` | onCall | Concede pontos por ações (video_watched, module_completed…) |
| `chatWithVeglia` | onCall | Chat IA com Claude via Anthropic API (usa Secret Manager) |
| `calculatePreventiveScore` | onCall | Calcula score preventivo após diagnóstico |

### 4.2 Função HTTP pública

| Função | Trigger | Propósito |
|--------|---------|-----------|
| `createLandingLead` | onRequest (CORS público) | Recebe lead do chat Vela / formulário landing; salva em `leads` |

### 4.3 Triggers Firestore

| Função | Trigger | Propósito |
|--------|---------|-----------|
| `syncUserClaims` | `onDocumentWritten` em `users/{uid}` | Atualiza custom claims JWT (company_id, role) |
| `syncComplianceScore` | `onDocumentWritten` em `enrollments` e `vaccination_records` | Recalcula compliance_score da empresa em tempo real |

### 4.4 Scheduled (Cloud Scheduler)

| Função | Schedule (UTC) | Propósito |
|--------|---------------|-----------|
| `dailyHealthCheck` | `0 11 * * *` (08h BRT) | Verifica vacinas vencendo e módulos abandonados |
| `checkComplianceAlerts` | `0 12 * * *` (09h BRT) | Atualiza status vacinas (pending/overdue) |
| `calculateISPC` | `0 9 1 * *` (1º do mês) | Calcula ISPC mensal por empresa |

### 4.5 Dependências (functions/package.json)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `firebase-admin` | ^12.7.0 | Admin SDK — acesso total a Firestore/Storage/Auth |
| `firebase-functions` | ^6.1.0 | Helpers de trigger (onCall, onSchedule…) |
| `pdf-lib` | ^1.17.1 | Geração de PDFs de certificado |
| `nodemailer` | ^8.0.7 | Envio de emails (Ethereal em dev; SMTP em prod) |
| `@veglia/shared` | workspace:* | Tipos TypeScript compartilhados |

---

## 5. Firebase Hosting

**URL produção:** `https://veglia-6e734.web.app`  
**Custom domain:** `app.vegl.ia` (configurado)  
**Pasta pública:** `apps/web/dist`

**Rewrites SPA (firebase.json):**

| Source | Destination |
|--------|-------------|
| `/admin/**` | `/app.html` |
| `/app/**` | `/app.html` |
| `/login` | `/app.html` |
| `/acesso` | `/app.html` |
| `/onboarding` | `/app.html` |
| `/unauthorized` | `/app.html` |

**Cache headers:**
- `/images/**` e `/assets/**` → `Cache-Control: public, max-age=31536000, immutable`

---

## 6. Secret Manager

| Secret | Usado em | Propósito |
|--------|----------|-----------|
| `ANTHROPIC_API_KEY` | CF `chatWithVeglia` | Acesso à API Claude (Anthropic) |

---

## 7. APIs GCP Habilitadas

| API | Por quê |
|-----|---------|
| Cloud Firestore API | Banco de dados principal |
| Cloud Storage API | Armazenamento de certificados e logos |
| Cloud Functions API | Backend serverless |
| Cloud Scheduler API | Crons das functions scheduled |
| Secret Manager API | Guarda ANTHROPIC_API_KEY |
| Cloud Build API | Build das Cloud Functions no deploy |
| Identity Platform / IAM | Auth + Service Accounts |

---

## 8. CI/CD — GitHub Actions

| Workflow | Trigger | Secrets necessários |
|----------|---------|---------------------|
| `deploy.yml` | Push em `main` | `FIREBASE_SERVICE_ACCOUNT_VEGLIA_6E734`, `GITHUB_TOKEN` |
| `preview.yml` | Pull Request → `main` | `FIREBASE_SERVICE_ACCOUNT_VEGLIA_6E734`, `GITHUB_TOKEN` |

**Passos do pipeline:**
1. `pnpm/action-setup@v4` — instala pnpm (versão lida de `packageManager` no package.json)
2. `actions/setup-node@v4` com `cache: 'pnpm'`
3. `pnpm install --frozen-lockfile`
4. `pnpm --filter @veglia/web build`
5. `bash scripts/predeploy.sh` — swap index/app para Hosting
6. `FirebaseExtended/action-hosting-deploy@v0` — deploy

---

## 9. Integrações Externas

| Serviço | Como integra | Dados trafegados |
|---------|-------------|-----------------|
| **Anthropic (Claude)** | `fetch` direto da CF `chatWithVeglia`; chave via Secret Manager | Contexto do usuário + pergunta |
| **SMTP (Nodemailer)** | CF `sendInviteEmail`; credenciais via env vars | Email de convite |
| **YouTube IFrame API** | Frontend `VegliaPlayer`; vídeos "não listados" | IDs de vídeo lidos do Firestore `config/videoIds` |
| **Google OAuth** | Firebase Auth provider | Nome, email, foto |
| **Power Automate / OneDrive** | HTTP POST anônimo em CF `createLandingLead` ou coleção `onedrive_docs` | Documentos e metadados |

---

## 10. Configuração Frontend (packages/firebase-config)

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE",   // pública por design
  authDomain: "veglia-6e734.firebaseapp.com",
  projectId: "veglia-6e734",
  storageBucket: "veglia-6e734.firebasestorage.app",
  messagingSenderId: "848052093163",
  appId: "1:848052093163:web:b40cdc01763cbfa4f8beae",
};
```

Exports: `auth`, `db`, `storage`, `app` — consumidos por todos os componentes via imports diretos.

---

## 11. Notas de Segurança

- **API Key pública** é intencional (Web API Key); a proteção real são as Firestore Security Rules.
- **Service Account** do CI/CD armazenado como GitHub Secret — nunca commitar o JSON.
- **ANTHROPIC_API_KEY** via Secret Manager — nunca em variável de ambiente no código.
- **SMTP credentials** via `process.env` nas Cloud Functions — não hardcoded.
- **Regras Firestore** usam custom claims JWT como fonte de verdade — não confiam em campos do documento enviado pelo cliente.
- **Certificados** no Storage são públicos (URL gerada é o controle de acesso — UUID longo).
