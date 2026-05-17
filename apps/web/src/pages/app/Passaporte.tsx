import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import QRCode from "qrcode";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { HealthPassport, VaccinationRecord } from "@veglia/shared";

// ─── Modal: adicionar vacina ──────────────────────────────────────────────────

interface AddVaccineModalProps {
  onSave: (record: Omit<VaccinationRecord, never>) => void;
  onClose: () => void;
}

function AddVaccineModal({ onSave, onClose }: AddVaccineModalProps) {
  const [vaccineName, setVaccineName] = useState("");
  const [dateApplied, setDateApplied] = useState("");
  const [dose, setDose] = useState("Dose unica");
  const [provider, setProvider] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccineName.trim() || !dateApplied) return;
    onSave({
      vaccine_name: vaccineName.trim(),
      date_applied: new Date(dateApplied).getTime(),
      dose,
      provider: provider.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Adicionar vacina</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
          >
            x
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Vacina *</label>
            <input
              type="text"
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              required
              placeholder="Ex: Influenza, Hepatite B, COVID-19"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Data de aplicacao *</label>
            <input
              type="date"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Dose</label>
            <select
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            >
              <option value="Dose unica">Dose unica</option>
              <option value="1a dose">1a dose</option>
              <option value="2a dose">2a dose</option>
              <option value="3a dose">3a dose</option>
              <option value="Reforco">Reforco</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Local / Clinica</label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Ex: UBS Vila Mariana"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!vaccineName.trim() || !dateApplied}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── QR Code do passaporte ────────────────────────────────────────────────────

interface PassaporteQRProps {
  token: string;
}

function PassaporteQR({ token }: PassaporteQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const publicUrl = `${window.location.origin}/passaporte/${token}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, publicUrl, {
      width: 160,
      margin: 2,
      color: { dark: "#0B2545", light: "#F4EDE0" },
    });
  }, [publicUrl]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-[10px] text-white/30 text-center">
        QR publico para verificacao de terceiros
      </p>
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

function generateToken(): string {
  return crypto.randomUUID();
}

export default function Passaporte() {
  const { firebaseUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  const [passport, setPassport] = useState<HealthPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddVaccine, setShowAddVaccine] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "health_passports", uid), (snap) => {
      if (snap.exists()) {
        setPassport(snap.data() as HealthPassport);
      } else {
        setPassport(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  // Inicializa passaporte se nao existir
  useEffect(() => {
    if (!uid || !companyId || loading) return;
    if (passport) return;

    const newPassport: HealthPassport = {
      user_id: uid,
      company_id: companyId,
      vaccinations: [],
      certificates: [],
      health_score: 0,
      qr_token: generateToken(),
      updated_at: Date.now(),
    };

    setDoc(doc(db, "health_passports", uid), newPassport);
  }, [uid, companyId, loading, passport]);

  const handleAddVaccine = async (record: VaccinationRecord) => {
    if (!uid || !passport) return;
    const updated = [...(passport.vaccinations ?? []), record];
    const score = Math.min(100, updated.length * 15);

    await setDoc(
      doc(db, "health_passports", uid),
      {
        vaccinations: updated,
        health_score: score,
        updated_at: Date.now(),
      },
      { merge: true }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const vaccinations = passport?.vaccinations ?? [];
  const healthScore = passport?.health_score ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Passaporte de Saude Digital</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Seu historico vacinal e certificados de compliance
          </p>
        </div>
        <button
          onClick={() => setShowAddVaccine(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span>+</span>
          Registrar vacina
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card principal do passaporte */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0B2545] to-[#1A3A5C] border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Header do card */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-base font-bold text-white">Vegl</span>
                <span className="text-base font-bold text-[#C9A96E]">.</span>
                <span className="text-base font-bold text-[#5DD3A8]">ia</span>
              </div>
              <p className="text-xs text-white/40">Passaporte de Saude Digital</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 mb-1">Score de saude</p>
              <p className="text-2xl font-bold text-[#5DD3A8]">{healthScore}</p>
            </div>
          </div>

          {/* Nome do usuario */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-white/30 mb-1">Titular</p>
            <p className="text-lg font-semibold text-white">
              {firebaseUser?.displayName ?? firebaseUser?.email ?? "—"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl px-3 py-3 text-center">
              <p className="text-xl font-bold text-[#5DD3A8]">{vaccinations.length}</p>
              <p className="text-[10px] text-white/30">Vacinas</p>
            </div>
            <div className="bg-white/5 rounded-xl px-3 py-3 text-center">
              <p className="text-xl font-bold text-white">
                {passport?.certificates?.length ?? 0}
              </p>
              <p className="text-[10px] text-white/30">Certificados</p>
            </div>
            <div className="bg-white/5 rounded-xl px-3 py-3 text-center">
              <p className="text-xl font-bold text-[#C9A96E]">{healthScore}/100</p>
              <p className="text-[10px] text-white/30">Score</p>
            </div>
          </div>

          {/* Barra de score */}
          <div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5DD3A8] to-[#C9A96E] rounded-full transition-all"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] text-white/20">
            Powered by VaciVitta · Atualizado em{" "}
            {passport?.updated_at
              ? new Date(passport.updated_at).toLocaleDateString("pt-BR")
              : "—"}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center">
          {passport?.qr_token ? (
            <PassaporteQR token={passport.qr_token} />
          ) : (
            <p className="text-xs text-white/30">Gerando QR Code...</p>
          )}
        </div>
      </div>

      {/* Historico de vacinas */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Historico Vacinal</h2>
          <button
            onClick={() => setShowAddVaccine(true)}
            className="text-xs text-[#5DD3A8] hover:underline"
          >
            + Adicionar
          </button>
        </div>

        {vaccinations.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-white/30 text-sm">Nenhuma vacina registrada ainda.</p>
            <button
              onClick={() => setShowAddVaccine(true)}
              className="mt-3 text-[#5DD3A8] text-sm hover:underline"
            >
              Registrar primeira vacina
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3">Vacina</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Dose</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Data</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Local</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations
                .slice()
                .sort((a, b) => b.date_applied - a.date_applied)
                .map((v, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-white">{v.vaccine_name}</td>
                    <td className="px-4 py-3.5 text-sm text-white/50">{v.dose}</td>
                    <td className="px-4 py-3.5 text-sm text-white/50">
                      {new Date(v.date_applied).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/40">{v.provider ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddVaccine && (
        <AddVaccineModal
          onSave={handleAddVaccine}
          onClose={() => setShowAddVaccine(false)}
        />
      )}
    </div>
  );
}
