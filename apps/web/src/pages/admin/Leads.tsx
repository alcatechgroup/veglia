import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = "novo" | "contactado" | "demo_agendada" | "proposta_enviada" | "fechado" | "perdido";

interface LeadNote {
  text: string;
  author: string;
  created_at: number;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  size: string;
  source: string;
  recommended_plan: string;
  status: LeadStatus;
  assignee: string | null;
  notes: LeadNote[];
  conversation_summary: string;
  created_at: { seconds: number } | null;
  updated_at: { seconds: number } | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: "novo",             label: "Novo",             color: "#5DD3A8" },
  { id: "contactado",       label: "Contactado",       color: "#63B3ED" },
  { id: "demo_agendada",    label: "Demo Agendada",    color: "#F6AD55" },
  { id: "proposta_enviada", label: "Proposta Enviada", color: "#C9A96E" },
  { id: "fechado",          label: "Fechado",          color: "#68D391" },
  { id: "perdido",          label: "Perdido",          color: "#FC8181" },
];

const PLAN_LABEL: Record<string, string> = {
  starter:      "Starter · até 50",
  compliance:   "Compliance · até 250",
  professional: "Professional · até 1k",
  enterprise:   "Enterprise",
};

const PLAN_COLOR: Record<string, string> = {
  starter:      "rgba(93,211,168,.15)",
  compliance:   "rgba(99,179,237,.15)",
  professional: "rgba(201,169,110,.15)",
  enterprise:   "rgba(252,129,129,.15)",
};

