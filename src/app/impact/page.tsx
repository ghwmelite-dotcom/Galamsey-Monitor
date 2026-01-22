'use client';

/**
 * Impact Dashboard Page
 * Shows user's personal impact and community leaderboard
 */

import { Suspense, useState } from 'react';
import { useSession } from '@/lib/auth-context';
import Navigation from '@/components/Navigation';
import ImpactDashboard from '@/components/ImpactDashboard';
import Leaderboard from '@/components/Leaderboard';
import {
  Trophy,
  User,
  Users,
  TrendingUp,
  Award,
  Shield,
  Loader2,
  LogIn,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'personal' | 'community';

function ImpactPageContent() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ghana-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-ghana-green" />
            Impact Dashboard
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Track your contributions and see how you're making a difference in protecting Ghana's environment.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'personal'
                ? 'bg-ghana-green text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="h-4 w-4" />
            My Impact
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'community'
                ? 'bg-ghana-green text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="h-4 w-4" />
            Community
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' ? (
          session ? (
            <ImpactDashboard />
          ) : (
            <NotLoggedInPrompt />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Leaderboard */}
            <div className="lg:col-span-2">
              <Leaderboard />
            </div>

            {/* Side Stats */}
            <div className="space-y-6">
              {/* Guardian Program Info */}
              <div className="bg-gradient-to-br from-ghana-green to-forest-700 rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Guardian Program</h3>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Join our community of environmental guardians. Submit reports, earn badges,
                  and rise through the ranks as you help protect Ghana's natural resources.
                </p>

                <div className="space-y-3">
                  <RankPreview rank="diamond" label="Diamond" requirement="100+ verified" />
                  <RankPreview rank="gold" label="Gold" requirement="50+ verified" />
                  <RankPreview rank="silver" label="Silver" requirement="20+ verified" />
                  <RankPreview rank="bronze" label="Bronze" requirement="5+ verified" />
                  <RankPreview rank="observer" label="Observer" requirement="Start here" />
                </div>

                {!session && (
                  <Link
                    href="/register"
                    className="mt-4 block w-full text-center bg-white text-ghana-green font-semibold py-2 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Join the Program
                  </Link>
                )}
              </div>

              {/* Top Badges */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-ghana-gold" />
                  <h3 className="font-semibold text-gray-900">Popular Badges</h3>
                </div>

                <div className="space-y-3">
                  <BadgeInfo
                    name="First Report"
                    description="Submit your first incident report"
                    icon="🏁"
                  />
                  <BadgeInfo
                    name="Trusted Reporter"
                    description="5 reports verified by moderators"
                    icon="✓"
                  />
                  <BadgeInfo
                    name="Justice Seeker"
                    description="Report led to enforcement action"
                    icon="⚖️"
                  />
                  <BadgeInfo
                    name="Water Guardian"
                    description="Report 10 water pollution incidents"
                    icon="💧"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Not logged in prompt
function NotLoggedInPrompt() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-ghana-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <LogIn className="h-8 w-8 text-ghana-green" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Sign In to View Your Impact
      </h2>
      <p className="text-gray-600 mb-6">
        Track your personal contributions, earn badges, and see how you're making a
        difference in the fight against illegal mining.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/login"
          className="px-6 py-2 bg-ghana-green text-white font-medium rounded-lg hover:bg-ghana-green/90 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}

// Rank preview for sidebar
function RankPreview({
  rank,
  label,
  requirement,
}: {
  rank: string;
  label: string;
  requirement: string;
}) {
  const icons: Record<string, string> = {
    diamond: '💎',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    observer: '👁️',
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span>{icons[rank]}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-white/60 text-xs">{requirement}</span>
    </div>
  );
}

// Badge info for sidebar
function BadgeInfo({
  name,
  description,
  icon,
}: {
  name: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-ghana-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm">{icon}</span>
      </div>
      <div>
        <p className="font-medium text-gray-900 text-sm">{name}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ghana-green" />
        </div>
      }
    >
      <ImpactPageContent />
    </Suspense>
  );
}
