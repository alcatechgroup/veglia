import { Link } from "react-router-dom";
import { FEATURES } from "@/data/roadmap";
import { SPRINT_ITEMS } from "@/data/sprint";
import { DECISOES_PENDENTES } from "@/data/decisoes";
import { useChecklist } from "@/hooks/useChecklist";
import TrendsWidget from "@/components/TrendsWidget";
import ClaudeUsageWidget from "@/components/ClaudeUsageWidget";
import OneDriveWidget from "@/components/OneDriveWidget";
import CoworkSummaryWidget from "@/components/CoworkSummaryWidget";

export default function Overview() {
  const { checked } = useChecklist();

  // Variáveis mantidas para futura reativação dinâmica dos KPIs
  void FEATURES;
  void SPRINT_ITEMS;
  void checked;
  void DECISOES_PENDENTES;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Sprint 1 · Semana 1 de 12
        </p>
        <h1 className="text-3xl font-bold text-white">Visão Geral</h1>
        <p className="text-white/40 mt-1 text-sm">
          Vegl.ia · Plataforma de Compliance Preventivo Corporativo
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link to="/admin/roadmap"><KpiCard label="Features MVP" value="F01–F06" sub="6 de 6 completas ✓" accent="mint" /></Link>
        <Link to="/admin/sprint"><KpiCard label="Sprint 1" value="Semana 2" sub="94% concluído" accent="champagne" /></Link>
        <Link to="/admin/roadmap"><KpiCard label="Em progresso" value="1" sub="Custom domain · Gravação" accent="sky" /></Link>
        <Link to="/admin/decisoes"><KpiCard label="Decisões pendentes" value="3" sub="Seed · Audiovisual · ESOP" accent="warn" /></Link>
      </div>

      {/* Atividade recente */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-5">
          Atividade Recente
        </p>
        <div className="space-y-3">
          {[
            { label: "Firebase Blaze ativado", sub: "Cloud Functions + Storage desbloqueados", cor: "#5DD3A8" },
            { label: "Cloud Functions deployadas", sub: "syncUserClaims · generateCertificate (PDF) · sendInviteEmail", cor: "#5DD3A8" },
            { label: "PDF de certificado com SHA-256", sub: "gerado via pdf-lib + salvo no Storage", cor: "#5DD3A8" },
            { label: "Telas /app/convites e /app/relatorio entregues", sub: "QR Code · export CSV · email de convite", cor: "#5DD3A8" },
            { label: "12 roteiros prontos para gravação", sub: "Colaborador + Gestor de RH · Lei 15.377 + NR-1", cor: "#5DD3A8" },
            { label: "Interface RH assinante entregue", sub: "Trilhas + Calendário Vacinal + In-Company VaciVitta · 3 novas telas", cor: "#5DD3A8" },
            { label: "Deck de pitch VR no Admin", sub: "HTML interativo + navegação por teclado + export PDF · /admin/pitch", cor: "#5DD3A8" },
            { label: "Landing page corrigida no Admin", sub: "Imagens hero + seções restauradas · fotos sócios com fallback CSS", cor: "#5DD3A8" },
            { label: "5 bugs corrigidos (UX + testes)", sub: "Fragment key · tooltip dismiss · aria-label · data dinâmica · Safari CSV", cor: "#5DD3A8" },
            { label: "Call exploratória VR realizada", sub: "aguardando agenda da 1ª reunião formal", cor: "#C9A96E" },
          ].map((ev, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ev.cor }}
              />
              <div>
                <p className="text-white/75 text-sm leading-snug">{ev.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{ev.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cowork Summary */}
      <div className="mb-6">
        <CoworkSummaryWidget />
      </div>

      {/* OneDrive */}
      <div className="mb-6">
        <OneDriveWidget />
      </div>

      {/* Google Trends */}
      <div className="mb-6">
        <TrendsWidget />
      </div>

      {/* MRR projetado */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-5">
          Projeção de MRR
        </p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { fase: "T1", label: "MVP", months: "Meses 1–3", mrr: "R$ 35k", empresas: "50 empresas", active: true },
            { fase: "T2", label: "Diferenciação", months: "Meses 4–6", mrr: "R$ 120k", empresas: "150 empresas", active: false },
            { fase: "T3", label: "Escala", months: "Meses 7–9", mrr: "R$ 350k", empresas: "400 empresas", active: false },
            { fase: "T4", label: "Moat", months: "Meses 10–12+", mrr: "R$ 900k+", empresas: "1.000+ empresas", active: false },
          ].map((f) => (
            <div
              key={f.fase}
              className={`rounded-xl p-4 border transition-all ${
                f.active
                  ? "bg-[#5DD3A8]/10 border-[#5DD3A8]/30"
                  : "bg-white/3 border-white/8"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  f.active ? "bg-[#5DD3A8]/20 text-[#5DD3A8]" : "bg-white/10 text-white/40"
                }`}>
                  {f.fase}
                </span>
                {f.active && <span className="text-[10px] text-[#5DD3A8]/70 uppercase tracking-wide">Ativo</span>}
              </div>
              <p className={`text-xl font-bold mb-0.5 ${f.active ? "text-[#5DD3A8]" : "text-white/50"}`}>
                {f.mrr}
              </p>
              <p className="text-xs text-white/30">{f.empresas}</p>
              <p className="text-[11px] text-white/20 mt-1">{f.months}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Claude Usage */}
      <div className="mb-6">
        <ClaudeUsageWidget />
      </div>

      {/* Time */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-5">
          Time
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { nome: "Rodolfo Nascimento", papel: "CEO · Tech Lead · Estratégia", share: "33,33%", cor: "#5DD3A8" },
            { nome: "Fábio", papel: "Comercial · Relacionamento · Top Formaturas", share: "33,33%", cor: "#C9A96E" },
            { nome: "Thiago", papel: "Operação · Vacivitta · Saúde", share: "33,33%", cor: "#C9DCE8" },
          ].map((s) => (
            <div key={s.nome} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3"
                style={{ background: `${s.cor}25`, color: s.cor }}
              >
                {s.nome[0]}
              </div>
              <p className="text-white/80 text-sm font-medium">{s.nome}</p>
              <p className="text-white/35 text-xs mt-0.5 leading-snug">{s.papel}</p>
              <p className="text-xs mt-2 font-semibold" style={{ color: s.cor }}>{s.share}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string; accent: "mint" | "champagne" | "sky" | "warn";
}) {
  const colors = {
    mint: "text-[#5DD3A8]",
    champagne: "text-[#C9A96E]",
    sky: "text-[#C9DCE8]",
    warn: "text-orange-400",
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer">
      <p className="text-white/35 text-xs mb-3">{label}</p>
      <p className={`text-2xl font-bold ${colors[accent]}`}>{value}</p>
      <p className="text-white/25 text-xs mt-1">{sub}</p>
    </div>
  );
}
