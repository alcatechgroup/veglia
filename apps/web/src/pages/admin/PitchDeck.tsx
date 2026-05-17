import { useState } from "react";

const CANVA_EDIT_URL = "https://www.canva.com/d/YwNQdhjCKxzzPUO";
const HTML_PATH = "/pitch/deck-vr.html";

export default function PitchDeck() {
  const [fullscreen, setFullscreen] = useState(false);

  const handleDownloadHTML = () => {
    const a = document.createElement("a");
    a.href = HTML_PATH;
    a.download = "Veglia-Pitch-VR-2026.html";
    a.click();
  };

  const handleDownloadPDF = () => {
    const win = window.open(HTML_PATH, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => win.print(), 500);
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#5DD3A8] text-xs tracking-widest uppercase font-semibold mb-2">
          Pitch Deck · VR Benefícios
        </p>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Deck de Pitch</h1>
            <p className="text-white/40 mt-1 text-sm">
              10 slides · Parceria Estratégica · Mai/2026
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
            >
              <span className="text-base">⬇</span>
              Download HTML
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
            >
              <span className="text-base">⎙</span>
              Exportar PDF
            </button>
            <a
              href={CANVA_EDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/25 text-sm transition-all"
            >
              <span className="text-base">✏</span>
              Editar no Canva
            </a>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5DD3A8]/15 border border-[#5DD3A8]/30 text-[#5DD3A8] hover:bg-[#5DD3A8]/25 text-sm transition-all"
            >
              <span className="text-base">{fullscreen ? "⊠" : "⛶"}</span>
              {fullscreen ? "Sair" : "Tela cheia"}
            </button>
          </div>
        </div>
      </div>

      {/* Slide index pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          "Cover",
          "Problema",
          "Solução",
          "Como funciona",
          "Vacivitta",
          "Plataforma",
          "Modelo",
          "Por que VR",
          "Proposta",
          "Time",
        ].map((label, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-xs border border-white/10 text-white/40 bg-white/3"
          >
            <span className="text-[#5DD3A8] font-mono mr-1.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* Deck iframe */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B2545] transition-all ${
          fullscreen ? "fixed inset-0 z-50 rounded-none border-0" : ""
        }`}
        style={{ aspectRatio: fullscreen ? undefined : "16/9" }}
      >
        <iframe
          src={HTML_PATH}
          title="Vegl.ia · Deck de Pitch VR"
          className="w-full h-full"
          style={{ height: fullscreen ? "100vh" : undefined }}
          allowFullScreen
        />
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-white/80 text-xs hover:bg-black/80 transition-all"
          >
            ✕ Fechar
          </button>
        )}
      </div>

      {/* Meta info */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs mb-1">Audiência</p>
          <p className="text-white/80 text-sm font-medium">VR Benefícios</p>
          <p className="text-white/35 text-xs mt-0.5">Executivos de parceria / produto</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs mb-1">Objetivo</p>
          <p className="text-white/80 text-sm font-medium">Piloto · 3 empresas</p>
          <p className="text-white/35 text-xs mt-0.5">30 dias para o 1º cliente ativo</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs mb-1">Status</p>
          <p className="text-[#5DD3A8] text-sm font-medium">Pronto para reunião</p>
          <p className="text-white/35 text-xs mt-0.5">Aguardando agendamento VR</p>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-5 bg-[#C9A96E]/8 border border-[#C9A96E]/20 rounded-xl p-5">
        <p className="text-[#C9A96E] text-xs font-semibold uppercase tracking-widest mb-3">
          Dicas para a apresentação
        </p>
        <ul className="space-y-1.5 text-sm text-white/55">
          <li className="flex gap-2"><span className="text-[#5DD3A8]">→</span> Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">→</kbd> para navegar ou clique nas setas no deck</li>
          <li className="flex gap-2"><span className="text-[#5DD3A8]">→</span> Tecla <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">F</kbd> dentro do deck entra em fullscreen nativo</li>
          <li className="flex gap-2"><span className="text-[#5DD3A8]">→</span> Para enviar por email: clique em "Download HTML" — o arquivo abre em qualquer browser sem instalação</li>
          <li className="flex gap-2"><span className="text-[#5DD3A8]">→</span> Para PDF: clique "Exportar PDF" e use <em>Salvar como PDF</em> no diálogo de impressão</li>
          <li className="flex gap-2"><span className="text-[#5DD3A8]">→</span> Personalize o slide 8 com o nome do executivo antes da reunião — edite direto no Canva</li>
        </ul>
      </div>
    </div>
  );
}
