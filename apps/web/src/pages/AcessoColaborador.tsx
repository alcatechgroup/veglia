import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Acesso do Colaborador — login simples (e-mail + senha), sem CNPJ.
 * O colaborador é provisionado pela empresa; entra direto nas trilhas.
 */
export default function AcessoColaborador() {
  const { loginWithEmail, claims, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (authLoading || !claims) return;
    if (claims.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (claims.role === "admin_rh" || claims.role === "rh") {
      navigate("/app/dashboard", { replace: true });
    } else {
      navigate("/app/trilhas", { replace: true });
    }
  }, [claims, authLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // Redirect tratado pelo useEffect quando os claims carregam
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential"
      ) {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Falha ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetError("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch {
      setResetError("Não foi possível enviar. Verifique o e-mail.");
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#5DD3A8" }}>
          Acesso do Colaborador · Vegl.ia
        </p>

        {/* Logo */}
        <div className="flex items-baseline gap-1 justify-center mb-2">
          <span className="text-4xl font-bold text-twilight tracking-tight">Vegl</span>
          <span className="text-4xl font-bold text-champagne">.</span>
          <span className="text-4xl font-bold text-mint">ia</span>
        </div>
        <p className="font-serif italic text-center text-twilight/50 mb-10 text-sm">
          Quem vela, cuida.
        </p>

        {!showReset ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded-xl border border-twilight/15 bg-white text-twilight placeholder:text-twilight/35 focus:outline-none focus:ring-2 focus:ring-mint text-sm"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-3 rounded-xl border border-twilight/15 bg-white text-twilight placeholder:text-twilight/35 focus:outline-none focus:ring-2 focus:ring-mint text-sm"
            />

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 rounded-xl bg-twilight text-white text-sm font-semibold tracking-wide hover:bg-mid-blue transition-colors disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => { setShowReset(true); setResetEmail(email); }}
              className="text-xs text-twilight/40 hover:text-twilight/70 transition-colors mt-1"
            >
              Esqueci minha senha
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-3">
            {resetSent ? (
              <p className="text-sm text-center text-twilight/70">
                Enviamos um link de redefinição para <strong>{resetEmail}</strong>. Confira seu e-mail.
              </p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl border border-twilight/15 bg-white text-twilight placeholder:text-twilight/35 focus:outline-none focus:ring-2 focus:ring-mint text-sm"
                />
                {resetError && <p className="text-red-500 text-xs text-center">{resetError}</p>}
                <button
                  type="submit"
                  className="py-3 rounded-xl bg-twilight text-white text-sm font-semibold hover:bg-mid-blue transition-colors"
                >
                  Enviar link de redefinição
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setShowReset(false); setResetSent(false); }}
              className="text-xs text-twilight/40 hover:text-twilight/70 transition-colors"
            >
              ← Voltar
            </button>
          </form>
        )}

        <div className="flex items-center justify-between mt-8">
          <a
            href="/acessorh"
            className="text-xs text-twilight/35 hover:text-twilight/60 transition-colors"
          >
            Sou RH/Gestor →
          </a>
          <p className="text-xs text-twilight/35">Powered by Vacivitta</p>
        </div>
      </div>
    </div>
  );
}
