import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import type { HealthPassport } from "@veglia/shared";

export default function PassaportePublico() {
  const { token } = useParams<{ token: string }>();
  const [passport, setPassport] = useState<HealthPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    const q = query(
      collection(db, "health_passports"),
      where("qr_token", "==", token)
    );
    getDocs(q).then((snap) => {
      if (snap.empty) {
        setNotFound(true);
      } else {
        setPassport(snap.docs[0].data() as HealthPassport);
      }
      setLoading(false);
    });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-baseline gap-0.5 justify-center mb-2">
            <span className="text-2xl font-bold text-[#0B2545] tracking-tight">Vegl</span>
            <span className="text-2xl font-bold text-[#C9A96E]">.</span>
            <span className="text-2xl font-bold text-[#5DD3A8]">ia</span>
          </div>
          <p className="text-sm text-[#0B2545]/40">Verificacao de Passaporte de Saude</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#0B2545]/10 p-8 space-y-3 animate-pulse">
            <div className="h-6 w-3/4 bg-[#0B2545]/10 rounded" />
            <div className="h-4 w-1/2 bg-[#0B2545]/5 rounded" />
          </div>
        ) : notFound ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <p className="text-lg font-semibold text-[#0B2545]">Passaporte nao encontrado</p>
            <p className="text-sm text-[#0B2545]/50 mt-2">
              O QR Code pode estar desatualizado ou invalido.
            </p>
          </div>
        ) : passport ? (
          <div className="bg-white rounded-2xl border border-[#0B2545]/10 overflow-hidden shadow-sm">
            {/* Badge de verificacao */}
            <div className="bg-[#5DD3A8]/10 border-b border-[#5DD3A8]/20 px-6 py-4 flex items-center gap-3">
              <span className="text-[#5DD3A8] text-xl">✓</span>
              <div>
                <p className="text-sm font-semibold text-[#0B2545]">Passaporte verificado</p>
                <p className="text-xs text-[#0B2545]/50">
                  Autenticado pela plataforma Vegl.ia
                </p>
              </div>
            </div>

            {/* Dados publicos do passaporte */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FBF8F1] rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-[#0B2545]">
                    {passport.vaccinations.length}
                  </p>
                  <p className="text-xs text-[#0B2545]/40">Vacinas registradas</p>
                </div>
                <div className="bg-[#5DD3A8]/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-[#5DD3A8]">
                    {passport.health_score}/100
                  </p>
                  <p className="text-xs text-[#5DD3A8]/60">Score de saude</p>
                </div>
              </div>

              {/* Lista publica de vacinas (sem dados sensiveis) */}
              {passport.vaccinations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#0B2545]/40 mb-2">
                    Vacinas registradas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {passport.vaccinations.map((v, i) => (
                      <span
                        key={i}
                        className="text-xs text-[#0B2545]/70 bg-[#0B2545]/5 px-2.5 py-1 rounded-full"
                      >
                        {v.vaccine_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#0B2545]/30 text-center pt-2">
                Atualizado em{" "}
                {new Date(passport.updated_at).toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Footer */}
            <div className="bg-[#FBF8F1] px-6 py-3 text-center">
              <p className="text-[10px] text-[#0B2545]/25">
                Powered by{" "}
                <span className="text-[#5DD3A8]/50 font-semibold">VaciVitta</span> ·
                Vegl.ia — Compliance Vacinal Corporativo
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
