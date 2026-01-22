/**
 * Public API v1 - Single Incident
 * GET /api/v1/incidents/[id] - Get incident by ID
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const { id } = await params;
    const incidentId = parseInt(id);

    if (isNaN(incidentId)) {
      return addCorsHeaders(apiError('Invalid incident ID', 400));
    }

    // Validate API key
    const authHeader = request.headers.get('Authorization');
    const validation = await validateApiKey(db, authHeader);

    if (!validation.valid) {
      const response = apiError(validation.error!, 401);
      return addCorsHeaders(response, validation.apiKey?.allowed_origins);
    }

    // Get incident
    const incident = await db
      .prepare(
        `SELECT
          id, title, description, latitude, longitude, region, district,
          status, severity, incident_type, verification_status,
          created_at, updated_at
         FROM incidents
         WHERE id = ?`
      )
      .bind(incidentId)
      .first();

    if (!incident) {
      const response = apiError('Incident not found', 404);
      return addCorsHeaders(response, validation.apiKey?.allowed_origins);
    }

    // Get evidence (public only)
    const evidenceResult = await db
      .prepare(
        `SELECT id, file_url, file_type, file_name, thumbnail_url, created_at
         FROM evidence
         WHERE incident_id = ?`
      )
      .bind(incidentId)
      .all();

    // Get outcomes
    const outcomesResult = await db
      .prepare(
        `SELECT id, outcome_type, outcome_date, description, verified, impact_score, created_at
         FROM incident_outcomes
         WHERE incident_id = ? AND verified = 1`
      )
      .bind(incidentId)
      .all();

    // Log request
    const responseTime = Date.now() - startTime;
    await logApiRequest(
      db,
      validation.apiKey!.id,
      `/api/v1/incidents/${id}`,
      'GET',
      200,
      responseTime,
      request.headers.get('CF-Connecting-IP') || undefined,
      request.headers.get('User-Agent') || undefined
    );

    const response = apiSuccess({
      incident,
      evidence: evidenceResult.results || [],
      outcomes: outcomesResult.results || [],
    });

    return addCorsHeaders(response, validation.apiKey?.allowed_origins);
  } catch (error) {
    console.error('API v1 incident detail error:', error);

    const response = apiError('Internal server error', 500);
    return addCorsHeaders(response);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 204 }));
}
