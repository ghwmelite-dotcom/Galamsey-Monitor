/**
 * Guardian System - User ranking, badges, and gamification
 */

import type {
  GuardianRank,
  Badge,
  UserActivity,
  ActivityType,
  UserImpact,
  LeaderboardEntry,
  GUARDIAN_RANK_REQUIREMENTS,
} from '@/types';

// Badge definitions
export const BADGES: Record<string, Badge> = {
  first_report: {
    id: 'first_report',
    name: 'First Report',
    description: 'Submitted your first incident report',
    icon: 'flag',
    points: 10,
  },
  verified_5: {
    id: 'verified_5',
    name: 'Trusted Reporter',
    description: '5 reports verified by moderators',
    icon: 'check-circle',
    points: 50,
  },
  verified_20: {
    id: 'verified_20',
    name: 'Community Guardian',
    description: '20 reports verified',
    icon: 'shield',
    points: 100,
  },
  verified_50: {
    id: 'verified_50',
    name: 'Environmental Champion',
    description: '50 verified reports',
    icon: 'award',
    points: 250,
  },
  enforcement_1: {
    id: 'enforcement_1',
    name: 'Justice Seeker',
    description: 'Report led to enforcement action',
    icon: 'gavel',
    points: 100,
  },
  enforcement_5: {
    id: 'enforcement_5',
    name: 'Law Enforcer',
    description: '5 reports led to enforcement',
    icon: 'shield-check',
    points: 500,
  },
  water_guardian: {
    id: 'water_guardian',
    name: 'Water Guardian',
    description: 'Reported 10 water pollution incidents',
    icon: 'droplet',
    points: 75,
  },
  forest_protector: {
    id: 'forest_protector',
    name: 'Forest Protector',
    description: 'Reported 10 deforestation incidents',
    icon: 'tree-pine',
    points: 75,
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Submitted report within 24h of activity',
    icon: 'clock',
    points: 25,
  },
  photo_evidence: {
    id: 'photo_evidence',
    name: 'Photo Journalist',
    description: 'Uploaded 50 pieces of evidence',
    icon: 'camera',
    points: 50,
  },
  voice_reporter: {
    id: 'voice_reporter',
    name: 'Voice Reporter',
    description: 'Used voice input for 10 reports',
    icon: 'mic',
    points: 30,
  },
  regional_expert: {
    id: 'regional_expert',
    name: 'Regional Expert',
    description: 'Top reporter in your region for a month',
    icon: 'map-pin',
    points: 100,
  },
  streak_7: {
    id: 'streak_7',
    name: 'Dedicated Watcher',
    description: 'Reported incidents 7 days in a row',
    icon: 'flame',
    points: 50,
  },
  streak_30: {
    id: 'streak_30',
    name: 'Vigilant Guardian',
    description: 'Active for 30 consecutive days',
    icon: 'flame',
    points: 150,
  },
};

// Points awarded for different activities
export const ACTIVITY_POINTS: Record<ActivityType, number> = {
  report_submitted: 5,
  report_verified: 15,
  report_rejected: 0,
  enforcement_triggered: 50,
  badge_earned: 0, // Points come from the badge itself
  rank_promoted: 25,
  comment_added: 2,
  evidence_uploaded: 5,
  alert_subscription: 3,
};

// Rank requirements
export const RANK_REQUIREMENTS: Record<GuardianRank, { min_verified: number; min_points: number }> = {
  observer: { min_verified: 0, min_points: 0 },
  bronze: { min_verified: 5, min_points: 50 },
  silver: { min_verified: 20, min_points: 200 },
  gold: { min_verified: 50, min_points: 500 },
  diamond: { min_verified: 100, min_points: 1000 },
};

// Rank benefits
export const RANK_BENEFITS: Record<GuardianRank, string[]> = {
  observer: ['Basic reporting'],
  bronze: ['Priority support', 'Bronze badge'],
  silver: ['Monthly recognition', 'Direct moderator contact'],
  gold: ['EPA contact line', 'Featured reporter status'],
  diamond: ['Official partnership', 'Training opportunities', 'Advisory role'],
};

/**
 * Calculate the appropriate rank based on verified reports and points
 */
export function calculateRank(verifiedReports: number, points: number): GuardianRank {
  if (verifiedReports >= 100 && points >= 1000) return 'diamond';
  if (verifiedReports >= 50 && points >= 500) return 'gold';
  if (verifiedReports >= 20 && points >= 200) return 'silver';
  if (verifiedReports >= 5 && points >= 50) return 'bronze';
  return 'observer';
}

/**
 * Get progress to next rank
 */
export function getRankProgress(
  currentRank: GuardianRank,
  verifiedReports: number,
  points: number
): { nextRank: GuardianRank | null; verifiedProgress: number; pointsProgress: number } {
  const ranks: GuardianRank[] = ['observer', 'bronze', 'silver', 'gold', 'diamond'];
  const currentIndex = ranks.indexOf(currentRank);

  if (currentIndex === ranks.length - 1) {
    return { nextRank: null, verifiedProgress: 100, pointsProgress: 100 };
  }

  const nextRank = ranks[currentIndex + 1];
  const requirements = RANK_REQUIREMENTS[nextRank];

  const verifiedProgress = Math.min(100, (verifiedReports / requirements.min_verified) * 100);
  const pointsProgress = Math.min(100, (points / requirements.min_points) * 100);

  return { nextRank, verifiedProgress, pointsProgress };
}

