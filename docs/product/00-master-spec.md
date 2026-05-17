# Vegl.ia — Master Spec de Produto
> Gerado em: 2026-05-16 | Fase ativa: T1 MVP | Sprint: Semana 2 de 12
> Fonte: leitura direta dos 21 arquivos .docx em docs/product/
> Owner: @dev para implementação | Validação: Rodolfo (CEO)

---

## Estrutura das 22 features

O roadmap de produto divide as 22 features em 4 fases (T1–T4). O arquivo
"Análise edtech.docx" é documento fundacional estratégico — não é feature técnica.
As features são F01–F21, com F22 derivada do contexto do CLAUDE.md (motor de dados).

Mapeamento arquivo → feature:

| Arquivo .docx | Feature |
|---|---|
| Plataforma de Compliance em Saúde | F01 |
| Diagnóstico Preventivo Inicial | F02 |
| PLATAFORMA MULTI-SAÚDE | F03 |
| Calculadora Inteligente de Calendário Vacinal | F04 |
| Passaporte de Saúde Digital | F05 |
| Certificação para Empresas | F06 |
| Canal de Conteúdo Médico Autoritativo | F07 |
| Jornadas de Vida | F08 |
| Gamificação Corporativa | F09 |
| Modo "SIPAT Automática" | F10 |
| Motor de Campanhas Inteligentes | F11 |
| IA Preventiva Personalizada | F12 |
| Índice de Saúde Preventiva Corporativa | F13 |
| Universidade Corporativa White Label | F14 |
| Central de Saúde Familiar | F15 |
| Concierge Preventiva Digital | F16 |
| Ecossistema de Benefícios Preventivos | F17 |
| Marketplace de Saúde | F18 |
| Plataforma de Dados Epidemiológicos | F19 |
| Plataforma de Expansão Física Inteligente | F20 |
| Análise edtech (fundacional) | — |

> Nota: F21 e F22 aparecem no roadmap estratégico como camadas futuras de IA preditiva
> e integração com ecossistema externo (seguradoras, farmacêuticas). Não possuem .docx
> próprio ainda — derivam das seções "futuro" dos docs F12, F19 e F20.

---

## F01 — Plataforma de Compliance em Saúde

**Sprint:** S1
**Prioridade:** Alta
**Dependências:** nenhuma (fundação do MVP)

### O que resolve
Empresas não conseguem provar conformidade com a Lei 15.377/2026: perdem certificados,
não controlam vencimentos vacinais, dependem de planilhas. Gera risco trabalhista real.

### Funcionalidades core
- Dashboard executivo de compliance com indicadores em tempo real
- Controle de vacinação: cobertura por setor, reforços pendentes, vencimentos
- Controle de treinamentos obrigatórios: cursos, SIPAT, ergonomia, saúde mental
- Armazenamento e gestão de certificados com trilha de auditoria
- Alertas automáticos: vencimentos, baixa adesão, áreas críticas
- Relatórios de rastreabilidade (evidências para auditoria, fiscalização, ação trabalhista)
- Documentação centralizada: comprovantes, termos, aceites digitais, histórico preventivo
- IA de compliance: identifica setores vulneráveis e sugere ações corretivas

### Schema Firestore
```
companies/{company_id}
  name, cnpj, plan, white_label_partner, created_at

employees/{employee_id}
  company_id, name, email, department, role_job, status

vaccination_records/{record_id}
  company_id, employee_id, vaccine_name, date, batch, manufacturer,
  next_dose_date, status (up_to_date | pending | overdue)

training_completions/{completion_id}
  company_id, employee_id, course_id, completed_at, certificate_url,
  certificate_hash (SHA-256), expires_at

compliance_scores/{company_id}
  vaccination_coverage, training_compliance, mental_health_score,
  ergonomics_score, overall_score, risk_level, updated_at

audit_events/{event_id}
  company_id, employee_id, event_type, payload, timestamp
```

### Telas/rotas
- `/app/compliance` → dashboard principal de compliance (RH)
- `/app/compliance/vacinacao` → controle vacinal por colaborador/setor
- `/app/compliance/treinamentos` → controle de cursos e certificados
- `/app/compliance/relatorio` → exportação CSV/PDF para auditoria
- `/admin/empresas` → gestão de empresas (admin interno)

### Cloud Functions necessárias
- `checkComplianceAlerts`: cron diário — verifica vencimentos e dispara alertas
- `generateCertificate`: onCall — gera PDF com SHA-256, salva em Storage, atualiza Firestore
- `syncComplianceScore`: onWrite em training_completions/vaccination_records — recalcula score

### Critério de aceite
- [ ] RH consegue visualizar cobertura vacinal por setor em menos de 5s
- [ ] Alerta dispara automaticamente quando colaborador atinge 30 dias antes do vencimento
- [ ] Certificado é gerado com hash SHA-256 único e download funcional
- [ ] Relatório CSV exporta todos os colaboradores com status de compliance
- [ ] Dashboard mostra score 0–100 calculado a partir dos 6 indicadores

---

## F02 — Diagnóstico Preventivo Inicial

**Sprint:** S1
**Prioridade:** Alta
**Dependências:** F01 (precisa de `company_id` e `employee_id`)

### O que resolve
Plataformas genéricas entregam o mesmo conteúdo para todos — baixo engajamento e percepção
de valor zero. O diagnóstico é a porta de entrada inteligente que personaliza toda a jornada.

### Funcionalidades core
- Questionário de onboarding preventivo em etapas (idade, sexo, profissão, hábitos, vacinas, comorbidades)
- Geração de perfil preventivo com score 0–100 ("Preventive Health Score")
- Classificação de risco: 0–40 Alto / 41–70 Atenção / 71–90 Bom / 91–100 Excelência
- Identificação automática de riscos: cardiovascular, metabólico, burnout, imunológico
- Relatório personalizado com top recomendações (vacinas, cursos, hábitos, serviços)
- Dashboard RH com score preventivo agregado por setor
- Reavaliação trimestral automática (trigger por tempo)
- Versão corporate: assessment organizacional do RH

### Schema Firestore
```
health_assessments/{assessment_id}
  company_id, employee_id, version, completed_at
  answers: {sleep, exercise, stress, smoking, alcohol, diet, ...}
  risk_flags: [cardiovascular, metabolic, burnout, immunological]
  preventive_score: number
  recommendations: [{type, priority, title, action}]
  next_assessment_at: timestamp

corporate_assessments/{assessment_id}
  company_id, created_by, submitted_at
  sector_scores: {operational, administrative, leadership}
  top_gaps: [string]
```

### Telas/rotas
- `/app/diagnostico` → questionário de onboarding (colaborador)
- `/app/diagnostico/resultado` → resultado com score e recomendações
- `/app/diagnostico/historico` → evolução do score ao longo do tempo
- `/app/relatorio` → view RH com scores agregados por setor

### Cloud Functions necessárias
- `calculatePreventiveScore`: onCall — processa respostas e retorna score + recommendations
- `scheduleReassessment`: onWrite em health_assessments — agenda próxima avaliação

