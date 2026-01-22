-- Galamsey Monitor D1 Database Schema
-- Run with: wrangler d1 execute galamsey-db --file=./scripts/d1-schema.sql

-- ============================================
-- Core Tables
-- ============================================

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'investigating', 'resolved')),
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  incident_type TEXT NOT NULL CHECK(incident_type IN ('illegal_mining', 'water_pollution', 'deforestation', 'land_degradation')),
  evidence_urls TEXT,
  verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'rejected', 'duplicate')) DEFAULT 'pending',
  verified_by INTEGER REFERENCES users(id),
  verified_at TEXT,
  admin_notes TEXT,
  priority_score INTEGER DEFAULT 0,
  assigned_to INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Water quality readings table
CREATE TABLE IF NOT EXISTS water_quality (
  id INTEGER PRIMARY KEY,
  water_body_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  region TEXT NOT NULL,
  ph_level REAL,
  turbidity_ntu REAL,
  mercury_level_ppb REAL,
  arsenic_level_ppb REAL,
  lead_level_ppb REAL,
  dissolved_oxygen_mgl REAL,
  quality_status TEXT NOT NULL CHECK(quality_status IN ('safe', 'moderate', 'polluted', 'hazardous')),
  notes TEXT,
  measured_by TEXT NOT NULL,
  measured_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Mining sites table
CREATE TABLE IF NOT EXISTS mining_sites (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  estimated_area_hectares REAL,
  first_detected TEXT DEFAULT (datetime('now')),
  last_activity_detected TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'remediated')),
  satellite_image_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- User & Auth Tables
-- ============================================

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('citizen', 'moderator', 'admin', 'authority')) DEFAULT 'citizen',
  organization TEXT,
  phone TEXT,
  region TEXT,
  avatar_url TEXT,
  verified INTEGER DEFAULT 0,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table for NextAuth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Accounts table for OAuth providers (future use)
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, provider_account_id)
);

-- Verification tokens for email verification
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================
-- Notification Tables
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('incident_nearby', 'status_update', 'water_alert', 'weekly_digest', 'system', 'incident_verified', 'new_incident')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Alert subscriptions table
CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  region TEXT,
  incident_types TEXT,
  severity_threshold TEXT CHECK(severity_threshold IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  email_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 0,
  push_enabled INTEGER DEFAULT 1,
  weekly_digest INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, region)
);

-- ============================================
-- Evidence & Updates Tables
-- ============================================

-- Evidence table for file uploads
CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY,
  incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK(file_type IN ('image', 'video', 'document')) NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  thumbnail_url TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Incident updates/timeline table
CREATE TABLE IF NOT EXISTS incident_updates (
  id INTEGER PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  update_type TEXT CHECK(update_type IN ('status_change', 'note', 'evidence_added', 'verification', 'assignment', 'priority_change')) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Queue Tables
-- ============================================

-- Email queue for async sending
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  status TEXT CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TEXT,
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- SMS queue for async sending
CREATE TABLE IF NOT EXISTS sms_queue (
  id INTEGER PRIMARY KEY,
  to_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TEXT,
  sent_at TEXT,
  twilio_sid TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Indexes
-- ============================================

-- Incidents indexes
CREATE INDEX IF NOT EXISTS idx_incidents_region ON incidents(region);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_verification_status ON incidents(verification_status);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);

-- Water quality indexes
CREATE INDEX IF NOT EXISTS idx_water_quality_region ON water_quality(region);
CREATE INDEX IF NOT EXISTS idx_water_quality_status ON water_quality(quality_status);
CREATE INDEX IF NOT EXISTS idx_water_quality_measured_at ON water_quality(measured_at);

-- Mining sites indexes
CREATE INDEX IF NOT EXISTS idx_mining_sites_region ON mining_sites(region);
CREATE INDEX IF NOT EXISTS idx_mining_sites_status ON mining_sites(status);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Alert subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_user_id ON alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_region ON alert_subscriptions(region);

-- Evidence indexes
CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON evidence(incident_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON evidence(uploaded_by);

-- Incident updates indexes
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_user_id ON incident_updates(user_id);

-- Queue indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);

-- Record this migration
INSERT OR IGNORE INTO migrations (name) VALUES ('001_initial_schema');
