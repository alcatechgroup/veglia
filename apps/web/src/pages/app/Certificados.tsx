import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface CertificateDoc {
  id: string;
  uid: string;
  company_id: string;
  course_id: string;
  displayName: string;
  email: string;
  issued_at: number;
  sha256: string;
  pdf_url: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COURSE_LABELS: Record<string, string> = {
  "lei-15377": "Compliance Vacinal — Lei 15.377/2026",
  "nr-1": "NR-1: Gestão de Riscos Ocupacionais",
};

function courseLabel(courseId: string): string {
  return COURSE_LABELS[courseId] ?? courseId;
}

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

// ─── Certificados ─────────────────────────────────────────────────────────────

export default function Certificados() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? "";

  const [certificates, setCertificates] = useState<CertificateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "certificates"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CertificateDoc, "id">),
      }));
      // Ordena por mais recente
      docs.sort((a, b) => b.issued_at - a.issued_at);
      setCertificates(docs);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-white/30 text-sm">Carregando certificados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
          Histórico
        </p>
        <h1 className="text-2xl font-bold text-white">Meus Certificados</h1>
        <p className="text-sm text-white/40 mt-1">
          Todos os certificados de compliance emitidos para você
        </p>
      </div>

      {certificates.length === 0 ? (
        /* Empty state */
        <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-16 text-center">
          <p className="text-4xl mb-4">○</p>
          <p className="text-white/50 text-sm mb-1">
            Você ainda não concluiu nenhuma trilha.
          </p>
          <p className="text-white/30 text-xs mb-6">
            Complete os módulos e os quizzes para receber seu certificado de compliance.
          </p>
          <Link
            to="/app/trilhas"
            className="inline-flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Iniciar agora →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
            >
              {/* Ícone */}
              <div className="w-12 h-12 rounded-xl bg-[#5DD3A8]/10 flex items-center justify-center shrink-0">
                <span className="text-[#5DD3A8] text-xl">◆</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {courseLabel(cert.course_id)}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  Emitido em {formatDate(cert.issued_at)}
                </p>
                <p className="text-[10px] text-white/20 mt-1 font-mono">
                  SHA-256: {shortHash(cert.sha256)}
                </p>
              </div>

              {/* Ação */}
              {cert.pdf_url ? (
                <a
                  href={cert.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2 rounded-xl text-xs transition-colors shrink-0"
                >
                  Baixar PDF
                </a>
              ) : (
                <span className="text-[11px] text-[#C9A96E]/60 shrink-0">
                  PDF sendo gerado...
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
