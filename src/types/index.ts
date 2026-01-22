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
