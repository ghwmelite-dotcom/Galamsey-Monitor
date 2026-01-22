import { getRequestContext } from '@cloudflare/next-on-pages';
import type {
  Incident,
  IncidentInput,
  WaterQualityReading,
  WaterQualityInput,
  MiningSite,
  MiningSiteInput,
  DashboardStats,
  Notification,
  NotificationInput,
  AlertSubscription,
  AlertSubscriptionInput,
  Evidence,
  EvidenceInput,
  IncidentUpdate,
  IncidentUpdateInput,
  VerificationStatus,
  SearchResult
} from '@/types';

// Helper to get the D1 database binding
function getDb(): D1Database {
  const { env } = getRequestContext();
  return env.DB;
}

// ============================================
// Incident functions
// ============================================

export async function getAllIncidents(): Promise<Incident[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all<Incident>();
  return result.results ?? [];
}

export async function getIncidentById(id: number): Promise<Incident | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM incidents WHERE id = ?').bind(id).first<Incident>();
  return result;
}

export async function getIncidentsByRegion(region: string): Promise<Incident[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM incidents WHERE region = ? ORDER BY created_at DESC').bind(region).all<Incident>();
  return result.results ?? [];
}

export async function getIncidentsByStatus(status: string): Promise<Incident[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM incidents WHERE status = ? ORDER BY created_at DESC').bind(status).all<Incident>();
  return result.results ?? [];
}

export async function createIncident(input: IncidentInput): Promise<Incident> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO incidents (title, description, latitude, longitude, region, district,
      reported_by, contact_phone, severity, incident_type, evidence_urls, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    RETURNING *
  `).bind(
    input.title,
    input.description,
    input.latitude,
    input.longitude,
    input.region,
    input.district,
    input.reported_by,
    input.contact_phone || null,
    input.severity,
    input.incident_type,
    input.evidence_urls || null
  ).first<Incident>();

  return result!;
}

export async function updateIncidentStatus(id: number, status: Incident['status']): Promise<Incident | null> {
  const db = getDb();
  const result = await db.prepare(`
    UPDATE incidents SET status = ?, updated_at = datetime('now') WHERE id = ?
    RETURNING *
  `).bind(status, id).first<Incident>();
  return result;
}

// ============================================
// Water Quality functions
// ============================================

export async function getAllWaterReadings(): Promise<WaterQualityReading[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM water_quality ORDER BY measured_at DESC').all<WaterQualityReading>();
  return result.results ?? [];
}

export async function getWaterReadingById(id: number): Promise<WaterQualityReading | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM water_quality WHERE id = ?').bind(id).first<WaterQualityReading>();
  return result;
}

export async function getWaterReadingsByWaterBody(waterBodyName: string): Promise<WaterQualityReading[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM water_quality WHERE water_body_name = ? ORDER BY measured_at DESC').bind(waterBodyName).all<WaterQualityReading>();
  return result.results ?? [];
}

export async function createWaterReading(input: WaterQualityInput): Promise<WaterQualityReading> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO water_quality (water_body_name, latitude, longitude, region,
      ph_level, turbidity_ntu, mercury_level_ppb, arsenic_level_ppb, lead_level_ppb,
      dissolved_oxygen_mgl, quality_status, notes, measured_by, measured_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    RETURNING *
  `).bind(
    input.water_body_name,
    input.latitude,
    input.longitude,
    input.region,
    input.ph_level || null,
    input.turbidity_ntu || null,
    input.mercury_level_ppb || null,
    input.arsenic_level_ppb || null,
    input.lead_level_ppb || null,
    input.dissolved_oxygen_mgl || null,
    input.quality_status,
    input.notes || null,
    input.measured_by
  ).first<WaterQualityReading>();

  return result!;
}

// ============================================
// Mining Site functions
// ============================================

export async function getAllMiningSites(): Promise<MiningSite[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM mining_sites ORDER BY created_at DESC').all<MiningSite>();
  return result.results ?? [];
}

export async function getMiningSiteById(id: number): Promise<MiningSite | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM mining_sites WHERE id = ?').bind(id).first<MiningSite>();
  return result;
}

export async function getActiveMiningSites(): Promise<MiningSite[]> {
  const db = getDb();
  const result = await db.prepare("SELECT * FROM mining_sites WHERE status = 'active' ORDER BY created_at DESC").all<MiningSite>();
  return result.results ?? [];
}

