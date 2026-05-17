import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CompanyCertificate {
  id: string;
  company_id: string;
  year: number;
  score: number;
  collaborators_certified: number;
  total_collaborators: number;
  pdf_url?: string;
  hash?: string;
  issued_at: number;
}

interface ComplianceScore {
  overall_score: number;
  training_compliance: number;
  vaccination_coverage: number;
  mental_health_score: number;
  risk_level: "alto" | "atencao" | "bom" | "excelencia";
  updated_at: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "text-[#5DD3A8]";
  if (score >= 60) return "text-[#C9A96E]";
  return "text-red-400";
}

function riskLabel(level: ComplianceScore["risk_level"]): string {
  const map = { alto: "Alto Risco", atencao: "Atencao", bom: "Bom", excelencia: "Excelencia" };
  return map[level] ?? level;
}

function riskColor(level: ComplianceScore["risk_level"]): string {
  const map = {
    alto: "text-red-400 bg-red-500/10 border-red-500/30",
    atencao: "text-[#C9A96E] bg-[#C9A96E]/10 border-[#C9A96E]/30",
    bom: "text-[#5DD3A8] bg-[#5DD3A8]/10 border-[#5DD3A8]/30",
    excelencia: "text-[#5DD3A8] bg-[#5DD3A8]/15 border-[#5DD3A8]/40",
  };
  return map[level] ?? "";
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function CertificacaoEmpresa() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(null);
  const [certificates, setCertificates] = useState<CompanyCertificate[]>([]);
  const [totalCollaborators, setTotalCollaborators] = useState(0);
  const [certifiedCollaborators, setCertifiedCollaborators] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carrega score de compliance
  useEffect(() => {
    if (!companyId) return;
    const unsub = onSnapshot(
      query(collection(db, "compliance_scores"), where("company_id", "==", companyId)),
      (snap) => {
        if (!snap.empty) {
          setComplianceScore(snap.docs[0].data() as ComplianceScore);
        }
      }
    );
    return unsub;
  }, [companyId]);

  // Carrega certificados da empresa
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "company_certificates"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      setCertificates(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CompanyCertificate))
          .sort((a, b) => b.issued_at - a.issued_at)
      );
    });
  }, [companyId]);

  // Conta colaboradores e certificados individuais
  useEffect(() => {
    if (!companyId) return;
    const usersUnsub = onSnapshot(
      query(collection(db, "users"), where("company_id", "==", companyId)),
      (snap) => setTotalCollaborators(snap.size)
    );
    const certUnsub = onSnapshot(
      query(collection(db, "certificates"), where("company_id", "==", companyId)),
      (snap) => setCertifiedCollaborators(snap.size)
    );
    return () => {
      usersUnsub();
      certUnsub();
    };
  }, [companyId]);

  const handleGenerate = async () => {
    if (!companyId) return;
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const functions = getFunctions(app, "southamerica-east1");
      const generate = httpsCallable<
        { company_id: string; year: number },
        { pdf_url: string; score: number }
      >(functions, "generateCompanyCertificate");

      const result = await generate({
        company_id: companyId,
        year: new Date().getFullYear(),
      });

      setSuccess(
        `Certificado gerado com sucesso! Score: ${result.data.score}/100`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar certificado";
      if (msg.includes("already-exists")) {
        setError("Ja existe um certificado para este ano. Acesse abaixo para visualizar.");
      } else {
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const score = complianceScore?.overall_score ?? 0;
  const currentYear = new Date().getFullYear();
  const hasCertThisYear = certificates.some((c) => c.year === currentYear);
  const certificationPct =
    totalCollaborators > 0
      ? Math.round((certifiedCollaborators / totalCollaborators) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificacao de Empresa</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Badge "Empresa Verificada Vegl.ia" com validade de 12 meses
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || score < 40}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {generating ? "Gerando..." : hasCertThisYear ? "Renovar Certificado" : "Emitir Certificado"}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <span className="text-red-400 shrink-0">◇</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-4 py-3">
          <span className="text-[#5DD3A8] shrink-0">◆</span>
          <p className="text-sm text-[#5DD3A8]">{success}</p>
        </div>
      )}

      {/* Score de compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de score */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40">Score de Compliance</p>
              <p className={`text-5xl font-bold mt-1 ${scoreColor(score)}`}>{score}</p>
              <p className="text-sm text-white/30 mt-0.5">/100</p>
            </div>
            {complianceScore && (
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${riskColor(
                  complianceScore.risk_level
                )}`}
              >
                {riskLabel(complianceScore.risk_level)}
              </span>
            )}
          </div>

          {/* Barra geral */}
          <div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 80
                    ? "bg-gradient-to-r from-[#5DD3A8] to-[#4BC495]"
                    : score >= 60
                    ? "bg-[#C9A96E]"
                    : "bg-red-500"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          {complianceScore && (
            <div className="space-y-2">
              {[
                { label: "Treinamentos", value: complianceScore.training_compliance },
                { label: "Vacinacao", value: complianceScore.vaccination_coverage },
                { label: "Saude Mental", value: complianceScore.mental_health_score },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-xs">
                  <span className="text-white/40 w-24 shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5DD3A8] rounded-full"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-white/50 w-8 text-right">{item.value}%</span>
                </div>
              ))}
            </div>
          )}

          {score < 40 && (
            <p className="text-xs text-[#C9A96E] bg-[#C9A96E]/10 px-3 py-2 rounded-xl">
              Score minimo para certificacao: 40 pontos. Engaje mais colaboradores nas trilhas e vacinacao.
            </p>
          )}
        </div>

        {/* Card de colaboradores */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Colaboradores Certificados</h2>

          <div className="flex items-end gap-3">
            <p className="text-5xl font-bold text-white">{certifiedCollaborators}</p>
            <p className="text-white/40 text-sm mb-2">de {totalCollaborators}</p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/30 mb-1.5">
              <span>Taxa de certificacao</span>
              <span>{certificationPct}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5DD3A8] rounded-full transition-all"
                style={{ width: `${certificationPct}%` }}
              />
            </div>
          </div>

          <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-[#5DD3A8] mb-1">Badge "Empresa Verificada"</p>
            <p className="text-xs text-white/50">
              Disponivel para empresas com score acima de 40. O badge e emitido com validade de 12 meses
              e pode ser exibido no site e materiais corporativos.
            </p>
          </div>
        </div>
      </div>

      {/* Historico de certificados */}
      {certificates.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Historico de Certificacoes</h2>
          </div>
          <div className="divide-y divide-white/5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="px-6 py-4 flex items-center gap-6"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    Certificado Empresa Verificada {cert.year}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Emitido em {new Date(cert.issued_at).toLocaleDateString("pt-BR")} ·{" "}
                    {cert.collaborators_certified} colaboradores certificados
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${scoreColor(cert.score)}`}>{cert.score}/100</p>
                  <p className="text-[10px] text-white/30">Score</p>
                </div>
                {cert.pdf_url && (
                  <a
                    href={cert.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#5DD3A8] hover:text-[#4BC495] transition-colors shrink-0"
                  >
                    Baixar PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodape Powered by */}
      <p className="text-[10px] text-white/20 text-center">
        Certificacao auditada pela plataforma Vegl.ia · Powered by VaciVitta
      </p>
    </div>
  );
}
