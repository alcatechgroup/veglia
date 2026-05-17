import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import { app } from "@veglia/firebase-config";
import { auth } from "@veglia/firebase-config";

export default function Onboarding() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions(app, "southamerica-east1");
      const createCompany = httpsCallable(functions, "createCompany");
      await createCompany({ companyName: companyName.trim(), cnpj: cnpj.trim() || undefined });

      // Força refresh do token para pegar os novos custom claims
      await auth.currentUser?.getIdToken(true);
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
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                CNPJ (opcional)
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
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
              {loading ? "Criando empresa..." : "Começar"}
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