export async function createMiningSite(input: MiningSiteInput): Promise<MiningSite> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO mining_sites (name, latitude, longitude, region, district,
      estimated_area_hectares, status, satellite_image_url, notes, first_detected)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    RETURNING *
  `).bind(
    input.name,
    input.latitude,
    input.longitude,
    input.region,
    input.district,
    input.estimated_area_hectares || null,
    input.status,
    input.satellite_image_url || null,
    input.notes || null
  ).first<MiningSite>();

  return result!;
}

export async function updateMiningSiteStatus(id: number, status: MiningSite['status']): Promise<MiningSite | null> {
  const db = getDb();
  const result = await db.prepare(`
    UPDATE mining_sites SET status = ?, updated_at = datetime('now') WHERE id = ?
    RETURNING *
  `).bind(status, id).first<MiningSite>();
  return result;
}

// ============================================
// Dashboard Statistics
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();

  // Use batch to run all queries in parallel for better performance
  const [
    totalIncidentsResult,
    activeIncidentsResult,
    affectedWaterBodiesResult,
    pollutedWaterBodiesResult,
    totalMiningSitesResult,
    activeMiningSitesResult,
    incidentsByRegionResult,
    incidentsByTypeResult,
    waterQualityTrendResult,
    recentIncidentsResult,
  ] = await db.batch([
    db.prepare('SELECT COUNT(*) as count FROM incidents'),
    db.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'active'"),
    db.prepare('SELECT COUNT(DISTINCT water_body_name) as count FROM water_quality'),
    db.prepare("SELECT COUNT(DISTINCT water_body_name) as count FROM water_quality WHERE quality_status IN ('polluted', 'hazardous')"),
    db.prepare('SELECT COUNT(*) as count FROM mining_sites'),
    db.prepare("SELECT COUNT(*) as count FROM mining_sites WHERE status = 'active'"),
    db.prepare('SELECT region, COUNT(*) as count FROM incidents GROUP BY region ORDER BY count DESC'),
    db.prepare('SELECT incident_type as type, COUNT(*) as count FROM incidents GROUP BY incident_type ORDER BY count DESC'),
    db.prepare(`
      SELECT
        DATE(measured_at) as date,
        SUM(CASE WHEN quality_status = 'safe' THEN 1 ELSE 0 END) as safe,
        SUM(CASE WHEN quality_status IN ('polluted', 'hazardous') THEN 1 ELSE 0 END) as polluted
      FROM water_quality
      WHERE measured_at >= DATE('now', '-30 days')
      GROUP BY DATE(measured_at)
      ORDER BY date ASC
    `),
    db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 5'),
  ]);

  const totalIncidents = (totalIncidentsResult.results?.[0] as { count: number })?.count ?? 0;
  const activeIncidents = (activeIncidentsResult.results?.[0] as { count: number })?.count ?? 0;
  const affectedWaterBodies = (affectedWaterBodiesResult.results?.[0] as { count: number })?.count ?? 0;
  const pollutedWaterBodies = (pollutedWaterBodiesResult.results?.[0] as { count: number })?.count ?? 0;
  const totalMiningSites = (totalMiningSitesResult.results?.[0] as { count: number })?.count ?? 0;
  const activeMiningSites = (activeMiningSitesResult.results?.[0] as { count: number })?.count ?? 0;
  const incidentsByRegion = (incidentsByRegionResult.results ?? []) as { region: string; count: number }[];
  const incidentsByType = (incidentsByTypeResult.results ?? []) as { type: string; count: number }[];
  const waterQualityTrend = (waterQualityTrendResult.results ?? []) as { date: string; safe: number; polluted: number }[];
  const recentIncidents = (recentIncidentsResult.results ?? []) as Incident[];

  return {
    totalIncidents,
    activeIncidents,
    affectedWaterBodies,
    pollutedWaterBodies,
    totalMiningSites,
    activeMiningSites,
    incidentsByRegion,
    incidentsByType,
    waterQualityTrend,
    recentIncidents,
  };
}

// ============================================
// Notification functions
// ============================================

export async function createNotification(input: NotificationInput): Promise<Notification> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    input.user_id,
    input.type,
    input.title,
    input.message,
    input.link || null
  ).first<Notification>();

  return result!;
}

export async function getNotificationById(id: number): Promise<Notification | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first<Notification>();
  return result;
}

export async function getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').bind(userId, limit).all<Notification>();
  return result.results ?? [];
}

export async function getUnreadNotifications(userId: number): Promise<Notification[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC').bind(userId).all<Notification>();
  return result.results ?? [];
}

export async function markNotificationRead(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function markAllNotificationsRead(userId: number): Promise<number> {
  const db = getDb();
  const result = await db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').bind(userId).run();
  return result.meta.changes;
}

export async function deleteNotification(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

// ============================================
// Alert Subscription functions
// ============================================

export async function createAlertSubscription(input: AlertSubscriptionInput): Promise<AlertSubscription> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO alert_subscriptions (user_id, region, incident_types, severity_threshold, email_enabled, sms_enabled, push_enabled, weekly_digest)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    input.user_id,
    input.region || null,
    input.incident_types ? JSON.stringify(input.incident_types) : null,
    input.severity_threshold || 'medium',
    input.email_enabled !== false ? 1 : 0,
    input.sms_enabled ? 1 : 0,
    input.push_enabled !== false ? 1 : 0,
    input.weekly_digest !== false ? 1 : 0
  ).first<AlertSubscription>();

  return result!;
}

export async function getAlertSubscriptionById(id: number): Promise<AlertSubscription | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM alert_subscriptions WHERE id = ?').bind(id).first<AlertSubscription>();
  return result;
}

export async function getUserAlertSubscriptions(userId: number): Promise<AlertSubscription[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM alert_subscriptions WHERE user_id = ?').bind(userId).all<AlertSubscription>();
  return result.results ?? [];
}

export async function getSubscriptionsByRegion(region: string): Promise<AlertSubscription[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM alert_subscriptions WHERE region = ? OR region IS NULL').bind(region).all<AlertSubscription>();
  return result.results ?? [];
}

export async function updateAlertSubscription(id: number, updates: Partial<AlertSubscriptionInput>): Promise<AlertSubscription | null> {
  const current = await getAlertSubscriptionById(id);
  if (!current) return null;

  const db = getDb();
  const result = await db.prepare(`
    UPDATE alert_subscriptions SET
      region = ?,
      incident_types = ?,
      severity_threshold = ?,
      email_enabled = ?,
      sms_enabled = ?,
      push_enabled = ?,
      weekly_digest = ?,
      updated_at = datetime('now')
    WHERE id = ?
    RETURNING *
  `).bind(
    updates.region !== undefined ? updates.region : current.region,
    updates.incident_types ? JSON.stringify(updates.incident_types) : current.incident_types,
    updates.severity_threshold || current.severity_threshold,
    updates.email_enabled !== undefined ? (updates.email_enabled ? 1 : 0) : current.email_enabled,
    updates.sms_enabled !== undefined ? (updates.sms_enabled ? 1 : 0) : current.sms_enabled,
    updates.push_enabled !== undefined ? (updates.push_enabled ? 1 : 0) : current.push_enabled,
    updates.weekly_digest !== undefined ? (updates.weekly_digest ? 1 : 0) : current.weekly_digest,
    id
  ).first<AlertSubscription>();

  return result;
}

export async function deleteAlertSubscription(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM alert_subscriptions WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

// ============================================
// Evidence functions
// ============================================

export async function createEvidence(input: EvidenceInput): Promise<Evidence> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO evidence (incident_id, file_url, file_type, file_name, file_size, thumbnail_url, uploaded_by, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    input.incident_id,
    input.file_url,
    input.file_type,
    input.file_name,
    input.file_size || null,
    input.thumbnail_url || null,
    input.uploaded_by || null,
    input.description || null
  ).first<Evidence>();

  return result!;
}

export async function getEvidenceById(id: number): Promise<Evidence | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM evidence WHERE id = ?').bind(id).first<Evidence>();
  return result;
}

export async function getIncidentEvidence(incidentId: number): Promise<Evidence[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM evidence WHERE incident_id = ? ORDER BY created_at DESC').bind(incidentId).all<Evidence>();
  return result.results ?? [];
}

export async function deleteEvidence(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM evidence WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

// ============================================
// Incident Update functions
// ============================================

export async function createIncidentUpdate(input: IncidentUpdateInput): Promise<IncidentUpdate> {
  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO incident_updates (incident_id, user_id, update_type, old_value, new_value, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    input.incident_id,
    input.user_id || null,
    input.update_type,
    input.old_value || null,
    input.new_value || null,
    input.notes || null
  ).first<IncidentUpdate>();

  return result!;
}

export async function getIncidentUpdateById(id: number): Promise<IncidentUpdate | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM incident_updates WHERE id = ?').bind(id).first<IncidentUpdate>();
  return result;
}

export async function getIncidentUpdates(incidentId: number): Promise<IncidentUpdate[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY created_at ASC').bind(incidentId).all<IncidentUpdate>();
  return result.results ?? [];
}

// ============================================
// Incident verification functions
// ============================================

export async function updateIncidentVerification(
  id: number,
  status: VerificationStatus,
  verifiedBy: number,
  notes?: string
): Promise<Incident | null> {
  const incident = await getIncidentById(id);
  if (!incident) return null;

  // Create update record
  await createIncidentUpdate({
    incident_id: id,
    user_id: verifiedBy,
    update_type: 'verification',
    old_value: incident.verification_status,
    new_value: status,
    notes,
  });

  const db = getDb();
  const result = await db.prepare(`
    UPDATE incidents SET
      verification_status = ?,
      verified_by = ?,
      verified_at = datetime('now'),
      admin_notes = COALESCE(?, admin_notes),
      updated_at = datetime('now')
    WHERE id = ?
    RETURNING *
  `).bind(status, verifiedBy, notes || null, id).first<Incident>();

  return result;
}

export async function assignIncident(id: number, assignedTo: number, assignedBy: number): Promise<Incident | null> {
  const incident = await getIncidentById(id);
  if (!incident) return null;

  await createIncidentUpdate({
    incident_id: id,
    user_id: assignedBy,
    update_type: 'assignment',
    old_value: incident.assigned_to?.toString(),
    new_value: assignedTo.toString(),
  });

  const db = getDb();
  const result = await db.prepare(`
    UPDATE incidents SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?
    RETURNING *
  `).bind(assignedTo, id).first<Incident>();

  return result;
}

export async function updateIncidentPriority(id: number, priorityScore: number, updatedBy: number): Promise<Incident | null> {
  const incident = await getIncidentById(id);
  if (!incident) return null;

  await createIncidentUpdate({
    incident_id: id,
    user_id: updatedBy,
    update_type: 'priority_change',
    old_value: incident.priority_score?.toString(),
    new_value: priorityScore.toString(),
  });

  const db = getDb();
  const result = await db.prepare(`
    UPDATE incidents SET priority_score = ?, updated_at = datetime('now') WHERE id = ?
    RETURNING *
  `).bind(priorityScore, id).first<Incident>();

  return result;
}

export async function addIncidentNote(id: number, userId: number, note: string): Promise<IncidentUpdate> {
  return createIncidentUpdate({
    incident_id: id,
    user_id: userId,
    update_type: 'note',
    notes: note,
  });
}

// ============================================
// Search functions
// ============================================

export async function searchIncidents(query: string, limit: number = 20): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`;
  const db = getDb();
  const result = await db.prepare(`
    SELECT
      'incident' as type,
      id,
      title,
      description,
      region,
      latitude,
      longitude,
      CASE
        WHEN title LIKE ? THEN 3
        WHEN description LIKE ? THEN 2
        ELSE 1
      END as relevance
    FROM incidents
    WHERE title LIKE ? OR description LIKE ? OR region LIKE ? OR district LIKE ?
    ORDER BY relevance DESC, created_at DESC
    LIMIT ?
  `).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit).all<SearchResult>();

  return result.results ?? [];
}

