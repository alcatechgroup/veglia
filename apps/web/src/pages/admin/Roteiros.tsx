import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ModuloStatus = "pronto" | "pendente";

interface Modulo {
  id: number;
  titulo: string;
  duracao: string;
  percurso: string;
  path: string;
  status: ModuloStatus;
}

type TabId = "colaborador-lei" | "colaborador-nr1" | "gestor-rh";

// ─── Dados · Colaborador ──────────────────────────────────────────────────────

const MODULOS_LEI_COLAB: Modulo[] = [
  {
    id: 1,
    titulo: "Lei e Compliance",
    duracao: "5 min",
    percurso: "Colaborador",
    path: "/roteiros/lei-15377/modulo-01-lei-compliance.md",
    status: "pronto",
  },
  {
    id: 2,
    titulo: "Vacinação",
    duracao: "5 min",
    percurso: "Colaborador",
    path: "/roteiros/lei-15377/modulo-02-vacinacao.md",
    status: "pronto",
  },
  {
    id: 3,
    titulo: "Prevenção de Cânceres",
    duracao: "5 min",
    percurso: "Colaborador",
    path: "/roteiros/lei-15377/modulo-03-prevencao-canceres.md",
    status: "pronto",
  },
  {
    id: 4,
    titulo: "Saúde Mental",
    duracao: "5 min",
    percurso: "Colaborador",
    path: "/roteiros/lei-15377/modulo-04-saude-mental.md",
    status: "pronto",
  },
];

const MODULOS_NR1_COLAB: Modulo[] = [
  {
    id: 1,
    titulo: "O que é a NR-1",
    duracao: "5 min",
    percurso: "Colaborador",
    path: "/roteiros/nr-1/modulo-01-o-que-e-nr1.md",
    status: "pronto",
  },
  {
    id: 2,
    titulo: "GRO e PGR",
    duracao: "5 min",
    percurso: "Colaborador",
    path: "/roteiros/nr-1/modulo-02-gro-pgr.md",
    status: "pronto",
  },
];

// ─── Dados · Gestor de RH ─────────────────────────────────────────────────────

const MODULOS_LEI_RH: Modulo[] = [
  {
    id: 1,
    titulo: "Lei e Compliance para o Gestor",
    duracao: "7 min",
    percurso: "Gestor de RH",
    path: "/roteiros/lei-15377/modulo-01-rh-lei-compliance.md",
    status: "pronto",
  },
  {
    id: 2,
    titulo: "Vacinação para o Gestor",
    duracao: "7 min",
    percurso: "Gestor de RH",
    path: "/roteiros/lei-15377/modulo-02-rh-vacinacao.md",
    status: "pronto",
  },
  {
    id: 3,
    titulo: "Prevenção de Cânceres para o Gestor",
    duracao: "7 min",
    percurso: "Gestor de RH",
    path: "/roteiros/lei-15377/modulo-03-rh-prevencao-canceres.md",
    status: "pronto",
  },
  {
    id: 4,
    titulo: "Saúde Mental para o Gestor",
    duracao: "7 min",
    percurso: "Gestor de RH",
    path: "/roteiros/lei-15377/modulo-04-rh-saude-mental.md",
    status: "pronto",
  },
];

const MODULOS_NR1_RH: Modulo[] = [
  {
    id: 1,
    titulo: "NR-1 para o Gestor",
    duracao: "7 min",
    percurso: "Gestor de RH",
    path: "/roteiros/nr-1/modulo-01-rh-o-que-e-nr1.md",
    status: "pronto",
  },
  {
    id: 2,
    titulo: "GRO e PGR para o Gestor",
    duracao: "7 min",
    percurso: "Gestor de RH",
    path: "/roteiros/nr-1/modulo-02-rh-gro-pgr.md",
    status: "pronto",
  },
];

// ─── Guia de produção ─────────────────────────────────────────────────────────

