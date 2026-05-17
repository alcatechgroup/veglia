import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@veglia/shared";

interface Props {
  children: React.ReactNode;
  /** Se informado, redireciona se o role não bater */
  requiredRole?: UserRole | UserRole[];
  /**
   * Se true, exige que o usuário tenha claims.company_id.
   * Usuários autenticados sem empresa são redirecionados para /onboarding.
   */
  requiresCompany?: boolean;
}

export function ProtectedRoute({ children, requiredRole, requiresCompany }: Props) {
  const { firebaseUser, claims, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!firebaseUser) return <Navigate to="/login" replace />;

  // Usuário autenticado mas sem empresa — encaminhar para onboarding
  if (requiresCompany && !claims?.company_id) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredRole && claims) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(claims.role)) return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function LoadingScreen() {
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
