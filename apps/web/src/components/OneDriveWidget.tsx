import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@veglia/firebase-config";

interface OneDriveDoc {
  id: string;
  name: string;
  url: string;
  type: string;
  size_kb?: number;
  added_at: Timestamp;
  added_by?: string;
}

const SEEN_KEY = "veglia_onedrive_last_seen";
const API_KEY  = "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE";
const PROJECT  = "veglia-6e734";

const TYPE_COLORS: Record<string, string> = {
  pdf:  "text-red-400   bg-red-400/10",
  docx: "text-blue-400  bg-blue-400/10",
  xlsx: "text-emerald-400 bg-emerald-400/10",
  pptx: "text-orange-400 bg-orange-400/10",
  mp4:  "text-purple-400 bg-purple-400/10",
  png:  "text-pink-400  bg-pink-400/10",
  jpg:  "text-pink-400  bg-pink-400/10",
};

function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

export function OneDriveNewCount(): number {
  return Number(sessionStorage.getItem("veglia_onedrive_new_count") ?? 0);
}

export default function OneDriveWidget() {
  const [docs, setDocs]       = useState<OneDriveDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds]   = useState<Set<string>>(new Set());
  const [setup, setSetup]     = useState(false);

  useEffect(() => {
    const q = query(collection(db, "onedrive_docs"), orderBy("added_at", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const items: OneDriveDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OneDriveDoc));
      setDocs(items);
      setLoading(false);

      const lastSeen = Number(localStorage.getItem(SEEN_KEY) ?? 0);
      const fresh = new Set(
        items
          .filter((d) => d.added_at?.toMillis() > lastSeen)
          .map((d) => d.id)
      );
      setNewIds(fresh);
      sessionStorage.setItem("veglia_onedrive_new_count", String(fresh.size));
    }, () => setLoading(false));

    return () => unsub();
  }, []);

  function markAllSeen() {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
    setNewIds(new Set());
    sessionStorage.setItem("veglia_onedrive_new_count", "0");
  }

  if (loading) return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
      <div className="w-4 h-4 border-2 border-[#5DD3A8]/40 border-t-[#5DD3A8] rounded-full animate-spin" />
      <p className="text-white/30 text-sm">Verificando documentos OneDrive…</p>
    </div>
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          {/* OneDrive icon */}
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="shrink-0">
            <path d="M6.8 4.5A4.5 4.5 0 0 1 15.5 6H16a2 2 0 0 1 0 4H5a3 3 0 0 1-.2-6 4.5 4.5 0 0 1 2-3.5z" fill="#0078D4" opacity=".9"/>
            <path d="M4.5 5.5A3.5 3.5 0 0 1 11 7h.5a1.5 1.5 0 0 1 0 3H3a2.5 2.5 0 0 1 0-5 3.5 3.5 0 0 1 1.5.5z" fill="#28A8E8" opacity=".85"/>
          </svg>
          <p className="text-white/75 text-sm font-semibold">OneDrive · Documentos</p>
          {newIds.size > 0 && (
            <span className="text-[10px] font-bold bg-[#5DD3A8] text-[#0B2545] px-1.5 py-0.5 rounded-full leading-none">
              {newIds.size} novo{newIds.size > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {newIds.size > 0 && (
            <button
              onClick={markAllSeen}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              Marcar como lido
            </button>
          )}
          <button
            onClick={() => setSetup((s) => !s)}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors border border-white/10 px-2 py-1 rounded-lg"
          >
            {setup ? "Fechar" : "Como sincronizar"}
          </button>
        </div>
      </div>

      {/* Setup instructions */}
      {setup && <SetupInstructions apiKey={API_KEY} projectId={PROJECT} />}

      {/* Empty state */}
      {!setup && docs.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-white/25 text-sm">Nenhum documento ainda.</p>
          <p className="text-white/15 text-xs mt-1">Clique em "Como sincronizar" para configurar o Power Automate.</p>
        </div>
      )}

      {/* Doc list */}
      {!setup && docs.length > 0 && (
        <div className="divide-y divide-white/5">
          {docs.slice(0, 8).map((doc) => {
            const ext  = fileExt(doc.name);
            const cls  = TYPE_COLORS[ext] ?? "text-white/40 bg-white/8";
            const isNew = newIds.has(doc.id);
            const date = doc.added_at?.toDate().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
            return (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors ${isNew ? "bg-[#5DD3A8]/5" : ""}`}
              >
                {isNew && <span className="w-1.5 h-1.5 rounded-full bg-[#5DD3A8] shrink-0" />}
                {!isNew && <span className="w-1.5 h-1.5 shrink-0" />}
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${cls}`}>{ext}</span>
                <p className="text-white/65 text-sm flex-1 truncate">{doc.name.replace(/\.[^/.]+$/, "")}</p>
                <span className="text-white/20 text-[11px] shrink-0">{date}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-white/20">
                  <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </a>
            );
          })}
          {docs.length > 8 && (
            <p className="text-center text-white/20 text-xs py-2.5">+{docs.length - 8} documentos</p>
          )}
        </div>
      )}
    </div>
  );
}