const GUIA_PRODUCAO = [
  {
    titulo: "Cenário principal — Trilha Lei 15.377",
    itens: [
      "Fundo sólido em azul-claro pastel (#C9DCE8) ou cream (#F4EDE0)",
      "Iluminação natural simulada — softbox lateral + key light frontal suave",
      "Enquadramento em meio-corpo (peito até o topo, 10% de respiro superior)",
      "Apresentadora: jaleco branco sobre blusa em tom mint ou sage",
    ],
  },
  {
    titulo: "Cenário secundário — Trilha NR-1",
    itens: [
      "Mesmo estúdio, com elementos discretos de ambiente corporativo (bookshelf, planta)",
      "Apresentador(a) em camisa branca ou azul-clara (sem terno, sem gravata)",
    ],
  },
  {
    titulo: "Adereços recomendados",
    itens: [
      "Tablet (apresentador pode segurar para gestos didáticos)",
      "Folder ou notebook editorial",
      "Flores ou planta verde discreta",
      "Nunca: estetoscópio, jaleco com ícone médico, prancheta com formulários genéricos",
    ],
  },
  {
    titulo: "Estrutura narrativa (todos os vídeos)",
    itens: [
      "1. Hook (0–15s) — pergunta provocativa ou número que prende atenção",
      "2. Apresentação do tema (15–45s) — o que o espectador vai aprender",
      "3. Conteúdo central (45s–X min) — 3 a 5 pontos-chave do roteiro",
      "4. Aplicação prática (últimos 60s) — o que fazer agora",
      "5. Encerramento (10s) — selo Vegl.ia + tagline «Quem vela cuida»",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrilhaLabel(trilha: "lei" | "nr1"): string {
  return trilha === "lei" ? "LEI" : "NR1";
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ModuloStatus }) {
  if (status === "pronto") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: "#5DD3A8", color: "#0B2545" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#0B2545]/40 inline-block" />
        Pronto
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
      Pendente
    </span>
  );
}

interface ModuloCardProps {
  modulo: Modulo;
  trilha: "lei" | "nr1";
  onVerRoteiro: (modulo: Modulo) => void;
}

function ModuloCard({ modulo, trilha, onVerRoteiro }: ModuloCardProps) {
  const numeroLabel = `${getTrilhaLabel(trilha)} 0${modulo.id}`;

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4"
      style={{ backgroundColor: "#F4EDE0", borderColor: "#C9A96E33" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono font-semibold tracking-widest"
            style={{ color: "#C9A96E" }}
          >
            {numeroLabel}
          </span>
          <StatusBadge status={modulo.status} />
        </div>
      </div>

      {/* Título */}
      <div>
        <h3 className="text-base font-semibold" style={{ color: "#1A3A5C" }}>
          {modulo.titulo}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "#1A3A5C99" }}>
          <span>Percurso: {modulo.percurso}</span>
          <span>·</span>
          <span>{modulo.duracao}</span>
        </div>
      </div>

      {/* Ação */}
      <div className="mt-auto">
        <button
          onClick={() => onVerRoteiro(modulo)}
          disabled={modulo.status === "pendente"}
          className="w-full rounded-xl py-2 text-sm font-medium transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={
            modulo.status === "pronto"
              ? { backgroundColor: "#1A3A5C", color: "#F4EDE0" }
              : { backgroundColor: "#1A3A5C22", color: "#1A3A5C" }
          }
        >
          {modulo.status === "pronto" ? "Ver roteiro" : "Em breve"}
        </button>
      </div>
    </div>
  );
}

interface ModalRoteiro {
  modulo: Modulo;
  conteudo: string | null;
  carregando: boolean;
  erro: string | null;
}