### Critério de aceite
- [ ] Questionário completa em menos de 4 minutos (máximo 20 perguntas)
- [ ] Score calculado e exibido imediatamente após submissão
- [ ] Mínimo 3 recomendações personalizadas geradas por perfil
- [ ] RH visualiza score médio por setor no dashboard
- [ ] Reavaliação agendada automaticamente 90 dias após primeiro assessment

---

## F03 — Plataforma Multi-Saúde (Trilhas Educacionais)

**Sprint:** S1
**Prioridade:** Alta
**Dependências:** F01

### O que resolve
Empresas precisam provar que treinaram e conscientizaram colaboradores — a Lei 15.377 exige
evidência. Trilhas educacionais são o produto de compliance mais direto e o motor de leads.

### Funcionalidades core
- Catálogo de trilhas por categoria: Vacinação, NR-1, Saúde Mental, Ergonomia, Saúde Feminina, etc.
- Player de vídeo embedded YouTube (VegliaPlayer) com tracking de progresso
- Sistema de módulos e aulas com sequenciamento obrigatório
- Quizzes de verificação de aprendizagem por módulo
- Certificado automático ao completar trilha (SHA-256)
- Trilhas obrigatórias por empresa (RH define quais são mandatórias)
- Trilhas opcionais por interesse/perfil do colaborador
- Progresso salvo no Firestore (retomada de onde parou)
- Preview mode para RH visualizar conteúdo sem gerar enrollment

### Schema Firestore
```
courses/{course_id}
  company_id (null = global), title, description, category, thumbnail_url
  modules: [{module_id, title, video_id, duration_min, quiz_id}]
  is_mandatory: boolean, created_at

enrollments/{enrollment_id}
  company_id, employee_id, course_id, enrolled_at, completed_at
  progress: {module_id: {watched_percent, completed, quiz_passed}}
  certificate_id (ref)

video_progress/{user_id}_{video_id}
  employee_id, video_id, watch_percent_last, last_watched_at
  total_watch_time_s, completed: boolean

/config/videoIds (Firestore doc)
  lei15377_m1, lei15377_m2, lei15377_m3, lei15377_m4
  nr1_m1, nr1_m2, [outros módulos]
```

### Telas/rotas
- `/app/trilhas` → catálogo de trilhas disponíveis
- `/app/trilhas/:course_id` → detalhe da trilha com módulos
- `/app/trilhas/:course_id/:module_id` → player + quiz
- `/app/certificados` → certificados conquistados
- `/app/trilhas-rh` → visão RH com progresso dos colaboradores
- `/admin/conteudo` → painel admin para atualizar videoIds YouTube sem redeploy

### Cloud Functions necessárias
- `generateCertificate`: onCall — PDF + SHA-256 + Storage + Firestore + email
- `onCourseComplete`: onWrite em enrollments — trigger certificado quando completed_at preenchido

### Critério de aceite
- [ ] Vídeo carrega dentro do player sem redirecionar para YouTube
- [ ] Progresso salvo a cada 5 segundos de assistência
- [ ] Certificado gerado automaticamente ao concluir todos os módulos
- [ ] RH consegue ver % de conclusão por colaborador e por trilha
- [ ] Admin pode trocar videoId YouTube sem redeploy (via /admin/conteudo)
- [ ] Trilha obrigatória bloqueia certificado de compliance se não concluída

---

## F04 — Calculadora Inteligente de Calendário Vacinal

**Sprint:** S1
**Prioridade:** Alta
**Dependências:** F02 (usa perfil do colaborador)

### O que resolve
Colaboradores não sabem quais vacinas precisam tomar, quando e por quê. A calculadora
transforma dados simples em mapa vacinal individual e corporativo — e gera leads diretos
para campanhas de vacinação Vacivitta.

### Funcionalidades core
- Input do colaborador: idade, sexo, profissão, cidade, comorbidades, histórico vacinal
- Upload opcional de carteira vacinal (OCR futuro — T2)
- Análise automática baseada em calendário vacinal brasileiro + recomendações SBIm
- Geração de mapa vacinal individual: pendentes, reforços, por prioridade
- Score de proteção vacinal individual ("Seu índice de proteção é 63%")
- Dashboard corporativo: cobertura geral, vacinas mais ausentes, risco epidemiológico
- CTA de conversão: botão "Agendar Vacinação" → Vacivitta / parceiros
- Geração de leads qualificados para campanhas presenciais in company

### Schema Firestore
```
vaccination_profiles/{profile_id}
  employee_id, company_id, created_at, updated_at
  personal_data: {age, sex, occupation, city, comorbidities, travel_freq}
  vaccine_history: [{vaccine_name, date, next_dose}]
  protection_score: number
  pending_vaccines: [{name, priority, reason, recommendation}]

corporate_vaccine_dashboard/{company_id}
  overall_coverage_pct, vaccines_most_missing: [string]
  risk_level, last_updated_at
  sector_breakdown: {sector_name: {coverage_pct, pending_count}}
```

