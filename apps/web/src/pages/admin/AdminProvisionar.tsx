import { useState, type FormEvent } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@veglia/firebase-config";

// ─── CNPJ mask ────────────────────────────────────────────────────────────────
function applyCnpjMask(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

interface ProvisionResult {
  company_id: string;
  rhUid: string;
  resetLink: string;
  previewUrl: string | null;
}

export default function AdminProvisionar() {
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [rhName, setRhName] = useState("");
  const [rhEmail, setRhEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const functions = getFunctions(app, "us-central1");
      const provision = httpsCallable<
        { companyName: string; cnpj?: string; rhEmail: string; rhName?: string },
        ProvisionResult
      >(functions, "provisionClient");
      const res = await provision({
        companyName: companyName.trim(),
        cnpj: cnpj.replace(/\D/g, "") || undefined,
        rhEmail: rhEmail.trim(),
        rhName: rhName.trim() || undefined,
      });
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao provisionar cliente.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCompanyName(""); setCnpj(""); setRhName(""); setRhEmail("");
    setResult(null); setError(""); setCopied(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
          Admin · Onboarding
        </p>
        <h1 className="text-2xl font-bold text-white">Provisionar Cliente</h1>
        <p className="text-sm text-white/40 mt-1">
          Habilite uma nova empresa cliente. O sistema cria a empresa, vincula o CNPJ e o usuário
          RH (admin_rh) e envia um link para o RH definir a senha de acesso.
        </p>
      </div>

      {!result ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Nome da empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Ex: RHHUB Tecnologia da Informação LTDA"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/40"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(applyCnpjMask(e.target.value))}
              placeholder="00.000.000/0001-00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/40"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Nome do RH</label>
              <input
                type="text"
                value={rhName}
                onChange={(e) => setRhName(e.target.value)}
                placeholder="Nome do responsável"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/40"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">E-mail do RH</label>
              <input
                type="email"
                value={rhEmail}
                onChange={(e) => setRhEmail(e.target.value)}
                required
                placeholder="rh@empresa.com.br"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/40"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? "Provisionando…" : "Habilitar cliente"}
          </button>
        </form>
      ) : (
        <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/25 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <h2 className="text-lg font-semibold text-[#5DD3A8]">Cliente habilitado!</h2>
          </div>
          <p className="text-sm text-white/60">
            Empresa criada (<code className="text-white/80 bg-white/10 px-1 rounded">{result.company_id}</code>)
            e usuário RH vinculado.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
              Link para o RH definir a senha
            </p>
            <p className="text-xs text-white/40">
              Enviado por e-mail ao RH. Se o e-mail não chegar (SMTP não configurado),
              copie o link abaixo e repasse manualmente.
            </p>
            <div className="flex gap-2 items-center">
              <input
                readOnly
                value={result.resetLink}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.resetLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium px-3 py-2 rounded-lg"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            {result.previewUrl && (
              <a
                href={result.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-[#5DD3A8] hover:underline mt-1"
              >
                Ver prévia do e-mail (modo demo) →
              </a>
            )}
          </div>

          <button
            onClick={reset}
            className="bg-white/10 hover:bg-white/15 text-white/80 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Provisionar outro cliente
          </button>
        </div>
      )}
    </div>
  );
}
