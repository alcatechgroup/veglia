// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ComItem {
  id: string;
  label: string;
  done: boolean;
}

export interface PerfilCopy {
  id: string;
  titulo: string;
  conteudo: string;
}

export interface PostLinkedIn {
  id: string;
  titulo: string;
  conteudo: string;
  canvaUrl?: string;
  pngUrl?: string;
}

export interface CarrosselSlide {
  numero: number;
  titulo: string;
  descricao: string;
}

export interface Carrossel {
  id: string;
  titulo: string;
  canvaUrl: string;
  slides: CarrosselSlide[];
}

export interface AssetMarca {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  icone: string;
}

// ─── Checklist de tarefas ─────────────────────────────────────────────────────

export const COM_ITEMS: ComItem[] = [
  { id: "c1",  label: "Landing page no ar (veglia.com.br)",                          done: false },
  { id: "c2",  label: "LinkedIn Page Vegl.ia criada",                                done: false },
  { id: "c3",  label: "Instagram @vegl.ia criado",                                   done: false },
  { id: "c4",  label: "Bio LinkedIn escrita",                                         done: true  },
  { id: "c5",  label: "Bio Instagram escrita",                                        done: true  },
  { id: "c6",  label: "Sobre LinkedIn escrito",                                       done: true  },
  { id: "c7",  label: "Post LinkedIn #1 — Lei 15.377 (copy pronto)",                 done: true  },
  { id: "c8",  label: "Post LinkedIn #2 — Burnout e NR-1 (copy pronto)",             done: true  },
  { id: "c9",  label: "Post LinkedIn #3 — Vacivitta autoridade (copy pronto)",       done: true  },
  { id: "c10", label: "Post LinkedIn #4 — Lançamento Vegl.ia (copy pronto)",         done: true  },
  { id: "c11", label: "Carrossel #1 — O que muda com a Lei 15.377 (design pronto)",  done: true  },
  { id: "c12", label: "Carrossel #2 — Calendário Vacinal do Adulto (design pronto)", done: true  },
  { id: "c13", label: "Carrossel #3 — Riscos psicossociais NR-1 (design pronto)",    done: true  },
  { id: "c14", label: "Carrossel #4 — Como a Vegl.ia funciona (design pronto)",      done: true  },
  { id: "c15", label: "4 posts LinkedIn publicados",                                  done: false },
  { id: "c16", label: "4 carrosséis Instagram publicados",                            done: false },
  { id: "c17", label: "Deck de pitch VR finalizado",                                  done: true  },
];

// ─── Perfis ───────────────────────────────────────────────────────────────────

export const PERFIS: PerfilCopy[] = [
  {
    id: "bio-instagram",
    titulo: "Bio Instagram (@vegl.ia)",
    conteudo: `Compliance preventivo corporativo. Powered by Vacivitta. Autoridade médica real. Lei 15.377/2026.
Quem vela, cuida.`,
  },
  {
    id: "bio-linkedin",
    titulo: "Headline LinkedIn",
    conteudo: `Compliance Preventivo Corporativo · Para RHs que precisam cumprir a Lei 15.377/2026 e cuidar do time na mesma plataforma · Powered by Vacivitta · Auditoria trabalhista em um clique`,
  },
  {
    id: "sobre-linkedin",
    titulo: "Sobre LinkedIn",
    conteudo: `A Lei 15.377/2026 criou uma obrigação que nenhum RH pode ignorar: comunicar, treinar, registrar e auditar campanhas de saúde dos colaboradores. Sem exceção de porte. Sem exceção de setor. E com passivo trabalhista real para quem não cumprir.

O problema não é a lei. O problema é que ela chegou sem infraestrutura. O RH que já zelava agora precisa vigiar — e fazer isso sozinho, entre uma demissão e um processo seletivo, é a receita para o compliance virar passivo silencioso.

A Vegl.ia resolve isso.

Somos a plataforma de Compliance Preventivo Corporativo do Brasil. Em um único ambiente, o RH comunica obrigações da lei, treina colaboradores em saúde preventiva, registra adesão e gera certificados com hash SHA-256 — evidência auditável que protege a empresa em qualquer fiscalização ou ação trabalhista.

Não somos uma plataforma de e-learning. Somos infraestrutura de saúde corporativa contínua.

Nascemos dentro do ecossistema Vacivitta — dez anos de operação real de vacinação corporativa no Brasil. Cada conteúdo educacional da Vegl.ia é validado pela Dra. Amanda Conde Perez Fernandes: pediatra, neonatologista, nutróloga, membro da SBIm e diretora médica da Vacivitta. Não é IA genérica produzindo texto sobre vacina. É autoridade médica com rosto, histórico e responsabilidade científica.

Como funciona: o RH aplica o diagnóstico de adequação, a plataforma gera o plano de ação personalizado, colaboradores concluem as trilhas e a empresa recebe o dossiê auditável. Trinta dias do zero à conformidade.

Para quem é: gerentes e diretores de RH, DHOs e departamentos jurídicos de empresas com 100 a 5.000 colaboradores. Para quem precisa de prova — não de promessa.

Quem vela, cuida.`,
  },
];

