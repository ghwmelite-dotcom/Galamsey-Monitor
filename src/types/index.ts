// User Types
export type UserRole = 'citizen' | 'moderator' | 'admin' | 'authority';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  region?: string;
  avatar_url?: string;
  verified: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  organization?: string;
  phone?: string;
  region?: string;
}

export interface Session {
  id: string;
  session_token: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface SafeUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  region?: string;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
}

// Verification Status Types
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'duplicate';

// Incident Types
export interface Incident {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  reported_by: string;
  contact_phone?: string;
  status: 'active' | 'investigating' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident_type: 'illegal_mining' | 'water_pollution' | 'deforestation' | 'land_degradation';
  evidence_urls?: string;
  verification_status: VerificationStatus;
  verified_by?: number;
  verified_at?: string;
  admin_notes?: string;
  priority_score?: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentInput {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  reported_by: string;
  contact_phone?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident_type: 'illegal_mining' | 'water_pollution' | 'deforestation' | 'land_degradation';
  evidence_urls?: string;
}

// Water Quality Types
export interface WaterQualityReading {
  id: number;
  water_body_name: string;
  latitude: number;
  longitude: number;
  region: string;
  ph_level?: number;
  turbidity_ntu?: number;
  mercury_level_ppb?: number;
  arsenic_level_ppb?: number;
  lead_level_ppb?: number;
  dissolved_oxygen_mgl?: number;
  quality_status: 'safe' | 'moderate' | 'polluted' | 'hazardous';
  notes?: string;
  measured_by: string;
  measured_at: string;
  created_at: string;
}

export interface WaterQualityInput {
  water_body_name: string;
  latitude: number;
  longitude: number;
  region: string;
  ph_level?: number;
  turbidity_ntu?: number;
  mercury_level_ppb?: number;
  arsenic_level_ppb?: number;
  lead_level_ppb?: number;
  dissolved_oxygen_mgl?: number;
  quality_status: 'safe' | 'moderate' | 'polluted' | 'hazardous';
  notes?: string;
  measured_by: string;
}

// Mining Site Types
export interface MiningSite {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  estimated_area_hectares?: number;
  first_detected: string;
  last_activity_detected?: string;
  status: 'active' | 'inactive' | 'remediated';
  satellite_image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MiningSiteInput {
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  estimated_area_hectares?: number;
  status: 'active' | 'inactive' | 'remediated';
  satellite_image_url?: string;
  notes?: string;
}

// Statistics Types
export interface DashboardStats {
  totalIncidents: number;
  activeIncidents: number;
  affectedWaterBodies: number;
  pollutedWaterBodies: number;
  totalMiningSites: number;
  activeMiningSites: number;
  incidentsByRegion: { region: string; count: number }[];
  incidentsByType: { type: string; count: number }[];
  waterQualityTrend: { date: string; safe: number; polluted: number }[];
  recentIncidents: Incident[];
}

// Ghana Regions
export const GHANA_REGIONS = [
  'Ashanti',
  'Brong-Ahafo',
  'Central',
  'Eastern',
  'Greater Accra',
  'Northern',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Ahafo',
  'Bono East',
  'North East',
  'Oti',
  'Savannah',
  'Western North',
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

// Map center for Ghana
export const GHANA_CENTER: [number, number] = [7.9465, -1.0232];
export const GHANA_BOUNDS: [[number, number], [number, number]] = [
  [4.5, -3.5],
  [11.5, 1.5],
];

// Notification Types
export type NotificationType = 'incident_nearby' | 'status_update' | 'water_alert' | 'weekly_digest' | 'system' | 'incident_verified' | 'new_incident';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  email_sent: boolean;
  sms_sent: boolean;
  created_at: string;
}

export interface NotificationInput {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Alert Subscription Types
export type SeverityThreshold = 'low' | 'medium' | 'high' | 'critical';

export interface AlertSubscription {
  id: number;
  user_id: number;
  region?: string;
  incident_types?: string; // JSON array
  severity_threshold: SeverityThreshold;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  weekly_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertSubscriptionInput {
  user_id: number;
  region?: string;
  incident_types?: string[];
  severity_threshold?: SeverityThreshold;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  weekly_digest?: boolean;
}

// Evidence Types
export type FileType = 'image' | 'video' | 'document';

export interface Evidence {
  id: number;
  incident_id: number;
  file_url: string;
  file_type: FileType;
  file_name: string;
  file_size?: number;
  thumbnail_url?: string;
  uploaded_by?: number;
  description?: string;
  created_at: string;
}

export interface EvidenceInput {
  incident_id: number;
  file_url: string;
  file_type: FileType;
  file_name: string;
  file_size?: number;
  thumbnail_url?: string;
  uploaded_by?: number;
  description?: string;
}

// Incident Update Types
export type UpdateType = 'status_change' | 'note' | 'evidence_added' | 'verification' | 'assignment' | 'priority_change';

export interface IncidentUpdate {
  id: number;
  incident_id: number;
  user_id?: number;
  update_type: UpdateType;
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_at: string;
}

export interface IncidentUpdateInput {
  incident_id: number;
  user_id?: number;
  update_type: UpdateType;
  old_value?: string;
  new_value?: string;
  notes?: string;
}

// Email Queue Types
export interface EmailQueueItem {
  id: number;
  to_email: string;
  to_name?: string;
  subject: string;
  html_body: string;
  text_body?: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  last_attempt_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

// SMS Queue Types
export interface SMSQueueItem {
  id: number;
  to_phone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  last_attempt_at?: string;
  sent_at?: string;
  twilio_sid?: string;
  error_message?: string;
  created_at: string;
}

// Search Result Types
export interface SearchResult {
  type: 'incident' | 'water' | 'site';
  id: number;
  title: string;
  description: string;
  region: string;
  latitude: number;
  longitude: number;
  relevance: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Guardian System Types (Phase 2)
// ============================================

export type GuardianRank = 'observer' | 'bronze' | 'silver' | 'gold' | 'diamond';

export interface GuardianProfile {
  id: number;
  user_id: number;
  display_name: string;
  guardian_rank: GuardianRank;
  guardian_points: number;
  reports_submitted: number;
  reports_verified: number;
  enforcement_actions: number;
  badges: Badge[];
  bio?: string;
  avatar_url?: string;
  region?: string;
  show_on_leaderboard: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earned_at?: string;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: string;
  badge_name: string;
  badge_description?: string;
  badge_icon?: string;
  earned_at: string;
}

export type ActivityType =
  | 'report_submitted'
  | 'report_verified'
  | 'report_rejected'
  | 'enforcement_triggered'
  | 'badge_earned'
  | 'rank_promoted'
  | 'comment_added'
  | 'evidence_uploaded'
  | 'alert_subscription';

export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: ActivityType;
  incident_id?: number;
  points_earned: number;
  metadata?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_url?: string;
  guardian_rank: GuardianRank;
  score: number;
  region?: string;
}

export interface Leaderboard {
  period: 'weekly' | 'monthly' | 'all_time';
  category: 'reports' | 'verified' | 'enforcement' | 'points';
  region?: string;
  entries: LeaderboardEntry[];
  updated_at: string;
}

// Guardian rank requirements
export const GUARDIAN_RANK_REQUIREMENTS = {
  observer: { min_verified: 0, min_points: 0 },
  bronze: { min_verified: 5, min_points: 50 },
  silver: { min_verified: 20, min_points: 200 },
  gold: { min_verified: 50, min_points: 500 },
  diamond: { min_verified: 100, min_points: 1000 },
} as const;

// ============================================
// Outcome Tracking Types (Phase 2)
// ============================================

export type OutcomeType =
  | 'investigation_opened'
  | 'site_visit_conducted'
  | 'warning_issued'
  | 'equipment_seized'
  | 'site_closed'
  | 'arrests_made'
  | 'remediation_started'
  | 'remediation_completed'
  | 'case_dismissed';

export interface IncidentOutcome {
  id: number;
  incident_id: number;
  outcome_type: OutcomeType;
  outcome_date: string;
  description?: string;
  evidence_url?: string;
  reported_by?: number;
  verified: boolean;
  verified_by?: number;
  verified_at?: string;
  impact_score: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentOutcomeInput {
  incident_id: number;
  outcome_type: OutcomeType;
  outcome_date: string;
  description?: string;
  evidence_url?: string;
  reported_by?: number;
}

export const OUTCOME_WEIGHTS: Record<OutcomeType, number> = {
  investigation_opened: 1.0,
  site_visit_conducted: 2.0,
  warning_issued: 2.5,
  equipment_seized: 4.0,
  site_closed: 5.0,
  arrests_made: 5.0,
  remediation_started: 6.0,
  remediation_completed: 8.0,
  case_dismissed: 0,
};

export type RecoveryLocationType = 'water_body' | 'land' | 'forest';

export interface EnvironmentalRecovery {
  id: number;
  incident_id?: number;
  location_type: RecoveryLocationType;
  location_name: string;
  latitude?: number;
  longitude?: number;
  baseline_date: string;
  baseline_status: string;
  current_status?: string;
  recovery_percentage: number;
  last_assessment_date?: string;
  next_assessment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Impact Dashboard Types (Phase 2)
// ============================================

export interface UserImpact {
  user_id: number;
  display_name: string;
  guardian_rank: GuardianRank;
  guardian_points: number;