export async function searchWaterBodies(query: string, limit: number = 20): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`;
  const db = getDb();
  const result = await db.prepare(`
    SELECT
      'water' as type,
      id,
      water_body_name as title,
      COALESCE(notes, 'Water quality reading') as description,
      region,
      latitude,
      longitude,
      CASE
        WHEN water_body_name LIKE ? THEN 3
        WHEN region LIKE ? THEN 2
        ELSE 1
      END as relevance
    FROM water_quality
    WHERE water_body_name LIKE ? OR region LIKE ? OR notes LIKE ?
    ORDER BY relevance DESC, measured_at DESC
    LIMIT ?
  `).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit).all<SearchResult>();

  return result.results ?? [];
}

export async function searchMiningSites(query: string, limit: number = 20): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`;
  const db = getDb();
  const result = await db.prepare(`
    SELECT
      'site' as type,
      id,
      name as title,
      COALESCE(notes, 'Mining site') as description,
      region,
      latitude,
      longitude,
      CASE
        WHEN name LIKE ? THEN 3
        WHEN region LIKE ? THEN 2
        ELSE 1
      END as relevance
    FROM mining_sites
    WHERE name LIKE ? OR region LIKE ? OR district LIKE ? OR notes LIKE ?
    ORDER BY relevance DESC, created_at DESC
    LIMIT ?
  `).bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit).all<SearchResult>();

  return result.results ?? [];
}

