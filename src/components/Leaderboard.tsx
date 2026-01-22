'use client';

/**
 * Community Leaderboard Component
 * Shows top guardians by different categories
 */

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Users,
  TrendingUp,
  Target,
  Star,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { Leaderboard as LeaderboardType, LeaderboardEntry, GuardianRank } from '@/types';
import { getRankIcon, getRankColor } from '@/lib/guardian';
import { GHANA_REGIONS } from '@/types';

type Period = 'weekly' | 'monthly' | 'all_time';
type Category = 'reports' | 'verified' | 'enforcement' | 'points';

interface LeaderboardProps {
  initialPeriod?: Period;
  initialCategory?: Category;
  initialRegion?: string;
  compact?: boolean;
}

export default function Leaderboard({
  initialPeriod = 'monthly',
  initialCategory = 'points',
  initialRegion,
  compact = false,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [region, setRegion] = useState<string | undefined>(initialRegion);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, category, region]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        category,
        limit: compact ? '10' : '25',
      });
      if (region) {
        params.set('region', region);
      }

      const response = await fetch(`/api/guardian/leaderboard?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: Category): string => {
    switch (cat) {
      case 'reports':
        return 'Reports Submitted';
      case 'verified':
        return 'Verified Reports';
      case 'enforcement':
        return 'Enforcement Actions';
      case 'points':
        return 'Total Points';
    }
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'reports':
        return <TrendingUp className="h-4 w-4" />;
      case 'verified':
        return <Star className="h-4 w-4" />;
      case 'enforcement':
        return <Target className="h-4 w-4" />;
      case 'points':
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getPeriodLabel = (p: Period): string => {
    switch (p) {
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'all_time':
        return 'All Time';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-ghana-green to-forest-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Trophy className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Community Leaderboard</h2>
          </div>
          <Users className="h-5 w-5 text-white/60" />
        </div>
      </div>

      {/* Filters */}
      {!compact && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            {/* Period Filter */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ghana-green"
              >
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="all_time">All Time</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ghana-green"
              >
                <option value="points">Total Points</option>
                <option value="reports">Reports Submitted</option>
                <option value="verified">Verified Reports</option>
                <option value="enforcement">Enforcement Actions</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Region Filter */}
            <div className="relative">
              <select
                value={region || ''}
                onChange={(e) => setRegion(e.target.value || undefined)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ghana-green"
              >
                <option value="">All Regions</option>
                {GHANA_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Current Filter Info (compact view) */}
      {compact && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getCategoryIcon(category)}
            <span>{getCategoryLabel(category)}</span>
            <span className="text-gray-400">•</span>
            <span>{getPeriodLabel(period)}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-ghana-green" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-2 text-sm text-ghana-green hover:underline"
            >
              Try again
            </button>
          </div>
        ) : leaderboard?.entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No entries yet for this period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard?.entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                index={index}
                category={category}
              />
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      {leaderboard && (
        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Updated {new Date(leaderboard.updated_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// Leaderboard Row Component
function LeaderboardRow({
  entry,
  index,
  category,
}: {
  entry: LeaderboardEntry;
  index: number;
  category: Category;
}) {
  const rankColors = getRankColor(entry.guardian_rank);
  const isTopThree = index < 3;

  const getRankBadge = () => {
    switch (entry.rank) {
      case 1:
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Crown className="h-5 w-5 text-yellow-600" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Medal className="h-5 w-5 text-gray-600" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <Medal className="h-5 w-5 text-amber-700" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-gray-500">{entry.rank}</span>
          </div>
        );
    }
  };

  const getScoreLabel = () => {
    switch (category) {
      case 'points':
        return 'pts';
      case 'reports':
      case 'verified':
      case 'enforcement':
        return '';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isTopThree ? 'bg-gradient-to-r from-ghana-green/5 to-transparent' : 'hover:bg-gray-50'
      }`}
    >
      {/* Rank */}
      {getRankBadge()}

      {/* Avatar & Name */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{getRankIcon(entry.guardian_rank)}</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{entry.display_name}</p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full capitalize ${rankColors.bg} ${rankColors.text}`}
            >
              {entry.guardian_rank}
            </span>
            {entry.region && (
              <span className="text-xs text-gray-400 truncate">{entry.region}</span>
            )}
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <p className={`text-lg font-bold ${isTopThree ? 'text-ghana-green' : 'text-gray-900'}`}>
          {entry.score.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">{getScoreLabel()}</p>
      </div>
    </div>
  );
}