  // Report stats
  reports_submitted: number;
  reports_verified: number;
  reports_pending: number;
  reports_rejected: number;

  // Outcome stats
  enforcement_actions: number;
  sites_closed: number;
  equipment_seized: number;
  arrests_made: number;

  // Environmental impact
  estimated_hectares_protected: number;
  water_bodies_monitored: number;

  // Badges
  badges: Badge[];
  recent_badges: Badge[];

  // Activity
  recent_activities: UserActivity[];
  activity_streak: number;

  // Rankings
  global_rank?: number;
  regional_rank?: number;
}

export interface PlatformImpact {
  total_reports: number;
  verified_reports: number;
  active_incidents: number;
  resolved_incidents: number;

  total_enforcement_actions: number;
  sites_closed: number;
  equipment_seized: number;
  arrests_made: number;

  estimated_hectares_protected: number;
  water_bodies_monitored: number;
  recovery_projects: number;

  active_guardians: number;
  total_guardians: number;
  reports_this_month: number;

  regions_covered: number;
  districts_covered: number;
}

// ============================================
// Public API Types (Phase 2)
// ============================================

export type ApiTier = 'free' | 'standard' | 'professional' | 'enterprise';
export type ApiPermission = 'read' | 'write' | 'admin';

export interface ApiKey {
  id: number;
  user_id?: number;
  key_prefix: string;
  name: string;
  tier: ApiTier;
  rate_limit_daily: number;
  rate_limit_minute: number;
  permissions: ApiPermission[];
  allowed_origins?: string[];
  last_used_at?: string;
  requests_today: number;
  requests_total: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface ApiKeyInput {
  name: string;
  tier?: ApiTier;
  permissions?: ApiPermission[];
  allowed_origins?: string[];
  expires_at?: string;
}

export const API_TIER_LIMITS = {
  free: { daily: 100, minute: 10 },
  standard: { daily: 10000, minute: 100 },
  professional: { daily: 100000, minute: 1000 },
  enterprise: { daily: -1, minute: -1 }, // Unlimited
} as const;

export interface ApiRequest {
  id: number;
  api_key_id?: number;
  endpoint: string;
  method: string;
  status_code?: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================
// Webhook Types (Phase 2)
// ============================================

export type WebhookEvent =
  | 'incident.created'
  | 'incident.verified'
  | 'incident.resolved'
  | 'incident.updated'
  | 'water_quality.alert'
  | 'enforcement.action'
  | 'outcome.reported';

export interface Webhook {
  id: number;
  user_id?: number;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  last_triggered_at?: string;
  failure_count: number;
  created_at: string;
}

export interface WebhookInput {
  url: string;
  events: WebhookEvent[];
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  event_type: WebhookEvent;
  payload: string;
  status_code?: number;
  response_body?: string;
  delivered_at: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}
