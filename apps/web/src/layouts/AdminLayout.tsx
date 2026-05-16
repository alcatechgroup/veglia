import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/admin", label: "Visão Geral", icon: "⬡", end: true },
  { to: "/admin/roadmap", label: "Roadmap", icon: "◈" },
  { to: "/admin/sprint", label: "Sprint 1", icon: "◎" },
  { to: "/admin/materiais", label: "Materiais", icon: "◻" },
  { to: "/admin/decisoes", label: "Decisões", icon: "◆" },
  { to: "/admin/historico", label: "Memória", icon: "◑" },
  { to: "/admin/roteiros",     label: "Roteiros",     icon: "▶" },
  { to: "/admin/comunicacao", label: "Comunicação",  icon: "◐" },
  { to: "/admin/pitch",       label: "Pitch VR",      icon: "◇" },
  { to: "/admin/conteudo",   label: "Conteudo",      icon: "▷" },
];

const BREADCRUMB: Record<string, string> = {
  "/admin":               "Visão Geral",
  "/admin/roadmap":       "Roadmap",
  "/admin/sprint":        "Sprint 1",
  "/admin/materiais":     "Materiais",
  "/admin/decisoes":      "Decisões",
  "/admin/historico":     "Memória",
  "/admin/roteiros":      "Roteiros",
  "/admin/comunicacao":   "Comunicação",
  "/admin/pitch":         "Pitch VR",
  "/admin/conteudo":     "Conteudo",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageLabel = BREADCRUMB[location.pathname] ?? "Command Center";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0B2545]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-white/5 px-5 py-8">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-bold text-white tracking-tight">Vegl</span>
            <span className="text-3xl font-bold text-[#C9A96E]">.</span>
            <span className="text-3xl font-bold text-[#5DD3A8]">ia</span>
          </div>
          <p className="text-xs text-white/30 mt-1 font-serif italic">Command Center</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-[#5DD3A8]/15 text-[#5DD3A8] font-medium"
                    : "text-white/45 hover:text-white/80 hover:bg-white/5"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        <div className="border-t border-white/5 pt-5">
          <p className="text-xs text-white/30 mb-0.5 truncate">{firebaseUser?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-white/25 hover:text-white/60 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-[#F4EDE0]/5 backdrop-blur-sm overflow-auto">
        {/* Topbar breadcrumb */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/25">
            <span>Vegl.ia</span>
            <span>/</span>
            <span className="text-white/55 font-medium">{pageLabel}</span>
          </div>
          <a
            href="/landing.html"
            className="text-[10px] text-white/20 hover:text-white/45 transition-colors flex items-center gap-1"
          >
            ← Site público
          </a>
        </div>
        <div className="min-h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
