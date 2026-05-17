---
description: Gera briefing semanal por agente do xquads ativos na Vegl.ia
argument-hint: [opcional: nome do agente — ex: po, estrategista, dev, designer, edu]
---

Gere o briefing semanal para os agentes da equipe xquads que atuam na Vegl.ia.

**Argumentos:** $ARGUMENTS — se vazio, gera para todos os agentes; se especificado um agente, gera apenas para ele.

## Como executar

1. Leia `CLAUDE.md` para contexto e cronograma atual.
2. Leia `docs/strategy/02-briefing-tese-expandida.html` para mapeamento completo de responsabilidades por agente.
3. Verifique entregas anteriores do agente:
   - `git log --grep="@po" --oneline` (ou nome do agente)
   - Documentos relacionados em `docs/`
4. Gere o briefing da semana atual considerando:
   - O que foi entregue na semana anterior
   - Bloqueios identificados
   - Próximas entregas até sexta-feira

## Estrutura do briefing por agente

```
@xquads-[agente] · Semana X
─────────────────────────────

Status anterior
- [O que foi entregue]
- [O que ficou pendente e por quê]

Entregas desta semana
- [ ] Tarefa 1 com critério de aceite claro
- [ ] Tarefa 2 com critério de aceite claro
- [ ] Tarefa 3 com critério de aceite claro

Dependências
- Depende de [outro agente] para [coisa]
- Bloqueia [outro agente] em [coisa]

Critério de "pronto"
[O que precisa estar verdadeiro para considerar a semana entregue]

Risco principal
[O que pode dar errado e como mitigar]
```

## Agentes ativos na Vegl.ia

- **@xquads-po** — backlog, user stories, jornada
- **@xquads-estrategista** — análise competitiva, positioning
- **@xquads-planning** — modelo financeiro, P&L, unit economics
- **@xquads-techlead** — arquitetura, ADRs, decisões técnicas
- **@xquads-dev** — implementação React + Firebase
- **@xquads-designer** — UI, design system, telas
- **@xquads-edu** — design instrucional, trilhas
- **@xquads-copy** — UX writing, posts, pitch deck
- **@xquads-vendas** — pipeline, propostas, fechamento (em parceria com Fábio)

## Tom

Briefing curto, acionável, sem encheção. Cada tarefa precisa ser executável em 1-2 dias. Critérios de aceite são objetivos, não subjetivos.
