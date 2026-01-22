-- Migration: Guardian System & Outcome Tracking
-- Phase 2: Community & Data
-- Date: January 2026

-- ============================================
-- User Guardian System Tables
-- ============================================

-- Add guardian-related columns to users table
ALTER TABLE users ADD COLUMN guardian_rank TEXT DEFAULT 'observer' CHECK(guardian_rank IN ('observer', 'bronze', 'silver', 'gold', 'diamond'));
ALTER TABLE users ADD COLUMN guardian_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN reports_submitted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN reports_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN enforcement_actions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'; -- JSON array of badge IDs
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN show_on_leaderboard INTEGER DEFAULT 1; -- 1 = opt-in, 0 = opt-out

-- User achievements/badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- User activity log for tracking contributions
CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK(activity_type IN (
        'report_submitted', 'report_verified', 'report_rejected',
        'enforcement_triggered', 'badge_earned', 'rank_promoted',
        'comment_added', 'evidence_uploaded', 'alert_subscription'
    )),
    incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0,
    metadata TEXT, -- JSON for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created ON user_activities(created_at);

-- ============================================
-- Outcome Tracking Tables
-- ============================================

-- Incident outcomes table - tracks what happened as a result of reports
CREATE TABLE IF NOT EXISTS incident_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    outcome_type TEXT NOT NULL CHECK(outcome_type IN (
        'investigation_opened', 'site_visit_conducted', 'warning_issued',
        'equipment_seized', 'site_closed', 'arrests_made',
        'remediation_started', 'remediation_completed', 'case_dismissed'
    )),
    outcome_date DATE NOT NULL,
    description TEXT,
    evidence_url TEXT,
    reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified INTEGER DEFAULT 0,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at DATETIME,
    impact_score REAL DEFAULT 0, -- Calculated impact weight
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_outcomes_incident ON incident_outcomes(incident_id);
CREATE INDEX idx_incident_outcomes_type ON incident_outcomes(outcome_type);
CREATE INDEX idx_incident_outcomes_date ON incident_outcomes(outcome_date);

-- Environmental recovery tracking
CREATE TABLE IF NOT EXISTS environmental_recovery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
    location_type TEXT NOT NULL CHECK(location_type IN ('water_body', 'land', 'forest')),
    location_name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    baseline_date DATE NOT NULL,
    baseline_status TEXT NOT NULL,
    current_status TEXT,
    recovery_percentage REAL DEFAULT 0,
    last_assessment_date DATE,
    next_assessment_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_environmental_recovery_incident ON environmental_recovery(incident_id);
CREATE INDEX idx_environmental_recovery_type ON environmental_recovery(location_type);

-- ============================================
-- API Keys & Rate Limiting Tables
-- ============================================

-- API keys for public API access
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the API key
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'free' CHECK(tier IN ('free', 'standard', 'professional', 'enterprise')),
    rate_limit_daily INTEGER DEFAULT 100,
    rate_limit_minute INTEGER DEFAULT 10,
    permissions TEXT DEFAULT '["read"]', -- JSON array of permissions
    allowed_origins TEXT, -- JSON array of allowed domains
    last_used_at DATETIME,
    requests_today INTEGER DEFAULT 0,
    requests_total INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- API request log for analytics
CREATE TABLE IF NOT EXISTS api_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_requests_key ON api_requests(api_key_id);
CREATE INDEX idx_api_requests_created ON api_requests(created_at);
CREATE INDEX idx_api_requests_endpoint ON api_requests(endpoint);

-- ============================================
-- Leaderboard & Statistics Cache
-- ============================================

-- Cached leaderboard data (updated periodically)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'all_time')),
    category TEXT NOT NULL CHECK(category IN ('reports', 'verified', 'enforcement', 'points')),
    region TEXT, -- NULL for global
    rankings TEXT NOT NULL, -- JSON array of {user_id, display_name, score, rank}
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period, category, region)
);

CREATE INDEX idx_leaderboard_cache_period ON leaderboard_cache(period, category);

