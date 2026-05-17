import { useState } from "react";

type Period = { value: string; label: string; hint: string };

const PERIODS: Period[] = [
  { value: "today 7-d",  label: "7 dias",   hint: "últimos 7 dias" },
  { value: "today 1-m",  label: "30 dias",  hint: "últimos 30 dias" },
  { value: "today 12-m", label: "12 meses", hint: "últimos 12 meses" },
];

export default function TrendsWidget() {
  const [period, setPeriod] = useState(PERIODS[1]);
  const [loaded, setLoaded] = useState(false);

  const req = JSON.stringify({
    comparisonItem: [{ keyword: "lei 15377", geo: "BR", time: period.value }],
    category: 0,
    property: "",
  });

  const src = `https://trends.google.com/trends/embed/explore/TIMESERIES?req=${encodeURIComponent(req)}&tz=180&hl=pt-BR`;

  function handlePeriod(p: Period) {
    if (p.value === period.value) return;
    setLoaded(false);
    setPeriod(p);
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10">
      {/* Header dark */}
      <div className="bg-white/5 px-6 py-4 flex items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#5DD3A8] animate-pulse" />
          <div>
            <p className="text-white/80 text-sm font-semibold leading-none">
              Interesse de busca · "Lei 15.377"
            </p>
            <p className="text-white/30 text-xs mt-1">
              Google Trends · Brasil · escala 0–100 (pico relativo do período)
            </p>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period.value === p.value
                  ? "bg-[#5DD3A8]/15 text-[#5DD3A8] border border-[#5DD3A8]/30"
                  : "bg-white/5 text-white/35 border border-white/8 hover:text-white/60 hover:bg-white/8"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area — cream background to match Trends iframe */}
      <div className="relative bg-[#F8F6F1]">
        {/* Skeleton shown while iframe loads */}
        {!loaded && (
          <div className="absolute inset-0 z-10 bg-[#F8F6F1] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#5DD3A8]/40 border-t-[#5DD3A8] rounded-full animate-spin" />
            <p className="text-[#1A3A5C]/40 text-xs">Carregando dados do Google Trends…</p>
          </div>
        )}

        <iframe
          key={src}
          src={src}
          onLoad={() => setLoaded(true)}
          className="w-full border-0 block"
          style={{ height: 300 }}
          title="Google Trends – Lei 15.377"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Footer */}
      <div className="bg-white/3 border-t border-white/8 px-6 py-3 flex items-center justify-between">
        <p className="text-white/25 text-[11px]">
          100 = pico máximo de interesse no período · {period.hint}
        </p>
        <a
          href="https://trends.google.com/trends/explore?q=lei+15377&geo=BR"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#5DD3A8]/50 hover:text-[#5DD3A8] transition-colors"
        >
          Abrir no Trends ↗
        </a>
      </div>
    </div>
  );
}
