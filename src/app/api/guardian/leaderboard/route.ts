/**
 * Guardian Leaderboard API
 * GET /api/guardian/leaderboard - Get leaderboard rankings
 */

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { GuardianRank, LeaderboardEntry, Leaderboard } from '@/types';

export async function GET(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const url = new URL(request.url);
    const period = (url.searchParams.get('period') || 'all_time') as 'weekly' | 'monthly' | 'all_time';
    const category = (url.searchParams.get('category') || 'points') as 'reports' | 'verified' | 'enforcement' | 'points';
    const region = url.searchParams.get('region') || null;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);

    // Build the query based on category
    let orderBy: string;
    let selectField: string;

    switch (category) {
      case 'reports':
        orderBy = 'reports_submitted';
        selectField = 'COALESCE(reports_submitted, 0) as score';
        break;
      case 'verified':
        orderBy = 'reports_verified';
        selectField = 'COALESCE(reports_verified, 0) as score';
        break;
      case 'enforcement':
        orderBy = 'enforcement_actions';
        selectField = 'COALESCE(enforcement_actions, 0) as score';
        break;
      default:
        orderBy = 'guardian_points';
        selectField = 'COALESCE(guardian_points, 0) as score';
    }

    // Build date filter based on period
    let dateFilter = '';
    if (period === 'weekly') {
      dateFilter = `AND created_at >= DATE('now', '-7 days')`;
    } else if (period === 'monthly') {
      dateFilter = `AND created_at >= DATE('now', '-30 days')`;
    }

    // Build region filter
    let regionFilter = '';
    const params: (string | number)[] = [];
    if (region) {
      regionFilter = 'AND region = ?';
      params.push(region);
    }

    // For time-based periods, we need to aggregate from user_activities
    let query: string;

    if (period === 'all_time') {
      // Use cumulative stats from users table
      query = `
        SELECT
          id as user_id,
          COALESCE(display_name, name) as display_name,
          avatar_url,
          COALESCE(guardian_rank, 'observer') as guardian_rank,
          ${selectField},
          region
        FROM users
        WHERE show_on_leaderboard = 1
          ${regionFilter}
          AND (${orderBy} > 0 OR guardian_points > 0)
        ORDER BY ${orderBy} DESC
        LIMIT ?
      `;
      params.push(limit);
    } else {
      // Aggregate from activities for time periods
      let activityFilter = '';
      if (category === 'reports') {
        activityFilter = `AND activity_type = 'report_submitted'`;
      } else if (category === 'verified') {
        activityFilter = `AND activity_type = 'report_verified'`;
      } else if (category === 'enforcement') {
        activityFilter = `AND activity_type = 'enforcement_triggered'`;
      }

      query = `
        SELECT
          u.id as user_id,
          COALESCE(u.display_name, u.name) as display_name,
          u.avatar_url,
          COALESCE(u.guardian_rank, 'observer') as guardian_rank,
          ${category === 'points'
            ? 'COALESCE(SUM(ua.points_earned), 0) as score'
            : 'COUNT(ua.id) as score'
          },
          u.region
        FROM users u
        LEFT JOIN user_activities ua ON u.id = ua.user_id
          ${dateFilter}
          ${activityFilter}
        WHERE u.show_on_leaderboard = 1
          ${regionFilter.replace('AND', 'AND u.')}
        GROUP BY u.id
        HAVING score > 0
        ORDER BY score DESC
        LIMIT ?
      `;
      params.push(limit);
    }

    const result = await db.prepare(query).bind(...params).all();

    // Add rank numbers
    const entries: LeaderboardEntry[] = ((result.results || []) as Record<string, unknown>[]).map(
      (row, index) => ({
        rank: index + 1,
        user_id: row.user_id as number,
        display_name: row.display_name as string,
        avatar_url: row.avatar_url as string | undefined,
        guardian_rank: row.guardian_rank as GuardianRank,
        score: row.score as number,
        region: row.region as string | undefined,
      })
    );

    const leaderboard: Leaderboard = {
      period,
      category,
      region: region || undefined,
      entries,
      updated_at: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return Response.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
