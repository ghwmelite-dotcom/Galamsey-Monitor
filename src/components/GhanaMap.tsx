'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Incident, WaterQualityReading, MiningSite } from '@/types';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

interface MapProps {
  incidents?: Incident[];
  waterReadings?: WaterQualityReading[];
  miningSites?: MiningSite[];
  showLegend?: boolean;
  height?: string;
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

const GHANA_CENTER: [number, number] = [7.9465, -1.0232];

const severityColors = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const waterStatusColors = {
  safe: '#3b82f6',
  moderate: '#f59e0b',
  polluted: '#ef4444',
  hazardous: '#7c3aed',
};

const miningStatusColors = {
  active: '#ef4444',
  inactive: '#6b7280',
  remediated: '#22c55e',
};

export default function GhanaMap({
  incidents = [],
  waterReadings = [],
  miningSites = [],
  showLegend = true,
  height = '500px',
  center = GHANA_CENTER,
  zoom = 7,
  onLocationSelect,
}: MapProps) {
  const [isClient, setIsClient] = useState(false);
  const [icons, setIcons] = useState<Record<string, L.Icon | L.DivIcon> | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet and create icons on client side only
    import('leaflet').then((L) => {
      const createIcon = (color: string) =>
        new L.DivIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

      setIcons({
        incident_low: createIcon(severityColors.low),
        incident_medium: createIcon(severityColors.medium),
        incident_high: createIcon(severityColors.high),
        incident_critical: createIcon(severityColors.critical),
      });
    });
  }, []);

  if (!isClient || !icons) {
    return (
      <div
        style={{ height }}
        className="bg-gray-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div style={{ height }} className="rounded-xl overflow-hidden shadow-lg">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Incident Markers */}
          {incidents.map((incident) => (
            <Marker
              key={`incident-${incident.id}`}
              position={[incident.latitude, incident.longitude]}
              icon={icons[`incident_${incident.severity}`]}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-sm">{incident.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{incident.description.slice(0, 100)}...</p>
                  <div className="mt-2 text-xs">
                    <p><strong>Region:</strong> {incident.region}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{incident.status}</span></p>
                    <p><strong>Severity:</strong> <span className="capitalize">{incident.severity}</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Water Quality Markers */}
          {waterReadings.map((reading) => (
            <CircleMarker
              key={`water-${reading.id}`}
              center={[reading.latitude, reading.longitude]}
              radius={10}
              fillColor={waterStatusColors[reading.quality_status]}
              color={waterStatusColors[reading.quality_status]}
              fillOpacity={0.7}
              weight={2}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-bold text-sm">{reading.water_body_name}</h3>
                  <p className="text-xs text-gray-600">Water Quality Reading</p>
                  <div className="mt-2 text-xs space-y-1">
                    <p><strong>Status:</strong> <span className="capitalize">{reading.quality_status}</span></p>
                    {reading.ph_level && <p><strong>pH:</strong> {reading.ph_level}</p>}
                    {reading.turbidity_ntu && <p><strong>Turbidity:</strong> {reading.turbidity_ntu} NTU</p>}
                    {reading.mercury_level_ppb && <p><strong>Mercury:</strong> {reading.mercury_level_ppb} ppb</p>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Mining Site Markers */}
          {miningSites.map((site) => (
            <CircleMarker
              key={`site-${site.id}`}
              center={[site.latitude, site.longitude]}
              radius={Math.max(8, Math.sqrt((site.estimated_area_hectares || 10) * 2))}
              fillColor={miningStatusColors[site.status]}
              color="#000"
              fillOpacity={0.5}
              weight={1}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-bold text-sm">{site.name}</h3>
                  <p className="text-xs text-gray-600">Mining Site</p>
                  <div className="mt-2 text-xs space-y-1">
                    <p><strong>Status:</strong> <span className="capitalize">{site.status}</span></p>
                    <p><strong>Region:</strong> {site.region}</p>
                    {site.estimated_area_hectares && (
                      <p><strong>Area:</strong> {site.estimated_area_hectares} ha</p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {showLegend && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-[1000]">
          <h4 className="font-bold mb-2">Legend</h4>
          <div className="space-y-2">
            <div>
              <p className="font-medium text-gray-700">Incident Severity</p>
              <div className="flex gap-2 mt-1">
                {Object.entries(severityColors).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700">Water Quality</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {Object.entries(waterStatusColors).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
