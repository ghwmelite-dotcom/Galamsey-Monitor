'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import GhanaMap from '@/components/GhanaMap';
import { Droplets, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { WaterQualityReading } from '@/types';

const statusConfig = {
  safe: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Safe' },
  moderate: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Moderate Concern' },
  polluted: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Polluted' },
  hazardous: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Hazardous' },
};

export default function WaterPage() {
  const [waterReadings, setWaterReadings] = useState<WaterQualityReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/water');
        const data = await res.json();
        setWaterReadings(data);
      } catch (error) {
        console.error('Failed to fetch water readings:', error);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const stats = {
    safe: waterReadings.filter(r => r.quality_status === 'safe').length,
    moderate: waterReadings.filter(r => r.quality_status === 'moderate').length,
    polluted: waterReadings.filter(r => r.quality_status === 'polluted').length,
    hazardous: waterReadings.filter(r => r.quality_status === 'hazardous').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Water Quality Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Track water quality across Ghana&apos;s rivers and water bodies affected by galamsey activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.safe}</p>
                <p className="text-blue-600 text-sm">Safe</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900">{stats.moderate}</p>
                <p className="text-yellow-600 text-sm">Moderate</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">{stats.polluted}</p>
                <p className="text-orange-600 text-sm">Polluted</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{stats.hazardous}</p>
                <p className="text-red-600 text-sm">Hazardous</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                Water Quality Map
              </h3>
              <GhanaMap
                waterReadings={waterReadings}
                height="500px"
                showLegend={true}
              />
            </div>
          </div>

          {/* Water Quality Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Understanding the Readings</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Mercury (Hg)</h4>
                  <p className="text-gray-600 mt-1">
                    Safe: &lt;1 ppb | Dangerous: &gt;5 ppb
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Mercury poisoning causes neurological damage
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Arsenic (As)</h4>
                  <p className="text-gray-600 mt-1">
                    Safe: &lt;10 ppb | Dangerous: &gt;50 ppb
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Long-term exposure causes cancer
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Turbidity</h4>
                  <p className="text-gray-600 mt-1">
                    Safe: &lt;5 NTU | Dangerous: &gt;100 NTU
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Indicates sediment and suspended particles
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">pH Level</h4>
                  <p className="text-gray-600 mt-1">
                    Safe: 6.5-8.5 | Acidic: &lt;6 | Alkaline: &gt;9
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Mining runoff makes water acidic
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Readings Table */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Water Quality Readings</h2>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Water Body
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Region
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    pH
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Turbidity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mercury
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Arsenic
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Measured By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waterReadings.map((reading) => {
                  const config = statusConfig[reading.quality_status];
                  const Icon = config.icon;
                  return (
                    <tr key={reading.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {reading.water_body_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{reading.region}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {reading.ph_level?.toFixed(1) || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {reading.turbidity_ntu ? `${reading.turbidity_ntu} NTU` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={reading.mercury_level_ppb && reading.mercury_level_ppb > 5 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {reading.mercury_level_ppb ? `${reading.mercury_level_ppb} ppb` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={reading.arsenic_level_ppb && reading.arsenic_level_ppb > 10 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {reading.arsenic_level_ppb ? `${reading.arsenic_level_ppb} ppb` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {reading.measured_by}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Warning */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Health Warning</h3>
              <p className="text-red-700 mt-2">
                Do not drink, swim in, or use water from rivers marked as polluted or hazardous.
                Mercury and arsenic contamination can cause serious health problems including:
              </p>
              <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                <li>Neurological damage and developmental issues in children</li>
                <li>Kidney and liver damage</li>
                <li>Skin diseases and rashes</li>
                <li>Increased cancer risk with long-term exposure</li>
              </ul>
              <p className="text-red-700 mt-3 font-medium">
                If you must use water from affected areas, boil it first and avoid long-term consumption.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
