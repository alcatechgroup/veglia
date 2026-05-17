import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusSolicitacao = "solicitado" | "confirmado" | "realizado" | "cancelado";
type TurnoPreferido = "manha" | "tarde" | "integral";
type WizardStep = 1 | 2 | 3 | 4;

interface Solicitacao {
  id: string;
  vacinas: string[];
  data_preferencia: string;
  colaboradores_estimados: number;
  status: StatusSolicitacao;
  responsavel_vacivitta?: string;
  criado_em: string;
}

interface FormState {
  vacinas_selecionadas: string[];
  data_1: string;
  data_2: string;
  data_3: string;
  turno: TurnoPreferido;
  observacoes: string;
  colaboradores_estimados: number;
  selecionar_especificos: boolean;
  colaboradores_especificos: string[];
}

// ─── Mock de dados ────────────────────────────────────────────────────────────

const VACINAS_DISPONIVEIS = [
  "Influenza 2026/27",
  "Hepatite B (dose avulsa)",
  "dT (tetano adulto)",
  "dTpa (gestantes / reforco)",
  "HPV (adulto)",
  "Febre Amarela",
  "Varicela",
  "COVID-19 (atualizacao)",
] as const;

const COLABORADORES_MOCK = [
  "Ana Paula Silva",
  "Carlos Eduardo Mendes",
  "Fernanda Torres Costa",
  "Ricardo Almeida Souza",
  "Beatriz Oliveira Lima",
  "Marcelo Ferreira Nunes",
  "Juliana Castro Pereira",
  "Thiago Martins Rodrigues",
] as const;

const SOLICITACOES_MOCK: Solicitacao[] = [
  {
    id: "sol-001",
    vacinas: ["Influenza 2026", "Hepatite B"],
    data_preferencia: "2026-05-20",
    colaboradores_estimados: 45,
    status: "confirmado",
    responsavel_vacivitta: "Equipe VaciVitta Sul",
    criado_em: "2026-05-10",
  },
  {
    id: "sol-002",
    vacinas: ["dTpa"],
    data_preferencia: "2026-06-03",
    colaboradores_estimados: 12,
    status: "solicitado",
    criado_em: "2026-05-09",
  },
];

const FORM_INITIAL: FormState = {
  vacinas_selecionadas: [],
  data_1: "",
  data_2: "",
  data_3: "",
  turno: "manha",
  observacoes: "",
  colaboradores_estimados: 20,
  selecionar_especificos: false,
  colaboradores_especificos: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function labelStatus(status: StatusSolicitacao): string {
  const map: Record<StatusSolicitacao, string> = {
    solicitado: "Solicitado",
    confirmado: "Confirmado",
    realizado: "Realizado",
    cancelado: "Cancelado",
  };
  return map[status];
}

function turnoLabel(turno: TurnoPreferido): string {
  const map: Record<TurnoPreferido, string> = {
    manha: "Manha 8–12h",
    tarde: "Tarde 13–17h",
    integral: "Integral",
  };
  return map[turno];
}

// ─── Badge de status ──────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: StatusSolicitacao;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<StatusSolicitacao, string> = {
    solicitado:
      "text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20",
    confirmado:
      "text-[#5DD3A8] bg-[#5DD3A8]/10 border border-[#5DD3A8]/20",
    realizado:
      "text-white/60 bg-white/5 border border-white/10",
    cancelado:
      "text-red-400 bg-red-500/10 border border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      <span className="text-[8px]">●</span>
      {labelStatus(status)}
    </span>
  );
}

// ─── Timeline de progresso da solicitacao ────────────────────────────────────

interface TimelineProps {
  status: StatusSolicitacao;
}

