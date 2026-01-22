'use client';

/**
 * Personal Impact Dashboard Component
 * Shows user's guardian rank, badges, impact metrics, and activity
 */

import { useState, useEffect } from 'react';
import {
  Award,
  Shield,
  TrendingUp,
  MapPin,
  Droplet,
  TreePine,
  Flame,
  ChevronRight,
  Star,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Loader2,
} from 'lucide-react';
import type { UserImpact, GuardianRank, Badge } from '@/types';
import {
  getRankColor,
  getRankIcon,
  formatPoints,
  RANK_BENEFITS,
  getActivityMessage,
} from '@/lib/guardian';

interface ImpactDashboardProps {
  userId?: number;
  showFullDashboard?: boolean;
}

// Badge icon mapping
const BADGE_ICONS: Record<string, React.ReactNode> = {
  flag: <Star className="h-5 w-5" />,
  'check-circle': <CheckCircle className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
  gavel: <Target className="h-5 w-5" />,
  'shield-check': <Shield className="h-5 w-5" />,
  droplet: <Droplet className="h-5 w-5" />,
  'tree-pine': <TreePine className="h-5 w-5" />,
  clock: <Clock className="h-5 w-5" />,
  camera: <Star className="h-5 w-5" />,
  mic: <Star className="h-5 w-5" />,
  'map-pin': <MapPin className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
};

export default function ImpactDashboard({ showFullDashboard = true }: ImpactDashboardProps) {
  const [impact, setImpact] = useState<UserImpact | null>(null);
  const [rankProgress, setRankProgress] = useState<{
    nextRank: GuardianRank | null;
    verifiedProgress: number;
    pointsProgress: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImpactData();
  }, []);

  const fetchImpactData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guardian/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch impact data');
      }

      const data = await response.json();
      setImpact(data.data.impact);
      setRankProgress(data.data.rank_progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-green" />
      </div>
    );
  }

  if (error || !impact) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error || 'Failed to load impact data'}</p>
        <button
          onClick={fetchImpactData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const rankColors = getRankColor(impact.guardian_rank);
  const rankIcon = getRankIcon(impact.guardian_rank);

  return (
    <div className="space-y-6">
      {/* Guardian Rank Card */}
      <div className={`rounded-2xl p-6 ${rankColors.bg} ${rankColors.border} border-2`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{rankIcon}</span>
              <div>
                <h2 className={`text-2xl font-bold capitalize ${rankColors.text}`}>
                  {impact.guardian_rank} Guardian
                </h2>
                <p className="text-sm text-gray-600">
                  {formatPoints(impact.guardian_points)} points earned
                </p>
              </div>
            </div>

            {/* Rank Benefits */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Your Benefits</p>
              <div className="flex flex-wrap gap-2">
                {RANK_BENEFITS[impact.guardian_rank].map((benefit, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 bg-white/50 rounded-full text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="text-right">
            {impact.global_rank && (
              <div className="mb-2">
                <p className="text-xs text-gray-500">Global Rank</p>
                <p className="text-2xl font-bold text-gray-900">#{impact.global_rank}</p>
              </div>
            )}
            {impact.regional_rank && (
              <div>
                <p className="text-xs text-gray-500">Regional Rank</p>
                <p className="text-lg font-semibold text-gray-700">#{impact.regional_rank}</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress to Next Rank */}
        {rankProgress?.nextRank && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Progress to {rankProgress.nextRank.charAt(0).toUpperCase() + rankProgress.nextRank.slice(1)}
              </p>
              <span className="text-xs text-gray-500">
                {Math.round(Math.min(rankProgress.verifiedProgress, rankProgress.pointsProgress))}%
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Verified Reports</span>
                  <span>{Math.round(rankProgress.verifiedProgress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ghana-green transition-all duration-500"
                    style={{ width: `${rankProgress.verifiedProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Points</span>
                  <span>{Math.round(rankProgress.pointsProgress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ghana-gold transition-all duration-500"
                    style={{ width: `${rankProgress.pointsProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFullDashboard && (
        <>
          {/* Impact Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
              label="Reports Submitted"
              value={impact.reports_submitted}
              subValue={`${impact.reports_verified} verified`}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-red-600" />}
              label="Enforcement Actions"
              value={impact.enforcement_actions}
              subValue={`${impact.sites_closed} sites closed`}
              bgColor="bg-red-50"
            />
            <StatCard
              icon={<TreePine className="h-5 w-5 text-green-600" />}
              label="Hectares Protected"
              value={impact.estimated_hectares_protected}
              subValue="estimated impact"
              bgColor="bg-green-50"
            />
            <StatCard
              icon={<Droplet className="h-5 w-5 text-cyan-600" />}
              label="Water Bodies"
              value={impact.water_bodies_monitored}
              subValue="monitored"
              bgColor="bg-cyan-50"
            />
          </div>

          {/* Report Stats Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-ghana-green" />
              Report Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900">{impact.reports_submitted}</p>
                <p className="text-sm text-gray-500">Submitted</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-700">{impact.reports_verified}</p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-700">{impact.reports_pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-700">{impact.reports_rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>

            {/* Verification Rate */}
            {impact.reports_submitted > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Verification Rate</span>
                  <span className="text-sm font-semibold text-green-600">
                    {Math.round((impact.reports_verified / impact.reports_submitted) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(impact.reports_verified / impact.reports_submitted) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Badges Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-ghana-gold" />
                Badges Earned
              </h3>
              <span className="text-sm text-gray-500">{impact.badges.length} total</span>
            </div>

            {impact.badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {impact.badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No badges earned yet</p>
                <p className="text-sm">Submit verified reports to earn badges!</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent Activity
              </h3>
              {impact.activity_streak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <Flame className="h-4 w-4" />
                  {impact.activity_streak} day streak
                </span>
              )}
            </div>

            {impact.recent_activities.length > 0 ? (
              <div className="space-y-3">
                {impact.recent_activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ActivityIcon type={activity.activity_type} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {activity.points_earned > 0 && (
                      <span className="text-sm font-medium text-green-600">
                        +{activity.points_earned} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No recent activity</p>
                <p className="text-sm">Start reporting to see your activity here!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subValue,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subValue}</p>
    </div>
  );
}

// Badge Card Component
function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 bg-ghana-gold/20 rounded-full flex items-center justify-center mb-2">
        {BADGE_ICONS[badge.icon] || <Award className="h-6 w-6 text-ghana-gold" />}
      </div>
      <p className="text-sm font-medium text-gray-900 text-center">{badge.name}</p>
      <p className="text-xs text-gray-500 text-center">{badge.description}</p>
      {badge.earned_at && (
        <p className="text-xs text-gray-400 mt-1">
          {new Date(badge.earned_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// Activity Icon Component
function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'report_submitted':
      return <TrendingUp className="h-5 w-5 text-blue-500" />;
    case 'report_verified':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'report_rejected':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'enforcement_triggered':
      return <Target className="h-5 w-5 text-purple-500" />;
    case 'badge_earned':
      return <Award className="h-5 w-5 text-yellow-500" />;
    case 'rank_promoted':
      return <Trophy className="h-5 w-5 text-cyan-500" />;
    default:
      return <Star className="h-5 w-5 text-gray-500" />;
  }
}