// ─── Posts LinkedIn ───────────────────────────────────────────────────────────

export const POSTS_LINKEDIN: PostLinkedIn[] = [
  {
    id: "post-1",
    titulo: "Post #1 — Lei 15.377/2026 (educativo)",
    canvaUrl: "https://www.canva.com/d/68xGb55i7N_WT2l",
    conteudo: `A maioria dos RHs sabe que a Lei 15.377 existe. Poucos sabem o que ela exige de verdade.

Ela não pede um cartaz na cantina. Ela não pede um e-mail de campanha de vacinação no outubro rosa.

Ela inseriu o artigo 169-A na CLT. E esse artigo tem quatro obrigações concretas para toda empresa com empregado CLT — independente de porte ou setor:

1. Comunicar campanhas oficiais de vacinação — com registro de que o colaborador foi informado.

2. Orientar sobre HPV, câncer de mama, colo de útero e próstata — conteúdo regular, não eventual.

3. Informar sobre o direito à ausência para exames preventivos — sem desconto, com prazo de aviso.

4. Documentar tudo de forma auditável — política interna, treinamentos realizados, evidência que resiste a fiscalização.

Não basta fazer. Precisa provar que fez.

E aí está o vão onde a maioria das empresas vai se machucar: a lei entrou em vigor em abril de 2026, o Ministério do Trabalho pode autuar, e ação trabalhista por omissão não exige acidente — exige negligência documentada.

Você já tem o dossiê que protege sua empresa?

Faz sentido? Comenta aqui ou me manda mensagem. Posso mostrar o que a Vegl.ia gera de evidência auditável em 30 dias.

#compliance #lei15377 #saudecorporativa #recursoshumanos #leitrabalhista #auditoria #saudepreventiva #NR1`,
  },
  {
    id: "post-2",
    titulo: "Post #2 — Saúde mental + NR-1 (provocação)",
    canvaUrl: "https://www.canva.com/d/yQM3sXEeH7uBhos",
    conteudo: `Burnout entrou no CID-11. A NR-1 revisada tornou riscos psicossociais obrigatórios no GRO. E quase nenhuma empresa sabe o que fazer com isso na prática.

Não é exagero. É o que eu ouço de RH em RH.

A revisão da NR-1 foi clara: a empresa agora precisa identificar, avaliar e documentar os riscos psicossociais do trabalho dentro do Gerenciamento de Riscos Ocupacionais. Isso inclui — explicitamente — estresse crônico, sobrecarga, assédio organizacional e os fatores que levam ao burnout.

O que mudou para o RH na prática:

Antes, bem-estar era programa voluntário. Iniciativa bonita no relatório de ESG.

Agora, é obrigação do PGR. Quem não mapear os riscos psicossociais não tem GRO completo. Quem não tem GRO completo está irregular perante o Ministério do Trabalho.

O que precisa estar documentado:

→ Mapeamento dos fatores de risco psicossocial por função
→ Ações preventivas implementadas
→ Treinamentos de conscientização realizados
→ Evidência de comunicação ativa com a equipe

A parte difícil não é entender o que fazer. É transformar isso em processo repetível, rastreável e auditável — sem contratar mais um consultor para cada ciclo de adequação.

É exatamente o que a Vegl.ia resolve na camada de saúde mental e NR-1.

Se o tema é urgente na sua empresa, me manda mensagem. Vamos trocar uma ideia sem pressão.

#NR1 #saudemental #burnout #compliance #saudecorporativa #recursoshumanos #riscos #leitrabalhista #saudepreventiva #SIPAT`,
  },
  {
    id: "post-3",
    titulo: "Post #3 — Vacivitta + autoridade médica (credibilidade)",
    canvaUrl: "https://www.canva.com/d/voWqoRCnaPsVTA_",
    conteudo: `A Vegl.ia não é mais uma plataforma de e-learning corporativo. E a diferença está em quem assina o conteúdo.

Existe uma diferença enorme entre conteúdo sobre vacina gerado por IA de propósito geral e conteúdo validado por quem vacina o Brasil há dez anos.

A Vacivitta opera uma das redes mais respeitadas de imunização humanizada do país. Não é parceiro de papel. É a espinha dorsal operacional da Vegl.ia — quem traz a operação real de vacinação corporativa para dentro da plataforma.

E no centro dessa autoridade está a Dra. Amanda Conde Perez Fernandes.

Pediatra. Neonatologista. Nutróloga. Membro da SBIm — a Sociedade Brasileira de Imunizações. Diretora médica da Vacivitta.

Cada módulo educacional que o colaborador da sua empresa conclui na Vegl.ia foi estruturado e validado por ela. Cada informação sobre calendário vacinal adulto, prevenção de cânceres e saúde preventiva tem responsabilidade científica — não é conteúdo de blog reformatado em slide.

Isso importa por uma razão prática: quando sua empresa é fiscalizada ou enfrenta uma ação trabalhista, a qualidade do conteúdo do treinamento é parte da defesa. Conteúdo com autoria médica rastreável pesa diferente de conteúdo genérico.

Compliance robusto começa com evidência de qualidade.

Curioso para saber como as trilhas da Vegl.ia são estruturadas? Comenta ou me manda mensagem.

#vacinacaocorporativa #saudecorporativa #compliance #medicinapreventiva #recursoshumanos #lei15377 #saudepreventiva #SIPAT #saudenotrabalho`,
  },
  {
    id: "post-4",
    titulo: "Post #4 — Lançamento / founder story (Rodolfo)",
    canvaUrl: "https://www.canva.com/d/ncNiLSdgZhicpYZ",
    conteudo: `Três pessoas decidiram construir a infraestrutura de saúde preventiva do ambiente corporativo brasileiro. Deixa eu te contar por que.

O Thiago lidera a Vacivitta há mais de uma década. Sabe o que é vacinar empresa grande, equipe de campo, time de logística. Sabe que o elo fraco nunca é a vacina — é o registro, a comunicação, a prova de que aconteceu.

O Fábio passou vinte anos formando médicos via Top Formaturas. Conhece cada canal de relacionamento com os profissionais de saúde desse país. Sabe que confiança não se compra — se constrói em cada formatura, em cada entrega.

Eu construí tecnologia. Trabalhei com IA antes de virar pauta de podcast. Sei onde a plataforma resolve o que o processo manual não aguenta.

Quando a Lei 15.377/2026 foi sancionada em abril, nenhum dos três precisou convencer o outro. A lei abriu uma obrigação que 5 milhões de empresas precisam cumprir — e o mercado ainda não tinha a infraestrutura para isso.

Nasceu a Vegl.ia.

Uma plataforma onde o RH diagnostica o gap de adequação, colaboradores percorrem trilhas de saúde preventiva validadas por autoridade médica real, e a empresa gera o dossiê auditável que protege contra passivo trabalhista.

Não é projeto piloto. É uma joint venture entre três sócios que têm pele em jogo.

Estamos em fase de lançamento. Se você é RH de uma empresa média ou grande, quero muito trocar uma ideia.

#empreendedorismo #saudecorporativa #compliance #lei15377 #recursoshumanos #leitrabalhista #vacinacaocorporativa #saudepreventiva`,
  },
];