/**
 * Check what badges a user should earn based on their stats
 */
export function checkEarnedBadges(stats: {
  reports_submitted: number;
  reports_verified: number;
  enforcement_actions: number;
  water_reports: number;
  deforestation_reports: number;
  evidence_count: number;
  voice_reports: number;
  activity_streak: number;
  is_regional_top: boolean;
  existing_badges: string[];
}): Badge[] {
  const newBadges: Badge[] = [];

  // First report
  if (stats.reports_submitted >= 1 && !stats.existing_badges.includes('first_report')) {
    newBadges.push(BADGES.first_report);
  }

  // Verified milestones
  if (stats.reports_verified >= 5 && !stats.existing_badges.includes('verified_5')) {
    newBadges.push(BADGES.verified_5);
  }
  if (stats.reports_verified >= 20 && !stats.existing_badges.includes('verified_20')) {
    newBadges.push(BADGES.verified_20);
  }
  if (stats.reports_verified >= 50 && !stats.existing_badges.includes('verified_50')) {
    newBadges.push(BADGES.verified_50);
  }

  // Enforcement milestones
  if (stats.enforcement_actions >= 1 && !stats.existing_badges.includes('enforcement_1')) {
    newBadges.push(BADGES.enforcement_1);
  }
  if (stats.enforcement_actions >= 5 && !stats.existing_badges.includes('enforcement_5')) {
    newBadges.push(BADGES.enforcement_5);
  }

  // Category-specific badges
  if (stats.water_reports >= 10 && !stats.existing_badges.includes('water_guardian')) {
    newBadges.push(BADGES.water_guardian);
  }
  if (stats.deforestation_reports >= 10 && !stats.existing_badges.includes('forest_protector')) {
    newBadges.push(BADGES.forest_protector);
  }

  // Activity badges
  if (stats.evidence_count >= 50 && !stats.existing_badges.includes('photo_evidence')) {
    newBadges.push(BADGES.photo_evidence);
  }
  if (stats.voice_reports >= 10 && !stats.existing_badges.includes('voice_reporter')) {
    newBadges.push(BADGES.voice_reporter);
  }

  // Streak badges
  if (stats.activity_streak >= 7 && !stats.existing_badges.includes('streak_7')) {
    newBadges.push(BADGES.streak_7);
  }
  if (stats.activity_streak >= 30 && !stats.existing_badges.includes('streak_30')) {
    newBadges.push(BADGES.streak_30);
  }

  // Regional expert
  if (stats.is_regional_top && !stats.existing_badges.includes('regional_expert')) {
    newBadges.push(BADGES.regional_expert);
  }

  return newBadges;
}

/**
 * Get rank color for UI display
 */
export function getRankColor(rank: GuardianRank): { bg: string; text: string; border: string } {
  switch (rank) {
    case 'diamond':
      return { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' };
    case 'gold':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
    case 'silver':
      return { bg: 'bg-gray-200', text: 'text-gray-700', border: 'border-gray-400' };
    case 'bronze':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
  }
}

/**
 * Get rank icon
 */
export function getRankIcon(rank: GuardianRank): string {
  switch (rank) {
    case 'diamond':
      return '💎';
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
    default:
      return '👁️';
  }
}

/**
 * Format points with K/M suffix
 */
export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}

/**
 * Calculate estimated environmental impact
 */
export function calculateEnvironmentalImpact(stats: {
  verified_reports: number;
  enforcement_actions: number;
  sites_closed: number;
}): { hectares_protected: number; water_bodies_saved: number } {
  // Rough estimates based on average impact per action
  const hectares_protected =
    stats.verified_reports * 0.5 + // Each verified report prevents ~0.5 hectare of damage
    stats.enforcement_actions * 2 + // Each enforcement action protects ~2 hectares
    stats.sites_closed * 10; // Each closed site protects ~10 hectares

  const water_bodies_saved =
    Math.floor(stats.verified_reports * 0.1) + // 10% of reports help water bodies
    stats.sites_closed * 1; // Each closed site helps 1 water body

  return {
    hectares_protected: Math.round(hectares_protected * 10) / 10,
    water_bodies_saved,
  };
}

/**
 * Generate activity feed message
 */
export function getActivityMessage(activity: UserActivity): string {
  switch (activity.activity_type) {
    case 'report_submitted':
      return 'Submitted a new incident report';
    case 'report_verified':
      return 'Report was verified by moderators';
    case 'report_rejected':
      return 'Report was not verified';
    case 'enforcement_triggered':
      return 'Report led to enforcement action!';
    case 'badge_earned':
      return `Earned a new badge`;
    case 'rank_promoted':
      return 'Promoted to a new Guardian rank!';
    case 'comment_added':
      return 'Added a comment to an incident';
    case 'evidence_uploaded':
      return 'Uploaded evidence to an incident';
    case 'alert_subscription':
      return 'Set up alert notifications';
    default:
      return 'Activity recorded';
  }
}
