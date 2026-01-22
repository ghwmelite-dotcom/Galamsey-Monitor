#!/usr/bin/env node

/**
 * D1 Data Import Script
 *
 * This script imports data from JSON exports into the D1 database.
 * Run this after:
 * 1. Exporting data from SQLite: sqlite3 data/galamsey.db -json "SELECT * FROM table" > exports/table.json
 * 2. Creating the D1 database: wrangler d1 create galamsey-db
 * 3. Pushing the schema: wrangler d1 execute galamsey-db --file=./scripts/d1-schema.sql
 *
 * Usage:
 *   node scripts/d1-import.js [--local]
 *
 * Options:
 *   --local  Import to local D1 database (for testing)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');
const isLocal = process.argv.includes('--local');
const localFlag = isLocal ? '--local' : '';

// Tables to import in order (respecting foreign key constraints)
const TABLES = [
  'users',
  'sessions',
  'accounts',
  'verification_tokens',
  'incidents',
  'water_quality',
  'mining_sites',
  'notifications',
  'alert_subscriptions',
  'evidence',
  'incident_updates',
  'email_queue',
  'sms_queue',
];

// Column mappings for each table (to handle any differences between SQLite and D1)
const COLUMN_MAPS = {
  incidents: {
    columns: [
      'id', 'title', 'description', 'latitude', 'longitude', 'region', 'district',
      'reported_by', 'contact_phone', 'status', 'severity', 'incident_type',
      'evidence_urls', 'verification_status', 'verified_by', 'verified_at',
      'admin_notes', 'priority_score', 'assigned_to', 'created_at', 'updated_at'
    ]
  },
  water_quality: {
    columns: [
      'id', 'water_body_name', 'latitude', 'longitude', 'region', 'ph_level',
      'turbidity_ntu', 'mercury_level_ppb', 'arsenic_level_ppb', 'lead_level_ppb',
      'dissolved_oxygen_mgl', 'quality_status', 'notes', 'measured_by',
      'measured_at', 'created_at'
    ]
  },
  mining_sites: {
    columns: [
      'id', 'name', 'latitude', 'longitude', 'region', 'district',
      'estimated_area_hectares', 'first_detected', 'last_activity_detected',
      'status', 'satellite_image_url', 'notes', 'created_at', 'updated_at'
    ]
  },
  users: {
    columns: [
      'id', 'email', 'password_hash', 'name', 'role', 'organization', 'phone',
      'region', 'avatar_url', 'verified', 'email_verified', 'created_at', 'updated_at'
    ]
  },
  sessions: {
    columns: ['id', 'session_token', 'user_id', 'expires_at', 'created_at']
  },
  accounts: {
    columns: [
      'id', 'user_id', 'type', 'provider', 'provider_account_id', 'refresh_token',
      'access_token', 'expires_at', 'token_type', 'scope', 'id_token',
      'session_state', 'created_at'
    ]
  },
  verification_tokens: {
    columns: ['identifier', 'token', 'expires']
  },
  notifications: {
    columns: [
      'id', 'user_id', 'type', 'title', 'message', 'link', 'read',
      'email_sent', 'sms_sent', 'created_at'
    ]
  },
  alert_subscriptions: {
    columns: [
      'id', 'user_id', 'region', 'incident_types', 'severity_threshold',
      'email_enabled', 'sms_enabled', 'push_enabled', 'weekly_digest',
      'created_at', 'updated_at'
    ]
  },
  evidence: {
    columns: [
      'id', 'incident_id', 'file_url', 'file_type', 'file_name', 'file_size',
      'thumbnail_url', 'uploaded_by', 'description', 'created_at'
    ]
  },
  incident_updates: {
    columns: [
      'id', 'incident_id', 'user_id', 'update_type', 'old_value', 'new_value',
      'notes', 'created_at'
    ]
  },
  email_queue: {
    columns: [
      'id', 'to_email', 'to_name', 'subject', 'html_body', 'text_body',
      'status', 'attempts', 'last_attempt_at', 'sent_at', 'error_message', 'created_at'
    ]
  },
  sms_queue: {
    columns: [
      'id', 'to_phone', 'message', 'status', 'attempts', 'last_attempt_at',
      'sent_at', 'twilio_sid', 'error_message', 'created_at'
    ]
  },
};

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  // Escape single quotes by doubling them
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

function generateInsertStatements(tableName, data, columns) {
  const statements = [];

  for (const row of data) {
    const values = columns.map(col => escapeValue(row[col]));
    const sql = `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
    statements.push(sql);
  }

  return statements;
}

async function importTable(tableName) {
  const jsonPath = path.join(EXPORTS_DIR, `${tableName}.json`);

  if (!fs.existsSync(jsonPath)) {
    console.log(`Skipping ${tableName}: No export file found at ${jsonPath}`);
    return;
  }

  console.log(`Importing ${tableName}...`);

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  No data to import for ${tableName}`);
      return;
    }

    const columns = COLUMN_MAPS[tableName]?.columns || Object.keys(data[0]);
    const statements = generateInsertStatements(tableName, data, columns);

    // Write to temp SQL file
    const tempSqlPath = path.join(__dirname, `temp_${tableName}.sql`);
    fs.writeFileSync(tempSqlPath, statements.join('\n'));

    // Execute using wrangler
    const cmd = `wrangler d1 execute galamsey-db ${localFlag} --file="${tempSqlPath}"`;
    execSync(cmd, { stdio: 'inherit' });

    // Clean up temp file
    fs.unlinkSync(tempSqlPath);

    console.log(`  Imported ${data.length} rows into ${tableName}`);
  } catch (error) {
    console.error(`  Error importing ${tableName}:`, error.message);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('D1 Data Import Script');
  console.log('='.repeat(50));
  console.log(`Mode: ${isLocal ? 'Local' : 'Remote'}`);
  console.log('');

  // Check if exports directory exists
  if (!fs.existsSync(EXPORTS_DIR)) {
    console.log(`Creating exports directory at ${EXPORTS_DIR}`);
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    console.log('');
    console.log('To export data from SQLite, run:');
    console.log('');
    for (const table of TABLES) {
      console.log(`  sqlite3 data/galamsey.db -json "SELECT * FROM ${table}" > exports/${table}.json`);
    }
    console.log('');
    console.log('Then run this script again.');
    return;
  }

  // Import each table
  for (const table of TABLES) {
    await importTable(table);
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('Import complete!');
  console.log('='.repeat(50));
}

main().catch(console.error);
