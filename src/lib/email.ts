import { Resend } from 'resend';
import type { Incident, WaterQualityReading } from '@/types';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'Galamsey Monitor <notifications@galamsey.gov.gh>';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn('Email service not configured. Set RESEND_API_KEY in environment.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email Templates
export function getNewIncidentEmailHtml(incident: Incident): string {
  const severityColors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };

  const incidentTypeLabels: Record<string, string> = {
    illegal_mining: 'Illegal Mining',
    water_pollution: 'Water Pollution',
    deforestation: 'Deforestation',
    land_degradation: 'Land Degradation',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Incident Report - Galamsey Monitor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #006B3F 0%, #004d2e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #FCD116; margin: 0; font-size: 24px;">Galamsey Monitor</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Environmental Protection Alert</p>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">New Incident Reported</strong>
      </div>

      <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">${incident.title}</h2>

      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <span style="background: ${severityColors[incident.severity]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          ${incident.severity}
        </span>
        <span style="background: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
          ${incidentTypeLabels[incident.incident_type] || incident.incident_type}
        </span>
      </div>

      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        ${incident.description}
      </p>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Location Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Region:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${incident.region}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">District:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${incident.district}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Coordinates:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reported by:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${incident.reported_by}</td>
          </tr>
        </table>
      </div>

      <a href="${APP_URL}/incident/${incident.id}" style="display: inline-block; background: #006B3F; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Full Report
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Galamsey Monitor - Protecting Ghana's Environment</p>
      <p style="margin: 0;">
        <a href="${APP_URL}/settings/notifications" style="color: #006B3F; text-decoration: none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getStatusUpdateEmailHtml(incident: Incident, oldStatus: string, newStatus: string): string {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    investigating: 'Under Investigation',
    resolved: 'Resolved',
  };

  const statusColors: Record<string, string> = {
    active: '#ef4444',
    investigating: '#f59e0b',
    resolved: '#22c55e',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Incident Status Update - Galamsey Monitor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #006B3F 0%, #004d2e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #FCD116; margin: 0; font-size: 24px;">Galamsey Monitor</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Status Update</p>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">${incident.title}</h2>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #374151; font-size: 14px;">Status has been updated</p>
        <div style="display: inline-flex; align-items: center; gap: 15px;">
          <span style="background: ${statusColors[oldStatus] || '#9ca3af'}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;">
            ${statusLabels[oldStatus] || oldStatus}
          </span>
          <span style="color: #9ca3af; font-size: 20px;">→</span>
          <span style="background: ${statusColors[newStatus] || '#9ca3af'}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;">
            ${statusLabels[newStatus] || newStatus}
          </span>
        </div>
      </div>

      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>Location:</strong> ${incident.district}, ${incident.region}
      </p>

      <a href="${APP_URL}/incident/${incident.id}" style="display: inline-block; background: #006B3F; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Incident Details
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Galamsey Monitor - Protecting Ghana's Environment</p>
      <p style="margin: 0;">
        <a href="${APP_URL}/settings/notifications" style="color: #006B3F; text-decoration: none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getWaterAlertEmailHtml(reading: WaterQualityReading): string {
  const statusColors: Record<string, string> = {
    safe: '#22c55e',
    moderate: '#f59e0b',
    polluted: '#ef4444',
    hazardous: '#dc2626',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Water Quality Alert - Galamsey Monitor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Water Quality Alert</h1>
      <p style="color: #fecaca; margin: 10px 0 0 0;">Galamsey Monitor</p>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <strong style="color: #991b1b;">Warning: ${reading.quality_status.toUpperCase()} water quality detected</strong>
      </div>

      <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">${reading.water_body_name}</h2>

      <span style="display: inline-block; background: ${statusColors[reading.quality_status]}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px;">
        ${reading.quality_status}
      </span>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Measurements</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${reading.ph_level ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">pH Level:</td><td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${reading.ph_level}</td></tr>` : ''}
          ${reading.turbidity_ntu ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Turbidity:</td><td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${reading.turbidity_ntu} NTU</td></tr>` : ''}
          ${reading.mercury_level_ppb ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mercury:</td><td style="padding: 8px 0; color: ${reading.mercury_level_ppb > 2 ? '#dc2626' : '#1f2937'}; font-size: 14px; font-weight: 500;">${reading.mercury_level_ppb} ppb</td></tr>` : ''}
          ${reading.arsenic_level_ppb ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Arsenic:</td><td style="padding: 8px 0; color: ${reading.arsenic_level_ppb > 10 ? '#dc2626' : '#1f2937'}; font-size: 14px; font-weight: 500;">${reading.arsenic_level_ppb} ppb</td></tr>` : ''}
        </table>
      </div>

      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>Location:</strong> ${reading.region}<br>
        <strong>Measured by:</strong> ${reading.measured_by}
      </p>

      <a href="${APP_URL}/water" style="display: inline-block; background: #006B3F; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Water Quality Data
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Galamsey Monitor - Protecting Ghana's Environment</p>
      <p style="margin: 0;">
        <a href="${APP_URL}/settings/notifications" style="color: #006B3F; text-decoration: none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getWeeklyDigestEmailHtml(stats: {
  newIncidents: number;
  resolvedIncidents: number;
  pollutedWaterBodies: number;
  topRegions: { region: string; count: number }[];
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Digest - Galamsey Monitor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #006B3F 0%, #004d2e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #FCD116; margin: 0; font-size: 24px;">Weekly Digest</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Galamsey Monitor</p>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">This Week's Summary</h2>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #92400e;">${stats.newIncidents}</div>
          <div style="font-size: 12px; color: #a16207; text-transform: uppercase; letter-spacing: 0.5px;">New Incidents</div>
        </div>
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #166534;">${stats.resolvedIncidents}</div>
          <div style="font-size: 12px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Resolved</div>
        </div>
      </div>

      <div style="background: #fee2e2; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <div style="font-size: 28px; font-weight: 700; color: #991b1b;">${stats.pollutedWaterBodies}</div>
        <div style="font-size: 12px; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">Polluted Water Bodies</div>
      </div>

      ${stats.topRegions.length > 0 ? `
      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Most Affected Regions</h3>
      <ul style="margin: 0 0 25px 0; padding: 0; list-style: none;">
        ${stats.topRegions.slice(0, 5).map((r, i) => `
          <li style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #374151;">${i + 1}. ${r.region}</span>
            <span style="color: #6b7280; font-weight: 500;">${r.count} incidents</span>
          </li>
        `).join('')}
      </ul>
      ` : ''}

      <a href="${APP_URL}/statistics" style="display: inline-block; background: #006B3F; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Full Statistics
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Galamsey Monitor - Protecting Ghana's Environment</p>
      <p style="margin: 0;">
        <a href="${APP_URL}/settings/notifications" style="color: #006B3F; text-decoration: none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper functions for sending specific email types
export async function sendNewIncidentEmail(to: string, incident: Incident) {
  return sendEmail({
    to,
    subject: `[Alert] New ${incident.severity.toUpperCase()} Incident: ${incident.title}`,
    html: getNewIncidentEmailHtml(incident),
  });
}

export async function sendStatusUpdateEmail(to: string, incident: Incident, oldStatus: string, newStatus: string) {
  return sendEmail({
    to,
    subject: `[Update] Incident Status Changed: ${incident.title}`,
    html: getStatusUpdateEmailHtml(incident, oldStatus, newStatus),
  });
}

export async function sendWaterAlertEmail(to: string, reading: WaterQualityReading) {
  return sendEmail({
    to,
    subject: `[ALERT] ${reading.quality_status.toUpperCase()} Water Quality: ${reading.water_body_name}`,
    html: getWaterAlertEmailHtml(reading),
  });
}

export async function sendWeeklyDigestEmail(to: string, stats: Parameters<typeof getWeeklyDigestEmailHtml>[0]) {
  return sendEmail({
    to,
    subject: 'Your Weekly Galamsey Monitor Digest',
    html: getWeeklyDigestEmailHtml(stats),
  });
}
