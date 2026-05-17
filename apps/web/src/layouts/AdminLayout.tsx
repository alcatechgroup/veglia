import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  // Estrategia
  { to: "/admin", label: "Visao Geral", icon: "⬡", end: true, group: "Estrategia" },
  { to: "/admin/roadmap", label: "Roadmap", icon: "◈", group: "Estrategia" },
  { to: "/admin/sprint", label: "Sprint 1", icon: "◎", group: "Estrategia" },
  { to: "/admin/decisoes", label: "Decisoes", icon: "◆", group: "Estrategia" },
  { to: "/admin/historico", label: "Memoria", icon: "◑", group: "Estrategia" },
  // Conteudo
  { to: "/admin/materiais", label: "Materiais", icon: "◻", group: "Conteudo" },
  { to: "/admin/roteiros", label: "Roteiros", icon: "▶", group: "Conteudo" },
  { to: "/admin/comunicacao", label: "Comunicacao", icon: "◐", group: "Conteudo" },
  { to: "/admin/conteudo", label: "Video IDs", icon: "▷", group: "Conteudo" },
  { to: "/admin/canal", label: "Canal Saude", icon: "◎", group: "Conteudo" },
  // Plataforma
  { to: "/admin/pitch", label: "Pitch VR", icon: "◇", group: "Plataforma" },
  { to: "/admin/white-label", label: "White Label", icon: "◈", group: "Plataforma" },
  { to: "/admin/epidemiologia", label: "Epidemiologia", icon: "◎", group: "Plataforma" },
  { to: "/admin/marketplace", label: "Marketplace", icon: "◐", group: "Plataforma" },
  { to: "/admin/beneficios", label: "Beneficios", icon: "◻", group: "Plataforma" },
  { to: "/admin/analytics", label: "Analytics", icon: "◆", group: "Plataforma" },
];

const BREADCRUMB: Record<string, string> = {
  "/admin": "Visao Geral",
  "/admin/roadmap": "Roadmap",
  "/admin/sprint": "Sprint 1",
  "/admin/materiais": "Materiais",
  "/admin/decisoes": "Decisoes",
  "/admin/historico": "Memoria",
  "/admin/roteiros": "Roteiros",
  "/admin/comunicacao": "Comunicacao",
  "/admin/pitch": "Pitch VR",
  "/admin/conteudo": "Video IDs",
  "/admin/canal": "Canal Saude",
  "/admin/white-label": "White Label",
  "/admin/epidemiologia": "Epidemiologia",
  "/admin/marketplace": "Marketplace",
  "/admin/beneficios": "Beneficios",
  "/admin/analytics": "Analytics",
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

        {/* Nav com grupos */}
        <nav className="flex flex-col gap-0.5 overflow-y-auto">
          {["Estrategia", "Conteudo", "Plataforma"].map((group) => (
            <div key={group} className="mb-2">
              <p className="text-[10px] text-white/20 px-3 py-1 uppercase tracking-wide">
                {group}
              </p>
              {NAV.filter((item) => item.group === group).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : undefined}
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
            </div>
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
