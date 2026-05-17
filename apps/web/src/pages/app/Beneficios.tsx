import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { Benefit, BenefitActivation } from "@veglia/shared";

// ─── Catalogo seed ────────────────────────────────────────────────────────────

const BENEFITS_SEED: Omit<Benefit, "id">[] = [
  {
    name: "Desconto em Farmacia Parceira",
    description: "20% de desconto em medicamentos e vitaminas em farmácias parceiras da rede VaciVitta.",
    how_to_access: "Apresente o QR Code do seu Passaporte de Saude no caixa.",
    valid_until: new Date("2026-12-31").getTime(),
    limit_per_user: 12,
    plans: ["starter", "pro", "enterprise"],
  },
  {
    name: "Consulta de Orientacao Nutricional",
    description: "1 sessao gratuita por trimestre com nutricionista parceiro. Orientacoes de saude preventiva e plano alimentar.",
    how_to_access: "Solicite pelo Marketplace > Consulta Nutricional.",
    limit_per_user: 4,
    plans: ["pro", "enterprise"],
  },
  {
    name: "App de Mindfulness",
    description: "Acesso gratuito ao app de meditacao e saude mental por 90 dias. Reduz estresse e melhora produtividade.",
    how_to_access: "Acesse o link enviado por email apos solicitar.",
    limit_per_user: 1,
    plans: ["starter", "pro", "enterprise"],
  },
  {
    name: "Vacinacao In-Company Gratuita",
    description: "1 vacina gratuita por colaborador por ano no evento In-Company VaciVitta agendado pela empresa.",
    how_to_access: "Participe do evento agendado pela equipe de RH.",
    limit_per_user: 1,
    plans: ["pro", "enterprise"],
  },
];

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Beneficios() {
  const { firebaseUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [activations, setActivations] = useState<BenefitActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "benefits"), (snap) => {
      if (snap.empty) {
        setBenefits(BENEFITS_SEED.map((s, i) => ({ id: `benefit-${i + 1}`, ...s })));
      } else {
        setBenefits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Benefit)));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "benefit_activations"),
      where("user_id", "==", uid)
    );
    return onSnapshot(q, (snap) => {
      setActivations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BenefitActivation)));
    });
  }, [uid]);

  const getActivationCount = (benefitId: string) =>
    activations.filter((a) => a.benefit_id === benefitId).length;

  const handleActivate = async (benefit: Benefit) => {
    if (!uid || !companyId || activating) return;
    const count = getActivationCount(benefit.id);
    if (benefit.limit_per_user && count >= benefit.limit_per_user) return;

    setActivating(benefit.id);
    try {
      await addDoc(collection(db, "benefit_activations"), {
        benefit_id: benefit.id,
        benefit_name: benefit.name,
        user_id: uid,
        company_id: companyId,
        activated_at: Date.now(),
      });
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Beneficios Preventivos</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Beneficios de saude inclusos no seu plano
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b) => {
            const count = getActivationCount(b.id);
            const limit = b.limit_per_user ?? Infinity;
            const exhausted = count >= limit;
            const isActivating = activating === b.id;

            return (
              <div
                key={b.id}
                className={`bg-white/5 border rounded-2xl p-5 space-y-3 transition-colors ${
                  exhausted ? "border-white/5 opacity-60" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-white leading-snug">{b.name}</h3>
                    {b.valid_until && (
                      <span className="text-[10px] text-white/25 shrink-0">
                        ate {new Date(b.valid_until).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{b.description}</p>
                </div>

                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-white/30 mb-0.5">Como acessar</p>
                  <p className="text-xs text-white/60">{b.how_to_access}</p>
                </div>

                <div className="flex items-center justify-between">
                  {b.limit_per_user && (
                    <span className="text-xs text-white/30">
                      {count}/{b.limit_per_user} usos
                    </span>
                  )}
                  <button
                    onClick={() => handleActivate(b)}
                    disabled={exhausted || isActivating}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ml-auto ${
                      exhausted
                        ? "bg-white/5 text-white/25 cursor-not-allowed"
                        : isActivating
                        ? "bg-white/10 text-white/40 cursor-wait"
                        : "bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545]"
                    }`}
                  >
                    {exhausted ? "Limite atingido" : isActivating ? "..." : "Ativar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activations.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Historico de ativacoes
          </h2>
          <div className="space-y-2">
            {activations.slice(-5).reverse().map((a) => (
              <div key={a.id} className="flex items-center gap-4 text-xs">
                <span className="text-[#5DD3A8]">✓</span>
                <span className="text-white/60 flex-1">
                  {(a as BenefitActivation & { benefit_name?: string }).benefit_name ?? a.benefit_id}
                </span>
                <span className="text-white/25">
                  {new Date(a.activated_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
