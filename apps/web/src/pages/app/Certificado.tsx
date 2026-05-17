import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { Enrollment } from "@veglia/shared";
import { COURSE_ID, COURSE_TITLE } from "@/data/courses";

export default function Certificado() {
  const { firebaseUser, vegliaUser } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const enrollmentId = `${uid}_${COURSE_ID}`;

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "enrollments", enrollmentId);
    const unsub = onSnapshot(ref, (snap) => {
      setEnrollment(snap.exists() ? (snap.data() as Enrollment) : null);
      setLoading(false);
    });
    return unsub;
  }, [uid, enrollmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-white/30 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!enrollment?.completed_at) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Meu Certificado</h1>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-12 text-center">
          <p className="text-4xl mb-4">○</p>
          <p className="text-white/50 text-sm mb-1">Nenhum certificado disponível ainda.</p>
          <p className="text-white/30 text-xs">
            Conclua a trilha <strong className="text-white/50">{COURSE_TITLE}</strong> para receber seu certificado de compliance.
          </p>
        </div>
      </div>
    );
  }

  const completedDate = new Date(enrollment.completed_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Meu Certificado</h1>

      {/* Preview do certificado */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div
          className="relative bg-gradient-to-br from-[#0B2545] via-[#1A3A5C] to-[#0B2545] p-12 border-b border-white/5"
          style={{ minHeight: "420px" }}
        >
          {/* Marca d'agua */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <span className="text-[200px] font-bold text-white leading-none">V</span>
          </div>

          <div className="relative z-10 text-center max-w-xl mx-auto">
            {/* Logo */}
            <div className="flex items-baseline gap-0.5 justify-center mb-2">
              <span className="text-2xl font-bold text-white">Vegl</span>
              <span className="text-2xl font-bold text-[#C9A96E]">.</span>
              <span className="text-2xl font-bold text-[#5DD3A8]">ia</span>
            </div>
            <p className="text-xs text-[#5DD3A8]/50 mb-8 tracking-widest uppercase">
              Certificado de Compliance
            </p>

            <p className="text-sm text-white/50 mb-2">Certificamos que</p>
            <p className="text-3xl font-bold text-white mb-2">
              {vegliaUser?.displayName ?? firebaseUser?.displayName ?? "Colaborador"}
            </p>
            <p className="text-sm text-white/40 mb-6">
              {vegliaUser?.email ?? firebaseUser?.email}
            </p>

            <p className="text-sm text-white/50 mb-1">concluiu com aproveitamento a trilha</p>
            <p className="text-lg font-semibold text-[#C9A96E] mb-6">{COURSE_TITLE}</p>

            <p className="text-xs text-white/30 mb-8">
              Emitido em {completedDate}
            </p>

            <div className="flex items-center justify-center gap-2 border border-[#5DD3A8]/20 rounded-full px-4 py-1.5 w-fit mx-auto">
              <span className="text-[#5DD3A8] text-xs">Powered by</span>
              <span className="text-[#5DD3A8] font-bold text-xs">VaciVitta</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            {enrollment.certificate_url ? (
              <p className="text-xs text-white/30">
                Hash SHA-256 verificavel disponivel
              </p>
            ) : (
              <p className="text-xs text-[#C9A96E]/60">
                Certificado PDF sendo gerado...
              </p>
            )}
          </div>
          {enrollment.certificate_url && (
            <a
              href={enrollment.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Baixar PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
