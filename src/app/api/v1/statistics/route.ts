/**
 * Public API v1 - Statistics
 * GET /api/v1/statistics - Get platform statistics
 */

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import {
  validateApiKey,
  apiSuccess,
  apiError,
  logApiRequest,
  addCorsHeaders,
} from '@/lib/api-utils';

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const url = new URL(request.url);

    // Validate API key
    const authHeader = request.headers.get('Authorization');
    const validation = await validateApiKey(db, authHeader);

    if (!validation.valid) {
      const response = apiError(validation.error!, 401);
      return addCorsHeaders(response, validation.apiKey?.allowed_origins);
    }

    // Parse optional region filter
    const region = url.searchParams.get('region');

    // Build region condition
    const regionCondition = region ? 'AND region = ?' : '';
    const regionParams = region ? [region] : [];

    // Get incident statistics
    const incidentStats = await db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'investigating' THEN 1 ELSE 0 END) as investigating,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
         FROM incidents
         WHERE 1=1 ${regionCondition}`
      )
      .bind(...regionParams)
      .first() as Record<string, number> | null;

    // Get water quality statistics
    const waterStats = await db
      .prepare(
        `SELECT
          COUNT(*) as total_readings,
          COUNT(DISTINCT water_body_name) as water_bodies,
          SUM(CASE WHEN quality_status = 'safe' THEN 1 ELSE 0 END) as safe,
          SUM(CASE WHEN quality_status = 'moderate' THEN 1 ELSE 0 END) as moderate,
          SUM(CASE WHEN quality_status = 'polluted' THEN 1 ELSE 0 END) as polluted,
          SUM(CASE WHEN quality_status = 'hazardous' THEN 1 ELSE 0 END) as hazardous,
          AVG(ph_level) as avg_ph,
          AVG(turbidity_ntu) as avg_turbidity,
          AVG(mercury_level_ppb) as avg_mercury
         FROM water_quality
         WHERE 1=1 ${regionCondition}`
      )
      .bind(...regionParams)
      .first() as Record<string, number> | null;

    // Get mining sites statistics
    const siteStats = await db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN status = 'remediated' THEN 1 ELSE 0 END) as remediated,
          SUM(estimated_area_hectares) as total_area_hectares
         FROM mining_sites
         WHERE 1=1 ${regionCondition}`
      )
      .bind(...regionParams)
      .first() as Record<string, number> | null;

    // Get incidents by type
    const incidentsByType = await db
      .prepare(
        `SELECT incident_type as type, COUNT(*) as count
         FROM incidents
         WHERE 1=1 ${regionCondition}
         GROUP BY incident_type`
      )
      .bind(...regionParams)
      .all();

    // Get incidents by region (if not filtered)
    let incidentsByRegionResults: unknown[] = [];
    if (!region) {
      const incidentsByRegionResult = await db
        .prepare(
          `SELECT region, COUNT(*) as count
           FROM incidents
           GROUP BY region
           ORDER BY count DESC`
        )
        .all();
      incidentsByRegionResults = incidentsByRegionResult.results || [];
    }

    // Get outcome statistics
    const outcomeStats = await db
      .prepare(
        `SELECT
          COUNT(*) as total_outcomes,
          SUM(CASE WHEN outcome_type = 'investigation_opened' THEN 1 ELSE 0 END) as investigations,
          SUM(CASE WHEN outcome_type = 'site_closed' THEN 1 ELSE 0 END) as sites_closed,
          SUM(CASE WHEN outcome_type = 'equipment_seized' THEN 1 ELSE 0 END) as equipment_seized,
          SUM(CASE WHEN outcome_type = 'arrests_made' THEN 1 ELSE 0 END) as arrests,
          SUM(CASE WHEN outcome_type = 'remediation_started' THEN 1 ELSE 0 END) as remediations_started,
          SUM(CASE WHEN outcome_type = 'remediation_completed' THEN 1 ELSE 0 END) as remediations_completed
         FROM incident_outcomes io
         JOIN incidents i ON io.incident_id = i.id
         WHERE io.verified = 1 ${regionCondition.replace('AND', 'AND i.')}`
      )
      .bind(...regionParams)
      .first() as Record<string, number> | null;

    // Get monthly trends (last 12 months)
    const monthlyTrends = await db
      .prepare(
        `SELECT
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as incidents,
          SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified
         FROM incidents
         WHERE created_at >= DATE('now', '-12 months') ${regionCondition}
         GROUP BY strftime('%Y-%m', created_at)
         ORDER BY month`
      )
      .bind(...regionParams)
      .all();

    // Log request
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      db,
      validation.apiKey!.id,
      '/api/v1/statistics',
      'GET',
      200,
      responseTime,
      request.headers.get('CF-Connecting-IP') || undefined,
      request.headers.get('User-Agent') || undefined
    );

    const response = apiSuccess({
      region: region || 'all',
      incidents: {
        total: incidentStats?.total || 0,
        active: incidentStats?.active || 0,
        investigating: incidentStats?.investigating || 0,
        resolved: incidentStats?.resolved || 0,
        verified: incidentStats?.verified || 0,
        by_severity: {
          critical: incidentStats?.critical || 0,
          high: incidentStats?.high || 0,
          medium: incidentStats?.medium || 0,
          low: incidentStats?.low || 0,
        },
        by_type: incidentsByType.results || [],
        by_region: incidentsByRegionResults,
      },
      water_quality: {
        total_readings: waterStats?.total_readings || 0,
        water_bodies_monitored: waterStats?.water_bodies || 0,
        by_status: {
          safe: waterStats?.safe || 0,
          moderate: waterStats?.moderate || 0,
          polluted: waterStats?.polluted || 0,
          hazardous: waterStats?.hazardous || 0,
        },
        averages: {
          ph: waterStats?.avg_ph ? Math.round((waterStats.avg_ph as number) * 100) / 100 : null,
          turbidity_ntu: waterStats?.avg_turbidity ? Math.round((waterStats.avg_turbidity as number) * 100) / 100 : null,
          mercury_ppb: waterStats?.avg_mercury ? Math.round((waterStats.avg_mercury as number) * 100) / 100 : null,
        },
      },
      mining_sites: {
        total: siteStats?.total || 0,
        active: siteStats?.active || 0,
        inactive: siteStats?.inactive || 0,
        remediated: siteStats?.remediated || 0,
        total_area_hectares: siteStats?.total_area_hectares || 0,
      },
      outcomes: {
        total: outcomeStats?.total_outcomes || 0,
        investigations_opened: outcomeStats?.investigations || 0,
        sites_closed: outcomeStats?.sites_closed || 0,
        equipment_seized: outcomeStats?.equipment_seized || 0,
        arrests_made: outcomeStats?.arrests || 0,
        remediations_started: outcomeStats?.remediations_started || 0,
        remediations_completed: outcomeStats?.remediations_completed || 0,
      },
      trends: {
        monthly: monthlyTrends.results || [],
      },
      meta: {
        rate_limit_remaining: validation.rateLimitRemaining,
      },
    });

    return addCorsHeaders(response, validation.apiKey?.allowed_origins);
  } catch (error) {
    console.error('API v1 statistics error:', error);

    const response = apiError('Internal server error', 500);
    return addCorsHeaders(response);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 204 }));
}
