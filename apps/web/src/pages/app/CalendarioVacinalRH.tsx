import React, { useState, useEffect } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusVacina = "em_dia" | "proxima_30d" | "atrasada" | "nao_aplicavel";

interface RegistroVacina {
  vacina: string;
  ultima_dose: string | null;
  proxima_dose: string | null;
  status: StatusVacina;
}

interface ColaboradorVacinal {
  id: string;
  nome: string;
  cargo: string;
  idade: number;
  sexo: "F" | "M";
  vacinacoes: RegistroVacina[];
}

type ViewMode = "lista" | "por_vacina";
type FiltroStatus = "todos" | "em_dia" | "proxima_30d" | "atrasada";

// ─── Mock de dados ────────────────────────────────────────────────────────────

const VACINAS_COLUNAS = [
  "Influenza 2026",
  "Hepatite B",
  "dT/dTpa",
  "HPV",
  "Febre Amarela",
  "Varicela",
] as const;

type NomeVacina = (typeof VACINAS_COLUNAS)[number];

const COLABORADORES: ColaboradorVacinal[] = [
  {
    id: "c1",
    nome: "Ana Paula Silva",
    cargo: "Analista de RH",
    idade: 34,
    sexo: "F",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2026-03-10",
        proxima_dose: "2027-03-10",
        status: "em_dia",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2025-11-01",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2024-06-15",
        proxima_dose: "2034-06-15",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: null,
        proxima_dose: "2026-06-01",
        status: "proxima_30d",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: "2022-08-20",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Varicela",
        ultima_dose: "2010-04-10",
        proxima_dose: null,
        status: "em_dia",
      },
    ],
  },
  {
    id: "c2",
    nome: "Carlos Eduardo Mendes",
    cargo: "Gerente Comercial",
    idade: 42,
    sexo: "M",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2025-04-15",
        proxima_dose: "2026-04-15",
        status: "atrasada",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2020-02-10",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2019-07-01",
        proxima_dose: "2029-07-01",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: null,
        proxima_dose: null,
        status: "nao_aplicavel",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: "2018-01-05",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Varicela",
        ultima_dose: null,
        proxima_dose: "2026-05-25",
        status: "proxima_30d",
      },
    ],
  },
  {
    id: "c3",
    nome: "Fernanda Torres Costa",
    cargo: "Coordenadora Financeira",
    idade: 29,
    sexo: "F",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2026-04-02",
        proxima_dose: "2027-04-02",
        status: "em_dia",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2026-01-15",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2023-09-20",
        proxima_dose: "2033-09-20",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: "2023-11-10",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: "2021-12-03",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Varicela",
        ultima_dose: "2005-03-14",
        proxima_dose: null,
        status: "em_dia",
      },
    ],
  },
  {
    id: "c4",
    nome: "Ricardo Almeida Souza",
    cargo: "Desenvolvedor Sênior",
    idade: 37,
    sexo: "M",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: null,
        proxima_dose: "2026-05-30",
        status: "proxima_30d",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2024-08-22",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2024-11-18",
        proxima_dose: "2034-11-18",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: null,
        proxima_dose: null,
        status: "nao_aplicavel",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: "2023-05-07",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Varicela",
        ultima_dose: "2007-06-30",
        proxima_dose: null,
        status: "em_dia",
      },
    ],
  },
  {
    id: "c5",
    nome: "Beatriz Oliveira Lima",
    cargo: "Assistente Jurídica",
    idade: 26,
    sexo: "F",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2026-04-28",
        proxima_dose: "2027-04-28",
        status: "em_dia",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2025-03-10",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2022-01-20",
        proxima_dose: "2032-01-20",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: null,
        proxima_dose: "2026-06-10",
        status: "proxima_30d",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: null,
        proxima_dose: null,
        status: "nao_aplicavel",
      },
      {
        vacina: "Varicela",
        ultima_dose: "2009-08-05",
        proxima_dose: null,
        status: "em_dia",
      },
    ],
  },
  {
    id: "c6",
    nome: "Marcelo Ferreira Nunes",
    cargo: "Diretor de Operações",
    idade: 51,
    sexo: "M",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2025-03-20",
        proxima_dose: "2026-03-20",
        status: "atrasada",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2015-06-01",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2025-02-14",
        proxima_dose: "2035-02-14",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: null,
        proxima_dose: null,
        status: "nao_aplicavel",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: "2020-09-11",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Varicela",
        ultima_dose: null,
        proxima_dose: null,
        status: "nao_aplicavel",
      },
    ],
  },
  {
    id: "c7",
    nome: "Juliana Castro Pereira",
    cargo: "Especialista em Marketing",
    idade: 31,
    sexo: "F",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2026-04-10",
        proxima_dose: "2027-04-10",
        status: "em_dia",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2024-10-05",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2023-03-07",
        proxima_dose: "2033-03-07",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: "2022-08-19",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: null,
        proxima_dose: "2026-05-28",
        status: "proxima_30d",
      },
      {
        vacina: "Varicela",
        ultima_dose: "2004-11-22",
        proxima_dose: null,
        status: "em_dia",
      },
    ],
  },
  {
    id: "c8",
    nome: "Thiago Martins Rodrigues",
    cargo: "Analista de Suporte",
    idade: 24,
    sexo: "M",
    vacinacoes: [
      {
        vacina: "Influenza 2026",
        ultima_dose: "2026-05-01",
        proxima_dose: "2027-05-01",
        status: "em_dia",
      },
      {
        vacina: "Hepatite B",
        ultima_dose: "2025-07-14",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "dT/dTpa",
        ultima_dose: "2024-04-03",
        proxima_dose: "2034-04-03",
        status: "em_dia",
      },
      {
        vacina: "HPV",
        ultima_dose: null,
        proxima_dose: null,
        status: "nao_aplicavel",
      },
      {
        vacina: "Febre Amarela",
        ultima_dose: "2024-02-20",
        proxima_dose: null,
        status: "em_dia",
      },
      {
        vacina: "Varicela",
        ultima_dose: null,
        proxima_dose: "2026-06-05",
        status: "proxima_30d",
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function getStatusVacinaColaborador(
  colaborador: ColaboradorVacinal,
  nomeVacina: NomeVacina
): StatusVacina {
  const registro = colaborador.vacinacoes.find((v) => v.vacina === nomeVacina);
  return registro?.status ?? "nao_aplicavel";
}

function colaboradorTemStatusGeral(
  colaborador: ColaboradorVacinal,
  filtro: FiltroStatus
): boolean {
  if (filtro === "todos") return true;
  return colaborador.vacinacoes.some((v) => v.status === filtro);
}

function colaboradorStatusGlobal(
  colaborador: ColaboradorVacinal
): "em_dia" | "proxima_30d" | "atrasada" {
  const vacinacoes = colaborador.vacinacoes.filter(
    (v) => v.status !== "nao_aplicavel"
  );
  if (vacinacoes.some((v) => v.status === "atrasada")) return "atrasada";
  if (vacinacoes.some((v) => v.status === "proxima_30d")) return "proxima_30d";
  return "em_dia";
}

function exportCSV(colaboradores: ColaboradorVacinal[]): void {
  const headers = [
    "Nome",
    "Cargo",
    "Idade",
    "Sexo",
    ...VACINAS_COLUNAS.map((v) => `${v} - Status`),
    ...VACINAS_COLUNAS.map((v) => `${v} - Última dose`),
    ...VACINAS_COLUNAS.map((v) => `${v} - Próxima dose`),
  ];

  const rows = colaboradores.map((col) => {
    const statusCells = VACINAS_COLUNAS.map((vacina) => {
      const registro = col.vacinacoes.find((v) => v.vacina === vacina);
      if (!registro || registro.status === "nao_aplicavel") return "Não aplicável";
      if (registro.status === "em_dia") return "Em dia";
      if (registro.status === "proxima_30d") return "Próxima 30d";
      return "Atrasada";
    });
    const ultimaDoseCells = VACINAS_COLUNAS.map((vacina) => {
      const registro = col.vacinacoes.find((v) => v.vacina === vacina);
      return formatDate(registro?.ultima_dose ?? null);
    });
    const proximaDoseCells = VACINAS_COLUNAS.map((vacina) => {
      const registro = col.vacinacoes.find((v) => v.vacina === vacina);
      return formatDate(registro?.proxima_dose ?? null);
    });
    return [
      col.nome,
      col.cargo,
      String(col.idade),
      col.sexo === "F" ? "Feminino" : "Masculino",
      ...statusCells,
      ...ultimaDoseCells,
      ...proximaDoseCells,
    ];
  });

  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calendario-vacinal-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Chips de status ──────────────────────────────────────────────────────────

interface StatusChipProps {
  status: StatusVacina;
  small?: boolean;
}

function StatusChip({ status, small = false }: StatusChipProps) {
  const base = small
    ? "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
    : "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap";

  if (status === "em_dia") {
    return (
      <span className={`${base} text-[#5DD3A8] bg-[#5DD3A8]/10`}>
        <span className="text-[8px]">●</span> Em dia
      </span>
    );
  }
  if (status === "proxima_30d") {
    return (
      <span className={`${base} text-[#C9A96E] bg-[#C9A96E]/10`}>
        <span className="text-[8px]">●</span> 30 dias
      </span>
    );
  }
  if (status === "atrasada") {
    return (
      <span className={`${base} text-red-400 bg-red-500/10`}>
        <span className="text-[8px]">●</span> Atrasada
      </span>
    );
  }
  return <span className="text-white/25 text-xs">—</span>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: "mint" | "champagne" | "red" | "default";
}

function KpiCard({ label, value, sub, color = "default" }: KpiCardProps) {
  const valueColor =
    color === "mint"
      ? "text-[#5DD3A8]"
      : color === "champagne"
      ? "text-[#C9A96E]"
      : color === "red"
      ? "text-red-400"
      : "text-white";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Detalhe de linha expandível (view lista) ─────────────────────────────────

interface DetalheColaboradorProps {
  colaborador: ColaboradorVacinal;
}

function DetalheColaborador({ colaborador }: DetalheColaboradorProps) {
  return (
    <tr className="bg-white/[0.04] border-b border-white/5">
      <td colSpan={VACINAS_COLUNAS.length + 2} className="px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {colaborador.vacinacoes.map((v) => (
            <div
              key={v.vacina}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5"
            >
              <p className="text-[11px] font-semibold text-white/70 mb-1.5 leading-tight">
                {v.vacina}
              </p>
              <StatusChip status={v.status} small />
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] text-white/30">
                  Última:{" "}
                  <span className="text-white/50">
                    {formatDate(v.ultima_dose)}
                  </span>
                </p>
                {v.proxima_dose && (
                  <p className="text-[10px] text-white/30">
                    Próxima:{" "}
                    <span className="text-white/50">
                      {formatDate(v.proxima_dose)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

// ─── Tooltip de ação ──────────────────────────────────────────────────────────

interface AcaoTooltipProps {
  onClose: () => void;
}

function AcaoTooltip({ onClose }: AcaoTooltipProps) {
  return (
    <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-[#0d2d58] border border-white/15 rounded-xl shadow-xl p-3">
      <p className="text-[11px] text-white/50 mb-2 leading-snug">
        Solicite vacinação in-company via VaciVitta
      </p>
      <a
        href="/app/in-company"
        className="flex items-center gap-1.5 text-[#5DD3A8] text-xs font-semibold hover:underline"
        onClick={onClose}
      >
        Solicitar via In-Company VaciVitta →
      </a>
    </div>
  );
}

// ─── View Lista ───────────────────────────────────────────────────────────────

interface ViewListaProps {
  colaboradores: ColaboradorVacinal[];
  filtroVacina: string;
}

function ViewLista({ colaboradores, filtroVacina }: ViewListaProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  useEffect(() => {
    if (!tooltipId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest("[data-tooltip-anchor]")) setTooltipId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tooltipId]);

  const vacinasFiltradas: readonly NomeVacina[] =
    filtroVacina === "todas"
      ? VACINAS_COLUNAS
      : VACINAS_COLUNAS.filter((v) => v === filtroVacina);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3 min-w-[180px]">
                Nome / Cargo
              </th>
              {vacinasFiltradas.map((vacina) => (
                <th
                  key={vacina}
                  className="text-left text-[11px] font-medium text-white/30 px-3 py-3 min-w-[96px]"
                >
                  {vacina}
                </th>
              ))}
              <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3 min-w-[120px]">
                Acao
              </th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((col, idx) => (
              <React.Fragment key={col.id}>
                <tr
                  key={col.id}
                  onClick={() => toggleExpand(col.id)}
                  className={`border-b border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors ${
                    idx % 2 === 0 ? "" : "bg-white/[0.02]"
                  } ${expandedId === col.id ? "bg-white/[0.05]" : ""}`}
                >
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-white">{col.nome}</p>
                    <p className="text-[11px] text-white/35">{col.cargo}</p>
                  </td>
                  {vacinasFiltradas.map((vacina) => (
                    <td key={vacina} className="px-3 py-3.5">
                      <StatusChip
                        status={getStatusVacinaColaborador(col, vacina)}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3.5 relative">
                    <div className="relative inline-block">
                      <div data-tooltip-anchor className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTooltipId((prev) =>
                              prev === col.id ? null : col.id
                            );
                          }}
                          className="text-[11px] text-[#5DD3A8] font-semibold hover:underline whitespace-nowrap"
                        >
                          Solicitar vacina →
                        </button>
                        {tooltipId === col.id && (
                          <AcaoTooltip
                            onClose={() => setTooltipId(null)}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                {expandedId === col.id && (
                  <DetalheColaborador key={`${col.id}-detail`} colaborador={col} />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {colaboradores.length === 0 && (
        <div className="px-6 py-10 text-center text-white/30 text-sm">
          Nenhum colaborador encontrado para os filtros selecionados.
        </div>
      )}
    </div>
  );
}

// ─── View Por vacina ──────────────────────────────────────────────────────────

interface ViewPorVacinaProps {
  colaboradores: ColaboradorVacinal[];
  filtroVacina: string;
}

function MiniDonut({
  emDia,
  total,
}: {
  emDia: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.round((emDia / total) * 100);
  const circunferencia = 2 * Math.PI * 16;
  const dashOffset = circunferencia - (pct / 100) * circunferencia;

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="#5DD3A8"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div>
        <p className="text-lg font-bold text-white leading-none">{pct}%</p>
        <p className="text-[10px] text-white/35 mt-0.5">
          {emDia}/{total} em dia
        </p>
      </div>
    </div>
  );
}

function ViewPorVacina({ colaboradores, filtroVacina }: ViewPorVacinaProps) {
  const vacinasFiltradas: readonly NomeVacina[] =
    filtroVacina === "todas"
      ? VACINAS_COLUNAS
      : VACINAS_COLUNAS.filter((v) => v === filtroVacina);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {vacinasFiltradas.map((vacina) => {
        const registros = colaboradores
          .map((col) => ({
            colaborador: col,
            registro: col.vacinacoes.find((v) => v.vacina === vacina),
          }))
          .filter((r) => r.registro?.status !== "nao_aplicavel");

        const total = registros.length;
        const emDia = registros.filter((r) => r.registro?.status === "em_dia").length;
        const atrasados = registros
          .filter((r) => r.registro?.status === "atrasada")
          .map((r) => r.colaborador);
        const proximos = registros
          .filter((r) => r.registro?.status === "proxima_30d")
          .map((r) => r.colaborador);

        return (
          <div
            key={vacina}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
          >
            {/* Header do card */}
            <div>
              <p className="text-[11px] font-medium text-[#5DD3A8]/60 uppercase tracking-wide mb-0.5">
                Vacina
              </p>
              <h3 className="text-base font-bold text-white leading-tight">
                {vacina}
              </h3>
            </div>

            {/* Donut */}
            <MiniDonut emDia={emDia} total={total} />

            {/* Atrasados */}
            {atrasados.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wide mb-1.5">
                  Atrasados ({atrasados.length})
                </p>
                <div className="space-y-1">
                  {atrasados.map((col) => (
                    <p key={col.id} className="text-xs text-red-400">
                      {col.nome}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Proximos 30d */}
            {proximos.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#C9A96E]/70 uppercase tracking-wide mb-1.5">
                  Próximos 30d ({proximos.length})
                </p>
                <div className="space-y-1">
                  {proximos.map((col) => (
                    <p key={col.id} className="text-xs text-[#C9A96E]">
                      {col.nome}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Botão in-company */}
            <div className="mt-auto pt-2 border-t border-white/5">
              <a
                href="/app/in-company"
                className="text-[11px] text-[#5DD3A8] font-semibold hover:underline"
              >
                Solicitar in-company VaciVitta →
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Legenda ──────────────────────────────────────────────────────────────────

function Legenda() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/40">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#5DD3A8] inline-block" />
        Em dia
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#C9A96E] inline-block" />
        Próxima nos próximos 30 dias
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        Atrasada / vencida
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-white/25 font-semibold">—</span>
        Nao aplicavel
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CalendarioVacinalRH() {
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroVacina, setFiltroVacina] = useState<string>("todas");

  // KPIs
  const total = COLABORADORES.length;
  const emDiaTotal = COLABORADORES.filter(
    (c) => colaboradorStatusGlobal(c) === "em_dia"
  ).length;
  const proximos30d = COLABORADORES.filter(
    (c) => colaboradorStatusGlobal(c) === "proxima_30d"
  ).length;
  const atrasados = COLABORADORES.filter(
    (c) => colaboradorStatusGlobal(c) === "atrasada"
  ).length;

  // Filtros aplicados
  const colaboradoresFiltrados = COLABORADORES.filter((col) => {
    const passaStatus = colaboradorTemStatusGeral(col, filtroStatus);
    const passaVacina =
      filtroVacina === "todas"
        ? true
        : col.vacinacoes.some((v) => v.vacina === filtroVacina);
    return passaStatus && passaVacina;
  });

  const PILLS: { label: string; value: FiltroStatus }[] = [
    { label: "Todos", value: "todos" },
    { label: "Em dia", value: "em_dia" },
    { label: "Proximos 30d", value: "proxima_30d" },
    { label: "Atrasados", value: "atrasada" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
            Calendario Vacinal · VaciVitta
          </p>
          <h1 className="text-2xl font-bold text-white">
            Calendario Vacinal Corporativo
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-sm text-white/40">
              Acompanhe o status vacinal de toda a equipe · integrado ao
              calendario SBIm 2026/27
            </p>
            <span className="text-[10px] font-semibold text-[#5DD3A8]/60 bg-[#5DD3A8]/8 border border-[#5DD3A8]/20 px-2 py-0.5 rounded-full tracking-wide shrink-0">
              Powered by VaciVitta
            </span>
          </div>
        </div>
        <button
          onClick={() => exportCSV(colaboradoresFiltrados)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          <span className="text-base leading-none">↓</span>
          Exportar CSV
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Colaboradores monitorados"
          value={total}
          sub="total na plataforma"
        />
        <KpiCard
          label="Em dia com todas as vacinas"
          value={emDiaTotal}
          sub={`${Math.round((emDiaTotal / total) * 100)}% da equipe`}
          color="mint"
        />
        <KpiCard
          label="Vacinas nos proximos 30 dias"
          value={proximos30d}
          sub="requerem atencao"
          color="champagne"
        />
        <KpiCard
          label="Com vacinas atrasadas"
          value={atrasados}
          sub="acoes imediatas"
          color="red"
        />
      </div>

      {/* ── Barra de filtros + toggle de view ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Pills de status */}
        <div className="flex items-center gap-2 flex-wrap">
          {PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setFiltroStatus(pill.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                filtroStatus === pill.value
                  ? "bg-[#5DD3A8] text-[#0B2545]"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {pill.label}
            </button>
          ))}

          {/* Select de vacina */}
          <select
            value={filtroVacina}
            onChange={(e) => setFiltroVacina(e.target.value)}
            className="text-xs font-medium bg-white/5 border border-white/10 text-white/60 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#5DD3A8]/40 transition-colors cursor-pointer"
          >
            <option value="todas">Todas as vacinas</option>
            {VACINAS_COLUNAS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle lista / por vacina */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setViewMode("lista")}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "lista"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            ≡ Lista
          </button>
          <button
            onClick={() => setViewMode("por_vacina")}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "por_vacina"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            ▦ Por vacina
          </button>
        </div>
      </div>

      {/* ── Views ── */}
      {viewMode === "lista" ? (
        <ViewLista
          colaboradores={colaboradoresFiltrados}
          filtroVacina={filtroVacina}
        />
      ) : (
        <ViewPorVacina
          colaboradores={colaboradoresFiltrados}
          filtroVacina={filtroVacina}
        />
      )}

      {/* ── Legenda ── */}
      <div className="border-t border-white/5 pt-4">
        <Legenda />
      </div>

      {/* ── Rodape ── */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-[11px] text-white/25 text-center leading-relaxed">
          Calendario vacinal baseado no calendario SBIm/VaciVitta 2026/27 ·
          atualizado automaticamente
          <br />
          Powered by VaciVitta · Dra. Amanda Conde Perez Fernandes
        </p>
      </div>
    </div>
  );
}
