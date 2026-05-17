import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db, auth } from "@veglia/firebase-config";
import type { UserRole } from "@veglia/shared";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface InviteData {
  company_id: string;
  email: string;
  role: UserRole;
  displayName: string;
  cargo?: string;
  createdAt: number;
  usedAt: number | null;
}

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; invite: InviteData; token: string }
  | { status: "success" };

// ─── AceitarConvite ───────────────────────────────────────────────────────────

export default function AceitarConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Busca e valida o convite
  useEffect(() => {
    if (!token) {
      setPageState({ status: "error", message: "Link de convite inválido ou expirado." });
      return;
    }

    getDoc(doc(db, "invites", token))
      .then((snap) => {
        if (!snap.exists()) {
          setPageState({ status: "error", message: "Convite não encontrado. Solicite um novo ao seu RH." });
          return;
        }

        const data = snap.data() as InviteData;

        if (data.usedAt !== null) {
          setPageState({ status: "error", message: "Este convite já foi utilizado. Entre em contato com seu RH." });
          return;
        }

        setName(data.displayName ?? "");
        setPageState({ status: "ready", invite: data, token });
      })
      .catch(() => {
        setPageState({ status: "error", message: "Erro ao verificar convite. Tente novamente." });
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Informe seu nome completo.");
      return;
    }
    if (password.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    if (pageState.status !== "ready") return;
    const { invite } = pageState;

    setSubmitting(true);

    try {
      // 1. Cria conta Firebase Auth
      const credential = await createUserWithEmailAndPassword(
        auth,
        invite.email,
        password
      );
      const { user } = credential;

      // 2. Atualiza displayName no Auth
      await updateProfile(user, { displayName: name.trim() });

      // 3. Cria documento users/{uid}
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        company_id: invite.company_id,
        role: invite.role,
        email: invite.email,
        displayName: name.trim(),
        cargo: invite.cargo ?? "",
        status_compliance: "pending",
        createdAt: Date.now(),
      });

      // 4. Marca convite como usado
      await updateDoc(doc(db, "invites", token), {
        usedAt: serverTimestamp(),
      });

      // 5. Aguarda token JWT ser propagado (custom claims via Cloud Function syncUserClaims)
      // Dá um refresh para pegar os claims depois que o trigger Firestore rodar
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await user.getIdToken(true);

      setPageState({ status: "success" });
      setTimeout(() => navigate("/app/trilhas", { replace: true }), 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar sua conta. Tente novamente.";
      // Traduz erros comuns do Firebase
      if (message.includes("email-already-in-use")) {
        setFormError("Este e-mail já possui uma conta. Faça login diretamente.");
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (pageState.status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B2545] flex items-center justify-center">
        <div className="flex items-baseline gap-1 animate-pulse">
          <span className="text-3xl font-bold text-white">Vegl</span>
          <span className="text-3xl font-bold text-[#C9A96E]">.</span>
          <span className="text-3xl font-bold text-[#5DD3A8]">ia</span>
        </div>
      </div>
    );
  }

  // ─── Erro ─────────────────────────────────────────────────────────────────

  if (pageState.status === "error") {
    return (
      <div className="min-h-screen bg-[#0B2545] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-baseline gap-0.5 justify-center mb-8">
            <span className="text-4xl font-bold text-white">Vegl</span>
            <span className="text-4xl font-bold text-[#C9A96E]">.</span>
            <span className="text-4xl font-bold text-[#5DD3A8]">ia</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <p className="text-3xl mb-4">✗</p>
            <p className="text-white/70 text-sm">{pageState.message}</p>
            <a
              href="/login"
              className="inline-block mt-6 text-xs text-[#5DD3A8] hover:underline"
            >
              Ir para o login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Sucesso ──────────────────────────────────────────────────────────────

  if (pageState.status === "success") {
    return (
      <div className="min-h-screen bg-[#0B2545] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-3 text-[#5DD3A8]">✓</p>
          <p className="text-white font-semibold">Conta criada! Redirecionando...</p>
        </div>
      </div>
    );
  }

  // ─── Formulário ───────────────────────────────────────────────────────────

  const { invite } = pageState;

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
          {/* Convite header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-full px-3 py-1 mb-4">
              <span className="text-[#5DD3A8] text-xs">Convite recebido</span>
            </div>
            <h1 className="text-xl font-semibold text-white mb-1">
              Bem-vindo à Vegl.ia
            </h1>
            <p className="text-sm text-white/50">
              Você foi convidado para acessar a plataforma.
            </p>
            <p className="text-xs text-white/30 mt-2">
              E-mail: <span className="text-white/50">{invite.email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Nome completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Senha *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Confirmar senha *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50 transition-colors"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {submitting ? "Criando conta..." : "Criar conta e entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-5">
            Já tem conta?{" "}
            <a href="/login" className="text-[#5DD3A8] hover:underline">
              Fazer login
            </a>
          </p>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          Powered by <span className="text-[#5DD3A8]/40 font-semibold">VaciVitta</span>
        </p>
      </div>
    </div>
  );
}
