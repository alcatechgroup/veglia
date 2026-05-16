import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── CNPJ helpers ─────────────────────────────────────────────────────────────

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
  return cnpj.length === 14;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AcessoRH() {
  const { loginWithEmail, claims, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // If already authenticated, redirect based on role
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

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(applyCnpjMask(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const cnpjClean = stripCnpj(cnpj);

    if (!isValidCnpj(cnpjClean)) {
      setError("CNPJ inválido. Verifique o número digitado.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Authenticate — the Firestore Security Rules for /companies
      // require authentication. We login first, then verify CNPJ association.
      try {
        await loginWithEmail(email, password);
      } catch (authErr: unknown) {
        const code = (authErr as { code?: string })?.code ?? "";
        if (
          code === "auth/wrong-password" ||
          code === "auth/user-not-found" ||
          code === "auth/invalid-credential"
        ) {
          setError("E-mail ou senha incorretos.");
        } else {
          setError("Falha ao autenticar. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      // Step 2: After login, force token refresh to get latest claims
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Erro inesperado. Tente novamente.");
        setLoading(false);
        return;
      }

      const tokenResult = await currentUser.getIdTokenResult(true);
      const userCompanyId = tokenResult.claims["company_id"] as string | undefined;
      const role = tokenResult.claims["role"] as string | undefined;

      // Step 3: Verify the CNPJ matches the authenticated user's company
      // Now the user is authenticated, so Firestore rules allow the read
      const q = query(collection(db, "companies"), where("cnpj", "==", cnpjClean));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // CNPJ not found — sign out and show error
        await signOut(auth);
        setError("CNPJ não cadastrado na plataforma. Entre em contato com seu gestor.");
        setLoading(false);
        return;
      }

      const companyDocId = snapshot.docs[0].id;

      if (!userCompanyId || userCompanyId !== companyDocId) {
        // Authenticated user belongs to a different company
        await signOut(auth);
        setError("Usuário não associado a esta empresa. Verifique o CNPJ.");
        setLoading(false);
        return;
      }

      // Step 4: Redirect based on role
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "admin_rh" || role === "rh") {
        navigate("/app/dashboard", { replace: true });
      } else {
        navigate("/app/trilhas", { replace: true });
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch {
      setResetError("Não foi possível enviar o e-mail. Verifique o endereço.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#0B2545" }}
    >
      {/* Logo */}
      <div className="flex items-baseline gap-1 justify-center mb-2">
        <span className="text-4xl font-bold tracking-tight" style={{ color: "#fff" }}>
          Vegl
        </span>
        <span className="text-4xl font-bold" style={{ color: "#C9A96E" }}>.</span>
        <span className="text-4xl font-bold" style={{ color: "#5DD3A8" }}>ia</span>
      </div>
      <p
        className="font-serif italic text-center mb-10 text-sm"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        Acesso da empresa
      </p>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 border"
        style={{
          background: "#1A3A5C",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <h1
          className="text-lg font-bold mb-1"
          style={{ color: "#fff" }}
        >
          Acesso RH
        </h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
          Entre com os dados da sua empresa para continuar.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* CNPJ */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              CNPJ da empresa
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              required
              autoComplete="off"
              className="px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                caretColor: "#5DD3A8",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#5DD3A8")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
              }
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              Seu e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
              required
              autoComplete="email"
              className="px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                caretColor: "#5DD3A8",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#5DD3A8")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
              }
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  caretColor: "#5DD3A8",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#5DD3A8")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                style={{ color: "rgba(255,255,255,0.4)" }}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="text-xs text-center px-3 py-2 rounded-lg"
              style={{ color: "#FF7272", background: "rgba(255,114,114,0.1)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50"
            style={{
              background: "#5DD3A8",
              color: "#0B2545",
            }}
          >
            {loading ? "Verificando…" : "Acessar plataforma →"}
          </button>
        </form>

        {/* Forgot password */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setResetEmail(email);
              setResetSent(false);
              setResetError("");
              setShowResetModal(true);
            }}
            className="text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#5DD3A8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            Esqueci minha senha
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
        Nao tem acesso?{" "}
        <a
          href="https://www.veglia.com.br"
          className="transition-colors"
          style={{ color: "#5DD3A8" }}
        >
          Solicitar demo
        </a>
        {" "}· Powered by Vacivitta
      </p>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 border"
            style={{
              background: "#1A3A5C",
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: "#fff" }}>
              Recuperar senha
            </h2>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Informe seu e-mail e enviaremos um link de redefinicao.
            </p>

            {resetSent ? (
              <div
                className="text-sm text-center px-4 py-3 rounded-xl"
                style={{ color: "#5DD3A8", background: "rgba(93,211,168,0.1)" }}
              >
                Link enviado! Verifique sua caixa de entrada.
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    caretColor: "#5DD3A8",
                  }}
                />
                {resetError && (
                  <p className="text-xs" style={{ color: "#FF7272" }}>
                    {resetError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
                  style={{ background: "#5DD3A8", color: "#0B2545" }}
                >
                  {resetLoading ? "Enviando…" : "Enviar link"}
                </button>
              </form>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