function SetupInstructions({ apiKey, projectId }: { apiKey: string; projectId: string }) {
  const step2Body = JSON.stringify({ returnSecureToken: true }, null, 2);
  const step3Body = `{
  "fields": {
    "name":     { "stringValue": "<nome do arquivo>" },
    "url":      { "stringValue": "<link do arquivo>" },
    "type":     { "stringValue": "<extensão>" },
    "added_at": { "timestampValue": "<data ISO 8601>" },
    "added_by": { "stringValue": "OneDrive Sync" }
  }
}`;

  return (
    <div className="bg-[#0B2545] border-b border-white/8 p-5 space-y-4">
      <p className="text-[#5DD3A8] text-xs uppercase tracking-widest font-semibold">
        Configurar Power Automate → Firestore
      </p>
      <p className="text-white/40 text-xs leading-relaxed">
        Crie um Flow no Power Automate com o gatilho <strong className="text-white/60">"Quando um arquivo é criado"</strong> na pasta OneDrive. Adicione as 3 ações HTTP abaixo.
      </p>

      {[
        {
          n: "1",
          label: "Gatilho",
          desc: "When a file is created · OneDrive · pasta: Vegl.ia",
          code: null,
        },
        {
          n: "2",
          label: "HTTP — obter token anônimo Firebase",
          desc: `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
          code: step2Body,
          note: "Salve o campo idToken da resposta como variável: @{body('HTTP_Auth')['idToken']}",
        },
        {
          n: "3",
          label: "HTTP — gravar no Firestore",
          desc: `POST https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/onedrive_docs`,
          code: step3Body,
          note: "Header: Authorization → Bearer @{variables('idToken')}",
        },
      ].map((s) => (
        <div key={s.n} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-[#5DD3A8]/15 text-[#5DD3A8] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-semibold">{s.label}</p>
            <p className="text-[#C9A96E]/60 text-[10px] font-mono mt-0.5 break-all">{s.desc}</p>
            {s.code && (
              <pre className="bg-white/5 rounded-lg p-3 text-[10px] text-white/40 font-mono mt-2 overflow-x-auto whitespace-pre-wrap">{s.code}</pre>
            )}
            {s.note && <p className="text-[#5DD3A8]/50 text-[10px] mt-1.5 italic">{s.note}</p>}
          </div>
        </div>
      ))}

      <div className="bg-[#C9A96E]/8 border border-[#C9A96E]/20 rounded-xl p-3">
        <p className="text-[#C9A96E]/70 text-[10px] leading-relaxed">
          <strong>Pré-requisito:</strong> Habilite <em>Login Anônimo</em> no Firebase Console → Authentication → Sign-in providers → Anonymous → Enable. Feito isso o flow funciona sem nenhuma conta de usuário.
        </p>
      </div>
    </div>
  );
}
