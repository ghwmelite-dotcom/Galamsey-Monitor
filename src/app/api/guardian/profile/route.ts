/**
 * Guardian Profile API
 * GET /api/guardian/profile - Get current user's guardian profile
 * GET /api/guardian/profile/[id] - Get specific user's public guardian profile
 */

export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionFromRequest } from '@/lib/auth-edge';
import type { GuardianRank, Badge, UserActivity, UserImpact } from '@/types';
import { calculateRank, getRankProgress, calculateEnvironmentalImpact, BADGES } from '@/lib/guardian';

export async function GET(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    // Get authenticated user
    const session = await getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.id);

    // Get user data with guardian info
    const userResult = await db
      .prepare(
        `SELECT
          id, name, email, role, region, avatar_url, created_at,
          COALESCE(guardian_rank, 'observer') as guardian_rank,
          COALESCE(guardian_points, 0) as guardian_points,
          COALESCE(reports_submitted, 0) as reports_submitted,
          COALESCE(reports_verified, 0) as reports_verified,
          COALESCE(enforcement_actions, 0) as enforcement_actions,
          COALESCE(display_name, name) as display_name,
          bio,
          COALESCE(show_on_leaderboard, 1) as show_on_leaderboard
        FROM users WHERE id = ?`
      )
      .bind(userId)
      .first();

    if (!userResult) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult as Record<string, unknown>;

    // Get user's badges
    const badgesResult = await db
      .prepare(
        `SELECT badge_id, badge_name, badge_description, badge_icon, earned_at
         FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC`
      )
      .bind(userId)
      .all();

    const badges: Badge[] = ((badgesResult.results || []) as Record<string, unknown>[]).map((b) => ({
      id: b.badge_id as string,
      name: b.badge_name as string,
      description: b.badge_description as string,
      icon: b.badge_icon as string,
      points: BADGES[b.badge_id as string]?.points || 0,
      earned_at: b.earned_at as string,
    }));

    // Get recent badges (last 5)
    const recentBadges = badges.slice(0, 5);

    // Get report statistics
    const reportStats = await db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected
         FROM incidents WHERE reported_by = ?`
      )
      .bind(user.name)
      .first();

    // Get outcome statistics
    const outcomeStats = await db
      .prepare(
        `SELECT
          COUNT(*) as total_outcomes,
          SUM(CASE WHEN outcome_type = 'site_closed' THEN 1 ELSE 0 END) as sites_closed,
          SUM(CASE WHEN outcome_type = 'equipment_seized' THEN 1 ELSE 0 END) as equipment_seized,
          SUM(CASE WHEN outcome_type = 'arrests_made' THEN 1 ELSE 0 END) as arrests_made
         FROM incident_outcomes io
         JOIN incidents i ON io.incident_id = i.id
         WHERE i.reported_by = ?`
      )
      .bind(user.name)
      .first();

    // Get recent activities
    const activitiesResult = await db
      .prepare(
        `SELECT id, activity_type, incident_id, points_earned, metadata, created_at
         FROM user_activities WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 10`
      )
      .bind(userId)
      .all();

    const recentActivities: UserActivity[] = ((activitiesResult.results || []) as Record<string, unknown>[]).map(
      (a) => ({
        id: a.id as number,
        user_id: userId,
        activity_type: a.activity_type as UserActivity['activity_type'],
        incident_id: a.incident_id as number | undefined,
        points_earned: a.points_earned as number,
        metadata: a.metadata as string | undefined,
        created_at: a.created_at as string,
      })
    );

    // Calculate activity streak (days in a row with activity)
    const streakResult = await db
      .prepare(
        `WITH RECURSIVE dates AS (
          SELECT DATE(created_at) as activity_date
          FROM user_activities
          WHERE user_id = ?
          GROUP BY DATE(created_at)
        )
        SELECT COUNT(*) as streak
        FROM dates
        WHERE activity_date >= DATE('now', '-30 days')`
      )
      .bind(userId)
      .first();

    const activityStreak = ((streakResult as Record<string, unknown> | null)?.streak as number) || 0;

    // Cast query results to proper types
    const reportStatsTyped = reportStats as Record<string, unknown> | null;
    const outcomeStatsTyped = outcomeStats as Record<string, unknown> | null;

    // Calculate environmental impact
    const impact = calculateEnvironmentalImpact({
      verified_reports: (reportStatsTyped?.verified as number) || 0,
      enforcement_actions: (user.enforcement_actions as number) || 0,
      sites_closed: (outcomeStatsTyped?.sites_closed as number) || 0,
    });

    // Get global rank
    const globalRankResult = await db
      .prepare(
        `SELECT COUNT(*) + 1 as rank FROM users
         WHERE guardian_points > ? AND show_on_leaderboard = 1`
      )
      .bind(user.guardian_points)
      .first() as Record<string, unknown> | null;

    // Get regional rank if user has a region
    let regionalRank: number | undefined;
    if (user.region) {
      const regionalRankResult = await db
        .prepare(
          `SELECT COUNT(*) + 1 as rank FROM users
           WHERE guardian_points > ? AND region = ? AND show_on_leaderboard = 1`
        )
        .bind(user.guardian_points, user.region)
        .first() as Record<string, unknown> | null;
      regionalRank = regionalRankResult?.rank as number;
    }

    // Calculate rank progress
    const rankProgress = getRankProgress(
      user.guardian_rank as GuardianRank,
      (reportStatsTyped?.verified as number) || 0,
      user.guardian_points as number
    );

    // Build response
    const userImpact: UserImpact = {
      user_id: userId,
      display_name: user.display_name as string,
      guardian_rank: user.guardian_rank as GuardianRank,
      guardian_points: user.guardian_points as number,

      reports_submitted: (reportStatsTyped?.total as number) || 0,
      reports_verified: (reportStatsTyped?.verified as number) || 0,
      reports_pending: (reportStatsTyped?.pending as number) || 0,
      reports_rejected: (reportStatsTyped?.rejected as number) || 0,

      enforcement_actions: user.enforcement_actions as number,
      sites_closed: (outcomeStatsTyped?.sites_closed as number) || 0,
      equipment_seized: (outcomeStatsTyped?.equipment_seized as number) || 0,
      arrests_made: (outcomeStatsTyped?.arrests_made as number) || 0,

      estimated_hectares_protected: impact.hectares_protected,
      water_bodies_monitored: impact.water_bodies_saved,

      badges,
      recent_badges: recentBadges,
      recent_activities: recentActivities,
      activity_streak: activityStreak,

      global_rank: globalRankResult?.rank as number,
      regional_rank: regionalRank,
    };

    return Response.json({
      success: true,
      data: {
        profile: {
          id: user.id,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          region: user.region,
          guardian_rank: user.guardian_rank,
          show_on_leaderboard: user.show_on_leaderboard === 1,
          created_at: user.created_at,
        },
        impact: userImpact,
        rank_progress: rankProgress,
      },
    });
  } catch (error) {
    console.error('Guardian profile error:', error);
    return Response.json(
      { error: 'Failed to fetch guardian profile' },
      { status: 500 }
    );
  }
}

// Update guardian profile
export async function PATCH(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = env.DB;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, bio, show_on_leaderboard } = body;

    // Update user profile
    await db
      .prepare(
        `UPDATE users SET
          display_name = COALESCE(?, display_name),
          bio = COALESCE(?, bio),
          show_on_leaderboard = COALESCE(?, show_on_leaderboard),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(
        display_name || null,
        bio || null,
        show_on_leaderboard !== undefined ? (show_on_leaderboard ? 1 : 0) : null,
        session.id
      )
      .run();

    return Response.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Guardian profile update error:', error);
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