function Timeline({ status }: TimelineProps) {
  const steps: { key: StatusSolicitacao; label: string }[] = [
    { key: "solicitado", label: "Solicitado" },
    { key: "confirmado", label: "Confirmado" },
    { key: "realizado", label: "Realizado" },
  ];

  const activeIndex =
    status === "cancelado"
      ? -1
      : steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isActive = idx <= activeIndex;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                  isActive
                    ? "bg-[#5DD3A8] text-[#0B2545]"
                    : "bg-white/10 text-white/25"
                }`}
              >
                {isActive ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[9px] font-medium whitespace-nowrap ${
                  isActive ? "text-[#5DD3A8]" : "text-white/25"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-8 h-px mb-4 mx-1 transition-colors ${
                  idx < activeIndex ? "bg-[#5DD3A8]" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Card de solicitacao ──────────────────────────────────────────────────────

interface SolicitacaoCardProps {
  solicitacao: Solicitacao;
}

function SolicitacaoCard({ solicitacao }: SolicitacaoCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      {/* Topo: ID + status */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wide mb-0.5">
            Solicitacao
          </p>
          <p className="text-sm font-bold text-white font-mono">
            #{solicitacao.id}
          </p>
        </div>
        <StatusBadge status={solicitacao.status} />
      </div>

      {/* Vacinas */}
      <div className="flex flex-wrap gap-1.5">
        {solicitacao.vacinas.map((v) => (
          <span
            key={v}
            className="text-[11px] font-medium text-[#5DD3A8]/80 bg-[#5DD3A8]/8 border border-[#5DD3A8]/15 px-2.5 py-0.5 rounded-full"
          >
            {v}
          </span>
        ))}
      </div>

      {/* Metadados */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">Data preferida</p>
          <p className="text-sm text-white font-medium">
            {formatDate(solicitacao.data_preferencia)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">Colaboradores</p>
          <p className="text-sm text-white font-medium">
            {solicitacao.colaboradores_estimados} pessoas
          </p>
        </div>
        {solicitacao.responsavel_vacivitta && (
          <div className="col-span-2">
            <p className="text-[10px] text-white/30 mb-0.5">
              Responsavel VaciVitta
            </p>
            <p className="text-sm text-[#5DD3A8] font-medium">
              {solicitacao.responsavel_vacivitta}
            </p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">Solicitado em</p>
          <p className="text-xs text-white/40">
            {formatDate(solicitacao.criado_em)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-white/5 pt-3">
        <Timeline status={solicitacao.status} />
      </div>
    </div>
  );
}

// ─── Barra de progresso do wizard ─────────────────────────────────────────────

interface WizardProgressProps {
  currentStep: WizardStep;
}

const WIZARD_STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "Vacinas" },
  { step: 2, label: "Data" },
  { step: 3, label: "Equipe" },
  { step: 4, label: "Confirmar" },
];

function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="flex items-center gap-0">
      {WIZARD_STEPS.map(({ step, label }, idx) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        const isLast = idx === WIZARD_STEPS.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-[#5DD3A8] text-[#0B2545]"
                    : isActive
                    ? "bg-[#5DD3A8]/20 border-2 border-[#5DD3A8] text-[#5DD3A8]"
                    : "bg-white/8 border border-white/15 text-white/30"
                }`}
              >
                {isDone ? "✓" : step}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isActive
                    ? "text-[#5DD3A8]"
                    : isDone
                    ? "text-[#5DD3A8]/60"
                    : "text-white/25"
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-10 h-px mb-5 mx-1 transition-colors ${
                  isDone ? "bg-[#5DD3A8]/50" : "bg-white/8"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Selecao de vacinas ───────────────────────────────────────────────

interface Step1Props {
  form: FormState;
  onChange: (updates: Partial<FormState>) => void;
}

function Step1({ form, onChange }: Step1Props) {
  const toggle = (vacina: string) => {
    const ja = form.vacinas_selecionadas.includes(vacina);
    onChange({
      vacinas_selecionadas: ja
        ? form.vacinas_selecionadas.filter((v) => v !== vacina)
        : [...form.vacinas_selecionadas, vacina],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white mb-1">
          Quais vacinas deseja aplicar?
        </h3>
        <p className="text-sm text-white/40">
          Selecione uma ou mais vacinas para esta campanha.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {VACINAS_DISPONIVEIS.map((vacina) => {
          const selecionada = form.vacinas_selecionadas.includes(vacina);
          return (
            <button
              key={vacina}
              type="button"
              onClick={() => toggle(vacina)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selecionada
                  ? "bg-[#5DD3A8]/10 border-[#5DD3A8]/40 text-[#5DD3A8]"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:text-white/80"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  selecionada
                    ? "bg-[#5DD3A8] border-[#5DD3A8]"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {selecionada && (
                  <span className="text-[#0B2545] text-[10px] font-bold leading-none">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">{vacina}</span>
            </button>
          );
        })}
      </div>

      {form.vacinas_selecionadas.length === 0 && (
        <p className="text-xs text-[#C9A96E] flex items-center gap-1.5">
          <span>⚠</span> Selecione ao menos uma vacina para continuar.
        </p>
      )}
    </div>
  );
}

// ─── Step 2: Data e horario ───────────────────────────────────────────────────

interface Step2Props {
  form: FormState;
  onChange: (updates: Partial<FormState>) => void;
}

function Step2({ form, onChange }: Step2Props) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-white mb-1">
          Datas e horario preferidos
        </h3>
        <p className="text-sm text-white/40">
          Informe ate 3 opcoes de data. A VaciVitta confirmara a disponibilidade.
        </p>
      </div>

      {/* 3 datas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(
          [
            { field: "data_1" as const, label: "1ª opcao (obrigatoria)" },
            { field: "data_2" as const, label: "2ª opcao" },
            { field: "data_3" as const, label: "3ª opcao" },
          ] as const
        ).map(({ field, label }) => (
          <div key={field}>
            <label className="block text-xs text-white/40 mb-1.5">{label}</label>
            <input
              type="date"
              value={form[field]}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => onChange({ [field]: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#5DD3A8]/40 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Turno */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">
          Turno preferido
        </label>
        <select
          value={form.turno}
          onChange={(e) =>
            onChange({ turno: e.target.value as TurnoPreferido })
          }
          className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#5DD3A8]/40 transition-colors cursor-pointer"
        >
          <option value="manha">Manha 8–12h</option>
          <option value="tarde">Tarde 13–17h</option>
          <option value="integral">Integral</option>
        </select>
      </div>

      {/* Observacoes */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">
          Observacoes (opcional)
        </label>
        <textarea
          value={form.observacoes}
          onChange={(e) => onChange({ observacoes: e.target.value })}
          placeholder="Ex: acesso pelo portao lateral, sem elevador no 2o andar..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-[#5DD3A8]/40 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Colaboradores ────────────────────────────────────────────────────

interface Step3Props {
  form: FormState;
  onChange: (updates: Partial<FormState>) => void;
}

function Step3({ form, onChange }: Step3Props) {
  const toggleColaborador = (nome: string) => {
    const ja = form.colaboradores_especificos.includes(nome);
    onChange({
      colaboradores_especificos: ja
        ? form.colaboradores_especificos.filter((c) => c !== nome)
        : [...form.colaboradores_especificos, nome],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-white mb-1">
          Estimativa de colaboradores
        </h3>
        <p className="text-sm text-white/40">
          Quantas pessoas participarao desta campanha de vacinacao?
        </p>
      </div>

      {/* Slider + input */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={500}
            value={form.colaboradores_estimados}
            aria-label="Numero estimado de colaboradores"
            onChange={(e) =>
              onChange({ colaboradores_estimados: Number(e.target.value) })
            }
            className="flex-1 accent-[#5DD3A8] cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={500}
              value={form.colaboradores_estimados}
              onChange={(e) => {
                const val = Math.min(500, Math.max(1, Number(e.target.value)));
                onChange({ colaboradores_estimados: val });
              }}
              className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 text-center focus:outline-none focus:border-[#5DD3A8]/40 transition-colors"
            />
            <span className="text-sm text-white/40">pessoas</span>
          </div>
        </div>

        <p className="text-xs text-white/30 italic">
          A VaciVitta confirma a capacidade de atendimento com base neste numero.
        </p>
      </div>

      {/* Selecao especifica */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() =>
            onChange({
              selecionar_especificos: !form.selecionar_especificos,
              colaboradores_especificos: [],
            })
          }
          className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
              form.selecionar_especificos
                ? "bg-[#5DD3A8] border-[#5DD3A8]"
                : "border-white/20 bg-transparent"
            }`}
          >
            {form.selecionar_especificos && (
              <span className="text-[#0B2545] text-[10px] font-bold leading-none">
                ✓
              </span>
            )}
          </div>
          Quero selecionar colaboradores especificos
        </button>

        {form.selecionar_especificos && (
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
            <p className="text-xs text-white/40 mb-3">
              Selecione os colaboradores que participarao:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COLABORADORES_MOCK.map((nome) => {
                const selecionado = form.colaboradores_especificos.includes(nome);
                return (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => toggleColaborador(nome)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all text-sm ${
                      selecionado
                        ? "bg-[#5DD3A8]/8 border-[#5DD3A8]/30 text-[#5DD3A8]"
                        : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6 hover:text-white/70"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        selecionado
                          ? "bg-[#5DD3A8] border-[#5DD3A8]"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {selecionado && (
                        <span className="text-[#0B2545] text-[9px] font-bold leading-none">
                          ✓
                        </span>
                      )}
                    </div>
                    {nome}
                  </button>
                );
              })}
            </div>
            {form.colaboradores_especificos.length > 0 && (
              <p className="text-xs text-[#5DD3A8] mt-2">
                {form.colaboradores_especificos.length} colaborador
                {form.colaboradores_especificos.length !== 1 ? "es" : ""}{" "}
                selecionado
                {form.colaboradores_especificos.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Confirmacao ──────────────────────────────────────────────────────

interface Step4Props {
  form: FormState;
  responsavelNome: string;
  loading: boolean;
  sucesso: boolean;
  onSubmit: () => void;
}

function Step4({ form, responsavelNome, loading, sucesso, onSubmit }: Step4Props) {
  if (sucesso) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#5DD3A8]/15 border border-[#5DD3A8]/30 flex items-center justify-center text-2xl">
          ✓
        </div>
        <div>
          <h3 className="text-base font-bold text-[#5DD3A8] mb-1">
            Solicitacao enviada!
          </h3>
          <p className="text-sm text-white/50">
            A equipe VaciVitta entrara em contato em ate 48h para confirmar
            logistica e data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-white mb-1">
          Revise sua solicitacao
        </h3>
        <p className="text-sm text-white/40">
          Confirme os dados antes de enviar para a equipe VaciVitta.
        </p>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-xl divide-y divide-white/5">
        {/* Vacinas */}
        <div className="px-4 py-3.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-2">
            Vacinas selecionadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {form.vacinas_selecionadas.map((v) => (
              <span
                key={v}
                className="text-[11px] font-medium text-[#5DD3A8]/80 bg-[#5DD3A8]/8 border border-[#5DD3A8]/15 px-2.5 py-0.5 rounded-full"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Datas */}
        <div className="px-4 py-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {form.data_1 && (
            <div>
              <p className="text-[10px] text-white/30 mb-0.5">1ª opcao</p>
              <p className="text-sm text-white font-medium">
                {formatDate(form.data_1)}
              </p>
            </div>
          )}
          {form.data_2 && (
            <div>
              <p className="text-[10px] text-white/30 mb-0.5">2ª opcao</p>
              <p className="text-sm text-white/70">{formatDate(form.data_2)}</p>
            </div>
          )}
          {form.data_3 && (
            <div>
              <p className="text-[10px] text-white/30 mb-0.5">3ª opcao</p>
              <p className="text-sm text-white/70">{formatDate(form.data_3)}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-white/30 mb-0.5">Turno</p>
            <p className="text-sm text-white/70">{turnoLabel(form.turno)}</p>
          </div>
        </div>

        {/* Colaboradores */}
        <div className="px-4 py-3.5">
          <p className="text-[10px] text-white/30 mb-0.5">
            Colaboradores estimados
          </p>
          <p className="text-sm text-white font-medium">
            {form.colaboradores_estimados} pessoas
          </p>
          {form.selecionar_especificos &&
            form.colaboradores_especificos.length > 0 && (
              <p className="text-xs text-white/40 mt-1">
                Lista especifica: {form.colaboradores_especificos.join(", ")}
              </p>
            )}
        </div>

        {/* Responsavel */}
        <div className="px-4 py-3.5">
          <p className="text-[10px] text-white/30 mb-0.5">
            Responsavel pelo agendamento
          </p>
          <p className="text-sm text-white/70">{responsavelNome}</p>
        </div>

        {/* Observacoes */}
        {form.observacoes && (
          <div className="px-4 py-3.5">
            <p className="text-[10px] text-white/30 mb-0.5">Observacoes</p>
            <p className="text-sm text-white/50 italic">{form.observacoes}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
          loading
            ? "bg-[#5DD3A8]/40 text-[#0B2545]/60 cursor-not-allowed"
            : "bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] cursor-pointer"
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-[#0B2545]/30 border-t-[#0B2545]/80 rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar solicitacao →"
        )}
      </button>
    </div>
  );
}

// ─── Como funciona ────────────────────────────────────────────────────────────

function ComoFunciona() {
  const cards = [
    {
      icon: "◎",
      titulo: "Solicite pelo painel",
      descricao:
        "Selecione as vacinas, datas preferidas e estimativa de colaboradores diretamente aqui.",
    },
    {
      icon: "◆",
      titulo: "VaciVitta confirma em 48h",
      descricao:
        "Equipe especializada entra em contato para alinhar logistica, insumos e acesso ao espaco.",
    },
    {
      icon: "⬡",
      titulo: "Vacinacao na sua empresa",
      descricao:
        "Equipe VaciVitta vai ate voce com insumos, registro digital e certificacao para cada colaborador.",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Como funciona</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.titulo}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
          >
            <span className="text-[#5DD3A8] text-xl leading-none">
              {card.icon}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                {card.titulo}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {card.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/25 text-center pt-1">
        Mais de 10 anos de operacao real de vacinacao corporativa no Brasil
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function InCompanyVaciVitta() {
  const { vegliaUser, firebaseUser } = useAuth();

  const [form, setForm] = useState<FormState>(FORM_INITIAL);
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [sucesso, setSucesso] = useState<boolean>(false);

  const responsavelNome =
    vegliaUser?.displayName ?? firebaseUser?.displayName ?? firebaseUser?.email ?? "—";

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const podeAvancar = (): boolean => {
    if (step === 1) return form.vacinas_selecionadas.length > 0;
    if (step === 2) return form.data_1.trim() !== "";
    return true;
  };

  const avancar = () => {
    if (!podeAvancar()) return;
    setStep((prev) => (Math.min(prev + 1, 4) as WizardStep));
  };

  const voltar = () => {
    if (sucesso) {
      setSucesso(false);
      setForm(FORM_INITIAL);
      setStep(1);
      return;
    }
    setStep((prev) => (Math.max(prev - 1, 1) as WizardStep));
  };

  const enviar = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSucesso(true);
    }, 1500);
  };

  const resetarWizard = () => {
    setSucesso(false);
    setForm(FORM_INITIAL);
    setStep(1);
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
            IN-COMPANY · VACIVITTA
          </p>
          <h1 className="text-2xl font-bold text-white">
            Vacinacao In-Company
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-sm text-white/40">
              Solicite a presenca da equipe VaciVitta na sua empresa ·
              agendamento em 48h
            </p>
            <span className="text-[10px] font-semibold text-[#5DD3A8]/60 bg-[#5DD3A8]/8 border border-[#5DD3A8]/20 px-2 py-0.5 rounded-full tracking-wide shrink-0">
              Powered by VaciVitta
            </span>
            <span className="text-[10px] font-semibold text-[#C9A96E]/70 bg-[#C9A96E]/8 border border-[#C9A96E]/20 px-2 py-0.5 rounded-full tracking-wide shrink-0">
              Disponivel para assinantes Pro e Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* ── Secao 1: Solicitacoes ativas ── */}
      {SOLICITACOES_MOCK.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">
              Solicitacoes ativas
            </h2>
            <span className="text-xs text-white/30">
              {SOLICITACOES_MOCK.length} solicitacao
              {SOLICITACOES_MOCK.length !== 1 ? "es" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOLICITACOES_MOCK.map((sol) => (
              <SolicitacaoCard key={sol.id} solicitacao={sol} />
            ))}
          </div>
        </div>
      )}

      {/* ── Secao 2: Wizard nova solicitacao ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Nova solicitacao</h2>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          {/* Barra de progresso */}
          {!sucesso && (
            <div className="flex justify-center">
              <WizardProgress currentStep={step} />
            </div>
          )}

          {/* Separador */}
          {!sucesso && <div className="border-t border-white/5" />}

          {/* Conteudo do step */}
          {step === 1 && <Step1 form={form} onChange={updateForm} />}
          {step === 2 && <Step2 form={form} onChange={updateForm} />}
          {step === 3 && <Step3 form={form} onChange={updateForm} />}
          {step === 4 && (
            <Step4
              form={form}
              responsavelNome={responsavelNome}
              loading={loading}
              sucesso={sucesso}
              onSubmit={enviar}
            />
          )}

          {/* Navegacao */}
          {!sucesso && (
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={voltar}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  ← Voltar
                </button>
              ) : (
                <div />
              )}

              {step < 4 && (
                <button
                  type="button"
                  onClick={avancar}
                  disabled={!podeAvancar()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    podeAvancar()
                      ? "bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] cursor-pointer"
                      : "bg-white/8 text-white/25 cursor-not-allowed"
                  }`}
                >
                  Proximo →
                </button>
              )}
            </div>
          )}

          {/* Botao nova solicitacao apos sucesso */}
          {sucesso && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={resetarWizard}
                className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
              >
                Fazer nova solicitacao
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Secao 3: Como funciona ── */}
      <ComoFunciona />

      {/* ── Secao 4: Credenciais medicas ── */}
      <div className="border-t border-white/5 pt-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#5DD3A8]/15 border border-[#5DD3A8]/25 flex items-center justify-center text-[#5DD3A8] text-base shrink-0">
            ✦
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Dra. Amanda Conde Perez Fernandes
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Diretora Medica · VaciVitta
            </p>
            <p className="text-xs text-white/25 mt-0.5">
              Membro SBIm · CRM validado · Pediatra · Neonatologista ·
              Nutrologa
            </p>
          </div>
        </div>
      </div>

      {/* ── Rodape ── */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-[11px] text-white/20 text-center leading-relaxed">
          Vacinacao In-Company VaciVitta · agendamento sujeito a disponibilidade
          da equipe
          <br />
          Powered by VaciVitta · Vegl.ia Plataforma de Compliance Preventivo
        </p>
      </div>
    </div>
  );
}