export async function globalSearch(query: string, limit: number = 30): Promise<SearchResult[]> {
  // Run all searches in parallel
  const [incidents, waterBodies, sites] = await Promise.all([
    searchIncidents(query, limit),
    searchWaterBodies(query, limit),
    searchMiningSites(query, limit),
  ]);

  // Combine and sort by relevance
  const results = [...incidents, ...waterBodies, ...sites];
  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, limit);
}

// ============================================
// Admin statistics
// ============================================

export async function getAdminStats(): Promise<{
  totalUsers: number;
  pendingVerifications: number;
  activeIncidents: number;
  hazardousWater: number;
  recentIncidents: Incident[];
  incidentsByStatus: { status: string; count: number }[];
}> {
  const db = getDb();

  // Use batch for better performance
  const [
    totalUsersResult,
    pendingVerificationsResult,
    activeIncidentsResult,
    hazardousWaterResult,
    recentIncidentsResult,
    incidentsByStatusResult,
  ] = await db.batch([
    db.prepare('SELECT COUNT(*) as count FROM users'),
    db.prepare("SELECT COUNT(*) as count FROM incidents WHERE verification_status = 'pending'"),
    db.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'active'"),
    db.prepare("SELECT COUNT(*) as count FROM water_quality WHERE quality_status = 'hazardous'"),
    db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10'),
    db.prepare(`
      SELECT verification_status as status, COUNT(*) as count
      FROM incidents
      GROUP BY verification_status
    `),
  ]);

  return {
    totalUsers: (totalUsersResult.results?.[0] as { count: number })?.count ?? 0,
    pendingVerifications: (pendingVerificationsResult.results?.[0] as { count: number })?.count ?? 0,
    activeIncidents: (activeIncidentsResult.results?.[0] as { count: number })?.count ?? 0,
    hazardousWater: (hazardousWaterResult.results?.[0] as { count: number })?.count ?? 0,
    recentIncidents: (recentIncidentsResult.results ?? []) as Incident[],
    incidentsByStatus: (incidentsByStatusResult.results ?? []) as { status: string; count: number }[],
  };
}

