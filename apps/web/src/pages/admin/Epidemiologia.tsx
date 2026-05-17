import { useState } from "react";

// ─── Dados seed: mapa de calor SP ────────────────────────────────────────────

interface RegionData {
  name: string;
  vaccination_index: number; // 0-100
  alert?: string;
  diseases: string[];
}

const SP_REGIONS: RegionData[] = [
  {
    name: "Capital — Centro",
    vaccination_index: 72,
    diseases: ["Dengue", "Leptospirose"],
    alert: "Alerta dengue: indice alto em fevereiro",
  },
  {
    name: "Capital — Zona Leste",
    vaccination_index: 58,
    diseases: ["Dengue", "Influenza"],
    alert: "Cobertura vacinal influenza abaixo do ideal",
  },
  {
    name: "Capital — Zona Sul",
    vaccination_index: 65,
    diseases: ["COVID-19", "Dengue"],
  },
  {
    name: "Capital — Zona Norte",
    vaccination_index: 61,
    diseases: ["Influenza", "Sarampo"],
    alert: "Sarampo: queda na cobertura MMR",
  },
  {
    name: "Grande SP — ABC",
    vaccination_index: 74,
    diseases: ["Influenza", "COVID-19"],
  },
  {
    name: "Grande SP — Guarulhos",
    vaccination_index: 56,
    diseases: ["Dengue", "Hepatite A"],
    alert: "Dengue: emergencia declarada",
  },
  {
    name: "Interior — Campinas",
    vaccination_index: 81,
    diseases: ["Influenza"],
  },
  {
    name: "Interior — Ribeirão Preto",
    vaccination_index: 78,
    diseases: ["Influenza", "COVID-19"],
  },
];

// ─── Alertas epidemiologicos vigentes ────────────────────────────────────────

const ACTIVE_ALERTS: Array<{ id: number; disease: string; level: AlertLevel; region: string; recommendation: string }> = [
  {
    id: 1,
    disease: "Dengue",
    level: "high",
    region: "Grande SP — Guarulhos",
    recommendation: "Recomendar vacina contra dengue (Dengvaxia/Qdenga) para colaboradores na regiao",
  },
  {
    id: 2,
    disease: "Influenza",
    level: "medium",
    region: "Estado de SP",
    recommendation: "Campanha de vacinacao anual — calendario disponivel no canal VaciVitta",
  },
  {
    id: 3,
    disease: "COVID-19",
    level: "low",
    region: "Nacional",
    recommendation: "Vacina bivalente disponivel — reforco para maiores de 60 anos e imunocomprometidos",
  },
];

type AlertLevel = "high" | "medium" | "low";

const ALERT_COLORS: Record<AlertLevel, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/30",
  medium: "text-[#C9A96E] bg-[#C9A96E]/10 border-[#C9A96E]/30",
  low: "text-[#5DD3A8] bg-[#5DD3A8]/10 border-[#5DD3A8]/30",
};

const ALERT_LABELS: Record<AlertLevel, string> = {
  high: "Emergencia",
  medium: "Atencao",
  low: "Informativo",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function indexColor(index: number): string {
  if (index >= 75) return "bg-[#5DD3A8]";
  if (index >= 60) return "bg-[#C9A96E]";
  return "bg-red-500";
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Epidemiologia() {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Plataforma Epidemiologica</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Monitoramento de doencas e indices de vacinacao por regiao
        </p>
      </div>

      {/* Nota de dados */}
      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <span className="text-white/30 shrink-0">◎</span>
        <p className="text-xs text-white/40">
          Dados baseados no OpenDataSUS e boletins epidemiologicos do CVE-SP.
          Atualizacao: mai/2026. Em producao: integracao automatica via API do Ministerio da Saude.
        </p>
      </div>

      {/* Alertas vigentes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Alertas Epidemiologicos Vigentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ACTIVE_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-2xl p-4 space-y-2 ${ALERT_COLORS[alert.level]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{alert.disease}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-current/10">
                  {ALERT_LABELS[alert.level]}
                </span>
              </div>
              <p className="text-xs opacity-70">{alert.region}</p>
              <p className="text-xs opacity-60 leading-relaxed">{alert.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa de calor por regiao */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">
            Indice de Vacinacao por Regiao — Estado de SP
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {SP_REGIONS.map((region) => (
            <div
              key={region.name}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                selectedRegion?.name === region.name
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              onClick={() =>
                setSelectedRegion(
                  selectedRegion?.name === region.name ? null : region
                )
              }
            >
              {/* Indicador de nivel */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${indexColor(region.vaccination_index)}`}
              />

              {/* Nome */}
              <span className="text-sm text-white/70 w-48 shrink-0">{region.name}</span>

              {/* Barra */}
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${indexColor(region.vaccination_index)}`}
                  style={{ width: `${region.vaccination_index}%` }}
                />
              </div>

              {/* Percentual */}
              <span className="text-sm font-semibold text-white w-10 text-right shrink-0">
                {region.vaccination_index}%
              </span>

              {/* Alerta */}
              {region.alert && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full shrink-0">
                  Alerta
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detalhe da regiao selecionada */}
      {selectedRegion && (
        <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">{selectedRegion.name}</h3>
          {selectedRegion.alert && (
            <p className="text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-xl">
              {selectedRegion.alert}
            </p>
          )}
          <div>
            <p className="text-xs text-white/40 mb-2">Doencas prevalentes:</p>
            <div className="flex gap-2 flex-wrap">
              {selectedRegion.diseases.map((d) => (
                <span
                  key={d}
                  className="text-xs text-[#5DD3A8] bg-[#5DD3A8]/10 px-3 py-1 rounded-full"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/40">
            Recomendacao: verificar colaboradores na regiao e recomendar vacinas especificas
            via campanha na plataforma.
          </p>
        </div>
      )}
    </div>
  );
}
