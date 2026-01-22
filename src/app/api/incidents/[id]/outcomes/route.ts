/**
 * Incident Outcomes API
 * GET /api/incidents/[id]/outcomes - Get outcomes for an incident
 * POST /api/incidents/[id]/outcomes - Add a new outcome
 */

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionFromRequest } from '@/lib/auth-edge';
import type { OutcomeType } from '@/types';
import { ACTIVITY_POINTS } from '@/lib/guardian';

// Outcome weights for impact calculation
const OUTCOME_WEIGHTS: Record<OutcomeType, number> = {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const { id } = await params;
    const incidentId = parseInt(id);

    if (isNaN(incidentId)) {
      return Response.json({ error: 'Invalid incident ID' }, { status: 400 });
    }

    // Get all outcomes for the incident
    const outcomes = await db
      .prepare(
        `SELECT
          io.*,
          u1.name as reporter_name,
          u2.name as verifier_name
         FROM incident_outcomes io
         LEFT JOIN users u1 ON io.reported_by = u1.id
         LEFT JOIN users u2 ON io.verified_by = u2.id
         WHERE io.incident_id = ?
         ORDER BY io.outcome_date DESC`
      )
      .bind(incidentId)
      .all();

    // Calculate total impact score
    const totalImpact = ((outcomes.results || []) as Record<string, unknown>[]).reduce((sum: number, o) => {
      if (o.verified) {
        return sum + (o.impact_score as number);
      }
      return sum;
    }, 0);

    return Response.json({
      success: true,
      data: {
        outcomes: outcomes.results || [],
        total_impact_score: totalImpact,
        verified_outcomes: ((outcomes.results || []) as Record<string, unknown>[]).filter((o) => o.verified).length,
      },
    });
  } catch (error) {
    console.error('Get outcomes error:', error);
    return Response.json({ error: 'Failed to fetch outcomes' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;
    const { id } = await params;
    const incidentId = parseInt(id);

    if (isNaN(incidentId)) {
      return Response.json({ error: 'Invalid incident ID' }, { status: 400 });
    }

    // Verify user is authenticated
    const session = await getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if incident exists
    const incident = await db
      .prepare('SELECT id, reported_by FROM incidents WHERE id = ?')
      .bind(incidentId)
      .first() as { id: number; reported_by: string } | null;

    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      outcome_type,
      outcome_date,
      description,
      evidence_url,
    } = body as {
      outcome_type: OutcomeType;
      outcome_date: string;
      description?: string;
      evidence_url?: string;
    };

    // Validate required fields
    if (!outcome_type || !outcome_date) {
      return Response.json(
        { error: 'outcome_type and outcome_date are required' },
        { status: 400 }
      );
    }

    // Validate outcome type
    const validOutcomeTypes: OutcomeType[] = [
      'investigation_opened',
      'site_visit_conducted',
      'warning_issued',
      'equipment_seized',
      'site_closed',
      'arrests_made',
      'remediation_started',
      'remediation_completed',
      'case_dismissed',
    ];

    if (!validOutcomeTypes.includes(outcome_type)) {
      return Response.json({ error: 'Invalid outcome type' }, { status: 400 });
    }

    // Calculate impact score
    const impactScore = OUTCOME_WEIGHTS[outcome_type];

    // Auto-verify if user is moderator/admin/authority
    const isPrivileged = ['moderator', 'admin', 'authority'].includes(session.role);

    // Create outcome
    const result = await db
      .prepare(
        `INSERT INTO incident_outcomes
         (incident_id, outcome_type, outcome_date, description, evidence_url, reported_by, verified, verified_by, verified_at, impact_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(
        incidentId,
        outcome_type,
        outcome_date,
        description || null,
        evidence_url || null,
        session.id,
        isPrivileged ? 1 : 0,
        isPrivileged ? session.id : null,
        isPrivileged ? new Date().toISOString() : null,
        impactScore
      )
      .first();

    // If this is an enforcement action and verified, update the reporter's stats
    if (isPrivileged && ['site_closed', 'equipment_seized', 'arrests_made'].includes(outcome_type)) {
      // Find the original reporter
      const reporterUser = await db
        .prepare('SELECT id FROM users WHERE name = ?')
        .bind(incident.reported_by)
        .first() as { id: number } | null;

      if (reporterUser) {
        // Update reporter's enforcement_actions count
        await db
          .prepare(
            `UPDATE users SET
              enforcement_actions = COALESCE(enforcement_actions, 0) + 1,
              guardian_points = COALESCE(guardian_points, 0) + ?
             WHERE id = ?`
          )
          .bind(ACTIVITY_POINTS.enforcement_triggered, reporterUser.id)
          .run();

        // Log activity
        await db
          .prepare(
            `INSERT INTO user_activities (user_id, activity_type, incident_id, points_earned, metadata)
             VALUES (?, 'enforcement_triggered', ?, ?, ?)`
          )
          .bind(
            reporterUser.id,
            incidentId,
            ACTIVITY_POINTS.enforcement_triggered,
            JSON.stringify({ outcome_type })
          )
          .run();
      }
    }

    // Log incident update
    await db
      .prepare(
        `INSERT INTO incident_updates (incident_id, user_id, update_type, new_value, notes)
         VALUES (?, ?, 'status_change', ?, ?)`
      )
      .bind(
        incidentId,
        session.id,
        `outcome:${outcome_type}`,
        description || `Outcome reported: ${outcome_type}`
      )
      .run();

    return Response.json({
      success: true,
      data: result,
      message: isPrivileged ? 'Outcome added and verified' : 'Outcome submitted for verification',
    });
  } catch (error) {
    console.error('Create outcome error:', error);
    return Response.json({ error: 'Failed to create outcome' }, { status: 500 });
  }
}
