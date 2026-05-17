import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Notification } from "@veglia/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<Notification["type"], string> = {
  vaccine_expiring: "◈",
  module_reminder: "◎",
  diagnostic_pending: "◇",
  campaign_invite: "◑",
  certificate_ready: "◆",
};

const TYPE_COLORS: Record<Notification["type"], string> = {
  vaccine_expiring: "text-[#C9A96E]",
  module_reminder: "text-[#5DD3A8]",
  diagnostic_pending: "text-amber-400",
  campaign_invite: "text-sky-400",
  certificate_ready: "text-[#5DD3A8]",
};

// ─── Hook: contagem de nao lidas (para o header) ──────────────────────────────

export function useUnreadNotifications(uid: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", uid),
      where("read", "==", false)
    );
    return onSnapshot(q, (snap) => setCount(snap.size));
  }, [uid]);

  return count;
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Notificacoes() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const uid = firebaseUser?.uid ?? "";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", uid)
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => b.created_at - a.created_at);
      setNotifications(docs);
      setLoading(false);
    });
  }, [uid]);

  const markRead = async (notifId: string) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  };

  const handleAction = async (notif: Notification) => {
    await markRead(notif.id);
    if (notif.action_url) navigate(notif.action_url);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificacoes</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Alertas de saude e lembretes personalizados
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-[#5DD3A8] hover:underline"
          >
            Marcar todas como lidas ({unreadCount})
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="text-3xl text-white/20">◎</span>
            <p className="text-white/30 text-sm mt-3">Nenhuma notificacao ainda.</p>
            <p className="text-white/20 text-xs mt-1">
              Alertas de saude aparecerao aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  !notif.read ? "bg-white/[0.03]" : ""
                } hover:bg-white/[0.05]`}
              >
                {/* Indicador de nao lida */}
                <div className="flex items-center justify-center w-8 h-8 shrink-0">
                  <span className={`text-lg ${TYPE_COLORS[notif.type]}`}>
                    {TYPE_ICONS[notif.type]}
                  </span>
                  {!notif.read && (
                    <span className="absolute ml-5 mb-5 w-2 h-2 bg-[#5DD3A8] rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.read ? "text-white/50" : "text-white"}`}>
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-white/25 mt-0.5">
                    {new Date(notif.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.action_url && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="text-xs font-medium text-[#5DD3A8] hover:text-[#4BC495] transition-colors"
                    >
                      Ver
                    </button>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
                    >
                      Lida
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