-- Platform statistics cache
CREATE TABLE IF NOT EXISTS platform_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_key TEXT NOT NULL UNIQUE,
    stat_value TEXT NOT NULL, -- JSON for complex values
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Webhooks for partner integrations
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret_hash TEXT NOT NULL, -- For HMAC verification
    events TEXT NOT NULL DEFAULT '[]', -- JSON array of subscribed events
    is_active INTEGER DEFAULT 1,
    last_triggered_at DATETIME,
    failure_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON
    status_code INTEGER,
    response_body TEXT,
    delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type);

-- ============================================
-- Insert badge definitions
-- ============================================

INSERT OR IGNORE INTO platform_stats (stat_key, stat_value) VALUES
('badge_definitions', '[
    {"id": "first_report", "name": "First Report", "description": "Submitted your first incident report", "icon": "flag", "points": 10},
    {"id": "verified_5", "name": "Trusted Reporter", "description": "5 reports verified by moderators", "icon": "check-circle", "points": 50},
    {"id": "verified_20", "name": "Community Guardian", "description": "20 reports verified", "icon": "shield", "points": 100},
    {"id": "verified_50", "name": "Environmental Champion", "description": "50 verified reports", "icon": "award", "points": 250},
    {"id": "enforcement_1", "name": "Justice Seeker", "description": "Report led to enforcement action", "icon": "gavel", "points": 100},
    {"id": "enforcement_5", "name": "Law Enforcer", "description": "5 reports led to enforcement", "icon": "shield-check", "points": 500},
    {"id": "water_guardian", "name": "Water Guardian", "description": "Reported 10 water pollution incidents", "icon": "droplet", "points": 75},
    {"id": "forest_protector", "name": "Forest Protector", "description": "Reported 10 deforestation incidents", "icon": "tree-pine", "points": 75},
    {"id": "early_bird", "name": "Early Bird", "description": "Submitted report within 24h of activity", "icon": "clock", "points": 25},
    {"id": "photo_evidence", "name": "Photo Journalist", "description": "Uploaded 50 pieces of evidence", "icon": "camera", "points": 50},
    {"id": "voice_reporter", "name": "Voice Reporter", "description": "Used voice input for 10 reports", "icon": "mic", "points": 30},
    {"id": "regional_expert", "name": "Regional Expert", "description": "Top reporter in your region for a month", "icon": "map-pin", "points": 100},
    {"id": "streak_7", "name": "Dedicated Watcher", "description": "Reported incidents 7 days in a row", "icon": "flame", "points": 50},
    {"id": "streak_30", "name": "Vigilant Guardian", "description": "Active for 30 consecutive days", "icon": "flame", "points": 150}
]');

-- Insert outcome impact weights
INSERT OR IGNORE INTO platform_stats (stat_key, stat_value) VALUES
('outcome_weights', '{
    "investigation_opened": 1.0,
    "site_visit_conducted": 2.0,
    "warning_issued": 2.5,
    "equipment_seized": 4.0,
    "site_closed": 5.0,
    "arrests_made": 5.0,
    "remediation_started": 6.0,
    "remediation_completed": 8.0,
    "case_dismissed": 0
}');

-- Insert guardian rank thresholds
INSERT OR IGNORE INTO platform_stats (stat_key, stat_value) VALUES
('guardian_ranks', '{
    "observer": {"min_verified": 0, "min_points": 0, "benefits": ["Basic reporting"]},
    "bronze": {"min_verified": 5, "min_points": 50, "benefits": ["Priority support", "Bronze badge"]},
    "silver": {"min_verified": 20, "min_points": 200, "benefits": ["Monthly recognition", "Direct moderator contact"]},
    "gold": {"min_verified": 50, "min_points": 500, "benefits": ["EPA contact line", "Featured reporter status"]},
    "diamond": {"min_verified": 100, "min_points": 1000, "benefits": ["Official partnership", "Training opportunities", "Advisory role"]}
}');