function relativeTime(lead: Lead): string {
  const ts = lead.created_at?.seconds;
  if (!ts) return "";
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

function sourceLabelShort(source: string): string {
  if (source === "chat_vela") return "Chat Vela";
  if (source === "landing_form") return "Formulário";
  return source;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onMove,
  onOpen,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  onMove: (id: string, status: LeadStatus) => void;
  onOpen: (lead: Lead) => void;
  dragging: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const snippet = lead.conversation_summary
    ? '"' + lead.conversation_summary.slice(0, 80).split("\n")[0] + (lead.conversation_summary.length > 80 ? "…" : "") + '"'
    : null;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead.id)}
      onDragEnd={onDragEnd}
      style={{
        background: dragging === lead.id ? "rgba(93,211,168,.08)" : "#132B45",
        border: "1px solid rgba(255,255,255,.07)",
        borderRadius: 14,
        padding: "16px",
        cursor: "grab",
        opacity: dragging === lead.id ? 0.5 : 1,
        transition: "opacity .15s",
        position: "relative",
      }}
    >
      {/* Nome + empresa */}
      <p style={{ fontWeight: 700, color: "#FBF8F1", fontSize: 14, marginBottom: 2 }}>{lead.name}</p>
      <p style={{ color: "rgba(251,248,241,.6)", fontSize: 13, marginBottom: 10 }}>{lead.company}</p>

      {/* Badge plano */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{
          background: PLAN_COLOR[lead.recommended_plan] || "rgba(93,211,168,.1)",
          color: "#5DD3A8",
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 99,
          letterSpacing: ".3px",
        }}>
          {PLAN_LABEL[lead.recommended_plan] || lead.recommended_plan}
        </span>
        {lead.size && lead.size !== "não informado" && (
          <span style={{ color: "rgba(251,248,241,.35)", fontSize: 11 }}>{lead.size} func.</span>
        )}
      </div>

      {/* Source + tempo */}
      <p style={{ color: "rgba(251,248,241,.35)", fontSize: 11, marginBottom: snippet ? 8 : 0 }}>
        {sourceLabelShort(lead.source)} · {relativeTime(lead)}
      </p>

      {/* Snippet da conversa */}
      {snippet && (
        <p style={{ color: "rgba(251,248,241,.4)", fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
          {snippet}
        </p>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <a
          href={`mailto:${lead.email}?subject=Vegl.ia — ${lead.company}`}
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "7px 0",
            borderRadius: 8,
            border: "1px solid rgba(93,211,168,.25)",
            color: "#5DD3A8",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            transition: "background .15s",
          }}
        >
          Contatar
        </a>
        <div style={{ position: "relative", flex: 1 }}>
          <button
            onClick={e => { e.stopPropagation(); setMoveOpen(prev => !prev); }}
            style={{
              width: "100%",
              padding: "7px 0",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.1)",
              background: "transparent",
              color: "rgba(251,248,241,.55)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Mover
          </button>
          {moveOpen && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 0,
              width: 190,
              background: "#0B2545",
              border: "1px solid rgba(93,211,168,.2)",
              borderRadius: 10,
              zIndex: 20,
              overflow: "hidden",
            }}>
              {COLUMNS.filter(c => c.id !== lead.status).map(col => (
                <button
                  key={col.id}
                  onClick={e => { e.stopPropagation(); onMove(lead.id, col.id); setMoveOpen(false); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 14px",
                    background: "transparent",
                    border: "none",
                    color: "rgba(251,248,241,.7)",
                    fontSize: 12.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(93,211,168,.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block", flexShrink: 0 }} />
                  {col.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onOpen(lead); }}
          style={{
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,.08)",
            background: "transparent",
            color: "rgba(251,248,241,.45)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          title="Ver detalhes"
        >
          ↗
        </button>
      </div>
    </div>
  );
}

// ── Sidebar de detalhes ───────────────────────────────────────────────────────

function LeadSidebar({
  lead,
  onClose,
  onMove,
  currentUserName,
}: {
  lead: Lead;
  onClose: () => void;
  onMove: (id: string, status: LeadStatus) => void;
  currentUserName: string;
}) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "leads", lead.id), {
        notes: arrayUnion({
          text: noteText.trim(),
          author: currentUserName,
          created_at: Date.now(),
        }),
        updated_at: serverTimestamp(),
      });
      setNoteText("");
    } catch (e) {
      console.error("Erro ao salvar nota:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: 400,
      height: "100vh",
      background: "#0B2545",
      borderLeft: "1px solid rgba(93,211,168,.15)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#FBF8F1", fontWeight: 700, fontSize: 17 }}>{lead.name}</p>
          <p style={{ color: "rgba(251,248,241,.5)", fontSize: 13, marginTop: 2 }}>{lead.company}</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: "20px 24px", flex: 1 }}>
        {/* Dados */}
        <Section title="Dados do lead">
          <Row label="E-mail"><a href={`mailto:${lead.email}`} style={{ color: "#5DD3A8", fontSize: 13 }}>{lead.email}</a></Row>
          <Row label="Empresa">{lead.company}</Row>
          <Row label="Funcionários">{lead.size}</Row>
          <Row label="Plano sugerido">{PLAN_LABEL[lead.recommended_plan] || lead.recommended_plan}</Row>
          <Row label="Origem">{sourceLabelShort(lead.source)}</Row>
          <Row label="Status atual">
            <span style={{ color: COLUMNS.find(c => c.id === lead.status)?.color || "#FBF8F1", fontWeight: 600, fontSize: 12 }}>
              {COLUMNS.find(c => c.id === lead.status)?.label || lead.status}
            </span>
          </Row>
        </Section>

        {/* Mover status */}
        <Section title="Mover para">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {COLUMNS.filter(c => c.id !== lead.status).map(col => (
              <button key={col.id} onClick={() => onMove(lead.id, col.id)} style={{
                padding: "5px 12px",
                borderRadius: 99,
                border: `1px solid ${col.color}40`,
                background: `${col.color}10`,
                color: col.color,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}>
                {col.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Conversa */}
        {lead.conversation_summary && (
          <Section title="Conversa com a Vela">
            <p style={{ color: "rgba(251,248,241,.5)", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {lead.conversation_summary}
            </p>
          </Section>
        )}

        {/* Ação rápida */}
        <a
          href={`mailto:${lead.email}?subject=Vegl.ia — Obrigado pelo interesse, ${lead.name.split(" ")[0]}`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "11px",
            borderRadius: 10,
            background: "rgba(93,211,168,.12)",
            border: "1px solid rgba(93,211,168,.25)",
            color: "#5DD3A8",
            fontWeight: 700,
            fontSize: 13.5,
            marginBottom: 20,
            textDecoration: "none",
          }}
        >
          Enviar e-mail para {lead.name.split(" ")[0]}
        </a>

        {/* Notas */}
        <Section title={`Notas (${lead.notes?.length || 0})`}>
          {(lead.notes || []).map((note, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,.04)",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 8,
            }}>
              <p style={{ color: "rgba(251,248,241,.7)", fontSize: 13, lineHeight: 1.55 }}>{note.text}</p>
              <p style={{ color: "rgba(251,248,241,.25)", fontSize: 11, marginTop: 6 }}>
                {note.author} · {note.created_at ? new Date(note.created_at).toLocaleString("pt-BR") : ""}
              </p>
            </div>
          ))}
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={3}
            placeholder="Adicionar nota..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(93,211,168,.2)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#FBF8F1",
              fontSize: 13,
              resize: "vertical",
              fontFamily: "Inter, sans-serif",
              outline: "none",
              marginBottom: 8,
            }}
          />
          <button
            onClick={saveNote}
            disabled={saving || !noteText.trim()}
            style={{
              padding: "9px 18px",
              background: "#5DD3A8",
              color: "#0B2545",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving || !noteText.trim() ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            {saving ? "Salvando..." : "Salvar nota"}
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ color: "rgba(251,248,241,.3)", fontSize: 10.5, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
      <span style={{ color: "rgba(251,248,241,.35)", fontSize: 12.5 }}>{label}</span>
      <span style={{ color: "rgba(251,248,241,.75)", fontSize: 12.5, textAlign: "right", maxWidth: "60%" }}>{children}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Leads() {
  const { firebaseUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);

  // Filtros
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterSource, setFilterSource] = useState("all");

  // Contagem "novo" para badge no nav
  const newCount = leads.filter(l => l.status === "novo").length;

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, snap => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Atualiza selectedLead quando os dados mudarem (ex: nota salva)
  useEffect(() => {
    if (!selectedLead) return;
    const updated = leads.find(l => l.id === selectedLead.id);
    if (updated) setSelectedLead(updated);
  }, [leads]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveCard = useCallback(async (id: string, status: LeadStatus) => {
    try {
      await updateDoc(doc(db, "leads", id), { status, updated_at: serverTimestamp() });
    } catch (e) {
      console.error("Erro ao mover card:", e);
    }
  }, []);

  const filteredLeads = leads.filter(l => {
    if (filterPlan !== "all" && l.recommended_plan !== filterPlan) return false;
    if (filterSource !== "all" && l.source !== filterSource) return false;
    return true;
  });

  const currentUserName = firebaseUser?.displayName || firebaseUser?.email || "Sócio";

  // ── Drag and drop ────────────────────────────────────────────────────────
  const handleDrop = (status: LeadStatus) => {
    if (dragging && dragging !== "") {
      moveCard(dragging, status);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#FBF8F1", letterSpacing: "-.02em" }}>
            Leads
            {newCount > 0 && (
              <span style={{
                marginLeft: 10,
                background: "#5DD3A8",
                color: "#0B2545",
                fontSize: 12,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 99,
                verticalAlign: "middle",
              }}>
                {newCount} novo{newCount > 1 ? "s" : ""}
              </span>
            )}
          </h1>
          <p style={{ color: "rgba(251,248,241,.4)", fontSize: 13.5, marginTop: 4 }}>
            {leads.length} lead{leads.length !== 1 ? "s" : ""} capturado{leads.length !== 1 ? "s" : ""} · Kanban de pipeline comercial
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8,
              color: "rgba(251,248,241,.7)",
              padding: "8px 12px",
              fontSize: 12.5,
              fontFamily: "inherit",
              outline: "none",
            }}
          >
            <option value="all">Todos os planos</option>
            <option value="starter">Starter</option>
            <option value="compliance">Compliance</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8,
              color: "rgba(251,248,241,.7)",
              padding: "8px 12px",
              fontSize: 12.5,
              fontFamily: "inherit",
              outline: "none",
            }}
          >
            <option value="all">Todas as origens</option>
            <option value="chat_vela">Chat Vela</option>
            <option value="landing_form">Formulário</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "rgba(251,248,241,.35)", fontSize: 14, textAlign: "center", paddingTop: 60 }}>
          Carregando leads...
        </div>
      ) : (
        /* Kanban board */
        <div style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 24,
          alignItems: "flex-start",
        }}>
          {COLUMNS.map(col => {
            const colLeads = filteredLeads.filter(l => l.status === col.id);
            const isOver = dragOver === col.id;
            return (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(col.id)}
                style={{
                  minWidth: 270,
                  width: 270,
                  flexShrink: 0,
                  background: isOver ? "rgba(93,211,168,.05)" : "rgba(255,255,255,.02)",
                  borderRadius: 16,
                  border: isOver ? "1px solid rgba(93,211,168,.3)" : "1px solid rgba(255,255,255,.04)",
                  padding: "16px 12px",
                  transition: "border-color .15s, background .15s",
                }}
              >
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block" }} />
                  <span style={{ color: "rgba(251,248,241,.7)", fontSize: 13, fontWeight: 700 }}>{col.label}</span>
                  <span style={{
                    marginLeft: "auto",
                    background: "rgba(255,255,255,.07)",
                    color: "rgba(251,248,241,.4)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {colLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onMove={moveCard}
                      onOpen={setSelectedLead}
                      dragging={dragging}
                      onDragStart={setDragging}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div style={{
                      height: 60,
                      border: "2px dashed rgba(255,255,255,.06)",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,.12)",
                      fontSize: 12,
                    }}>
                      vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sidebar */}
      {selectedLead && (
        <>
          <div
            onClick={() => setSelectedLead(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 99 }}
          />
          <LeadSidebar
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onMove={moveCard}
            currentUserName={currentUserName}
          />
        </>
      )}
    </div>
  );
}