function RoteiroModal({
  modal,
  onFechar,
}: {
  modal: ModalRoteiro;
  onFechar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(11, 37, 69, 0.75)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#FBF8F1" }}
      >
        {/* Header do modal */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ backgroundColor: "#1A3A5C", borderColor: "#ffffff10" }}
        >
          <div>
            <p className="text-xs font-mono tracking-widest" style={{ color: "#C9A96E" }}>
              ROTEIRO
            </p>
            <h2 className="text-base font-semibold text-white mt-0.5">
              {modal.modulo.titulo}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#ffffff55" }}>
              Percurso {modal.modulo.percurso} · {modal.modulo.duracao}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none ml-4 shrink-0"
          >
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 p-6">
          {modal.carregando && (
            <div className="flex items-center justify-center py-16">
              <div
                className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#5DD3A8", borderTopColor: "transparent" }}
              />
            </div>
          )}
          {modal.erro && (
            <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
              {modal.erro}
            </div>
          )}
          {modal.conteudo && !modal.carregando && (
            <pre
              className="whitespace-pre-wrap text-sm leading-relaxed font-sans"
              style={{ color: "#1A3A5C" }}
            >
              {modal.conteudo}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex items-center justify-end shrink-0"
          style={{ borderColor: "#1A3A5C15" }}
        >
          <button
            onClick={onFechar}
            className="text-sm px-4 py-2 rounded-xl font-medium transition-all"
            style={{ backgroundColor: "#1A3A5C", color: "#F4EDE0" }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-seção dentro de uma tab (Lei ou NR-1) ────────────────────────────────

interface SecaoModulosProps {
  titulo: string;
  trilha: "lei" | "nr1";
  modulos: Modulo[];
  onVerRoteiro: (modulo: Modulo) => void;
}

function SecaoModulos({ titulo, trilha, modulos, onVerRoteiro }: SecaoModulosProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9A96E" }}>
          {titulo}
        </h3>
        <div className="h-px flex-1 opacity-15" style={{ backgroundColor: "#C9A96E" }} />
        <span className="text-xs font-mono" style={{ color: "#ffffff40" }}>
          {modulos.filter((m) => m.status === "pronto").length}/{modulos.length} prontos
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modulos.map((modulo) => (
          <ModuloCard
            key={`${trilha}-${modulo.id}`}
            modulo={modulo}
            trilha={trilha}
            onVerRoteiro={onVerRoteiro}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; count: number }[] = [
  { id: "colaborador-lei", label: "Lei 15.377 · Colaborador", count: MODULOS_LEI_COLAB.length },
  { id: "colaborador-nr1", label: "NR-1 · Colaborador", count: MODULOS_NR1_COLAB.length },
  { id: "gestor-rh", label: "Gestor de RH", count: MODULOS_LEI_RH.length + MODULOS_NR1_RH.length },
];

export default function Roteiros() {
  const [tabAtiva, setTabAtiva] = useState<TabId>("colaborador-lei");
  const [modal, setModal] = useState<ModalRoteiro | null>(null);

  const handleVerRoteiro = async (modulo: Modulo) => {
    setModal({ modulo, conteudo: null, carregando: true, erro: null });

    try {
      const res = await fetch(modulo.path);
      if (!res.ok) throw new Error(`Arquivo não encontrado (${res.status})`);
      const texto = await res.text();
      setModal({ modulo, conteudo: texto, carregando: false, erro: null });
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : "Erro ao carregar o roteiro.";
      setModal({ modulo, conteudo: null, carregando: false, erro: mensagem });
    }
  };

  const handleFecharModal = () => setModal(null);

  const todosModulos = [
    ...MODULOS_LEI_COLAB,
    ...MODULOS_NR1_COLAB,
    ...MODULOS_LEI_RH,
    ...MODULOS_NR1_RH,
  ];
  const totalProntos = todosModulos.filter((m) => m.status === "pronto").length;
  const total = todosModulos.length;

  return (
    <div className="space-y-8">
      {/* Cabeçalho da página */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F4EDE0" }}>
            Roteiros Educacionais
          </h1>
          <p className="text-sm mt-1" style={{ color: "#ffffff55" }}>
            {totalProntos} de {total} roteiros concluídos · 2 percursos · 3 trilhas
          </p>
        </div>
        <div
          className="rounded-xl px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "#5DD3A8", color: "#0B2545" }}
        >
          Sprint 1 · Fase T1
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1 w-fit flex-wrap"
        style={{ backgroundColor: "#0B2545" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabAtiva(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              tabAtiva === tab.id
                ? { backgroundColor: "#5DD3A8", color: "#0B2545" }
                : { color: "#ffffff55" }
            }
          >
            {tab.label}
            <span
              className="rounded-full px-1.5 py-0.5 text-xs font-mono leading-none"
              style={
                tabAtiva === tab.id
                  ? { backgroundColor: "#0B254530", color: "#0B2545" }
                  : { backgroundColor: "#ffffff15", color: "#ffffff55" }
              }
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      {tabAtiva === "colaborador-lei" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULOS_LEI_COLAB.map((modulo) => (
            <ModuloCard
              key={`lei-colab-${modulo.id}`}
              modulo={modulo}
              trilha="lei"
              onVerRoteiro={handleVerRoteiro}
            />
          ))}
        </div>
      )}

      {tabAtiva === "colaborador-nr1" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULOS_NR1_COLAB.map((modulo) => (
            <ModuloCard
              key={`nr1-colab-${modulo.id}`}
              modulo={modulo}
              trilha="nr1"
              onVerRoteiro={handleVerRoteiro}
            />
          ))}
        </div>
      )}

      {tabAtiva === "gestor-rh" && (
        <div className="space-y-8">
          <SecaoModulos
            titulo="Lei 15.377/2026"
            trilha="lei"
            modulos={MODULOS_LEI_RH}
            onVerRoteiro={handleVerRoteiro}
          />
          <SecaoModulos
            titulo="NR-1"
            trilha="nr1"
            modulos={MODULOS_NR1_RH}
            onVerRoteiro={handleVerRoteiro}
          />
        </div>
      )}

      {/* Guia de Produção */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold" style={{ color: "#F4EDE0" }}>
            Guia de Produção
          </h2>
          <div
            className="h-px flex-1 opacity-20"
            style={{ backgroundColor: "#F4EDE0" }}
          />
          <span className="text-xs font-mono" style={{ color: "#C9A96E" }}>
            SETUP · GRAVAÇÃO
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIA_PRODUCAO.map((bloco) => (
            <div
              key={bloco.titulo}
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: "#1A3A5C33", border: "1px solid #ffffff0d" }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "#5DD3A8" }}>
                {bloco.titulo}
              </h3>
              <ul className="space-y-1.5">
                {bloco.itens.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                    style={{ color: "#ffffff80" }}
                  >
                    <span
                      className="mt-1 shrink-0 h-1 w-1 rounded-full"
                      style={{ backgroundColor: "#C9A96E" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "#ffffff30" }}>
          Fonte: <code className="font-mono">content/roteiros/01-roteiro-12-videos.md</code>
        </p>
      </section>

      {/* Modal */}
      {modal && (
        <RoteiroModal modal={modal} onFechar={handleFecharModal} />
      )}
    </div>
  );
}
