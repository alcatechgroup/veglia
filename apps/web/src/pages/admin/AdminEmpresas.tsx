import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@veglia/firebase-config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  is_matrix?: boolean;
  parent_id?: string;
  plan?: string;
  employee_count?: number;
}

interface CreateBranchPayload {
  companyName: string;
  cnpj?: string;
  parentId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEmpresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<string>("");
  const [branchName, setBranchName] = useState("");
  const [branchCnpj, setBranchCnpj] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "companies"), orderBy("name"))
      );
      setCompanies(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Company, "id">) }))
      );
    } catch {
      setError("Erro ao carregar empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const matrices = companies.filter((c) => !c.parent_id);
  const branches = companies.filter((c) => !!c.parent_id);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatrix || !branchName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const functions = getFunctions();
      const createBranch = httpsCallable<CreateBranchPayload, { company_id: string }>(
        functions,
        "createBranch"
      );
      const result = await createBranch({
        companyName: branchName.trim(),
        cnpj: branchCnpj.replace(/\D/g, "") || undefined,
        parentId: selectedMatrix,
      });
      setSuccess(`Filial criada com sucesso. ID: ${result.data.company_id}`);
      setBranchName("");
      setBranchCnpj("");
      setShowForm(false);
      await fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar filial.");
    } finally {
      setCreating(false);
    }
  };

  const getBranches = (matrixId: string) =>
    branches.filter((b) => b.parent_id === matrixId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas · Matriz e Filiais</h1>
          <p className="text-sm text-white/40 mt-1">
            Gerencie a estrutura hierárquica de empresas clientes.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null); }}
          className="px-4 py-2.5 bg-[#5DD3A8] hover:bg-[#4BC495] text-[#0B2545] font-semibold text-sm rounded-xl transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nova filial"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/20 rounded-xl px-4 py-3 text-sm text-[#5DD3A8]">
          {success}
        </div>
      )}

      {/* New Branch Form */}
      {showForm && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Criar nova filial</h2>
          <form onSubmit={handleCreateBranch} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Empresa matriz</label>
              <select
                value={selectedMatrix}
                onChange={(e) => setSelectedMatrix(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50"
              >
                <option value="">Selecione a matriz…</option>
                {matrices.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Nome da filial</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Ex: Filial São Paulo"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">
                  CNPJ <span className="text-white/20">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={branchCnpj}
                  onChange={(e) => setBranchCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !selectedMatrix || !branchName.trim()}
              className="px-5 py-2.5 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold text-sm rounded-xl transition-colors"
            >
              {creating ? "Criando…" : "Criar filial"}
            </button>
          </form>
        </div>
      )}

      {/* Company List */}
      {loading ? (
        <div className="text-white/30 text-sm animate-pulse py-12 text-center">
          Carregando empresas…
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-white/20 text-sm">
          Nenhuma empresa cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {matrices.map((matrix) => {
            const matrixBranches = getBranches(matrix.id);
            return (
              <div
                key={matrix.id}
                className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden"
              >
                {/* Matrix Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5DD3A8]/15 flex items-center justify-center">
                      <span className="text-[#5DD3A8] text-xs font-bold">M</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{matrix.name}</p>
                      {matrix.cnpj && (
                        <p className="text-[11px] text-white/30">{matrix.cnpj}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-white/25 font-mono">{matrix.id}</span>
                    <span className="text-[10px] bg-[#5DD3A8]/10 text-[#5DD3A8] px-2 py-0.5 rounded-full font-medium">
                      Matriz
                    </span>
                    {matrix.plan && (
                      <span className="text-[10px] bg-[#C9A96E]/10 text-[#C9A96E] px-2 py-0.5 rounded-full font-medium capitalize">
                        {matrix.plan}
                      </span>
                    )}
                  </div>
                </div>

                {/* Branches */}
                {matrixBranches.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {matrixBranches.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-center justify-between px-6 py-3 pl-14"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-4 bg-white/10 rounded-full" />
                          <div>
                            <p className="text-sm text-white/70">{branch.name}</p>
                            {branch.cnpj && (
                              <p className="text-[11px] text-white/25">{branch.cnpj}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-white/20 font-mono">{branch.id}</span>
                          <span className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full">
                            Filial
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-3 pl-14 text-xs text-white/20">
                    Sem filiais cadastradas
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {!loading && companies.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total de empresas", value: companies.length },
            { label: "Matrizes", value: matrices.length },
            { label: "Filiais", value: branches.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/3 border border-white/5 rounded-xl px-5 py-4 text-center"
            >
              <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
              <p className="text-xs text-white/30 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
