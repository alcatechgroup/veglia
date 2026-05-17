# MÓDULO 1 · LEI E COMPLIANCE PARA O GESTOR · TRILHA LEI 15.377/2026 · PERCURSO GESTOR DE RH
**Duração:** 7 min | **Apresentadores:** Dra. Amanda Conde Perez Fernandes + Advogado(a) Trabalhista Convidado(a) | **Percurso:** Gestor de RH

---

## HOOK (0–15s)

**[Dra. Amanda]**
A Lei 15.377/2026 entrou em vigor. Não é projeto de lei, não é regulamentação pendente — é texto promulgado, com prazo contado. A pergunta que todo gestor de RH precisa responder hoje é simples: a sua empresa está documentada para resistir a uma auditoria do Ministério do Trabalho? Se você não sabe responder com certeza, os próximos sete minutos são para você.

---

## APRESENTAÇÃO DO TEMA (15–45s)

**[Dra. Amanda]**
Eu sou a Dra. Amanda, médica e diretora médica da Vacivitta. Neste módulo, vou estar com um especialista em direito trabalhista para que você entenda não apenas o que a lei diz — mas o que ela exige que você, como gestor de RH, faça e documente. Vamos passar pelas quatro obrigações exatas da empresa, o que configura descumprimento, as consequências legais, e como a plataforma Vegl.ia serve como evidência de compliance. Ao final, você terá um checklist concreto para sair daqui e agir.

---

## CONTEÚDO CENTRAL (45s–6min)

### Ponto 1 — As quatro obrigações legais da empresa

**[Advogado(a)]**
A Lei 15.377/2026 alterou a CLT e estabeleceu quatro obrigações expressas para empresas que mantêm empregados regidos pela Consolidação das Leis do Trabalho. Não importa o porte da empresa, o setor ou o número de colaboradores — todas estão sujeitas.

Primeira obrigação: **informar sobre campanhas de vacinação**. A empresa precisa comunicar ativamente o colaborador sobre campanhas vigentes — datas, locais, vacinas disponíveis e cobertura. Informar uma vez no mural não é suficiente. A lei exige evidência de que a comunicação chegou ao trabalhador.

Segunda obrigação: **orientar sobre vacinas que previnem cânceres**. Isso inclui HPV, hepatite B e outras vacinas com relação oncológica comprovada. A orientação precisa ser formal, com conteúdo médico referenciado — não um cartaz genérico.

Terceira obrigação: **conscientizar sobre cânceres detectáveis precocemente**. Câncer de mama, colo de útero, próstata e pele são os prioritários. A empresa precisa provar que realizou atividades de conscientização — treinamentos, campanhas, materiais distribuídos.

Quarta obrigação: **documentar o cumprimento de todas as anteriores**. Esta é a obrigação que mais empresas vão descumprir sem perceber. Não basta fazer — é preciso ter registro. Log de acesso a treinamentos, listas de presença, comunicados assinados, certificados gerados.

> *[INSERT GRÁFICO: quadro com as 4 obrigações em colunas — ícone + nome da obrigação + "o que conta como evidência"]*

### Ponto 2 — O que configura descumprimento e as penalidades

**[Advogado(a)]**
O Ministério do Trabalho e Emprego tem competência para fiscalizar e autuar empresas com base na Lei 15.377. Vou ser direto sobre o que isso significa na prática.

Autuação administrativa: multa calculada por infração, por estabelecimento e — em alguns casos — por trabalhador afetado. O valor base pode ser multiplicado por reincidência. Empresas de médio e grande porte podem chegar a seis dígitos em uma única autuação.

Risco trabalhista individual: o colaborador que não recebeu as informações exigidas pode mover ação trabalhista alegando violação a direito legal. Dependendo do resultado de saúde — um câncer diagnosticado tardiamente, uma doença evitável por vacina — o dano moral e material pode ser significativo.

Risco reputacional: autuações do MTE são registros públicos. Em processos de due diligence, licitação pública ou certificação ESG, ausência de compliance em saúde preventiva começa a aparecer como passivo.

O ponto crítico: **a empresa não se exime provando que "tentou"**. Ela se exime provando que **fez e documentou**. Essa distinção é o que separa uma empresa protegida de uma empresa vulnerável.

### Ponto 3 — O que o RH precisa guardar para uma auditoria

**[Dra. Amanda]**
Falando agora do ponto de vista da operação de RH: quais documentos precisam existir e por quanto tempo?

Primeiro: **certificados de conclusão de treinamento** por colaborador. Com data, módulo concluído, nota obtida e identificação da plataforma. O padrão mínimo é PDF com hash SHA-256 — que garante que o documento não foi adulterado depois de emitido.

Segundo: **logs de acesso aos módulos educacionais**. Data e hora de acesso, duração da sessão, progresso por módulo. Isso é o que a Vegl.ia registra automaticamente no Firestore — e pode ser exportado em relatório para o RH a qualquer momento.

Terceiro: **registros de comunicação ao colaborador**. E-mail com confirmação de leitura, mensagem no sistema interno com timestamp, ou assinatura digital no aceite de comunicado. O canal importa menos do que a evidência de entrega.

