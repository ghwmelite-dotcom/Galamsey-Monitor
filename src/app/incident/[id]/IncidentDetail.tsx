'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  Clock,
  Download,
  Share2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Copy,
  Twitter,
  Facebook,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Incident, IncidentUpdate, Evidence } from '@/types';
import dynamic from 'next/dynamic';

const GhanaMap = dynamic(() => import('@/components/GhanaMap'), { ssr: false });

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

const verificationStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  duplicate: 'bg-purple-100 text-purple-800',
};

const incidentTypeLabels: Record<string, string> = {
  illegal_mining: 'Illegal Mining',
  water_pollution: 'Water Pollution',
  deforestation: 'Deforestation',
  land_degradation: 'Land Degradation',
};

const updateTypeIcons: Record<string, typeof CheckCircle> = {
  status_change: Clock,
  verification: CheckCircle,
  note: MessageSquare,
  evidence_added: FileText,
  assignment: User,
  priority_change: AlertTriangle,
};

export default function IncidentDetail() {
  const params = useParams();
  const id = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    async function fetchIncident() {
      try {
        const response = await fetch(`/api/incidents/${id}`);
        if (!response.ok) {
          throw new Error('Incident not found');
        }
        const data = await response.json();
        setIncident(data);

        // Fetch updates and evidence
        const [updatesRes, evidenceRes] = await Promise.all([
          fetch(`/api/incidents/${id}/updates`).catch(() => ({ ok: false })),
          fetch(`/api/incidents/${id}/evidence`).catch(() => ({ ok: false })),
        ]);

        if (updatesRes.ok) {
          const updatesData = await (updatesRes as Response).json();
          setUpdates(updatesData.data || []);
        }

        if (evidenceRes.ok) {
          const evidenceData = await (evidenceRes as Response).json();
          setEvidence(evidenceData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incident');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchIncident();
    }
  }, [id]);

  const handleDownloadPdf = () => {
    window.open(`/api/reports/${id}?type=incident`, '_blank');
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = incident?.title || 'Galamsey Incident Report';
    const text = `Check out this incident report: ${title}`;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
    }
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghana-green"></div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Incident Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested incident could not be found.'}</p>
          <Link
            href="/map"
            className="inline-flex items-center px-4 py-2 bg-ghana-green text-white rounded-lg hover:bg-ghana-green/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/map"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Map
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="inline-flex items-center px-3 py-2 bg-ghana-green text-white rounded-lg text-sm hover:bg-ghana-green/90"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityColors[incident.severity]}`}>
                  {incident.severity.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
                  {incident.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${verificationStatusColors[incident.verification_status || 'pending']}`}>
                  {(incident.verification_status || 'pending').toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {incidentTypeLabels[incident.incident_type]}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{incident.title}</h1>

              <p className="text-gray-600 leading-relaxed">{incident.description}</p>

              {incident.admin_notes && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">Admin Notes</h3>
                  <p className="text-sm text-yellow-700">{incident.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <GhanaMap
                  incidents={[incident]}
                  height="300px"
                  center={[incident.latitude, incident.longitude]}
                  zoom={12}
                />
              </div>
            </div>

            {/* Evidence Gallery */}
            {evidence.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence ({evidence.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {evidence.map((item) => (
                    <div key={item.id} className="relative group">
                      {item.file_type === 'image' ? (
                        <img
                          src={item.thumbnail_url || item.file_url}
                          alt={item.description || 'Evidence'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <span className="text-white text-sm">View</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
              <div className="space-y-4">
                {/* Initial report */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-ghana-green/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-ghana-green" />
                    </div>
                  </div>
                  <div className="flex-1 pb-4 border-b">
                    <p className="text-sm font-medium text-gray-900">Incident Reported</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Reported by {incident.reported_by}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(incident.created_at), 'PPpp')}
                    </p>
                  </div>
                </div>

                {/* Updates */}
                {updates.map((update) => {
                  const Icon = updateTypeIcons[update.update_type] || Clock;
                  return (
                    <div key={update.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1 pb-4 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {update.update_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        {update.old_value && update.new_value && (
                          <p className="text-sm text-gray-500 mt-1">
                            Changed from <span className="font-medium">{update.old_value}</span> to{' '}
                            <span className="font-medium">{update.new_value}</span>
                          </p>
                        )}
                        {update.notes && (
                          <p className="text-sm text-gray-600 mt-1">{update.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(update.created_at), 'PPpp')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{incident.district}</p>
                    <p className="text-sm text-gray-500">{incident.region} Region</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(incident.created_at), 'PPP')}
                    </p>
                    <p className="text-sm text-gray-500">Date Reported</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{incident.reported_by}</p>
                    <p className="text-sm text-gray-500">Reporter</p>
                  </div>
                </div>

                {incident.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{incident.contact_phone}</p>
                      <p className="text-sm text-gray-500">Contact</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coordinates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">GPS Coordinates</h2>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <p>Latitude: {incident.latitude.toFixed(6)}</p>
                <p>Longitude: {incident.longitude.toFixed(6)}</p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center text-sm text-ghana-green hover:underline"
              >
                Open in Google Maps
              </a>
            </div>

            {/* Report ID */}
            <div className="bg-gray-100 rounded-xl p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Report ID</p>
              <p className="text-lg font-mono font-bold text-gray-900">
                INC-{incident.id.toString().padStart(6, '0')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {format(new Date(incident.updated_at), 'PPpp')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
