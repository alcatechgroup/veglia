import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell({ uid }: { uid: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", uid),
      where("read", "==", false)
    );
    return onSnapshot(q, (snap) => setCount(snap.size));
  }, [uid]);

  return (
    <NavLink
      to="/app/notificacoes"
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
          isActive
            ? "bg-[#5DD3A8]/15 text-[#5DD3A8] font-medium"
            : "text-white/45 hover:text-white/80 hover:bg-white/5"
        }`
      }
    >
      <span className="text-base leading-none">◎</span>
      Notificacoes
      {count > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-[#5DD3A8] text-[#0B2545] text-[10px] font-bold rounded-full px-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </NavLink>
  );
}

// ─── Nav item active ──────────────────────────────────────────────────────────

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
    isActive
      ? "bg-[#5DD3A8]/15 text-[#5DD3A8] font-medium"
      : "text-white/45 hover:text-white/80 hover:bg-white/5"
  }`;

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, vegliaUser, claims, logout } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid ?? "";

  // QW5 — nome da empresa no footer da sidebar
  const [companyName, setCompanyName] = useState<string | null>(null);
  useEffect(() => {
    const companyId = claims?.company_id;
    if (!companyId) return;
    getDoc(doc(db, "companies", companyId)).then((snap) => {
      if (snap.exists()) setCompanyName(snap.data()?.name ?? null);
    }).catch(() => {/* silencia erros de permissão */});
  }, [claims?.company_id]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Tema visual: "clean" (light) ou "dark". Persistido em localStorage.
  const [theme, setTheme] = useState<"clean" | "dark">(
    () => (localStorage.getItem("veglia_theme") as "clean" | "dark") || "clean"
  );
  useEffect(() => {
    localStorage.setItem("veglia_theme", theme);
  }, [theme]);

  const isRH =
    claims?.role === "admin_rh" ||
    claims?.role === "admin" ||
    vegliaUser?.role === "rh" ||
    vegliaUser?.role === "admin";

  const isColaborador = !isRH;

  return (
    <div className={`flex min-h-screen bg-[#0B2545] ${theme === "clean" ? "theme-clean" : ""}`}>
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/5 px-5 py-8 overflow-y-auto">

        {/* Logo + toggle de tema */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-white tracking-tight">Vegl</span>
                <span className="text-2xl font-bold text-[#C9A96E]">.</span>
                <span className="text-2xl font-bold text-[#5DD3A8]">ia</span>
              </div>
              {isRH ? (
                <p className="text-[10px] text-white/30 mt-0.5">Painel RH</p>
              ) : (
                <p className="text-[10px] text-white/30 mt-0.5">Área do Colaborador</p>
              )}
            </div>
            <button
              onClick={() => setTheme((t) => (t === "clean" ? "dark" : "clean"))}
              className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              title={theme === "clean" ? "Mudar para tema escuro" : "Mudar para tema claro"}
              aria-label="Alternar tema"
            >
              {theme === "clean" ? (
                /* lua — vai para escuro */
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                /* sol — vai para claro */
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex flex-col gap-0.5">

          {/* ── RH / Admin ── */}
          {isRH && (
            <>
              <p className="text-[10px] text-white/20 px-3 mb-1 mt-1 uppercase tracking-wide">
                Visão geral
              </p>
              <NavLink to="/app/dashboard" className={navLinkClass}>
                <span className="text-base leading-none">⬡</span>
                Dashboard RH
              </NavLink>

              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
                Compliance
              </p>
              <NavLink to="/app/compliance" end className={navLinkClass}>
                <span className="text-base leading-none">◈</span>
                Painel Compliance
              </NavLink>
              <NavLink to="/app/compliance/vacinacao" className={navLinkClass}>
                <span className="text-base leading-none">◇</span>
                Controle Vacinal
              </NavLink>
              <NavLink to="/app/compliance/treinamentos" className={navLinkClass}>
                <span className="text-base leading-none">◎</span>
                Treinamentos
              </NavLink>
              <NavLink to="/app/compliance/relatorio" className={navLinkClass}>
                <span className="text-base leading-none">▦</span>
                Auditoria · Exportar CSV
              </NavLink>

              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
                Educação
              </p>
              <NavLink to="/app/trilhas-rh" className={navLinkClass}>
                <span className="text-base leading-none">◎</span>
                Trilhas Educacionais
              </NavLink>
              <NavLink to="/app/calendario-vacinal" className={navLinkClass}>
                <span className="text-base leading-none">◈</span>
                Calendário Vacinal
              </NavLink>
              <NavLink to="/app/in-company" className={navLinkClass}>
                <span className="text-base leading-none">◑</span>
                In-Company VaciVitta
              </NavLink>

              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
                Indicadores
              </p>
              <NavLink to="/app/indice" className={navLinkClass}>
                <span className="text-base leading-none">◆</span>
                Índice Preventivo
              </NavLink>
              <NavLink to="/app/epidemiologia" className={navLinkClass}>
                <span className="text-base leading-none">◎</span>
                Epidemiologia
              </NavLink>

              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
                Gestão
              </p>
              <NavLink to="/app/colaboradores" className={navLinkClass}>
                <span className="text-base leading-none">◈</span>
                Colaboradores
              </NavLink>
              <NavLink to="/app/importar" className={navLinkClass}>
                <span className="text-base leading-none">⬡</span>
                Importar Funcionários
              </NavLink>
              <NavLink to="/app/convites" className={navLinkClass}>
                <span className="text-base leading-none">◻</span>
                Convites
              </NavLink>
              <NavLink to="/app/certificados" className={navLinkClass}>
                <span className="text-base leading-none">◆</span>
                Certificados da Equipe
              </NavLink>
              <NavLink to="/app/relatorio" className={navLinkClass}>
                <span className="text-base leading-none">▦</span>
                Relatório de Progresso
              </NavLink>
            </>
          )}

          {/* ── Colaborador ── */}
          {isColaborador && (
            <>
              <NavLink to="/app/trilhas" className={navLinkClass}>
                <span className="text-base leading-none">◎</span>
                Minhas Trilhas
              </NavLink>
              <NavLink to="/app/minhas-vacinas" className={navLinkClass}>
                <span className="text-base leading-none">＋</span>
                Minhas Vacinas
              </NavLink>
              <NavLink to="/app/certificados" className={navLinkClass}>
                <span className="text-base leading-none">◆</span>
                Meus Certificados
              </NavLink>
            </>
          )}

          {/* Áreas "Em breve" (S2+) ocultadas: app exibe apenas o que está disponível. */}

          <div className="border-t border-white/5 my-2" />
          <NotificationBell uid={uid} />
        </nav>

        <div className="flex-1" />

        {/* ── Footer sidebar — QW5: nome da empresa ── */}
        <div className="border-t border-white/5 pt-5 space-y-1">
          {companyName && (
            <p className="text-[11px] text-[#5DD3A8]/60 font-medium truncate mb-0.5">
              {companyName}
            </p>
          )}
          <p className="text-xs text-white/40 truncate">
            {vegliaUser?.displayName ?? firebaseUser?.displayName}
          </p>
          <p className="text-[10px] text-white/25 truncate">{firebaseUser?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-white/25 hover:text-white/60 transition-colors mt-1"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full p-8">{children}</div>
        <div className="px-8 pb-6 flex items-center justify-end">
          <span className="text-[10px] text-white/20 tracking-wide">
            Powered by{" "}
            <span className="text-[#5DD3A8]/40 font-semibold">VaciVitta</span>
          </span>
        </div>
      </main>
    </div>
  );
}