Quarto: **data de vigência dos certificados**. A maioria dos módulos da Vegl.ia tem validade declarada de 12 meses. O RH precisa gerenciar renovações antes do vencimento para não criar lacunas de cobertura.

Prazo de guarda sugerido: **5 anos**, por analogia com o prazo prescricional trabalhista. É o mesmo critério de conservação de CTPS, recibos de salário e acordos coletivos.

### Ponto 4 — Como a Vegl.ia funciona como evidência de compliance

**[Dra. Amanda]**
A plataforma Vegl.ia foi estruturada do início com o objetivo de ser auditável. Não é uma funcionalidade adicionada depois — é um princípio de arquitetura.

Cada colaborador que conclui um módulo recebe um certificado em PDF com hash SHA-256. O hash é único, imutável e verificável: qualquer fiscal pode pegar aquele PDF, rodar o hash e confirmar que o documento é autêntico e não foi modificado.

O painel do gestor de RH consolida o status de conclusão por colaborador, por departamento e por empresa em tempo real. Se uma auditoria chega amanhã, o RH exporta o relatório hoje — sem precisar de planilha manual, sem margem para erro humano.

Os trilhas da plataforma foram desenvolvidas com base nos exatos requisitos da Lei 15.377 e validadas pela Dra. Amanda — o que significa que o conteúdo tem respaldo médico documentado, algo que inspetores do trabalho cada vez mais consideram na avaliação de qualidade do programa.

Em resumo: a Vegl.ia não é apenas um sistema de e-learning. É a camada de evidência que transforma a boa intenção do RH em proteção jurídica real para a empresa.

> *[INSERT GRÁFICO: fluxo simplificado — Colaborador conclui módulo → Certificado SHA-256 gerado → Log registrado no Firestore → Relatório exportável para RH → Evidência de compliance em auditoria]*

---

## CHECKLIST DO GESTOR (6min–6min40s)

**[Dra. Amanda]**
Antes de encerrar, o checklist concreto para você sair daqui e agir:

**Um:** mapear qual porcentagem da sua força de trabalho CLT já concluiu os módulos obrigatórios da Lei 15.377. Se estiver abaixo de 80%, você tem uma lacuna de compliance que precisa de plano de ação.

**Dois:** verificar se os certificados emitidos têm padrão auditável — hash SHA-256, data, identificação do colaborador e validade declarada. Certificados sem essas informações não servem como evidência em auditoria.

**Três:** checar se os registros de comunicação ao colaborador estão guardados com evidência de entrega — não apenas de envio. Há diferença entre "mandei o e-mail" e "tenho confirmação de que o colaborador recebeu e reconheceu".

**Quatro:** definir o prazo de renovação dos certificados antes do vencimento. Crie um alerta no calendário do RH para 30 dias antes do vencimento de cada lote de certificados.

**Cinco:** confirmar com a sua equipe jurídica ou de compliance se o programa de treinamento da empresa atende as quatro obrigações da lei — informação, orientação, conscientização e documentação. Se houver dúvida em qualquer um dos quatro pilares, é melhor resolver agora do que na auditoria.

---

## ENCERRAMENTO (6min40s–7min)

**[Dra. Amanda]**
Compliance não é o objetivo — é o piso. A Lei 15.377 define o mínimo que toda empresa deve oferecer. O RH que entende isso sai na frente: usa a obrigação legal como ponto de partida para construir uma cultura de saúde preventiva real, que reduz absenteísmo, melhora engajamento e gera dados para decisões mais inteligentes. A Vegl.ia foi construída para os dois: para cumprir a lei e para ir além dela. Quem vela, cuida.

> *[SELO VEGL.IA + TAGLINE "Quem vela, cuida." + Validação Dra. Amanda Conde · Vacivitta · Advogado(a) Trabalhista Convidado(a)]*

---

## NOTAS DE DIREÇÃO

- **Tom:** técnico e executivo — o gestor de RH precisa sair com clareza de risco, não com ansiedade. Equilibrar urgência legal com orientação prática
- **Formato sugerido:** mesa de dois apresentadores (Dra. Amanda + advogado(a)); Dra. Amanda apresenta e conduz, advogado(a) entra nos Pontos 1 e 2 para dar autoridade jurídica, Dra. Amanda retoma nos Pontos 3, 4 e Checklist
- **Gestos sugeridos:** advogado(a) ao citar as quatro obrigações conta nos dedos com firmeza; Dra. Amanda ao apresentar o checklist usa lista visual na tela
- **Insert gráfico recomendado:** Ponto 1 — quadro comparativo "obrigação da empresa vs. evidência mínima aceitável"; Ponto 4 — fluxo de auditabilidade da Vegl.ia
- **Ritmo:** mais rápido do que o percurso Colaborador — gestor de RH valoriza densidade de informação; pausas apenas nos pontos de risco jurídico para que a gravidade assente
- **Figurino:** Dra. Amanda — jaleco branco sobre blusa mint; advogado(a) — blazer sóbrio, sem gravata obrigatória
- **Fundo:** azul-claro pastel (#C9DCE8) — transmite credibilidade institucional