### Telas/rotas
- `/app/calculadora-vacinal` → formulário de perfil vacinal
- `/app/calculadora-vacinal/resultado` → mapa individual + score
- `/app/calendario-vacinal` → visão RH do calendário corporativo (decisão #17 CLAUDE.md)

### Cloud Functions necessárias
- `analyzeVaccineProfile`: onCall — processa perfil e retorna mapa vacinal + score
- `aggregateCorporateVaccineData`: scheduled (diário) — consolida dados para dashboard RH

### Critério de aceite
- [ ] Mapa vacinal gerado em menos de 3s após submissão
- [ ] Mínimo 5 vacinas analisadas (Influenza, Hepatite B, dTpa, COVID, Febre Amarela)
- [ ] Score de proteção exibido com breakdown por categoria
- [ ] Dashboard RH mostra top 5 vacinas mais ausentes por setor
- [ ] Botão "Agendar Vacinação" exibido para cada vacina pendente de alta prioridade

---

## F05 — Passaporte de Saúde Digital

**Sprint:** S2
**Prioridade:** Alta
**Dependências:** F03, F04

### O que resolve
Pessoas perdem carteiras vacinais, não acompanham histórico preventivo e não têm visão
integrada da própria saúde. O passaporte é o hub pessoal permanente que gera retenção
de longo prazo.

### Funcionalidades core
- Histórico vacinal completo: vacinas, datas, lotes, fabricantes, reforços, pendências
- Histórico educacional: cursos concluídos, certificados, trilhas realizadas
- Score preventivo individual com evolução temporal (gráfico linha)
- Alertas inteligentes: reforços próximos, campanhas, exames preventivos
- QR Code pessoal para comprovação rápida (uso em auditorias, eventos, RH)
- Timeline da vida preventiva (visualização cronológica)
- Perfil familiar: usuário pode gerenciar dependentes (filhos, cônjuge, pais)
- Exportação em PDF do passaporte (comprovação para RH/medicina ocupacional)

### Schema Firestore
```
health_passports/{employee_id}
  company_id, created_at
  vaccine_history: [{vaccine_name, date, batch, manufacturer, next_dose, verified}]
  course_history: [{course_id, title, completed_at, certificate_id}]
  preventive_score_history: [{score, measured_at}]
  qr_code_token: string (signed)

family_members/{member_id}
  owner_employee_id, name, birth_date, relationship
  vaccine_history: [...]
  alerts: [{type, message, due_date}]
```

### Telas/rotas
- `/app/passaporte` → view principal do passaporte digital
- `/app/passaporte/familia` → gestão de membros familiares
- `/app/passaporte/qrcode` → QR Code para comprovação
- `/app/passaporte/historico` → timeline preventiva

### Cloud Functions necessárias
- `generatePassportQR`: onCall — gera token assinado para QR Code
- `exportPassportPDF`: onCall — gera PDF do passaporte completo

### Critério de aceite
- [ ] Passaporte exibe histórico vacinal e de cursos de forma unificada
- [ ] QR Code gerado com token único e verificável
- [ ] Score histórico exibido em gráfico de linha com pelo menos 3 pontos
- [ ] Usuário consegue adicionar até 5 membros familiares
- [ ] PDF exportado contém todos os certificados em até 10s

---

## F06 — Certificação para Empresas

**Sprint:** S2
**Prioridade:** Alta
**Dependências:** F01, F03, F04, F13

### O que resolve
Empresas realizam ações preventivas isoladas sem conseguir demonstrar maturidade ao
mercado. A certificação cria o "GPTW da saúde preventiva" — reconhecimento institucional
que motiva investimento contínuo em prevenção.

### Funcionalidades core
- Sistema de avaliação multi-indicador: vacinação, educação, saúde mental, ergonomia, engajamento, compliance
- 4 níveis de certificação: Bronze / Prata / Ouro / Platinum
- Dashboard de evolução: gaps identificados, score por dimensão, metas para próximo nível
- Geração automática de selo digital para uso pela empresa (employer branding, ESG)
- Sugestões de melhoria via IA: "Para atingir Ouro, aumente cobertura vacinal em 12%"
- Relatório de certificação para auditorias e relatórios ESG
- Renovação anual automática (recalcula score com dados mais recentes)

### Schema Firestore
```
certifications/{certification_id}
  company_id, level (bronze|silver|gold|platinum)
  issued_at, valid_until, renews_at
  score_breakdown: {vaccination, education, mental_health, ergonomics, engagement, compliance}
  overall_score: number
  certificate_url, certificate_hash
  improvement_suggestions: [string]

certification_history/{company_id}
  records: [{certification_id, level, issued_at, score}]
```

### Telas/rotas
- `/app/certificacao` → view empresa com nível atual e breakdown
- `/app/certificacao/evolucao` → histórico de certificações
- `/app/certificacao/selo` → download do selo digital por nível
- `/admin/certificacoes` → gestão admin (emissão manual, override)

### Cloud Functions necessárias
- `calculateCertificationLevel`: scheduled (mensal) ou onCall — computa score e emite certificado
- `generateCertificationBadge`: onCall — gera imagem de selo PNG/SVG por nível

### Critério de aceite
- [ ] Score de certificação calculado com base em pelo menos 4 dimensões
- [ ] Nível exibido com breakdown visual por dimensão (progress bars)
- [ ] Selo digital gerado e disponível para download imediato
- [ ] Sugestões de melhoria geradas especificamente para gaps da empresa
- [ ] Relatório PDF de certificação disponível para exportação

---

## F07 — Canal de Conteúdo Médico Autoritativo

**Sprint:** S2
**Prioridade:** Média
**Dependências:** F03

### O que resolve
A plataforma precisa de atualização contínua de conteúdo para manter relevância e reduzir
CAC via tráfego orgânico. O canal transforma a Vegl.ia de software em marca de mídia
preventiva — autoridade nacional respaldada pela Dra. Amanda.

### Funcionalidades core
- Biblioteca de conteúdo médico organizado por tema (vacinação, longevidade, saúde mental, etc.)
- Artigos educacionais com autoria médica vinculada (Dra. Amanda + especialistas convidados)
- Newsletter preventiva automática (semanal por e-mail)
- Integração com trilhas: conteúdo do canal recomendado pela IA após cursos
- Categorias: Vacinação / Longevidade / Saúde Mental / Saúde da Mulher / Saúde Masculina / Wellness
- SEO: metadados completos para indexação orgânica
- Conteúdo corporativo: biblioteca temática para distribuição interna pelas empresas

### Schema Firestore
```
articles/{article_id}
  title, slug, category, author_id, published_at
  content_html, excerpt, featured_image_url
  tags: [string], read_time_min: number
  seo: {meta_title, meta_description, keywords}
  company_id (null = público)

article_views/{view_id}
  article_id, employee_id (nullable), company_id (nullable), viewed_at
```

### Telas/rotas
- `/conteudo` → feed público de artigos (SEO)
- `/conteudo/:slug` → artigo individual
- `/app/conteudo` → feed personalizado in-app com recomendações por perfil
- `/admin/conteudo/artigos` → CMS para criação e publicação de artigos

### Cloud Functions necessárias
- `sendWeeklyNewsletter`: scheduled (todo domingo 9h) — seleciona top artigos da semana e dispara via SendGrid

### Critério de aceite
- [ ] Artigo publicado com slug único e metadados SEO preenchidos
- [ ] Newsletter disparada automaticamente todo domingo
- [ ] Feed /app/conteudo mostra artigos relevantes ao perfil do usuário
- [ ] Tempo de leitura calculado automaticamente (200 palavras/min)

---

## F08 — Jornadas de Vida

**Sprint:** S2
**Prioridade:** Alta
**Dependências:** F02, F03, F12

### O que resolve
Cursos isolados geram baixo engajamento e abandono. Jornadas organizam a plataforma em
torno das dores reais do ciclo de vida — criando experiência emocional de acompanhamento,
não apenas educação.

### Funcionalidades core
- Catálogo de jornadas temáticas: Gestação Segura, Homem 40+, Mulher 40+, Saúde Corporativa, Performance e Longevidade, Pais e Filhos, Saúde Mental, Pós-COVID/Imunidade
- Diagnóstico inicial por jornada (IA identifica fase e perfil)
- Sequenciamento de conteúdos: vídeos + artigos + quizzes + serviços integrados
- Acompanhamento de progresso com marcos visuais
- Recomendação automática de jornada baseada no diagnóstico F02
- Conversão para serviços: cada jornada tem CTAs para vacinação, teleconsulta, exames
- Trilhas corporativas: RH define jornadas obrigatórias por cargo/setor

### Schema Firestore
```
journeys/{journey_id}
  title, description, target_audience, category
  phases: [{phase_id, title, steps: [{type, ref_id, title}]}]
  estimated_weeks: number, cover_image_url

journey_enrollments/{enrollment_id}
  company_id, employee_id, journey_id
  enrolled_at, current_phase, current_step
  completed_phases: [phase_id], completed_at
  progress_pct: number
```

### Telas/rotas
- `/app/jornadas` → catálogo de jornadas
- `/app/jornadas/:journey_id` → detalhe e início da jornada
- `/app/jornadas/:journey_id/fase/:phase_id` → conteúdos da fase atual

### Cloud Functions necessárias
- `recommendJourney`: onWrite em health_assessments — sugere jornada baseada no perfil
- `journeyProgressWebhook`: onUpdate em journey_enrollments — notificação de conclusão de fase

### Critério de aceite
- [ ] Mínimo 4 jornadas disponíveis no lançamento
- [ ] Jornada recomendada automaticamente após diagnóstico F02
- [ ] Progresso visual por fase (ex: "Fase 2 de 5 concluída")
- [ ] CTA de vacinação presente em pelo menos 1 passo de cada jornada
- [ ] Empresas conseguem atribuir jornada a cargo específico

---

## F09 — Gamificação Corporativa

**Sprint:** S2
**Prioridade:** Média
**Dependências:** F03, F08

### O que resolve
Baixa adesão é o principal killer de programas preventivos corporativos. SIPAT com 20%
de participação. Cursos ignorados. A gamificação transforma obrigação em experiência
com recompensa — aumenta LTV e cultura preventiva.

### Funcionalidades core
- Sistema de pontos por ações preventivas: cursos, vacinação, quizzes, desafios, hábitos
- 4 níveis de progressão: Iniciante Preventivo / Guardião da Saúde / Embaixador Preventivo / Elite Wellness
- Medalhas por conquistas específicas: "Carteira Vacinal Atualizada", "30 Dias Ativos", etc.
- Ranking individual, por equipe e por setor
- Desafios corporativos configuráveis pelo RH (duração, público, tema, recompensa)
- Dashboard de engajamento para RH: participação por setor, campanha mais eficaz
- Recompensas configuráveis pela empresa (vouchers, folgas, reconhecimento)

### Schema Firestore
```
gamification_profiles/{employee_id}
  company_id, total_points, current_level
  badges: [{badge_id, earned_at}]
  rank_position: number, rank_updated_at

challenges/{challenge_id}
  company_id, title, description, target_action, target_value
  start_date, end_date, reward_description
  participants: [employee_id], winners: [employee_id]

point_transactions/{tx_id}
  employee_id, company_id, points, action_type, ref_id, created_at
```

### Telas/rotas
- `/app/conquistas` → perfil de gamificação do colaborador
- `/app/ranking` → ranking corporativo
- `/app/desafios` → desafios ativos
- `/admin/gamificacao` → configuração de desafios pelo RH/admin

### Cloud Functions necessárias
- `awardPoints`: onWrite (cursos, vacinação, quizzes) — atribui pontos automaticamente
- `updateRankings`: scheduled (a cada 4h) — recalcula rankings
- `checkChallengeCompletion`: scheduled (diário) — verifica e fecha desafios encerrados

### Critério de aceite
- [ ] Pontos atribuídos automaticamente ao completar curso/módulo
- [ ] Medalha "Carteira Vacinal Atualizada" concedida ao completar F04
- [ ] Ranking atualizado a cada 4 horas
- [ ] RH consegue criar desafio com data, público e recompensa em menos de 5min
- [ ] Nível avança automaticamente ao atingir threshold de pontos

---

## F10 — Modo SIPAT Automática

**Sprint:** S2
**Prioridade:** Alta
**Dependências:** F03, F09

### O que resolve
SIPAT é obrigatória por lei e normalmente improvisada, cara e sem métricas. A Vegl.ia
transforma a SIPAT em produto SaaS automatizado — porta de entrada comercial com altíssima
dor real e budget já reservado pelas empresas.

### Funcionalidades core
- Configuração de SIPAT em 3 etapas: perfil da empresa → IA monta programação → empresa ajusta
- Biblioteca de conteúdos prontos por segmento: logística, administrativo, indústria, saúde
- Cronograma automático com distribuição de conteúdos ao longo do período
- Notificações automáticas para colaboradores durante o período da SIPAT
- Gamificação integrada: ranking por participação, pontuação por ação
- Certificados automáticos de participação na SIPAT
- Dashboard em tempo real: adesão, participação, engajamento por setor
- SIPAT Híbrida: slot para agendamento de vacinação in company e palestra presencial

### Schema Firestore
```
sipat_events/{event_id}
  company_id, title, period_start, period_end
  company_segment, collaborator_count, objectives: [string]
  schedule: [{day, content_id, content_type, is_mandatory}]
  status (draft|active|completed)
  metrics: {total_participants, completion_rate, avg_score}

sipat_participations/{participation_id}
  event_id, employee_id, company_id
  actions_completed: [string], points_earned: number
  certificate_issued: boolean
```

### Telas/rotas
- `/app/sipat` → hub de SIPAT ativas para o colaborador
- `/app/sipat/:event_id` → cronograma e conteúdos da SIPAT
- `/app/sipat/:event_id/ranking` → ranking de participação
- `/admin/sipat` → criação e gestão de SIPAT pelo RH
- `/admin/sipat/:event_id/dashboard` → métricas em tempo real

### Cloud Functions necessárias
- `generateSipatSchedule`: onCall — IA gera cronograma baseado no perfil da empresa
- `sipatDailyNotification`: scheduled (diário durante SIPAT ativa) — envia notificações
- `closeSipatEvent`: scheduled (diário) — finaliza SIPATs encerradas e emite certificados

### Critério de aceite
- [ ] SIPAT configurada e pronta para lançar em menos de 15 minutos
- [ ] Cronograma gerado automaticamente com pelo menos 5 dias de conteúdo
- [ ] Notificação enviada diariamente durante período ativo
- [ ] Dashboard mostra participação em tempo real por setor
- [ ] Certificado de participação gerado para colaboradores com >70% de conclusão

---

## F11 — Motor de Campanhas Inteligentes

**Sprint:** S3
**Prioridade:** Alta
**Dependências:** F01, F04, F12

### O que resolve
Campanhas corporativas genéricas geram baixa conversão e são feitas sem dados. O motor
usa inteligência da plataforma para criar campanhas certas, para o público certo, na hora
certa — e converte dados preventivos em demanda real para Vacivitta.

### Funcionalidades core
- Análise automática de dados da plataforma para identificar oportunidades de campanha
- Geração de campanhas segmentadas: vacinação, saúde mental, ergonomia, gestantes, etc.
- Inteligência sazonal: influenza no inverno, saúde mental em jan/fev, outubro rosa, etc.
- Automação de comunicação: e-mail + notificação + WhatsApp por perfil
- Campanhas geolocalizadas: identificação de regiões/setores mais vulneráveis
- Integração com presencial: CTA direto para vacinação in company via Vacivitta
- Dashboard de ROI: adesão, conversão, impacto estimado (redução absenteísmo)
- Marketplace de campanhas: empresa contrata palestrante/vacinação direto na plataforma

### Schema Firestore
```
campaign_templates/{template_id}
  name, category, trigger_type (seasonal|behavioral|threshold)
  target_criteria: {min_risk, vaccine_missing, segment, ...}
  content: {subject, body_html, notification_text, cta_url}

campaign_executions/{execution_id}
  company_id, template_id, created_at, status
  target_count, sent_count, opened_count, converted_count
  estimated_roi: {absenteeism_reduction_pct, cost_saved_brl}
```

### Telas/rotas
- `/admin/campanhas` → gestão de campanhas (criação, histórico, métricas)
- `/admin/campanhas/nova` → wizard de criação de campanha
- `/admin/campanhas/:id/dashboard` → métricas de campanha específica

### Cloud Functions necessárias
- `detectCampaignOpportunities`: scheduled (semanal) — analisa dados e cria sugestões de campanha
- `executeCampaign`: onCall — dispara comunicação para público-alvo segmentado
- `trackCampaignConversions`: onWrite em vaccinations/enrollments — registra conversões

### Critério de aceite
- [ ] Sugestão de campanha gerada automaticamente baseada em dados reais
- [ ] Campanha segmentada por setor, faixa etária ou risco
- [ ] Email e notificação disparados em menos de 5 minutos após execução
- [ ] Dashboard mostra taxa de abertura e conversão
- [ ] ROI estimado calculado com base em parâmetros configuráveis

---

## F12 — IA Preventiva Personalizada

**Sprint:** S3
**Prioridade:** Alta
**Dependências:** F02, F08, F11

### O que resolve
A plataforma sem IA é uma biblioteca passiva — baixo engajamento, alta taxa de abandono.
A IA é o "cérebro" que transforma dados em jornada ativa e contínua para cada usuário.

### Funcionalidades core
- Motor de recomendação: vacinas, cursos, hábitos, consultas, campanhas — por perfil individual
- Acompanhamento ativo: notificações inteligentes baseadas em comportamento e histórico
- IA conversacional: chat in-app estilo assistente (respostas baseadas em conteúdo médico validado)
- Análise preditiva de risco: identifica padrão de abandono antes de acontecer
- Score preventivo dinâmico: atualiza em tempo real conforme ações do usuário
- IA Corporativa: dashboard de risco preventivo por setor com sugestões de ação para RH
- Integração futura com wearables (Apple Health, Garmin) para ajuste de recomendações

### Schema Firestore
```
ai_recommendations/{rec_id}
  employee_id, company_id, created_at, expires_at
  type (vaccine|course|habit|service|campaign)
  priority, title, rationale, cta_url
  status (pending|shown|acted|dismissed)

ai_interactions/{interaction_id}
  employee_id, company_id, timestamp
  user_message, ai_response, intent_detected
  feedback_score (nullable)
```

### Telas/rotas
- `/app/ia` → hub de recomendações personalizadas
- `/app/ia/chat` → assistente conversacional
- `/admin/ia/corporativa` → IA de risco corporativo para RH

### Cloud Functions necessárias
- `generatePersonalRecommendations`: scheduled (semanal por usuário) — cria recomendações
- `aiChatHandler`: onCall — processa mensagem e retorna resposta (integração LLM)
- `detectChurnRisk`: scheduled (diário) — identifica usuários inativos e aciona reengajamento

### Critério de aceite
- [ ] Mínimo 3 recomendações personalizadas atualizadas a cada 7 dias
- [ ] Chat responde em menos de 3s para perguntas comuns sobre vacinação
- [ ] Notificação de reengajamento disparada após 14 dias de inatividade
- [ ] IA Corporativa identifica top 3 setores em risco no dashboard RH
- [ ] Recomendações nunca repetem conteúdo já concluído pelo usuário

---

## F13 — Índice de Saúde Preventiva Corporativa

**Sprint:** S2
**Prioridade:** Alta
**Dependências:** F01, F02, F04

### O que resolve
Empresas não possuem um indicador unificado de maturidade preventiva. O índice cria o
"score de crédito da saúde" — linguagem executiva que facilita venda para C-level e
justifica orçamento de RH/SST.

### Funcionalidades core
- Score geral 0–100 com 6 dimensões: cobertura vacinal, engajamento educacional, saúde ocupacional, saúde mental, hábitos preventivos, risco epidemiológico
- Classificação por nível: Alto Risco / Atenção / Boa Maturidade / Excelência
- Breakdown por departamento e unidade
- Evolução temporal com gráficos mensais
- Benchmark futuro por segmento de mercado (T3)
- Relatório executivo PDF para diretoria/ESG
- Indicadores de impacto financeiro: estimativa de redução de absenteísmo e sinistralidade

### Schema Firestore
```
preventive_indices/{company_id}
  updated_at, overall_score, classification
  dimensions: {
    vaccination: {score, coverage_pct, pending_count}
    education: {score, completion_rate, avg_watch_pct}
    occupational: {score}
    mental_health: {score}
    habits: {score}
    epidemiological_risk: {score, risk_level}
  }
  department_breakdown: {dept_name: {score, headcount}}
  score_history: [{date, score}]
  estimated_impact: {absenteeism_reduction_pct, annual_savings_brl}
```

### Telas/rotas
- `/app/indice` → dashboard principal do índice (RH/gestor)
- `/app/indice/departamentos` → breakdown por departamento
- `/app/indice/historico` → evolução temporal
- `/app/indice/relatorio` → exportação PDF para diretoria

### Cloud Functions necessárias
- `recalculatePreventiveIndex`: scheduled (semanal) — consolida todas as dimensões e atualiza índice
- `exportIndexReport`: onCall — gera PDF executivo com gráficos e indicadores

### Critério de aceite
- [ ] Score calculado a partir de pelo menos 4 dimensões com dados reais
- [ ] Gráfico de evolução mostra histórico dos últimos 6 meses
- [ ] Breakdown por departamento com cor indicando nível de risco
- [ ] PDF executivo gerado com logo da empresa e indicadores em até 15s
- [ ] Estimativa de impacto financeiro exibida na tela principal

---

## F14 — Universidade Corporativa White Label

**Sprint:** S3
**Prioridade:** Alta
**Dependências:** F03, F08, F09

### O que resolve
Empresas médias e grandes querem sua própria "universidade de saúde" com branding próprio.
O white label é o produto de maior ticket e recorrência — transforma a Vegl.ia em
infraestrutura invisível da educação preventiva corporativa.

### Funcionalidades core
- Configuração de tema visual por empresa: logo, cores, domínio personalizado (CSS variables)
- URL customizada (ex: saude.empresa.com.br) via subdomínio ou path /empresa/
- Catálogo de cursos customizável: empresa escolhe quais trilhas ficam disponíveis
- Criação de cursos proprietários pela empresa (upload de vídeo privado ou link YouTube não listado)
- Trilhas obrigatórias por cargo configuradas pelo RH
- Onboarding automático integrado com demissão/admissão (futuro: API TOTVS/SAP)
- Dashboard RH white label com branding da empresa
- Certificados emitidos com logo da empresa

### Schema Firestore
```
white_label_configs/{company_id}
  logo_url, primary_color, secondary_color, font_family
  custom_domain (nullable), subdomain
  enabled_features: [string]
  custom_course_ids: [course_id]
  mandatory_tracks_by_role: {role_name: [course_id]}

custom_courses/{course_id}
  company_id, title, description, modules: [...]
  created_by, created_at, is_white_label: true
```

### Telas/rotas
- `/empresa/:slug` → portal white label da empresa (landing e login)
- `/app` → dashboard interno com tema aplicado por CSS variables
- `/admin/white-label` → configuração do tema e catálogo pela empresa
- `/admin/white-label/cursos` → criação de cursos proprietários

### Cloud Functions necessárias
- `applyWhiteLabelTheme`: onCall — valida e salva configuração de tema
- `generateWhiteLabelCertificate`: onCall — emite certificado com logo da empresa

### Critério de aceite
- [ ] Tema aplicado (logo + cores) em menos de 1s ao carregar o portal
- [ ] Certificados emitidos exibem logo da empresa
- [ ] RH consegue criar trilha obrigatória para cargo específico
- [ ] Domínio personalizado funcional (config DNS documentada)
- [ ] CSS variables permitem troca completa de paleta sem redeploy

---

## F15 — Central de Saúde Familiar

**Sprint:** S3
**Prioridade:** Média
**Dependências:** F05, F04

### O que resolve
Benefício preventivo só para o colaborador tem valor limitado. Incluir a família aumenta
o LTV dramaticamente e cria vínculo emocional que torna o churn quase impossível.

### Funcionalidades core
- Gerenciamento de membros familiares: filhos, cônjuge, pais, dependentes
- Calendário vacinal individual por membro (com alertas)
- Score preventivo familiar agregado
- Jornadas de vida por membro: vacinação infantil, adolescência, idoso
- Alertas inteligentes por membro: reforço vacinal, check-ups, campanhas sazonais
- Gamificação familiar: pontuação coletiva por hábitos preventivos
- Empresa pode oferecer Central Familiar como benefício adicional (configuração por plano)

### Schema Firestore
```
family_health_hubs/{hub_id}
  owner_employee_id, company_id, created_at
  members: [{
    member_id, name, birth_date, relationship
    vaccine_history: [...], upcoming_alerts: [...]
    preventive_score: number
  }]
  family_preventive_score: number
  gamification_points: number
```

### Telas/rotas
- `/app/familia` → hub familiar com lista de membros
- `/app/familia/:member_id` → perfil e calendário do membro
- `/app/familia/:member_id/vacinas` → calendário vacinal do membro

### Cloud Functions necessárias
- `checkFamilyAlerts`: scheduled (diário) — verifica pendências de todos os membros
- `calculateFamilyScore`: onWrite em family_health_hubs — recalcula score familiar

### Critério de aceite
- [ ] Usuário consegue adicionar membro familiar em menos de 2 minutos
- [ ] Alerta de vacina pendente exibido na home do usuário
- [ ] Score familiar calculado como média ponderada dos membros
- [ ] Calendário vacinal infantil segue tabela SBIm atualizada

---

## F16 — Concierge Preventiva Digital

**Sprint:** S3
**Prioridade:** Média
**Dependências:** F12, F08

### O que resolve
A plataforma sem acompanhamento ativo é usada esporadicamente. A concierge garante
uso contínuo — é o produto de maior diferenciação competitiva e maior LTV individual.

### Funcionalidades core
- Acompanhamento ativo diário: notificações contextuais baseadas em perfil e comportamento
- Lembretes inteligentes: vacinas, cursos abandonados, check-ups, hábitos
- Recomendações proativas via IA: jornadas, conteúdos, serviços
- Interface conversacional humanizada (chat in-app ou WhatsApp)
- Plano preventivo semanal gerado automaticamente
- Acompanhamento de metas e hábitos (check-in diário/semanal)
- Versão corporativa: onboarding preventivo automatizado para novos colaboradores
- Plano VIP futuro: atendimento humano por médico parceiro

### Schema Firestore
```
concierge_plans/{plan_id}
  employee_id, company_id
  week_start, week_end
  daily_tasks: [{day, task_type, ref_id, title, completed}]
  focus_areas: [string]
  check_in_streak: number

concierge_interactions/{interaction_id}
  employee_id, timestamp, channel (app|whatsapp|email)
  interaction_type (reminder|recommendation|checkin|alert)
  content, action_taken (nullable)
```

### Telas/rotas
- `/app/concierge` → plano semanal e check-in diário
- `/app/concierge/chat` → interface conversacional
- `/app/concierge/historico` → histórico de interações e evolução

### Cloud Functions necessárias
- `generateWeeklyPlan`: scheduled (todo domingo) — cria plano preventivo semanal por usuário
- `sendDailyReminder`: scheduled (9h diário) — envia reminder personalizado
- `processConciergeCheckin`: onCall — processa check-in e atualiza streak

### Critério de aceite
- [ ] Plano semanal gerado automaticamente toda segunda-feira
- [ ] Reminder diário personalizado diferente para cada usuário
- [ ] Streak de check-in contabilizado e exibido visualmente
- [ ] Interação via chat responde em menos de 3s

---

## F17 — Ecossistema de Benefícios Preventivos

**Sprint:** S3
**Prioridade:** Média
**Dependências:** F09, F13

### O que resolve
Engajamento preventivo sem recompensa tangível tem vida curta. O ecossistema de
benefícios cria motivação extrínseca — prevenção vira vantagem percebida, não obrigação.

### Funcionalidades core
- Clube de benefícios: pontos acumulados por ações preventivas desbloqueiam descontos e vantagens
- Parceiros de benefícios: vacinação (Vacivitta), academias, farmácias, teleconsulta, telemedicina
- 4 níveis do clube: Bronze / Prata / Ouro / Platinum
- Cashback preventivo: porcentagem do valor de serviços parceiros retorna como pontos
- Benefícios corporativos: empresa subsidia programas e cria metas preventivas com recompensas
- IA de benefícios: sugere parceiros e programas baseados no perfil do usuário
- Integração com F09 (gamificação): mesma moeda de pontos

### Schema Firestore
```
benefit_partners/{partner_id}
  name, logo_url, category, description
  benefit_type (discount|cashback|access)
  discount_pct, cashback_pct, promo_code
  active: boolean

user_benefits/{user_benefit_id}
  employee_id, company_id, partner_id
  redeemed_at, value_brl, points_used

benefit_club_memberships/{employee_id}
  tier (bronze|silver|gold|platinum), points_balance
  tier_updated_at, total_points_earned
```

### Telas/rotas
- `/app/beneficios` → catálogo de benefícios por categoria
- `/app/beneficios/:partner_id` → detalhe do benefício e como resgatar
- `/app/beneficios/meu-clube` → nível atual, pontos e histórico
- `/admin/beneficios` → gestão de parceiros e benefícios

### Cloud Functions necessárias
- `redeemBenefit`: onCall — processa resgate e debita pontos
- `updateBenefitTier`: onWrite em gamification_profiles — avança tier quando threshold atingido

### Critério de aceite
- [ ] Usuário consegue ver todos os benefícios disponíveis em uma tela
- [ ] Resgate de benefício ocorre em menos de 3s
- [ ] Tier avança automaticamente ao atingir threshold de pontos
- [ ] Parceiro Vacivitta aparece em destaque com desconto em vacinação

---

## F18 — Marketplace de Saúde Preventiva

**Sprint:** S4
**Prioridade:** Média
**Dependências:** F07, F14, F17

### O que resolve
A Vegl.ia precisa de efeito de rede para criar barreira competitiva. O marketplace
conecta especialistas (médicos, nutricionistas, psicólogos, educators físicos) com
empresas e usuários — escala sem custo operacional próprio.

### Funcionalidades core
- Cadastro e perfil de especialistas: médicos, nutricionistas, psicólogos, fisioterapeutas, educadores físicos
- Catálogo de produtos/serviços: cursos, trilhas, mentorias, teleconsultas, workshops, palestras, eventos
- Sistema de busca e filtros: categoria, localização, preço, avaliação
- Sistema de avaliação e reputação de especialistas
- Controle de vendas e pagamentos (comissão 10–30%)
- Marketplace corporativo: RH contrata serviços diretamente (SIPAT, palestra, vacinação)
- Geolocalização: identifica profissionais próximos a unidades da empresa
- Certificação de especialistas: "Especialista Certificado Vegl.ia" (selo de qualidade)

### Schema Firestore
```
marketplace_providers/{provider_id}
  name, bio, specialty, credentials, photo_url
  ratings_avg, ratings_count, is_certified_veglia
  services: [{service_id, title, type, price, duration}]

marketplace_orders/{order_id}
  buyer_id, buyer_type (employee|company), company_id
  provider_id, service_id, amount_brl
  platform_fee_brl, status, created_at, confirmed_at
  review: {score, comment, reviewed_at}
```

### Telas/rotas
- `/marketplace` → vitrine pública de especialistas e serviços
- `/marketplace/:provider_id` → perfil do especialista
- `/marketplace/busca` → busca com filtros
- `/app/marketplace/corporativo` → contratação B2B por RH
- `/provider/dashboard` → painel do especialista (gestão de serviços e pedidos)

### Cloud Functions necessárias
- `processMarketplaceOrder`: onCall — processa pedido, notifica provider, inicia pagamento
- `releaseProviderPayment`: scheduled (D+30) — libera pagamento ao provider após janela de disputa
- `calculateProviderRating`: onWrite em marketplace_orders — recalcula rating após review

### Critério de aceite
- [ ] Especialista consegue criar perfil e publicar serviço em menos de 15 minutos
- [ ] Busca retorna resultados relevantes em menos de 2s
- [ ] Pedido processado e confirmado em menos de 10s
- [ ] RH consegue contratar SIPAT/palestra diretamente na plataforma
- [ ] Comissão calculada automaticamente e exibida ao provider

---

## F19 — Plataforma de Dados Epidemiológicos

**Sprint:** S4
**Prioridade:** Média
**Dependências:** F01, F04, F11, F13

### O que resolve
Os dados gerados pela plataforma têm valor comercial enorme para farmacêuticas, seguradoras
e clínicas. A camada de dados transforma a Vegl.ia de SaaS em empresa de inteligência
preventiva — ativo com valuation muito superior.

### Funcionalidades core
- Mapa preventivo nacional com heat maps por região e tema (vacinação, saúde mental, ergonomia)
- Benchmark por segmento: comparativo preventivo por setor econômico
- Índices nacionais: Índice Preventivo Regional, Índice Vacinal Corporativo, Índice de Saúde Mental
- Inteligência de expansão: identifica cidades e regiões com maior demanda preventiva
- Relatórios de tendências para indústria farmacêutica e seguradoras
- IA epidemiológica preditiva: prevê sazonalidades, surtos, picos de demanda
- Conformidade LGPD: todos os dados anonimizados e agregados antes da exposição

### Schema Firestore
```
epidemiological_snapshots/{snapshot_id}
  region_type (state|city|corporate_sector), region_id
  snapshot_date, data_source_count
  metrics: {
    vaccine_coverage_pct, mental_health_risk, ergonomic_risk
    top_vaccine_gaps, top_health_concerns
    preventive_index, trend_direction
  }

regional_trends/{region_id}
  region_name, region_type
  monthly_data: [{month, preventive_index, top_issues}]
  expansion_score: number
```

### Telas/rotas
- `/admin/inteligencia` → mapa nacional preventivo (admin interno)
- `/admin/inteligencia/regioes` → breakdown regional
- `/admin/inteligencia/relatorios` → geração de relatórios para parceiros

### Cloud Functions necessárias
- `aggregateEpidemiologicalData`: scheduled (semanal) — consolida dados anonimizados por região
- `generateTrendReport`: onCall — gera relatório de tendências para exportação/venda

### Critério de aceite
- [ ] Dados nunca expostos com identificação individual (anonimização obrigatória)
- [ ] Heat map exibe cobertura vacinal por estado/cidade
- [ ] Relatório de tendências exportável em PDF/JSON
- [ ] Score de expansão calculado para pelo menos 50 cidades

---

## F20 — Plataforma de Expansão Física Inteligente

**Sprint:** S4
**Prioridade:** Baixa
**Dependências:** F19

### O que resolve
A rede Vacivitta decide expansão de unidades sem dados de demanda real. A plataforma
transforma sinais digitais em inteligência territorial — reduz risco de abertura e
aumenta ROI de expansão física.

### Funcionalidades core
- Score de atratividade preventiva por cidade (0–100)
- Algoritmo de scoring: dados de plataforma + demografia + dados corporativos + epidemiologia
- Mapa interativo com ranking de cidades por oportunidade preventiva
- Identificação de clusters empresariais com alta demanda não atendida
- Sugestão automática de tipo de operação: clínica, unidade móvel, parceiro local
- Alertas de oportunidade: "Sorocaba apresenta crescimento acelerado de interesse em saúde corporativa"
- Integração com campanha: gera campanha de validação antes da abertura física

### Schema Firestore
```
expansion_scores/{city_id}
  city_name, state, population, calculated_at
  expansion_score: number
  score_components: {
    platform_demand, corporate_cluster, demographic_fit
    vaccine_coverage_gap, wellness_interest, competition_gap
  }
  suggested_operation_type: (clinic|mobile|partner)
  active_corporate_demand: [company_id]
```

### Telas/rotas
- `/admin/expansao` → mapa de expansão com ranking de cidades
- `/admin/expansao/:city_id` → detalhe de oportunidade por cidade

### Cloud Functions necessárias
- `calculateExpansionScores`: scheduled (mensal) — recalcula scores de todas as cidades monitoradas
- `detectExpansionOpportunity`: scheduled (semanal) — identifica mudanças significativas e alerta

### Critério de aceite
- [ ] Score calculado para pelo menos 100 cidades brasileiras
- [ ] Mapa interativo filtrável por score e tipo de operação
- [ ] Alerta disparado quando score de cidade aumenta >10 pontos em 30 dias

---

## F21 — IA Preditiva e Inteligência de Ecossistema

**Sprint:** S4
**Prioridade:** Baixa
**Dependências:** F12, F19, F20

### O que resolve
A IA transacional (F12) reage ao comportamento do usuário. A IA preditiva antecipa —
prevê surtos, risco de afastamento, abandono de plataforma, e oportunidades de campanha
antes que os eventos aconteçam.

### Funcionalidades core
- Previsão de risco de afastamento por colaborador (antes do evento)
- Antecipação de sazonalidades vacinais por região
- Predição de baixa adesão por setor antes de campanhas
- Benchmark preditivo por segmento
- Integração com seguradoras e operadoras: score preditivo como produto B2B
- API de inteligência preventiva para parceiros externos (farmacêuticas, planos de saúde)
- Modelo de ML treinado com dados históricos anonimizados da plataforma

### Schema Firestore
```
predictive_alerts/{alert_id}
  type (absenteeism_risk|churn_risk|outbreak_risk|campaign_opportunity)
  target_type (employee|sector|region|company)
  target_id, company_id, confidence_score
  predicted_at, predicted_for_date
  recommended_action, status (pending|acted|expired)
```

### Telas/rotas
- `/admin/ia-preditiva` → painel de alertas preditivos
- `/admin/ia-preditiva/modelos` → performance dos modelos de ML

### Cloud Functions necessárias
- `runPredictiveModels`: scheduled (diário) — executa modelos e cria alertas preditivos
- `exportPredictiveAPI`: onRequest — endpoint para parceiros externos consumirem inteligência

### Critério de aceite
- [ ] Alerta de risco de afastamento gerado com ao menos 7 dias de antecedência
- [ ] Confiança do modelo exibida junto ao alerta (%)
- [ ] API de parceiros documentada com autenticação por token

---

## BACKLOG PRIORIZADO

| Feature | Sprint | Complexidade | Valor de Negócio | Prioridade |
|---------|--------|-------------|-----------------|------------|
| F01 — Compliance em Saúde | S1 | Alta | Critica (porta de entrada Lei 15.377) | P1 |
| F03 — Trilhas Educacionais (Multi-Saúde) | S1 | Alta | Critica (produto principal MVP) | P1 |
| F04 — Calculadora Vacinal | S1 | Media | Alta (lead gen Vacivitta + motor demo VR) | P1 |
| F02 — Diagnóstico Preventivo | S1 | Media | Alta (personalização + demo) | P1 |
| F13 — Índice Preventivo Corporativo | S2 | Media | Alta (linguagem C-level, venda B2B) | P2 |
| F06 — Certificação para Empresas | S2 | Media | Alta (retenção + ESG + employer brand) | P2 |
| F05 — Passaporte de Saúde Digital | S2 | Media | Alta (retenção, vínculo emocional) | P2 |
| F10 — SIPAT Automática | S2 | Alta | Alta (dor imediata com budget reservado) | P2 |
| F08 — Jornadas de Vida | S2 | Alta | Alta (engajamento contínuo + LTV) | P2 |
| F07 — Canal de Conteúdo Médico | S2 | Media | Media (SEO + autoridade Dra. Amanda) | P3 |
| F09 — Gamificação Corporativa | S2 | Media | Media (engajamento, não critica no MVP) | P3 |
| F14 — Universidade White Label | S3 | Alta | Critica (maior ticket + carriers VR/Alelo) | P2 |
| F11 — Motor de Campanhas | S3 | Alta | Alta (automação de receita transacional) | P2 |
| F12 — IA Preventiva | S3 | Alta | Alta (diferencial competitivo) | P2 |
| F16 — Concierge Preventiva | S3 | Alta | Media (premium, pós-product-market-fit) | P3 |
| F15 — Central de Saúde Familiar | S3 | Media | Media (retenção B2C, não critica T1) | P3 |
| F17 — Ecossistema de Benefícios | S3 | Media | Media (retenção, pós estabilização) | P3 |
| F18 — Marketplace de Saúde | S4 | Alta | Alta (efeito de rede, escala T4) | P2 |
| F19 — Dados Epidemiológicos | S4 | Alta | Alta (valuation + parcerias indústria) | P2 |
| F20 — Expansão Física Inteligente | S4 | Media | Media (valor para Vacivitta, não SaaS) | P3 |
| F21 — IA Preditiva e Ecossistema | S4 | Alta | Alta (diferenciação absoluta T4) | P2 |

---

## Resumo MVP (S1 — demo VR)

Features obrigatórias para o demo VR (deadline 30/05):

1. **F01** — Dashboard de compliance com score e relatório CSV
2. **F03** — Trilhas com VegliaPlayer + certificado SHA-256 + progresso
3. **F04** — Calculadora vacinal com mapa individual
4. **F02** — Diagnóstico com score preventivo

Features que agregam impacto visual ao demo (nice-to-have):

5. **F13** — Índice corporativo (uma tela, dados mockados aceitáveis)
6. **F06** — Selo de certificação (imagem estática com os 4 níveis)

Features bloqueadas até S2 (disciplina MVP — decisão #01 CLAUDE.md):

- F08 Jornadas, F09 Gamificação, F10 SIPAT, F05 Passaporte, F07 Canal

---

## Notas técnicas para o dev

### Multi-tenant
Todo documento Firestore incluído neste spec já tem `company_id`. Security Rules
devem garantir que `request.auth.token.company_id == resource.data.company_id`
antes de qualquer leitura.

### Vídeos
Todos os videoIds são YouTube não-listado. Nunca hospedar vídeo no Storage.
videoIds ficam em `/config/videoIds` no Firestore com fallback hardcoded no hook
`useVideoIds.ts`. Admin troca via `/admin/conteudo` sem redeploy.

### Certificados
Geração sempre via Cloud Function `generateCertificate`. Client nunca gera certificado.
Hash SHA-256 calculado no server. PDF salvo em `Storage/certificates/{company_id}/{user_id}_{course_id}.pdf`.

### Score preventivo
Nunca calculado no client. Sempre via Cloud Function. Client apenas lê o score já calculado
do Firestore.

### White Label
Tema aplicado via CSS variables `--color-primary`, `--color-secondary`, `--font-family`.
Carregado no bootstrap da app a partir do doc `white_label_configs/{company_id}`.

### Autenticação
Custom claims obrigatórios: `company_id`, `role` (employee|rh|admin), `white_label_partner`.
Middleware valida claims em toda rota `/app/*` e `/admin/*`.
