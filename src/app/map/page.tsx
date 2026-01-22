'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import GhanaMap from '@/components/GhanaMap';
import type { Incident, WaterQualityReading, MiningSite } from '@/types';

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [waterReadings, setWaterReadings] = useState<WaterQualityReading[]>([]);
  const [miningSites, setMiningSites] = useState<MiningSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [incidentsRes, waterRes, sitesRes] = await Promise.all([
          fetch('/api/incidents'),
          fetch('/api/water'),
          fetch('/api/sites'),
        ]);

        const [incidentsData, waterData, sitesData] = await Promise.all([
          incidentsRes.json(),
          waterRes.json(),
          sitesRes.json(),
        ]);

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

  const activeIncidents = incidents.filter(i => i.status === 'active');
  const pollutedWaters = waterReadings.filter(r => ['polluted', 'hazardous'].includes(r.quality_status));
  const activeSites = miningSites.filter(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Incident Map</h1>
          <p className="text-gray-600 mt-2">
            Interactive map showing all reported incidents, water quality readings, and detected mining sites.
          </p>
        </div>

        {/* Filter Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Incidents</span>
              <span className="font-bold text-lg">{incidents.length}</span>
            </div>
            <div className="text-red-600 text-sm mt-1">{activeIncidents.length} active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Water Bodies</span>
              <span className="font-bold text-lg">{waterReadings.length}</span>
            </div>
            <div className="text-orange-600 text-sm mt-1">{pollutedWaters.length} polluted</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Mining Sites</span>
              <span className="font-bold text-lg">{miningSites.length}</span>
            </div>
            <div className="text-red-600 text-sm mt-1">{activeSites.length} active</div>
          </div>
          <div className="bg-ghana-green text-white rounded-lg shadow p-4">
            <div className="text-sm">Total Area Affected</div>
            <div className="font-bold text-lg">
              {miningSites.reduce((sum, s) => sum + (s.estimated_area_hectares || 0), 0).toFixed(1)} ha
            </div>
          </div>
        </div>

        {/* Full-width Map */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <GhanaMap
            incidents={incidents}
            waterReadings={waterReadings}
            miningSites={miningSites}
            height="600px"
            showLegend={true}
          />
        </div>

        {/* Incident List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Reported Incidents</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                      <div className="text-sm text-gray-500">{incident.description.slice(0, 60)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {incident.region}, {incident.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {incident.incident_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${
                        incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${
                        incident.status === 'active' ? 'status-active' :
                        incident.status === 'investigating' ? 'status-investigating' :
                        'status-resolved'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
