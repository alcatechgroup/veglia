import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

// ─── Pages: public ────────────────────────────────────────────────────────────
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";
import AceitarConvite from "@/pages/AceitarConvite";
import Diagnostico from "@/pages/Diagnostico";
import CalculadoraVacinal from "@/pages/CalculadoraVacinal";

// ─── Pages: app (cliente) ─────────────────────────────────────────────────────
import Onboarding from "@/pages/app/Onboarding";
import Trilhas from "@/pages/app/Trilhas";
import TrilhaLei15377 from "@/pages/app/TrilhaLei15377";
import TrilhaNr1 from "@/pages/app/TrilhaNr1";
import DashboardRH from "@/pages/app/DashboardRH";
import Certificado from "@/pages/app/Certificado";
import Certificados from "@/pages/app/Certificados";
import Convites from "@/pages/app/Convites";
import Relatorio from "@/pages/app/Relatorio";
import TrilhasRH from "@/pages/app/TrilhasRH";
import CalendarioVacinalRH from "@/pages/app/CalendarioVacinalRH";
import InCompanyVaciVitta from "@/pages/app/InCompanyVaciVitta";

// ─── Pages: admin (command center) ───────────────────────────────────────────
import Overview from "@/pages/admin/Overview";
import Roadmap from "@/pages/admin/Roadmap";
import Sprint from "@/pages/admin/Sprint";
import Materiais from "@/pages/admin/Materiais";
import Decisoes from "@/pages/admin/Decisoes";
import Historico from "@/pages/admin/Historico";
import Roteiros from "@/pages/admin/Roteiros";
import Comunicacao from "@/pages/admin/Comunicacao";
import PitchDeck from "@/pages/admin/PitchDeck";
import GerenciarConteudo from "@/pages/admin/GerenciarConteudo";

// ─── Redirect inteligente por role ────────────────────────────────────────────

function AppRedirect() {
  const { claims } = useAuth();
  if (claims?.role === "admin_rh" || claims?.role === "admin" || claims?.role === "rh") {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <Navigate to="/app/trilhas" replace />;
}

// ─── Area dos socios (Command Center interno) ─────────────────────────────────

function AdminApp() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="sprint" element={<Sprint />} />
          <Route path="materiais" element={<Materiais />} />
          <Route path="decisoes" element={<Decisoes />} />
          <Route path="historico" element={<Historico />} />
          <Route path="roteiros" element={<Roteiros />} />
          <Route path="comunicacao" element={<Comunicacao />} />
          <Route path="pitch" element={<PitchDeck />} />
          <Route
            path="conteudo"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <GerenciarConteudo />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
}

// ─── Area do cliente (produto) ────────────────────────────────────────────────

function ClientApp() {
  return (
    <ProtectedRoute requiresCompany>
      <AppLayout>
        <Routes>
          {/* Redireciona /app para dashboard se for RH/admin, senao para trilhas */}
          <Route index element={<AppRedirect />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <DashboardRH />
              </ProtectedRoute>
            }
          />
          <Route path="trilhas" element={<Trilhas />} />
          <Route path="trilha/lei-15377" element={<TrilhaLei15377 />} />
          <Route path="trilha/nr-1" element={<TrilhaNr1 />} />
          <Route path="certificado" element={<Certificado />} />
          <Route path="certificados" element={<Certificados />} />
          <Route
            path="convites"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <Convites />
              </ProtectedRoute>
            }
          />
          <Route
            path="relatorio"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <Relatorio />
              </ProtectedRoute>
            }
          />
          <Route
            path="trilhas-rh"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <TrilhasRH />
              </ProtectedRoute>
            }
          />
          <Route
            path="calendario-vacinal"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <CalendarioVacinalRH />
              </ProtectedRoute>
            }
          />
          <Route
            path="in-company"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <InCompanyVaciVitta />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/aceitar-convite" element={<AceitarConvite />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="/calculadora-vacinal" element={<CalculadoraVacinal />} />

        {/* Rotas protegidas */}
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/app/*" element={<ClientApp />} />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}
