import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { loginWithEmail, loginWithGoogle, claims, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users based on role — wrapped in useEffect to avoid
  // calling navigate during render (React Router warning)
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

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // Navigation handled by useEffect above once claims are loaded
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      // Navigation handled by useEffect above once claims are loaded
    } catch {
      setError("Falha ao entrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Eyebrow — internal access indicator */}
        <p className="text-center text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#C9A96E" }}>
          Acesso Administrativo · Vegl.ia
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

        {/* Form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail dos sócios"
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

          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 py-3 rounded-xl bg-twilight text-white text-sm font-semibold tracking-wide hover:bg-mid-blue transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-twilight/10" />
          <span className="text-xs text-twilight/35 uppercase tracking-widest">ou</span>
          <hr className="flex-1 border-twilight/10" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-xl border border-twilight/15 bg-white text-twilight text-sm font-medium hover:bg-bone transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          Entrar com Google
        </button>

        <div className="flex items-center justify-between mt-8">
          <a
            href="/acesso"
            className="text-xs text-twilight/35 hover:text-twilight/60 transition-colors flex items-center gap-1"
          >
            ← Acesso RH/Clientes
          </a>
          <p className="text-xs text-twilight/35">Powered by Vacivitta</p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
