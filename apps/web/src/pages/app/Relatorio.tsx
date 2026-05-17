import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { useComplianceData } from "@/hooks/useComplianceData";
import { StatusBadge } from "@/pages/app/DashboardRH";
import type { CollaboradorCompliance } from "@/hooks/useComplianceData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortHash(hash: string): string {
  return `${hash.slice(0, 12)}...`;
}

function exportCSV(users: CollaboradorCompliance[], companyName: string) {
  const headers = ["Nome", "Cargo", "E-mail", "Status", "Data Conclusão", "Hash SHA-256"];
  const rows = users.map((u) => [
    u.name,
    u.cargo ?? "",
    u.email,
    u.status === "completo"
      ? "Concluído"
      : u.status === "em_andamento"
      ? "Em andamento"
      : "Pendente",
    u.completedAt ? new Date(u.completedAt).toLocaleDateString("pt-BR") : "",
    u.certificateHash ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compliance-veglia-${companyName
    .toLowerCase()
    .replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Relatorio() {
  const { claims } = useAuth();
  const companyId = claims?.company_id ?? "";

  const { users, loading } = useComplianceData(companyId);
  const [companyName, setCompanyName] = useState<string>("—");

  // Busca nome da empresa
  useEffect(() => {
    if (!companyId) return;
    getDoc(doc(db, "companies", companyId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as { name?: string };
        setCompanyName(data.name ?? "—");
      }
    });
  }, [companyId]);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#5DD3A8]/70 font-medium tracking-wide uppercase mb-1">
            Exportar
          </p>
          <h1 className="text-2xl font-bold text-white">
            Relatório de Compliance · Lei 15.377/2026
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-sm text-white/40">
              {companyName} · Gerado em {hoje}
            </p>
            <span className="text-[10px] font-semibold text-[#5DD3A8]/60 bg-[#5DD3A8]/8 border border-[#5DD3A8]/20 px-2 py-0.5 rounded-full tracking-wide">
              Powered by VaciVitta
            </span>
          </div>
        </div>
        <button
          onClick={() => exportCSV(users, companyName)}
          disabled={loading || users.length === 0}
          className="flex items-center gap-2 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          <span className="text-base leading-none">↓</span>
          Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Colaboradores</h2>
          {!loading && (
            <span className="text-xs text-white/30">{users.length} registros</span>
          )}
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-white/30 text-sm">
            Carregando...
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-white/30 text-sm">Nenhum colaborador encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-medium text-white/30 px-6 py-3">Nome</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Cargo</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">E-mail</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Data Conclusão</th>
                <th className="text-left text-[11px] font-medium text-white/30 px-4 py-3">Hash SHA-256</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row, idx) => (
                <tr
                  key={row.uid}
                  className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${
                    idx % 2 === 0 ? "" : "bg-white/[0.02]"
                  }`}
                >
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-white">{row.name}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/50">{row.cargo ?? "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-white/50">{row.email}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-white/40">
                    {row.completedAt
                      ? new Date(row.completedAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.certificateHash ? (
                      <span
                        title={row.certificateHash}
                        className="text-[11px] text-white/30 font-mono cursor-help"
                      >
                        {shortHash(row.certificateHash)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/20">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rodapé */}
      <div className="border-t border-white/5 pt-5">
        <p className="text-[11px] text-white/25 text-center leading-relaxed">
          Gerado pela plataforma Vegl.ia · Powered by VaciVitta
          <br />
          Os certificados são identificados por hash SHA-256 e podem ser verificados a qualquer momento.
        </p>
      </div>
    </div>
  );
}
