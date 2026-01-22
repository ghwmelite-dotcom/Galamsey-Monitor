'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Droplets,
  TrendingUp,
  ArrowRight,
  Shield,
  FileText,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Incident } from '@/types';

interface AdminStats {
  totalUsers: number;
  pendingVerifications: number;
  activeIncidents: number;
  hazardousWater: number;
  recentIncidents: Incident[];
  incidentsByStatus: { status: string; count: number }[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
      return;
    }

    if (status === 'authenticated') {
      if (!['admin', 'moderator', 'authority'].includes(session?.user?.role || '')) {
        router.push('/');
        return;
      }

      fetchStats();
    }
  }, [status, session, router]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/admin/incidents?status=pending',
    },
    {
      label: 'Active Incidents',
      value: stats?.activeIncidents || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/admin/incidents?status=active',
    },
    {
      label: 'Hazardous Water',
      value: stats?.hazardousWater || 0,
      icon: Droplets,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/water',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/users',
    },
  ];

  const quickActions = [
    { label: 'Manage Incidents', icon: FileText, href: '/admin/incidents', color: 'bg-ghana-green' },
    { label: 'Manage Users', icon: Users, href: '/admin/users', color: 'bg-blue-600' },
    { label: 'Generate Reports', icon: TrendingUp, href: '/admin/reports', color: 'bg-purple-600' },
    { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-7 w-7 text-ghana-green" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {session?.user?.name}
              </p>
            </div>
            <span className="px-3 py-1 bg-ghana-green/10 text-ghana-green rounded-full text-sm font-medium capitalize">
              {session?.user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.link}>
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Incidents */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Incidents</h2>
              <Link
                href="/admin/incidents"
                className="text-sm text-ghana-green hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {stats?.recentIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/admin/incidents/${incident.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-1">{incident.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {incident.district}, {incident.region}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          incident.verification_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : incident.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {incident.verification_status || 'pending'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          incident.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : incident.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : incident.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(incident.created_at), 'PPp')}
                  </p>
                </Link>
              ))}

              {(!stats?.recentIncidents || stats.recentIncidents.length === 0) && (
                <p className="text-center text-gray-500 py-8">No recent incidents</p>
              )}
            </div>
          </div>

          {/* Quick Actions & Verification Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity text-center`}
                  >
                    <action.icon className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h2>
              <div className="space-y-3">
                {stats?.incidentsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.status === 'pending'
                            ? 'bg-yellow-500'
                            : item.status === 'verified'
                            ? 'bg-green-500'
                            : item.status === 'rejected'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      <span className="text-sm text-gray-600 capitalize">
                        {item.status || 'Unknown'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Alert */}
            {(stats?.pendingVerifications || 0) > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">
                      {stats?.pendingVerifications} Pending Verifications
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Review and verify new incident reports to ensure accuracy.
                    </p>
                    <Link
                      href="/admin/incidents?verification_status=pending"
                      className="inline-flex items-center text-sm font-medium text-yellow-800 hover:underline mt-2"
                    >
                      Review Now <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
