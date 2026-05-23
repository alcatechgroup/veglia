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

// ─── Nav item "em breve" — QW1 ────────────────────────────────────────────────
// Renderiza item desabilitado com badge "Em breve" para features S2+.
// Evita que o usuário clique em telas stub durante demos.

function NavItemComingSoon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm opacity-35 cursor-not-allowed select-none">
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 text-white/50">{label}</span>
      <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/15 text-white/30 font-medium tracking-wide uppercase">
        Em breve
      </span>
    </div>
  );
}

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

  const isRH =
    claims?.role === "admin_rh" ||
    claims?.role === "admin" ||
    vegliaUser?.role === "rh" ||
    vegliaUser?.role === "admin";

  const isColaborador = !isRH;

  return (
    <div className="flex min-h-screen bg-[#0B2545]">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/5 px-5 py-8 overflow-y-auto">

        {/* Logo */}
        <div className="mb-8">
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
              <NavLink to="/app/diagnostico" className={navLinkClass}>
                <span className="text-base leading-none">◇</span>
                Diagnóstico
              </NavLink>
              <NavLink to="/app/certificados" className={navLinkClass}>
                <span className="text-base leading-none">◆</span>
                Meus Certificados
              </NavLink>
            </>
          )}

          {/* ── Saúde — S2+ (Em breve) — QW1 ── */}
          <div className="border-t border-white/5 my-2" />
          <p className="text-[10px] text-white/15 px-3 mb-1 uppercase tracking-wide">
            Saúde · Em breve
          </p>
          <NavItemComingSoon icon="◆" label="Passaporte Digital" />
          <NavItemComingSoon icon="◑" label="Saúde da Família" />
          <NavItemComingSoon icon="◎" label="Canal de Saúde" />
          <NavItemComingSoon icon="◇" label="Assistente IA" />

          {/* ── Engajamento — S2+ (Em breve) — QW1 ── */}
          <div className="border-t border-white/5 my-2" />
          <p className="text-[10px] text-white/15 px-3 mb-1 uppercase tracking-wide">
            Engajamento · Em breve
          </p>
          <NavItemComingSoon icon="◈" label="Jornadas" />
          <NavItemComingSoon icon="◆" label="Conquistas" />
          <NavItemComingSoon icon="◻" label="Benefícios" />
          <NavItemComingSoon icon="◐" label="Marketplace" />

          {/* ── Ferramentas RH — S2+ ── */}
          {isRH && (
            <>
              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/15 px-3 mb-1 uppercase tracking-wide">
                Ferramentas RH · Em breve
              </p>
              <NavItemComingSoon icon="◐" label="Campanhas" />
              <NavItemComingSoon icon="▦" label="SIPAT Automática" />
              <NavItemComingSoon icon="◆" label="Cert. Empresa" />
            </>
          )}

          <div className="border-t border-white/5 my-2" />
          <NotificationBell uid={uid} />

          {/* ── Ferramentas freemium ── */}
          <div className="border-t border-white/5 my-3" />
          <p className="text-[10px] text-white/25 px-3 mb-1 uppercase tracking-wide">
            Ferramentas gratuitas
          </p>
          <a
            href="/diagnostico"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/45 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            <span className="text-base leading-none">◇</span>
            Diagnóstico Empresa
          </a>
          <a
            href="/calculadora-vacinal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/45 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            <span className="text-base leading-none">◈</span>
            Calculadora Vacinal
          </a>
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
