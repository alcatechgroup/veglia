import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable, getFunctions } from "firebase/functions";
import { app, auth } from "@veglia/firebase-config";

// ─── CNPJ helpers (mirror de AcessoRH para consistência) ─────────────────────

function applyCnpjMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function stripCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCnpj(cnpj: string): boolean {
  return cnpj.length === 0 || cnpj.length === 14; // vazio = opcional; 14 = válido
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(applyCnpjMask(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const cnpjClean = stripCnpj(cnpj);

    // Validação: CNPJ preenchido deve ter 14 dígitos (máscara garante isso)
    if (cnpj && !isValidCnpj(cnpjClean)) {
      setError("CNPJ inválido. Verifique os dígitos e tente novamente.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions(app, "southamerica-east1");
      const createCompany = httpsCallable(functions, "createCompany");

      // QW2: passa CNPJ sempre sem formatação (14 dígitos) para garantir
      // que a busca em AcessoRH (where cnpj == cnpjClean) funcione.
      await createCompany({
        companyName: companyName.trim(),
        cnpj: cnpjClean || undefined,
      });

      // Polling: aguarda syncUserClaims propagar company_id no JWT
      const waitForClaims = async (maxAttempts = 5, delayMs = 1500): Promise<boolean> => {
        for (let i = 0; i < maxAttempts; i++) {
          const token = await auth.currentUser?.getIdTokenResult(true);
          if (token?.claims?.company_id) return true;
          await new Promise<void>((r) => setTimeout(r, delayMs));
        }
        return false;
      };

      const claimsReady = await waitForClaims();
      if (!claimsReady) {
        console.warn("[Onboarding] Claims não propagados a tempo — navegando mesmo assim");
      }

      navigate("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar empresa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B2545] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-baseline gap-0.5 justify-center mb-8">
          <span className="text-4xl font-bold text-white tracking-tight">Vegl</span>
          <span className="text-4xl font-bold text-[#C9A96E]">.</span>
          <span className="text-4xl font-bold text-[#5DD3A8]">ia</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Bem-vindo</h1>
          <p className="text-sm text-white/50 mb-6">
            Configure sua empresa para começar a usar a plataforma.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome da empresa */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Nome da empresa *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Empresa XYZ Ltda"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 focus:bg-white/8 transition-colors"
              />
            </div>

            {/* CNPJ com máscara — QW3 */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                CNPJ
                <span className="ml-1 text-white/30 font-normal">(necessário para login)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(93,211,168,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <p className="text-[10px] text-white/25 mt-1">
                O CNPJ é usado para identificar a empresa no login do RH.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className="w-full bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? "Criando empresa…" : "Começar →"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          Powered by <span className="text-[#5DD3A8]/40 font-semibold">VaciVitta</span>
        </p>
      </div>
    </div>
  );
}
