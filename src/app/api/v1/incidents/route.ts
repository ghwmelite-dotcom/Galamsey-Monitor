/**
 * Public API v1 - Incidents
 * GET /api/v1/incidents - List incidents with filtering and pagination
 */

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import {
  validateApiKey,
  apiSuccess,
  apiError,
  apiPaginated,
  parsePaginationParams,
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

    // Parse pagination
    const { page, limit, offset } = parsePaginationParams(url);

    // Parse filters
    const region = url.searchParams.get('region');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const incidentType = url.searchParams.get('type');
    const verificationStatus = url.searchParams.get('verification_status');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Build query
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (region) {
      conditions.push('region = ?');
      params.push(region);
    }
    if (severity) {
      conditions.push('severity = ?');
      params.push(severity);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (incidentType) {
      conditions.push('incident_type = ?');
      params.push(incidentType);
    }
    if (verificationStatus) {
      conditions.push('verification_status = ?');
      params.push(verificationStatus);
    }
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM incidents ${whereClause}`)
      .bind(...params)
      .first() as { total: number } | null;

    const total = countResult?.total || 0;

    // Get incidents
    const incidentsResult = await db
      .prepare(
        `SELECT
          id, title, description, latitude, longitude, region, district,
          status, severity, incident_type, verification_status,
          created_at, updated_at
         FROM incidents
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    const incidents = incidentsResult.results || [];

    // Log request
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      db,
      validation.apiKey!.id,
      '/api/v1/incidents',
      'GET',
      200,
      responseTime,
      request.headers.get('CF-Connecting-IP') || undefined,
      request.headers.get('User-Agent') || undefined
    );

    const response = apiPaginated(
      incidents,
      total,
      page,
      limit,
      validation.rateLimitRemaining
    );

    return addCorsHeaders(response, validation.apiKey?.allowed_origins);
  } catch (error) {
    console.error('API v1 incidents error:', error);

    const response = apiError('Internal server error', 500);
    return addCorsHeaders(response);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 204 }));
}
