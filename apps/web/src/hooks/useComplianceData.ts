import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@veglia/firebase-config";
import type { VegliaUser } from "@veglia/shared";

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface CollaboradorCompliance {
  uid: string;
  name: string;
  email: string;
  cargo?: string;
  status: "completo" | "em_andamento" | "pendente";
  completedAt?: number;
  certificateUrl?: string;
  certificateHash?: string;
}

export interface ComplianceData {
  users: CollaboradorCompliance[];
  loading: boolean;
  percentCompliance: number;
  totalCertificados: number;
  pendingInvites: number;
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface EnrollmentDoc {
  uid: string;
  course_id: string;
  company_id: string;
  completed_at?: number | null;
  certificate_url?: string | null;
  certificate_hash?: string | null;
  modules?: Record<string, { watched_at?: number | null }>;
}

interface InviteDoc {
  company_id: string;
  usedAt: number | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const COMPLIANCE_COURSE_ID = "lei-15377";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveStatus(
  enrollment: EnrollmentDoc | undefined
): CollaboradorCompliance["status"] {
  if (!enrollment) return "pendente";
  if (enrollment.completed_at || enrollment.certificate_url) return "completo";
  if (enrollment.modules) {
    const hasProgress = Object.values(enrollment.modules).some(
      (m) => m.watched_at != null
    );
    if (hasProgress) return "em_andamento";
  }
  return "pendente";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComplianceData(companyId: string): ComplianceData {
  const [rawUsers, setRawUsers] = useState<VegliaUser[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, EnrollmentDoc>>(
    new Map()
  );
  const [pendingInvites, setPendingInvites] = useState(0);

  const [usersLoaded, setUsersLoaded] = useState(false);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);
  const [invitesLoaded, setInvitesLoaded] = useState(false);

  // ── Query 1: users da empresa ───────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "users"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      setRawUsers(snap.docs.map((d) => d.data() as VegliaUser));
      setUsersLoaded(true);
    });
  }, [companyId]);

  // ── Query 2: enrollments do curso de compliance ─────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "enrollments"),
      where("company_id", "==", companyId),
      where("course_id", "==", COMPLIANCE_COURSE_ID)
    );
    return onSnapshot(q, (snap) => {
      const map = new Map<string, EnrollmentDoc>();
      snap.docs.forEach((d) => {
        const data = d.data() as EnrollmentDoc;
        map.set(data.uid, data);
      });
      setEnrollmentMap(map);
      setEnrollmentsLoaded(true);
    });
  }, [companyId]);

  // ── Query 3: convites pendentes ─────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "invites"),
      where("company_id", "==", companyId)
    );
    return onSnapshot(q, (snap) => {
      const pending = snap.docs.filter((d) => {
        const data = d.data() as InviteDoc;
        return data.usedAt == null;
      }).length;
      setPendingInvites(pending);
      setInvitesLoaded(true);
    });
  }, [companyId]);

  // ── Join ────────────────────────────────────────────────────────────────────
  const loading = !usersLoaded || !enrollmentsLoaded || !invitesLoaded;

  const users: CollaboradorCompliance[] = loading
    ? []
    : rawUsers.map((user) => {
        const enrollment = enrollmentMap.get(user.uid);
        const status = deriveStatus(enrollment);
        return {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          cargo: user.cargo,
          status,
          completedAt: enrollment?.completed_at ?? undefined,
          certificateUrl: enrollment?.certificate_url ?? undefined,
          certificateHash: enrollment?.certificate_hash ?? undefined,
        };
      });

  const totalCertificados = users.filter((u) => u.status === "completo").length;
  const percentCompliance =
    users.length > 0 ? Math.round((totalCertificados / users.length) * 100) : 0;

  return {
    users,
    loading,
    percentCompliance,
    totalCertificados,
    pendingInvites,
  };
}
