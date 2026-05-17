import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { vegliaUser, claims, logout } = useAuth();

  return (
    <div className="min-h-screen bg-warm-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-twilight">Vegl</span>
            <span className="text-2xl font-bold text-champagne">.</span>
            <span className="text-2xl font-bold text-mint">ia</span>
          </div>
          <button
            onClick={logout}
            className="text-sm text-twilight/50 hover:text-twilight transition-colors"
          >
            Sair
          </button>
        </header>

        <div className="bg-white rounded-2xl border border-twilight/10 p-6">
          <p className="text-sm text-twilight/50 mb-1">Bem-vindo,</p>
          <h1 className="text-2xl font-semibold text-twilight">
            {vegliaUser?.displayName ?? "—"}
          </h1>
          <div className="mt-4 flex gap-3">
            <span className="px-3 py-1 rounded-full bg-mint/10 text-mint text-xs font-medium">
              {claims?.role}
            </span>
            <span className="px-3 py-1 rounded-full bg-twilight/5 text-twilight/60 text-xs">
              {claims?.company_id}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-twilight/30 mt-12">
          Powered by Vacivitta
        </p>
      </div>
    </div>
  );
}
