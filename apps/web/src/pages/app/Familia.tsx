import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { Dependent } from "@veglia/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RELATIONSHIP_LABELS: Record<Dependent["relationship"], string> = {
  spouse: "Conjuge",
  child: "Filho(a)",
  parent: "Pai/Mae",
  other: "Outro",
};

function getAge(birthDate: number): number {
  const diff = Date.now() - birthDate;
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function getVaccineRecommendations(ageYears: number): string[] {
  if (ageYears < 2) {
    return ["BCG", "Hepatite B", "Pentavalente", "Rotavirus", "Pneumocócica 10V", "Meningocócica C", "Febre amarela"];
  } else if (ageYears < 10) {
    return ["MMR (reforco)", "Varicela (reforco)", "DTP (reforco)", "Febre tifóide", "Meningocócica ACWY"];
  } else if (ageYears < 18) {
    return ["HPV (2 doses)", "Meningocócica ACWY", "dT", "Hepatite B (se nao vacinado)"];
  } else if (ageYears < 60) {
    return ["Influenza (anual)", "COVID-19 (atualizacao)", "Hepatite B", "HPV (ate 45 anos)"];
  } else {
    return ["Influenza (anual)", "Pneumocócica 23V", "Herpes zoster", "COVID-19 (atualizacao)", "dT"];
  }
}

// ─── Modal: adicionar dependente ──────────────────────────────────────────────

interface AddDependentModalProps {
  onSave: (dep: Omit<Dependent, "id" | "user_id" | "company_id" | "vaccinations">) => void;
  onClose: () => void;
}

function AddDependentModal({ onSave, onClose }: AddDependentModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relationship, setRelationship] = useState<Dependent["relationship"]>("child");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;
    onSave({
      name: name.trim(),
      birth_date: new Date(birthDate).getTime(),
      relationship,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0B2545] border border-white/10 rounded-2xl p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Adicionar dependente</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none"
          >
            x
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Data de nascimento *</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Parentesco</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Dependent["relationship"])}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
            >
              <option value="spouse">Conjuge</option>
              <option value="child">Filho(a)</option>
              <option value="parent">Pai/Mae</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !birthDate}
              className="flex-1 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545] font-semibold py-2.5 rounded-xl text-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card de dependente ───────────────────────────────────────────────────────

interface DependentCardProps {
  dependent: Dependent;
}

function DependentCard({ dependent }: DependentCardProps) {
  const age = getAge(dependent.birth_date);
  const recommendations = getVaccineRecommendations(age);
  const vaccinatedNames = dependent.vaccinations.map((v) => v.vaccine_name.toLowerCase());
  const pending = recommendations.filter(
    (r) => !vaccinatedNames.some((v) => v.includes(r.toLowerCase().split(" ")[0]))
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5DD3A8]/20 flex items-center justify-center shrink-0">
          <span className="text-[#5DD3A8] font-bold text-sm">
            {dependent.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{dependent.name}</h3>
          <p className="text-xs text-white/40">
            {RELATIONSHIP_LABELS[dependent.relationship]} · {age} anos
          </p>
        </div>
      </div>

      {/* Vacinas registradas */}
      {dependent.vaccinations.length > 0 && (
        <div>
          <p className="text-xs text-white/30 mb-2">Vacinas registradas</p>
          <div className="flex flex-wrap gap-1.5">
            {dependent.vaccinations.map((v, i) => (
              <span
                key={i}
                className="text-[11px] text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full"
              >
                {v.vaccine_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recomendacoes por faixa etaria */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs text-[#C9A96E]/70 mb-2">
            Vacinas recomendadas para {age} anos:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pending.slice(0, 4).map((v) => (
              <span
                key={v}
                className="text-[11px] text-[#C9A96E]/80 bg-[#C9A96E]/10 px-2 py-0.5 rounded-full"
              >
                {v}
              </span>
            ))}
            {pending.length > 4 && (
              <span className="text-[11px] text-white/25">
                +{pending.length - 4} mais
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Familia() {
  const { firebaseUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "dependents"),
      where("user_id", "==", uid)
    );
    return onSnapshot(q, (snap) => {
      setDependents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dependent)));
      setLoading(false);
    });
  }, [uid]);

  const handleAddDependent = async (
    dep: Omit<Dependent, "id" | "user_id" | "company_id" | "vaccinations">
  ) => {
    await addDoc(collection(db, "dependents"), {
      ...dep,
      user_id: uid,
      company_id: companyId,
      vaccinations: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Saude da Familia</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Gerencie o calendario vacinal dos seus dependentes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span>+</span>
          Adicionar dependente
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : dependents.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-12 text-center">
          <span className="text-3xl text-white/20">◑</span>
          <p className="text-white/30 text-sm mt-3">Nenhum dependente cadastrado.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-[#5DD3A8] text-sm hover:underline"
          >
            Adicionar primeiro dependente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dependents.map((d) => (
            <DependentCard key={d.id} dependent={d} />
          ))}
        </div>
      )}

      {showModal && (
        <AddDependentModal
          onSave={handleAddDependent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
