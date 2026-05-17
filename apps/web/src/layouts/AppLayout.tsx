import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, vegliaUser, claims, logout } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid ?? "";

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
      isActive
        ? "bg-[#5DD3A8]/15 text-[#5DD3A8] font-medium"
        : "text-white/45 hover:text-white/80 hover:bg-white/5"
    }`;

  return (
    <div className="flex min-h-screen bg-[#0B2545]">
      {/* Sidebar */}
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

        {/* Nav */}
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
                Auditoria / CSV
              </NavLink>

              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
                Educação
              </p>
              <NavLink to="/app/trilhas-rh" className={navLinkClass}>
                <span className="text-base leading-none">◎</span>
                Trilhas
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
              <NavLink to="/app/convites" className={navLinkClass}>
                <span className="text-base leading-none">◻</span>
                Convites
              </NavLink>
              <NavLink to="/app/certificados" className={navLinkClass}>
                <span className="text-base leading-none">◆</span>
                Certificados
              </NavLink>
              <NavLink to="/app/relatorio" className={navLinkClass}>
                <span className="text-base leading-none">▦</span>
                Relatório Equipe
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

          {/* ── S2+: Features disponíveis para todos ── */}
          <div className="border-t border-white/5 my-2" />
          <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
            Saude
          </p>
          <NavLink to="/app/passaporte" className={navLinkClass}>
            <span className="text-base leading-none">◆</span>
            Passaporte Digital
          </NavLink>
          <NavLink to="/app/familia" className={navLinkClass}>
            <span className="text-base leading-none">◑</span>
            Saude da Familia
          </NavLink>
          <NavLink to="/app/canal" className={navLinkClass}>
            <span className="text-base leading-none">◎</span>
            Canal de Saude
          </NavLink>
          <NavLink to="/app/assistente" className={navLinkClass}>
            <span className="text-base leading-none">◇</span>
            Assistente IA
          </NavLink>

          <div className="border-t border-white/5 my-2" />
          <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
            Engajamento
          </p>
          <NavLink to="/app/jornadas" className={navLinkClass}>
            <span className="text-base leading-none">◈</span>
            Jornadas
          </NavLink>
          <NavLink to="/app/conquistas" className={navLinkClass}>
            <span className="text-base leading-none">◆</span>
            Conquistas
          </NavLink>
          <NavLink to="/app/beneficios" className={navLinkClass}>
            <span className="text-base leading-none">◻</span>
            Beneficios
          </NavLink>
          <NavLink to="/app/marketplace" className={navLinkClass}>
            <span className="text-base leading-none">◐</span>
            Marketplace
          </NavLink>

          {isRH && (
            <>
              <div className="border-t border-white/5 my-2" />
              <p className="text-[10px] text-white/20 px-3 mb-1 uppercase tracking-wide">
                Ferramentas RH
              </p>
              <NavLink to="/app/campanhas" className={navLinkClass}>
                <span className="text-base leading-none">◐</span>
                Campanhas
              </NavLink>
              <NavLink to="/app/sipat" className={navLinkClass}>
                <span className="text-base leading-none">▦</span>
                SIPAT Automatica
              </NavLink>
              <NavLink to="/app/certificacao-empresa" className={navLinkClass}>
                <span className="text-base leading-none">◆</span>
                Cert. Empresa
              </NavLink>
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

        {/* Footer do sidebar */}
        <div className="border-t border-white/5 pt-5 space-y-1">
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

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full p-8">{children}</div>
        {/* Footer Powered by Vacivitta */}
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
