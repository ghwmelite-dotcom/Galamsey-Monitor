'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import DashboardStats from '@/components/DashboardStats';
import RecentIncidents from '@/components/RecentIncidents';
import GhanaMap from '@/components/GhanaMap';
import type { DashboardStats as DashboardStatsType, Incident, WaterQualityReading, MiningSite } from '@/types';

export default function Home() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [waterReadings, setWaterReadings] = useState<WaterQualityReading[]>([]);
  const [miningSites, setMiningSites] = useState<MiningSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, incidentsRes, waterRes, sitesRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/incidents'),
          fetch('/api/water'),
          fetch('/api/sites'),
        ]);

        const [statsData, incidentsData, waterData, sitesData] = await Promise.all([
          statsRes.json(),
          incidentsRes.json(),
          waterRes.json(),
          sitesRes.json(),
        ]);

        setStats(statsData);
        setIncidents(incidentsData);
        setWaterReadings(waterData);
        setMiningSites(sitesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Galamsey Monitoring Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring and reporting of illegal mining activities across Ghana.
            Together we can protect our water bodies, forests, and communities.
          </p>
        </div>

        {/* Alert Banner */}
        {stats && stats.activeIncidents > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>{stats.activeIncidents} active incidents</strong> require immediate attention.
                  <a href="/map" className="ml-2 underline font-medium">View on map</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && <DashboardStats stats={stats} />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Live Incident Map</h3>
              <GhanaMap
                incidents={incidents}
                waterReadings={waterReadings}
                miningSites={miningSites}
                height="400px"
              />
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="lg:col-span-1">
            {stats && <RecentIncidents incidents={stats.recentIncidents} />}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/report"
            className="bg-ghana-red text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
          >
            <div>
              <h3 className="text-lg font-bold">Report an Incident</h3>
              <p className="text-red-100 text-sm mt-1">Help us track illegal mining</p>
            </div>
            <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <a
            href="/water"
            className="bg-blue-600 text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
          >
            <div>
              <h3 className="text-lg font-bold">Check Water Quality</h3>
              <p className="text-blue-100 text-sm mt-1">Monitor affected rivers</p>
            </div>
            <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>

          <a
            href="/awareness"
            className="bg-ghana-green text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
          >
            <div>
              <h3 className="text-lg font-bold">Learn About Galamsey</h3>
              <p className="text-green-100 text-sm mt-1">Understand the impact</p>
            </div>
            <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Impact Summary */}
        <div className="mt-8 bg-gradient-to-r from-ghana-green to-green-700 text-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4">The Cost of Galamsey</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-ghana-gold">60%</p>
              <p className="text-green-100 text-sm">of water bodies polluted</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-ghana-gold">$2.2B</p>
              <p className="text-green-100 text-sm">annual economic loss</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-ghana-gold">34%</p>
              <p className="text-green-100 text-sm">forest cover lost</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-ghana-gold">5M+</p>
              <p className="text-green-100 text-sm">people affected</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Galamsey Monitor - A platform dedicated to protecting Ghana&apos;s environment.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Report illegal activities. Protect our water. Save our land.
          </p>
        </div>
      </footer>
    </div>
  );
}
