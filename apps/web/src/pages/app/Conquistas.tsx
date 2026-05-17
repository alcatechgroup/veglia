import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import { useAuth } from "@/contexts/AuthContext";
import type { UserPoints, UserLevel } from "@veglia/shared";

// ─── Constantes ───────────────────────────────────────────────────────────────

const LEVELS: Array<{ name: UserLevel; min: number; max: number; color: string }> = [
  { name: "Iniciante", min: 0, max: 499, color: "text-white/50" },
  { name: "Guardiao", min: 500, max: 1499, color: "text-[#C9A96E]" },
  { name: "Protetor", min: 1500, max: 3499, color: "text-[#5DD3A8]" },
  { name: "Defensor", min: 3500, max: 9999, color: "text-[#5DD3A8] drop-shadow-[0_0_8px_#5DD3A8]" },
];

const ALL_BADGES: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}> = [
  {
    id: "primeiro-certificado",
    name: "Primeiro Certificado",
    description: "Emitiu o primeiro certificado de compliance",
    icon: "◆",
    points: 500,
  },
  {
    id: "compliance-completo",
    name: "Compliance Completo",
    description: "Atingiu 700 pontos — compliance pleno",
    icon: "◈",
    points: 700,
  },
  {
    id: "vacinado-2026",
    name: "Vacinado 2026",
    description: "Comprovou vacinacao no calendario 2026",
    icon: "◎",
    points: 100,
  },
  {
    id: "equipe-engajada",
    name: "Equipe Engajada",
    description: "Indicou 5 ou mais colegas para a plataforma",
    icon: "◑",
    points: 500,
  },
];

const POINTS_FOR_ACTIONS: Array<{ label: string; points: number; icon: string }> = [
  { label: "Assistir video completo", points: 10, icon: "◎" },
  { label: "Completar modulo", points: 50, icon: "◑" },
  { label: "Completar trilha", points: 200, icon: "◈" },
  { label: "Emitir certificado", points: 500, icon: "◆" },
  { label: "Indicar colega", points: 100, icon: "◻" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentLevel(points: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.min) current = l;
  }
  return current;
}

function getNextLevel(points: number) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (points < LEVELS[i].max) return LEVELS[i];
  }
  return LEVELS[LEVELS.length - 1];
}

function levelProgress(points: number): number {
  const current = getCurrentLevel(points);
  const range = current.max - current.min;
  const progress = points - current.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

// ─── Leaderboard item ─────────────────────────────────────────────────────────

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: UserLevel;
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Conquistas() {
  const { firebaseUser, claims } = useAuth();
  const uid = firebaseUser?.uid ?? "";
  const companyId = claims?.company_id ?? "";

  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [loadingLeader, setLoadingLeader] = useState(true);

  // Pontos do usuario atual
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "user_points", uid), (snap) => {
      if (snap.exists()) {
        setUserPoints(snap.data() as UserPoints);
      } else {
        setUserPoints({
          user_id: uid,
          company_id: companyId,
          total_points: 0,
          level: "Iniciante",
          badges: [],
        });
      }
      setLoadingPoints(false);
    });
    return unsub;
  }, [uid, companyId]);

  // Leaderboard da empresa (top 5)
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "user_points"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      const entries: LeaderboardEntry[] = snap.docs
        .map((d) => d.data() as LeaderboardEntry)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 5);
      setLeaderboard(entries);
      setLoadingLeader(false);
    });
  }, [companyId]);

  if (loadingPoints) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const points = userPoints?.total_points ?? 0;
  const badges = userPoints?.badges ?? [];
  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = levelProgress(points);
  const myRank = leaderboard.findIndex((e) => e.user_id === uid) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Conquistas</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Seus pontos, nivel e badges na plataforma
        </p>
      </div>

      {/* Card de pontos e nivel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1">Total de pontos</p>
            <p className="text-4xl font-bold text-white">{points.toLocaleString("pt-BR")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 mb-1">Nivel atual</p>
            <p className={`text-2xl font-bold ${currentLevel.color}`}>{currentLevel.name}</p>
          </div>
        </div>

        {/* Barra de progresso de nivel */}
        <div>
          <div className="flex justify-between text-xs text-white/30 mb-2">
            <span>{currentLevel.name}</span>
            <span>
              {points} / {currentLevel.max} pts para {nextLevel.name}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5DD3A8] to-[#C9A96E] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Posicao no ranking */}
        {myRank > 0 && (
          <div className="bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-[#C9A96E] text-lg font-bold">#{myRank}</span>
            <p className="text-xs text-white/50">na sua empresa</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Badges</h2>
          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map((badge) => {
              const unlocked = badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-xl p-3 text-center space-y-2 border transition-all ${
                    unlocked
                      ? "bg-[#5DD3A8]/10 border-[#5DD3A8]/25"
                      : "bg-white/5 border-white/5 opacity-40"
                  }`}
                >
                  <span
                    className={`text-2xl ${unlocked ? "text-[#5DD3A8]" : "text-white/20"}`}
                  >
                    {badge.icon}
                  </span>
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      unlocked ? "text-white" : "text-white/30"
                    }`}
                  >
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-white/30 leading-snug">
                    {badge.description}
                  </p>
                  {!unlocked && (
                    <p className="text-[10px] text-[#C9A96E]/60">
                      +{badge.points} pts para desbloquear
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna direita: leaderboard + como ganhar pontos */}
        <div className="space-y-4">
          {/* Mini leaderboard */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Ranking da Empresa</h2>
            {loadingLeader ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-xs text-white/30">Nenhum participante ainda.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.user_id === uid;
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                        isMe ? "bg-[#5DD3A8]/10 border border-[#5DD3A8]/20" : "bg-white/5"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold w-5 text-center ${
                          idx === 0
                            ? "text-[#C9A96E]"
                            : idx === 1
                            ? "text-white/50"
                            : "text-white/30"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs text-white/60 flex-1">
                        {isMe ? "Voce" : `Colaborador ${idx + 1}`}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {entry.total_points.toLocaleString("pt-BR")} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-white/20">
              Ranking anonimo — apenas sua posicao e visivel para outros
            </p>
          </div>

          {/* Como ganhar pontos */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Como ganhar pontos</h2>
            <div className="space-y-2">
              {POINTS_FOR_ACTIONS.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl"
                >
                  <span className="text-base text-[#5DD3A8]">{a.icon}</span>
                  <span className="text-xs text-white/60 flex-1">{a.label}</span>
                  <span className="text-xs font-semibold text-[#C9A96E]">+{a.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
