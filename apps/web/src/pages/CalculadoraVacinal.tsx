import { useState } from "react";

// ─── Dados ────────────────────────────────────────────────────────────────────

type Perfil = "bebe" | "crianca" | "adolescente" | "adulto" | "idoso";
type Sexo = "feminino" | "masculino" | "nao_informado";
type Condicao = "nenhuma" | "gestante" | "imunossuprimido";

interface Vacina {
  nome: string;
  doses: number;
  publico: string[]; // "todos" | perfil | condicao especial
  prazo: string;
  obrigatoria_lei?: boolean;
  descricao?: string;
  /** Restringir a um sexo específico. undefined = ambos */
  sexo_exclusivo?: "feminino" | "masculino";
  /** Idade máxima em anos para a indicação (inclusive) */
  idade_max_anos?: number;
  /** Nota contextual por sexo — exibida quando selecionado */
  nota_sexo?: Partial<Record<Sexo, string>>;
}

const VACINAS: Vacina[] = [
  {
    nome: "Hepatite B",
    doses: 3,
    publico: ["todos"],
    prazo: "Início imediato",
    obrigatoria_lei: true,
    descricao: "3 doses: 0, 1 e 6 meses",
  },
  {
    nome: "Tríplice viral (SCR)",
    doses: 2,
    publico: ["todos"],
    prazo: "Se não vacinado",
    descricao: "Sarampo, caxumba e rubéola",
  },
  {
    nome: "dTpa (adulto)",
    doses: 1,
    // SBIm: para mulheres, 1 dose a cada gestação a partir da 20ª semana.
    // Homens adultos saudáveis recebem dT (sem coqueluche) — vacina diferente.
    // Por isso dTpa no perfil adulto é sexo_exclusivo feminino.
    publico: ["adulto", "idoso", "gestante"],
    prazo: "A cada gestação (20ª semana) — feminino",
    descricao: "Difteria, tétano e coqueluche — especialmente recomendada na gestação",
    sexo_exclusivo: "feminino",
  },
  {
    nome: "Influenza",
    doses: 1,
    publico: ["todos"],
    prazo: "Anualmente",
    obrigatoria_lei: true,
    descricao: "Vacina da gripe — campanha anual",
  },
  {
    nome: "COVID-19",
    doses: 2,
    publico: ["todos"],
    prazo: "Esquema completo + reforço",
    descricao: "Manter esquema primário atualizado",
  },
  {
    nome: "Pneumocócica 23V",
    doses: 1,
    publico: ["idoso", "imunossuprimido"],
    prazo: "Reforço a cada 5 anos",
    descricao: "Para grupos de risco",
  },
  {
    nome: "Varicela",
    doses: 2,
    publico: ["crianca", "adolescente"],
    prazo: "Se não vacinado",
    descricao: "Catapora — 2 doses com 4-8 semanas de intervalo",
  },
  {
    nome: "HPV",
    doses: 2,
    // SBIm: indicado para adolescentes e adultos até 45 anos (ambos os sexos)
    publico: ["adolescente", "adulto"],
    prazo: "2 doses com 6 meses de intervalo (até 14a) ou 3 doses",
    descricao: "Papilomavírus humano — indicado até 45 anos (SBIm 2026)",
    idade_max_anos: 45,
    nota_sexo: {
      feminino: "Previne câncer de colo do útero, vulva e vagina",
      masculino: "Previne câncer de pênis, orofaringe e anal",
    },
  },
  {
    nome: "dT (adulto)",
    doses: 1,
    // SBIm: homens adultos e idosos sem histórico de dTpa recente recebem dT (sem coqueluche).
    publico: ["adulto", "idoso"],
    prazo: "A cada 10 anos",
    descricao: "Difteria e tétano — reforço decenal para homens adultos",
    sexo_exclusivo: "masculino",
  },
  {
    nome: "Febre Amarela",
    doses: 1,
    publico: ["todos"],
    prazo: "Dose única (vitalícia)",
    descricao: "Exceto gestantes e imunossuprimidos — consultar médico",
  },
  {
    nome: "Herpes Zoster",
    doses: 2,
    publico: ["idoso"],
    prazo: "A partir dos 60 anos",
    descricao: "Prevenção do herpes e neuralgia pós-herpética",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Idade representativa máxima de cada faixa (usada para filtros de idade_max_anos)
const PERFIL_IDADE_MAX: Record<Perfil, number> = {
  bebe: 1,
  crianca: 9,
  adolescente: 19,
  adulto: 59,
  idoso: 99,
};

function filtrarVacinas(perfil: Perfil, sexo: Sexo, condicao: Condicao): Vacina[] {
  const idadeMax = PERFIL_IDADE_MAX[perfil];

  return VACINAS.filter((v) => {
    // 1. Verificar elegibilidade por público/perfil/condição
    const p = v.publico;
    const elegivel =
      p.includes("todos") ||
      p.includes(perfil) ||
      (condicao !== "nenhuma" && p.includes(condicao));

    if (!elegivel) return false;

    // 2. Verificar restrição de sexo exclusivo (ex: vacinas só femininas ou só masculinas)
    if (v.sexo_exclusivo && sexo !== "nao_informado" && v.sexo_exclusivo !== sexo) {
      return false;
    }

    // 3. Verificar limite de idade (ex: HPV até 45 anos)
    // Para o perfil "idoso" (60+), o idadeMax representativo é 99 — vacinas com
    // idade_max_anos < 60 serão excluídas corretamente para idosos.
    if (v.idade_max_anos !== undefined && idadeMax > v.idade_max_anos) {
      return false;
    }

    return true;
  });
}

const PERFIL_LABELS: Record<Perfil, string> = {
  bebe: "Bebê (0–1a)",
  crianca: "Criança (2–9a)",
  adolescente: "Adolescente (10–19a)",
  adulto: "Adulto (20–59a)",
  idoso: "Idoso (60+)",
};

const SEXO_LABELS: Record<Sexo, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  nao_informado: "Não informado",
};

const CONDICAO_LABELS: Record<Condicao, string> = {
  nenhuma: "Nenhuma",
  gestante: "Gestante",
  imunossuprimido: "Imunossuprimido",
};

// ─── Componentes internos ─────────────────────────────────────────────────────

function FilterButton<T extends string>({
  value,
  selected,
  label,
  onClick,
}: {
  value: T;
  selected: boolean;
  label: string;
  onClick: (v: T) => void;
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-xl text-sm border transition-all ${
        selected
          ? "bg-[#0B2545] border-[#0B2545] text-white font-medium"
          : "bg-white border-[#0B2545]/15 text-[#0B2545]/60 hover:border-[#0B2545]/30 hover:text-[#0B2545]"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Formulário de compartilhamento ──────────────────────────────────────────

function ShareForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // MVP: apenas simula o envio — integrar com SendGrid na Fase 2
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-2">✓</p>
        <p className="text-[#0B2545] font-semibold text-sm">Resultado enviado!</p>
        <button onClick={onClose} className="mt-3 text-xs text-[#0B2545]/40 hover:underline">
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-[#0B2545]/60">
        Insira o e-mail do seu RH para compartilhar os resultados:
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@empresa.com.br"
        required
        className="w-full border border-[#0B2545]/15 rounded-xl px-4 py-2.5 text-sm text-[#0B2545] placeholder-[#0B2545]/30 focus:outline-none focus:border-[#5DD3A8] transition-colors"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-[#0B2545]/15 text-[#0B2545]/50 py-2.5 rounded-xl text-sm hover:bg-[#0B2545]/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-[#0B2545] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#1A3A5C] transition-colors"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}

// ─── Calculadora Vacinal ──────────────────────────────────────────────────────

export default function CalculadoraVacinal() {
  const [perfil, setPerfil] = useState<Perfil>("adulto");
  const [sexo, setSexo] = useState<Sexo>("nao_informado");
  const [condicao, setCondicao] = useState<Condicao>("nenhuma");
  const [showShare, setShowShare] = useState(false);

  const vacinasFiltradas = filtrarVacinas(perfil, sexo, condicao);
  const obrigatorias = vacinasFiltradas.filter((v) => v.obrigatoria_lei);
  const recomendadas = vacinasFiltradas.filter((v) => !v.obrigatoria_lei);

  // Fallback: verificar se o filtro de sexo tem algum efeito visível.
  // Comparar contagem com sexo ignorado (nao_informado) vs sexo selecionado.
  const vacinasSemFiltroSexo = filtrarVacinas(perfil, "nao_informado", condicao);
  const filtroSexoSemEfeito =
    sexo !== "nao_informado" &&
    vacinasFiltradas.length === vacinasSemFiltroSexo.length;

  return (
    <div className="min-h-screen bg-[#FBF8F1]">
      {/* Header */}
      <header className="border-b border-[#0B2545]/8 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold text-[#0B2545] tracking-tight">Vegl</span>
            <span className="text-xl font-bold text-[#C9A96E]">.</span>
            <span className="text-xl font-bold text-[#5DD3A8]">ia</span>
          </div>
          <span className="text-xs text-[#0B2545]/40">Calculadora Vacinal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Intro */}
        <div className="mb-8">
          <p className="text-xs text-[#5DD3A8] font-semibold uppercase tracking-wide mb-2">
            Calendário SBIm 2026/27
          </p>
          <h1 className="text-2xl font-bold text-[#0B2545] mb-1">
            Calculadora Vacinal
          </h1>
          <p className="text-sm text-[#0B2545]/50">
            Selecione seu perfil para ver as vacinas recomendadas e obrigatórias pela Lei 15.377/2026.
            Ferramenta gratuita — nenhum login necessário.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-[#0B2545]/8 p-6 mb-6 shadow-sm space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#0B2545]/50 uppercase tracking-wide mb-3">
              Faixa etária
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PERFIL_LABELS) as [Perfil, string][]).map(([v, l]) => (
                <FilterButton
                  key={v}
                  value={v}
                  selected={perfil === v}
                  label={l}
                  onClick={setPerfil}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#0B2545]/50 uppercase tracking-wide mb-3">
              Sexo
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SEXO_LABELS) as [Sexo, string][]).map(([v, l]) => (
                <FilterButton
                  key={v}
                  value={v}
                  selected={sexo === v}
                  label={l}
                  onClick={setSexo}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#0B2545]/50 uppercase tracking-wide mb-3">
              Condição especial
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CONDICAO_LABELS) as [Condicao, string][]).map(([v, l]) => (
                <FilterButton
                  key={v}
                  value={v}
                  selected={condicao === v}
                  label={l}
                  onClick={setCondicao}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Aviso gestante */}
        {condicao === "gestante" && (
          <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl px-4 py-3 mb-5 text-xs text-[#0B2545]/70">
            Para gestantes, consulte sempre seu obstetra antes de se vacinar. Algumas vacinas
            de vírus vivos são contraindicadas durante a gravidez.
          </div>
        )}

        {/* Aviso quando filtro de sexo não altera o resultado */}
        {filtroSexoSemEfeito && (
          <div className="bg-[#0B2545]/5 border border-[#0B2545]/10 rounded-xl px-4 py-3 mb-5 text-xs text-[#0B2545]/50">
            Para esta faixa etária, todas as vacinas são indicadas para ambos os sexos.
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-5">
          {/* Obrigatórias Lei 15.377 */}
          {obrigatorias.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-[#0B2545]/60 uppercase tracking-wide">
                  Obrigatórias — Lei 15.377/2026
                </p>
                <span className="text-[10px] bg-[#5DD3A8]/15 text-[#5DD3A8] px-2 py-0.5 rounded-full font-medium">
                  {obrigatorias.length} vacinas
                </span>
              </div>
              <div className="space-y-2">
                {obrigatorias.map((v) => (
                  <div
                    key={v.nome}
                    className="bg-white border border-[#5DD3A8]/25 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-[#0B2545]">{v.nome}</p>
                        <span className="text-[10px] bg-[#5DD3A8]/15 text-[#5DD3A8] px-2 py-0.5 rounded-full font-medium">
                          Lei 15.377
                        </span>
                      </div>
                      <p className="text-xs text-[#0B2545]/40">{v.descricao}</p>
                      {v.nota_sexo && sexo !== "nao_informado" && v.nota_sexo[sexo] && (
                        <p className="text-[11px] text-[#5DD3A8] mt-1">{v.nota_sexo[sexo]}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-[#0B2545]/60">{v.doses} dose{v.doses > 1 ? "s" : ""}</p>
                      <p className="text-[10px] text-[#0B2545]/35 mt-0.5">{v.prazo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendadas */}
          {recomendadas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-[#0B2545]/60 uppercase tracking-wide">
                  Recomendadas SBIm
                </p>
                <span className="text-[10px] bg-[#0B2545]/8 text-[#0B2545]/50 px-2 py-0.5 rounded-full font-medium">
                  {recomendadas.length} vacinas
                </span>
              </div>
              <div className="space-y-2">
                {recomendadas.map((v) => (
                  <div
                    key={v.nome}
                    className="bg-white border border-[#0B2545]/8 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0B2545] mb-0.5">{v.nome}</p>
                      <p className="text-xs text-[#0B2545]/40">{v.descricao}</p>
                      {v.nota_sexo && sexo !== "nao_informado" && v.nota_sexo[sexo] && (
                        <p className="text-[11px] text-[#5DD3A8] mt-1">{v.nota_sexo[sexo]}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-[#0B2545]/60">{v.doses} dose{v.doses > 1 ? "s" : ""}</p>
                      <p className="text-[10px] text-[#0B2545]/35 mt-0.5">{v.prazo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA compartilhar */}
        <div className="mt-8 bg-white rounded-2xl border border-[#0B2545]/8 p-6 shadow-sm">
          {showShare ? (
            <ShareForm onClose={() => setShowShare(false)} />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0B2545] mb-0.5">
                  Compartilhar com seu RH
                </p>
                <p className="text-xs text-[#0B2545]/50">
                  Envie o resultado por e-mail para o departamento de RH da sua empresa.
                </p>
              </div>
              <button
                onClick={() => setShowShare(true)}
                className="shrink-0 bg-[#0B2545] hover:bg-[#1A3A5C] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
              >
                Compartilhar resultado
              </button>
            </div>
          )}
        </div>

        {/* Link para diagnóstico */}
        <div className="mt-4 text-center">
          <a href="/diagnostico" className="text-xs text-[#0B2545]/40 hover:text-[#0B2545]/70 transition-colors">
            Fazer diagnóstico de risco da empresa →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-6 pb-8 text-center">
        <p className="text-[10px] text-[#0B2545]/25">
          Baseado no Calendário SBIm 2026/27 · Não substitui avaliação médica ·
          Powered by <span className="text-[#5DD3A8]/60 font-semibold">VaciVitta</span>
        </p>
      </footer>
    </div>
  );
}