// ─── Carrosséis ───────────────────────────────────────────────────────────────

export const CARROSSEIS: Carrossel[] = [
  {
    id: "carrossel-1",
    titulo: "Carrossel #1 — O que muda com a Lei 15.377/2026",
    canvaUrl: "https://www.canva.com/d/MawSnKafbpgFkRL",
    slides: [
      { numero: 1, titulo: "Capa", descricao: "A lei que mudou o compliance de saúde nas empresas brasileiras. O que o seu RH precisa saber agora. (arrasta →)" },
      { numero: 2, titulo: "O problema", descricao: "Em vigor desde abril de 2026. Toda empresa com empregado CLT tem novas obrigações. Não importa o porte. Não importa o setor." },
      { numero: 3, titulo: "Obrigação 1 — Comunicar", descricao: "Comunicar campanhas oficiais de vacinação. A empresa precisa documentar que o colaborador foi informado — não basta enviar o e-mail." },
      { numero: 4, titulo: "Obrigação 2 — Orientar", descricao: "Orientar sobre prevenção de cânceres. Mama, colo do útero, próstata, HPV. Conteúdo regular e auditável — não eventual." },
      { numero: 5, titulo: "Obrigação 3 — Informar", descricao: "Informar sobre o direito à ausência. O colaborador pode se ausentar para exames preventivos sem desconto no salário." },
      { numero: 6, titulo: "Obrigação 4 — Documentar", descricao: "Documentar tudo. Política interna registrada. Treinamentos realizados. Evidência que resiste à fiscalização do Ministério do Trabalho." },
      { numero: 7, titulo: "Consequências", descricao: "Quem não cumpre: autuação pelo Ministério do Trabalho, ação trabalhista por omissão, passivo silencioso que vira problema caro." },
      { numero: 8, titulo: "CTA", descricao: "Sua empresa está pronta? A Vegl.ia gera o diagnóstico de adequação e o dossiê auditável em 30 dias. Powered by Vacivitta · Quem vela, cuida." },
    ],
  },
  {
    id: "carrossel-2",
    titulo: "Carrossel #2 — Calendário Vacinal do Adulto",
    canvaUrl: "https://www.canva.com/d/tuuYmifDPlr9TOj",
    slides: [
      { numero: 1, titulo: "Capa", descricao: "Vacina não é só coisa de criança. O calendário vacinal do adulto que todo brasileiro precisa conhecer. (Powered by Vacivitta · Dra. Amanda Conde)" },
      { numero: 2, titulo: "Contexto", descricao: "A maioria dos adultos parou de vacinar depois da infância. Mas o corpo não para de precisar de proteção. Reforços vencem. Vírus evoluem. Prevenção salva." },
      { numero: 3, titulo: "Gripe (Influenza)", descricao: "Todo ano, de preferência antes do outono. Em ambiente coletivo, o risco de disseminação é alto. Disponível no SUS e em clínicas privadas." },
      { numero: 4, titulo: "HPV", descricao: "Até 45 anos para mulheres e homens. Previne cânceres de colo do útero, pênis, garganta e região anal. A Lei 15.377 exige que sua empresa oriente sobre isso." },
      { numero: 5, titulo: "Hepatite B", descricao: "3 doses para quem nunca vacinou. Transmissão por contato com sangue ou fluidos. Gratuita no SUS para toda a população." },
      { numero: 6, titulo: "Tétano e Difteria", descricao: "Reforço a cada 10 anos. Gestantes e profissionais de saúde: esquema específico. A maioria dos adultos está desprotegida sem saber." },
      { numero: 7, titulo: "COVID-19", descricao: "Atualize o esquema conforme calendário do Ministério da Saúde. Doses bivalentes disponíveis. Infecção ativa afasta o colaborador e sobrecarrega o time." },
      { numero: 8, titulo: "CTA", descricao: "Sua empresa garante que o time está vacinado? A Vacivitta leva a vacinação corporativa até você. A Vegl.ia registra, documenta e cumpre a lei. Quem vela, cuida." },
    ],
  },
  {
    id: "carrossel-3",
    titulo: "Carrossel #3 — Riscos psicossociais NR-1",
    canvaUrl: "https://www.canva.com/d/H5App1GcUBl6hPG",
    slides: [
      { numero: 1, titulo: "Capa", descricao: "A NR-1 mudou. Burnout agora é obrigação legal. O que mudou e o que você precisa fazer antes de ser autuado." },
      { numero: 2, titulo: "O que são riscos psicossociais", descricao: "Pressão excessiva, falta de autonomia, assédio, conflito de papéis, sobrecarga crônica. Antes: tema de RH humanizado. Agora: obrigação do PGR." },
      { numero: 3, titulo: "O que entrou no GRO", descricao: "A revisão da NR-1 incluiu riscos psicossociais no GRO. GRO incompleto = empresa irregular perante o Ministério do Trabalho." },
      { numero: 4, titulo: "O que o RH precisa documentar", descricao: "Mapeamento dos fatores de risco por função. Ações preventivas implementadas. Treinamentos realizados. Evidência de comunicação com a equipe." },
      { numero: 5, titulo: "Como conscientizar a equipe", descricao: "Treinamento documentado + política interna clara = empresa protegida. Ação trabalhista por omissão não precisa de acidente — precisa de negligência comprovada." },
      { numero: 6, titulo: "CTA", descricao: "A Vegl.ia tem trilha específica de NR-1 e riscos psicossociais. Módulo validado. Certificado auditável. Dossiê para o RH. Quem vela, cuida." },
    ],
  },
  {
    id: "carrossel-4",
    titulo: "Carrossel #4 — Como a Vegl.ia funciona",
    canvaUrl: "https://www.canva.com/d/Y_LwWjGJG2FkdLq",
    slides: [
      { numero: 1, titulo: "Capa", descricao: "Compliance preventivo. Sem complicação. Como a Vegl.ia coloca sua empresa em conformidade com a Lei 15.377/2026 em 30 dias." },
      { numero: 2, titulo: "O problema", descricao: "O RH que cuida do time agora também precisa vigiar. Comunicar. Treinar. Registrar. Auditar. Tudo isso com evidência que resiste à fiscalização." },
      { numero: 3, titulo: "Passo 1 — Diagnóstico", descricao: "A plataforma avalia o gap atual da empresa em relação à Lei 15.377 e NR-1. Em minutos, o RH sabe exatamente o que está faltando. Gratuito. Sem compromisso." },
      { numero: 4, titulo: "Passo 2 — Trilhas", descricao: "Os colaboradores percorrem módulos educacionais de vacinação, prevenção de cânceres e saúde mental. Conteúdo validado pela Dra. Amanda Conde." },
      { numero: 5, titulo: "Passo 3 — Certificado auditável", descricao: "Cada conclusão gera um certificado com hash SHA-256. O RH tem o dossiê completo: quem fez, quando fez, qual conteúdo. Pronto para qualquer fiscalização." },
      { numero: 6, titulo: "Powered by Vacivitta", descricao: "Vacivitta — 10 anos de vacinação corporativa real no Brasil. Dra. Amanda Conde Perez Fernandes — pediatra, neonatologista, nutróloga, membro SBIm." },
      { numero: 7, titulo: "CTA", descricao: "Solicite uma demo. 30 dias do zero à conformidade. Dashboard do RH. Trilhas para colaboradores. Dossiê auditável. vegl.ia · Quem vela, cuida." },
    ],
  },
];

