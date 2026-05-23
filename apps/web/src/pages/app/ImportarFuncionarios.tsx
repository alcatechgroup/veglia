import { useState, useRef, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeRow {
  name: string;
  email: string;
  department?: string;
  cpf?: string;
  _valid: boolean;
  _errors: string[];
}

interface ImportResult {
  batch_id: string;
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): EmployeeRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // Detecta delimitador (vírgula ou ponto-e-vírgula)
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.toLowerCase().trim());

  const nameIdx = headers.findIndex((h) => ["nome", "name", "colaborador"].includes(h));
  const emailIdx = headers.findIndex((h) => ["email", "e-mail", "email corporativo"].includes(h));
  const deptIdx = headers.findIndex((h) =>
    ["departamento", "area", "setor", "department"].includes(h)
  );
  const cpfIdx = headers.findIndex((h) => ["cpf"].includes(h));

  return lines.slice(1).map((line, _i) => {
    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const errors: string[] = [];

    const name = nameIdx >= 0 ? cols[nameIdx] ?? "" : "";
    const email = emailIdx >= 0 ? cols[emailIdx] ?? "" : "";
    const department = deptIdx >= 0 ? cols[deptIdx] ?? "" : "";
    const cpf = cpfIdx >= 0 ? cols[cpfIdx] ?? "" : "";

    if (!name) errors.push("Nome obrigatório");
    if (!email) errors.push("Email obrigatório");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email inválido");

    return {
      name,
      email: email.toLowerCase(),
      department: department || undefined,
      cpf: cpf.replace(/\D/g, "") || undefined,
      _valid: errors.length === 0,
      _errors: errors,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportarFuncionarios() {
  const { claims } = useAuth();
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  }, []);

  const validRows = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const functions = getFunctions();
      const importEmployees = httpsCallable<
        { employees: Omit<EmployeeRow, "_valid" | "_errors">[] },
        ImportResult
      >(functions, "importEmployees");

      const res = await importEmployees({
        employees: validRows.map(({ name, email, department, cpf }) => ({
          name,
          email,
          department,
          cpf,
        })),
      });

      setResult(res.data);
      setRows([]);
      setFileName(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao importar. Tente novamente.");
    } finally {
      setImporting(false);
    }
  };

  const webhookUrl = `https://us-central1-veglia-6e734.cloudfunctions.net/importEmployeesWebhook`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Importar Colaboradores</h1>
        <p className="text-sm text-white/40 mt-1">
          Envie um CSV ou integre via webhook com a folha de pagamento.
        </p>
      </div>

      {/* Success banner */}
      {result && (
        <div className="bg-[#5DD3A8]/10 border border-[#5DD3A8]/25 rounded-2xl p-5">
          <p className="text-[#5DD3A8] font-semibold text-sm mb-2">✓ Importação concluída</p>
          <div className="grid grid-cols-3 gap-4 mt-3">
            {[
              { label: "Total", value: result.total },
              { label: "Criados", value: result.created },
              { label: "Ignorados (já existem)", value: result.skipped },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-white font-mono">{s.value}</p>
                <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3 text-xs text-red-300 space-y-0.5">
              {result.errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
            </div>
          )}
          <p className="text-[10px] text-white/20 mt-3 font-mono">Batch ID: {result.batch_id}</p>
        </div>
      )}

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[#5DD3A8]/60 bg-[#5DD3A8]/8"
            : "border-white/10 hover:border-white/25 hover:bg-white/3"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <p className="text-2xl mb-3">📄</p>
        <p className="text-white/60 text-sm font-medium">
          {fileName ?? "Arraste um arquivo CSV aqui ou clique para selecionar"}
        </p>
        <p className="text-white/25 text-xs mt-1">
          Colunas obrigatórias: <span className="font-mono">nome</span>,{" "}
          <span className="font-mono">email</span> · Opcionais:{" "}
          <span className="font-mono">departamento</span>, <span className="font-mono">cpf</span>
        </p>
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">
                {rows.length} linha{rows.length !== 1 ? "s" : ""} lidas
              </span>
              {validRows.length > 0 && (
                <span className="text-xs text-[#5DD3A8] bg-[#5DD3A8]/10 px-2 py-0.5 rounded-full">
                  {validRows.length} válidas
                </span>
              )}
              {invalidRows.length > 0 && (
                <span className="text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {invalidRows.length} com erro
                </span>
              )}
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="px-4 py-2 bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2545] font-semibold text-sm rounded-xl transition-colors"
            >
              {importing ? "Importando…" : `Importar ${validRows.length} colaboradores`}
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0B2545]">
                <tr className="text-white/30 uppercase tracking-wide border-b border-white/8">
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Departamento</th>
                  <th className="px-4 py-2 text-left">Erros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={row._valid ? "text-white/60" : "text-red-300/70 bg-red-500/5"}
                  >
                    <td className="px-4 py-2">
                      {row._valid ? (
                        <span className="text-[#5DD3A8]">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{row.name || "—"}</td>
                    <td className="px-4 py-2 font-mono">{row.email || "—"}</td>
                    <td className="px-4 py-2">{row.department || "—"}</td>
                    <td className="px-4 py-2 text-red-300 text-[10px]">
                      {row._errors.join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV template download */}
      <div className="bg-white/3 border border-white/5 rounded-xl px-5 py-4">
        <p className="text-xs text-white/40 mb-2">Modelo de CSV</p>
        <p className="text-[11px] text-white/25 font-mono mb-3">
          nome,email,departamento,cpf<br />
          João Silva,joao@empresa.com.br,RH,12345678901<br />
          Maria Santos,maria@empresa.com.br,TI,
        </p>
        <button
          onClick={() => {
            const content = "nome,email,departamento,cpf\nJoão Silva,joao@empresa.com.br,RH,12345678901";
            const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "modelo-importacao-veglia.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs text-[#5DD3A8]/60 hover:text-[#5DD3A8] transition-colors"
        >
          ↓ Baixar modelo.csv
        </button>
      </div>

      {/* Webhook section — visible only for admin_rh */}
      {(claims?.role === "admin_rh" || claims?.role === "admin") && (
        <div className="bg-white/3 border border-white/5 rounded-xl px-5 py-5 space-y-3">
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">
              Integração via webhook
            </p>
            <p className="text-xs text-white/30">
              Configure sua folha de pagamento para enviar dados de novos colaboradores
              automaticamente. Use o endpoint abaixo com autenticação por token Bearer.
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/25 mb-1">Endpoint</p>
            <code className="block bg-black/20 rounded-lg px-3 py-2 text-[11px] text-[#5DD3A8]/70 font-mono break-all">
              POST {webhookUrl}
            </code>
          </div>
          <div>
            <p className="text-[10px] text-white/25 mb-1">Formato do body (JSON)</p>
            <pre className="bg-black/20 rounded-lg px-3 py-2 text-[11px] text-white/40 font-mono overflow-x-auto">
{`{
  "employees": [
    { "name": "João Silva", "email": "joao@empresa.com.br", "department": "RH" }
  ]
}`}
            </pre>
          </div>
          <p className="text-[10px] text-white/20">
            Solicite seu webhook_token ao suporte da Vegl.ia. O token é único por empresa e
            autenticado via header{" "}
            <span className="font-mono">Authorization: Bearer &lt;token&gt;</span>.
          </p>
        </div>
      )}
    </div>
  );
}
