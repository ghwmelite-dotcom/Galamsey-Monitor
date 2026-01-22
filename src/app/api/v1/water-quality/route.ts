/**
 * Public API v1 - Water Quality
 * GET /api/v1/water-quality - List water quality readings
 */

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import {
  validateApiKey,
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
    const qualityStatus = url.searchParams.get('quality_status');
    const waterBody = url.searchParams.get('water_body');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Build query
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (region) {
      conditions.push('region = ?');
      params.push(region);
    }
    if (qualityStatus) {
      conditions.push('quality_status = ?');
      params.push(qualityStatus);
    }
    if (waterBody) {
      conditions.push('water_body_name LIKE ?');
      params.push(`%${waterBody}%`);
    }
    if (startDate) {
      conditions.push('measured_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('measured_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM water_quality ${whereClause}`)
      .bind(...params)
      .first() as { total: number } | null;

    const total = countResult?.total || 0;

    // Get readings
    const readingsResult = await db
      .prepare(
        `SELECT
          id, water_body_name, latitude, longitude, region,
          ph_level, turbidity_ntu, mercury_level_ppb, arsenic_level_ppb,
          lead_level_ppb, dissolved_oxygen_mgl, quality_status,
          notes, measured_at, created_at
         FROM water_quality
         ${whereClause}
         ORDER BY measured_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    const readings = readingsResult.results || [];

    // Log request
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      db,
      validation.apiKey!.id,
      '/api/v1/water-quality',
      'GET',
      200,
      responseTime,
      request.headers.get('CF-Connecting-IP') || undefined,
      request.headers.get('User-Agent') || undefined
    );

    const response = apiPaginated(
      readings,
      total,
      page,
      limit,
      validation.rateLimitRemaining
    );

    return addCorsHeaders(response, validation.apiKey?.allowed_origins);
  } catch (error) {
    console.error('API v1 water quality error:', error);

    const response = apiError('Internal server error', 500);
    return addCorsHeaders(response);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 204 }));
}