// ─── Assets de marca ──────────────────────────────────────────────────────────

export const ASSETS_MARCA: AssetMarca[] = [
  {
    id: "brandbook",
    titulo: "Brandbook",
    descricao: "Identidade visual completa — cores, tipografia, logo",
    href: "/docs/design/01-brandbook.html",
    icone: "◈",
  },
  {
    id: "iconografia",
    titulo: "Iconografia Linecraft",
    descricao: "Sistema de ícones 1.5px, geometria circular",
    href: "/docs/design/02-iconografia-linecraft.html",
    icone: "◻",
  },
  {
    id: "vacivitta",
    titulo: "Símbolo Vacivitta",
    descricao: "Rebranding com V duplo em mint",
    href: "/docs/design/07-vacivitta-simbolo-marca.html",
    icone: "⬡",
  },
  {
    id: "landing",
    titulo: "Landing Page HTML",
    descricao: "Versão HTML completa da landing institucional",
    href: "/docs/design/04-landing-page-completa.html",
    icone: "▶",
  },
  {
    id: "pitch-vr",
    titulo: "Deck de Pitch VR",
    descricao: "10 slides · Parceria estratégica VR Benefícios · Mai/2026",
    href: "https://www.canva.com/d/YwNQdhjCKxzzPUO",
    icone: "◆",
  },
];
