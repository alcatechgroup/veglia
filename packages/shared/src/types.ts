// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "admin_rh" | "rh" | "rh_filial" | "collaborator";

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
  parent_id?: string | null;  // null/undefined = matriz; preenchido = filial
  is_matrix?: boolean;        // true se tem ou pode ter filiais
  webhook_token?: string;     // token de autenticação para importação via webhook
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

// ─── Campaigns (F07) ─────────────────────────────────────────────────────────

export type CampaignType = "vaccination" | "education" | "prevention";
export type CampaignStatus = "draft" | "active" | "completed";

export interface Campaign {
  id: string;
  company_id: string;
  name: string;
  type: CampaignType;
  trilha_id?: string;
  status: CampaignStatus;
  starts_at: number; // epoch ms
  ends_at: number;   // epoch ms
  created_by: string;
  created_at: number;
  stats: { invited: number; enrolled: number; completed: number };
}

// ─── Journeys (F08) ──────────────────────────────────────────────────────────

export interface JourneyStep {
  trilha_id: string;
  order: number;
  required: boolean;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  target_profile: string[];
  steps: JourneyStep[];
  badge_id: string;
}

export interface UserJourney {
  user_id: string;
  journey_id: string;
  company_id: string;
  current_step: number;
  started_at: number;
  completed_at?: number;
  steps_completed: string[];
}

// ─── Gamification (F09) ──────────────────────────────────────────────────────

export type GamificationAction =
  | "video_watched"
  | "module_completed"
  | "trilha_completed"
  | "certificate_issued"
  | "invite_accepted";

export type UserLevel = "Iniciante" | "Guardiao" | "Protetor" | "Defensor";

export interface UserPoints {
  user_id: string;
  company_id: string;
  total_points: number;
  level: UserLevel;
  badges: string[];
}

// ─── Diagnostic (F10) ────────────────────────────────────────────────────────

export interface DiagnosticResult {
  user_id: string;
  company_id: string;
  score: number; // 0–100
  category: "low" | "medium" | "high";
  recommendations: string[];
  completed_at: number;
}

// ─── Health Passport (F11) ────────────────────────────────────────────────────

export interface VaccinationRecord {
  vaccine_name: string;
  date_applied: number;
  dose: string;
  provider?: string;
}

export interface HealthPassport {
  user_id: string;
  company_id: string;
  vaccinations: VaccinationRecord[];
  certificates: string[]; // certificate_ids
  health_score: number;
  qr_token: string;
  updated_at: number;
}

// ─── ISPC (F12) ──────────────────────────────────────────────────────────────

export interface ISPCSnapshot {
  company_id: string;
  period: string; // YYYY-MM
  score: number;
  breakdown: {
    education: number;
    vaccination: number;
    prevention: number;
  };
  created_at: number;
}

// ─── SIPAT (F13) ─────────────────────────────────────────────────────────────

export interface SipatEvent {
  id: string;
  company_id: string;
  year: number;
  status: "draft" | "active" | "completed";
  starts_at: number;
  ends_at: number;
  participants: string[];
  report_url?: string;
  created_by: string;
  created_at: number;
}

// ─── White Label (F14) ────────────────────────────────────────────────────────

export interface WhiteLabelConfig {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  platform_name: string;
  custom_domain?: string;
}

// ─── Marketplace (F15) ────────────────────────────────────────────────────────

export interface MarketplaceItem {
  id: string;
  name: string;
  provider: string;
  price?: number;
  description: string;
  category: "consultation" | "exam" | "vaccine" | "plan";
  available: boolean;
}

export interface MarketplaceRequest {
  id: string;
  user_id: string;
  company_id: string;
  item_id: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  created_at: number;
}

// ─── Content Feed (F16) ──────────────────────────────────────────────────────

export type ContentType = "video" | "article";
export type ContentCategory = "vaccination" | "mental_health" | "nutrition" | "prevention";

export interface ContentFeedItem {
  id: string;
  title: string;
  summary: string;
  type: ContentType;
  url: string;
  category: ContentCategory;
  published_at: number;
  author: string;
}

// ─── Notifications (F18) ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  company_id: string;
  type: "vaccine_expiring" | "module_reminder" | "diagnostic_pending" | "campaign_invite" | "certificate_ready";
  message: string;
  action_url?: string;
  read: boolean;
  created_at: number;
}

// ─── Benefits (F19) ──────────────────────────────────────────────────────────

export interface Benefit {
  id: string;
  name: string;
  description: string;
  how_to_access: string;
  valid_until?: number;
  limit_per_user?: number;
  plans: Array<"starter" | "pro" | "enterprise">;
}

export interface BenefitActivation {
  id: string;
  benefit_id: string;
  user_id: string;
  company_id: string;
  activated_at: number;
}

// ─── Dependents (F21) ────────────────────────────────────────────────────────

export interface Dependent {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  birth_date: number;
  relationship: "spouse" | "child" | "parent" | "other";
  vaccinations: VaccinationRecord[];
}

// ─── Vela Chat Config ─────────────────────────────────────────────────────────

export interface VelaKnowledgeItem {
  id: string;
  keywords: string[];
  response: string;
  order: number;
  active: boolean;
}

export interface VelaKnowledgeBase {
  items: VelaKnowledgeItem[];
  updated_at: number;
  updated_by: string;
}

export interface VelaSettings {
  greeting: string;
  fallback: string;
  conversion_kw: string[];
  updated_at: number;
  updated_by: string;
}

// ─── Company (extended) ───────────────────────────────────────────────────────

// ─── Employee Import ──────────────────────────────────────────────────────────

export interface ImportBatch {
  id: string;
  company_id: string;
  created_by: string;
  created_at: number;
  total: number;
  imported: number;
  duplicates: number;
  errors: Array<{ row: number; email: string; reason: string }>;
  source: "csv" | "webhook";
}

export interface ImportEmployeePayload {
  name: string;
  email: string;
  cpf?: string;
  cargo?: string;
  filial_id?: string;
  departamento?: string;
}
