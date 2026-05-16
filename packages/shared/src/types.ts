// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "admin_rh" | "rh" | "collaborator";

// ─── Course / Enrollment ──────────────────────────────────────────────────────

export interface CourseModule {
  id: string;
  title: string;
  videoId: string; // YouTube video ID (não listado)
  order: number;
  quizQuestions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface ModuleProgress {
  watched_at: number | null;        // epoch ms quando atingiu 80%
  quiz_score: number | null;        // 0–100
  quiz_passed: boolean;
  quiz_completed_at: number | null;
  watch_percent_last?: number;      // 0–100, último percentual salvo pelo poll de 5s
}

export interface Enrollment {
  uid: string;
  company_id: string;
  course_id: string;
  started_at: number;
  completed_at: number | null;
  certificate_url: string | null;
  modules: Record<string, ModuleProgress>; // key = module id
}

// ─── Firestore documents ──────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  plan: "starter" | "pro" | "enterprise";
  logoUrl?: string;
  /** CSS overrides para white label — ex: { primary: '#1A3A5C' } */
  theme?: Record<string, string>;
  adminUid: string;
  createdAt: number; // epoch ms
}

export interface VegliaUser {
  uid: string;
  company_id: string;
  role: UserRole;
  email: string;
  displayName: string;
  cargo?: string;
  createdAt: number;
}

export interface Invite {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  createdBy: string; // uid do admin
  createdAt: number;
  usedAt: number | null;
}

// ─── Firebase Auth custom claims ──────────────────────────────────────────────
export interface CustomClaims {
  company_id: string;
  role: UserRole;
}
