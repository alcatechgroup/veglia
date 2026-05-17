import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

// ─── Pages: public ────────────────────────────────────────────────────────────
import Login from "@/pages/Login";
import AcessoRH from "@/pages/AcessoRH";
import Unauthorized from "@/pages/Unauthorized";
import AceitarConvite from "@/pages/AceitarConvite";
import Diagnostico from "@/pages/Diagnostico";
import CalculadoraVacinal from "@/pages/CalculadoraVacinal";
import PassaportePublico from "@/pages/PassaportePublico";

// ─── Pages: app — S1 Core ────────────────────────────────────────────────────
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

// ─── F01 Compliance (S1) ──────────────────────────────────────────────────────
import ComplianceDashboard from "@/pages/app/ComplianceDashboard";
import ComplianceVacinacao from "@/pages/app/ComplianceVacinacao";
import ComplianceTreinamentos from "@/pages/app/ComplianceTreinamentos";
import ComplianceRelatorio from "@/pages/app/ComplianceRelatorio";

// ─── F02 Diagnóstico do colaborador (S1) ─────────────────────────────────────
import DiagnosticoColaborador from "@/pages/app/DiagnosticoColaborador";

// ─── F13 Índice Preventivo Corporativo (S2) ──────────────────────────────────
import IndicePreventivo from "@/pages/app/IndicePreventivo";

// ─── F06 Certificação de Empresa ──────────────────────────────────────────────
import CertificacaoEmpresa from "@/pages/app/CertificacaoEmpresa";

// ─── Pages: app — S2+ ────────────────────────────────────────────────────────
import Campanhas from "@/pages/app/Campanhas";
import Jornadas from "@/pages/app/Jornadas";
import Conquistas from "@/pages/app/Conquistas";
import Passaporte from "@/pages/app/Passaporte";
import ISPC from "@/pages/app/ISPC";
import Sipat from "@/pages/app/Sipat";
import Notificacoes from "@/pages/app/Notificacoes";
import Marketplace from "@/pages/app/Marketplace";
import Canal from "@/pages/app/Canal";
import Assistente from "@/pages/app/Assistente";
import Beneficios from "@/pages/app/Beneficios";
import Familia from "@/pages/app/Familia";

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
import WhiteLabel from "@/pages/admin/WhiteLabel";
import Epidemiologia from "@/pages/admin/Epidemiologia";
import AdminCanal from "@/pages/admin/AdminCanal";
import AdminMarketplace from "@/pages/admin/AdminMarketplace";
import AdminBeneficios from "@/pages/admin/AdminBeneficios";
import Analytics from "@/pages/admin/Analytics";
import Leads from "@/pages/admin/Leads";

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
    <ProtectedRoute requiredRole={["admin"]}>
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
          <Route
            path="white-label"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <WhiteLabel />
              </ProtectedRoute>
            }
          />
          <Route
            path="epidemiologia"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Epidemiologia />
              </ProtectedRoute>
            }
          />
          <Route
            path="canal"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <AdminCanal />
              </ProtectedRoute>
            }
          />
          <Route
            path="marketplace"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <AdminMarketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="beneficios"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <AdminBeneficios />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="leads"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Leads />
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

          {/* ── S1: Dashboard principal ── */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <DashboardRH />
              </ProtectedRoute>
            }
          />

          {/* ── S1: F01 Compliance ── */}
          <Route
            path="compliance"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <ComplianceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="compliance/vacinacao"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <ComplianceVacinacao />
              </ProtectedRoute>
            }
          />
          <Route
            path="compliance/treinamentos"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <ComplianceTreinamentos />
              </ProtectedRoute>
            }
          />
          <Route
            path="compliance/relatorio"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <ComplianceRelatorio />
              </ProtectedRoute>
            }
          />

          {/* ── S1: F02 Diagnóstico colaborador ── */}
          <Route path="diagnostico" element={<DiagnosticoColaborador />} />

          {/* ── S1: F03 Trilhas ── */}
          <Route path="trilhas" element={<Trilhas />} />
          <Route path="trilha/lei-15377" element={<TrilhaLei15377 />} />
          <Route path="trilha/nr-1" element={<TrilhaNr1 />} />
          <Route path="certificado" element={<Certificado />} />
          <Route path="certificados" element={<Certificados />} />

          {/* ── S1: Gestão RH ── */}
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

          {/* ── S2: F13 Índice Preventivo ── */}
          <Route
            path="indice"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <IndicePreventivo />
              </ProtectedRoute>
            }
          />

          {/* ── F06: Certificacao Empresa ── */}
          <Route
            path="certificacao-empresa"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <CertificacaoEmpresa />
              </ProtectedRoute>
            }
          />

          {/* ── S2+: Features bloqueadas no MVP (stub pages já existentes) ── */}
          <Route
            path="campanhas"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <Campanhas />
              </ProtectedRoute>
            }
          />
          <Route path="jornadas" element={<Jornadas />} />
          <Route path="conquistas" element={<Conquistas />} />
          <Route path="passaporte" element={<Passaporte />} />
          <Route
            path="ispc"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <ISPC />
              </ProtectedRoute>
            }
          />
          <Route
            path="sipat"
            element={
              <ProtectedRoute requiredRole={["admin", "admin_rh", "rh"]}>
                <Sipat />
              </ProtectedRoute>
            }
          />
          <Route path="notificacoes" element={<Notificacoes />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="canal" element={<Canal />} />
          <Route path="assistente" element={<Assistente />} />
          <Route path="beneficios" element={<Beneficios />} />
          <Route path="familia" element={<Familia />} />
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
        <Route path="/acesso" element={<AcessoRH />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/aceitar-convite" element={<AceitarConvite />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="/calculadora-vacinal" element={<CalculadoraVacinal />} />

        {/* Passaporte publico — verificacao por terceiros sem login */}
        <Route path="/passaporte/:token" element={<PassaportePublico />} />

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