// ============================================
// Get incidents with filters for admin
// ============================================

export async function getFilteredIncidents(filters: {
  status?: string;
  verification_status?: string;
  severity?: string;
  region?: string;
  incident_type?: string;
  assigned_to?: number;
  limit?: number;
  offset?: number;
}): Promise<{ incidents: Incident[]; total: number }> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.verification_status) {
    conditions.push('verification_status = ?');
    params.push(filters.verification_status);
  }
  if (filters.severity) {
    conditions.push('severity = ?');
    params.push(filters.severity);
  }
  if (filters.region) {
    conditions.push('region = ?');
    params.push(filters.region);
  }
  if (filters.incident_type) {
    conditions.push('incident_type = ?');
    params.push(filters.incident_type);
  }
  if (filters.assigned_to) {
    conditions.push('assigned_to = ?');
    params.push(filters.assigned_to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const db = getDb();

  // Get count and data
  const countQuery = `SELECT COUNT(*) as count FROM incidents ${whereClause}`;
  const dataQuery = `SELECT * FROM incidents ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  const countStmt = db.prepare(countQuery);
  const dataStmt = db.prepare(dataQuery);

  // Bind parameters
  params.forEach((param, index) => {
    countStmt.bind(param);
    dataStmt.bind(param);
  });

  const [countResult, dataResult] = await db.batch([
    params.length > 0 ? db.prepare(countQuery).bind(...params) : db.prepare(countQuery),
    params.length > 0 ? db.prepare(dataQuery).bind(...params, limit, offset) : db.prepare(dataQuery).bind(limit, offset),
  ]);

  const total = (countResult.results?.[0] as { count: number })?.count ?? 0;
  const incidents = (dataResult.results ?? []) as Incident[];

  return { incidents, total };
}
