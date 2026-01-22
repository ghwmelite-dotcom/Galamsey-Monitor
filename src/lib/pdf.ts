import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Incident, WaterQualityReading, MiningSite, DashboardStats } from '@/types';
import { format } from 'date-fns';

// Extend jsPDF to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

// Ghana Government Letterhead Colors
const COLORS = {
  primary: [0, 107, 63] as [number, number, number],     // Ghana Green
  secondary: [252, 209, 22] as [number, number, number], // Ghana Gold
  accent: [206, 17, 38] as [number, number, number],     // Ghana Red
  black: [0, 0, 0] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
};

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  low: [34, 197, 94],
  medium: [245, 158, 11],
  high: [239, 68, 68],
  critical: [220, 38, 38],
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  active: [239, 68, 68],
  investigating: [245, 158, 11],
  resolved: [34, 197, 94],
};

const WATER_STATUS_COLORS: Record<string, [number, number, number]> = {
  safe: [34, 197, 94],
  moderate: [245, 158, 11],
  polluted: [239, 68, 68],
  hazardous: [220, 38, 38],
};

function addHeader(doc: jsPDF, title: string): number {
  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 35, 'F');

  // Gold accent line
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 35, 210, 3, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GALAMSEY MONITOR', 105, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 105, 25, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  return 45; // Return Y position after header
}

function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height;

  // Footer line
  doc.setDrawColor(...COLORS.gray);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(
    'Galamsey Monitor - Environmental Protection Initiative | Generated: ' + format(new Date(), 'PPpp'),
    20,
    pageHeight - 12
  );
  doc.text(`Page ${pageNumber}`, 190, pageHeight - 12, { align: 'right' });

  // Reset
  doc.setTextColor(0, 0, 0);
}

export function generateIncidentReport(incident: Incident): jsPDF {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  let y = addHeader(doc, 'INCIDENT REPORT');

  // Incident ID and Date
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Report ID: INC-${incident.id.toString().padStart(6, '0')}`, 20, y);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 190, y, { align: 'right' });
  y += 10;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'bold');
  doc.text(incident.title, 20, y);
  y += 10;

  // Status badges
  const severityColor = SEVERITY_COLORS[incident.severity] || COLORS.gray;
  const statusColor = STATUS_COLORS[incident.status] || COLORS.gray;

  // Severity badge
  doc.setFillColor(...severityColor);
  doc.roundedRect(20, y - 5, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(incident.severity.toUpperCase(), 35, y, { align: 'center' });

  // Status badge
  doc.setFillColor(...statusColor);
  doc.roundedRect(55, y - 5, 35, 8, 2, 2, 'F');
  doc.text(incident.status.toUpperCase(), 72.5, y, { align: 'center' });

  y += 15;

  // Description
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitDescription = doc.splitTextToSize(incident.description, 170);
  doc.text(splitDescription, 20, y);
  y += splitDescription.length * 5 + 10;

  // Details table
  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: [
      ['Incident Type', incident.incident_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
      ['Region', incident.region],
      ['District', incident.district],
      ['Coordinates', `${incident.latitude.toFixed(6)}, ${incident.longitude.toFixed(6)}`],
      ['Reported By', incident.reported_by],
      ['Contact', incident.contact_phone || 'Not provided'],
      ['Reported On', format(new Date(incident.created_at), 'PPpp')],
      ['Last Updated', format(new Date(incident.updated_at), 'PPpp')],
      ['Verification Status', (incident.verification_status || 'pending').replace(/\b\w/g, l => l.toUpperCase())],
    ],
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: 20, right: 20 },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Map placeholder section
  if (y < 220) {
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(20, y, 170, 50, 3, 3, 'F');
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(10);
    doc.text('Map Location', 105, y + 25, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Coordinates: ${incident.latitude.toFixed(6)}, ${incident.longitude.toFixed(6)}`, 105, y + 35, { align: 'center' });
  }

  addFooter(doc, 1);

  return doc;
}

export function generateWaterQualityReport(reading: WaterQualityReading): jsPDF {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  let y = addHeader(doc, 'WATER QUALITY REPORT');

  // Report ID and Date
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Report ID: WQ-${reading.id.toString().padStart(6, '0')}`, 20, y);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 190, y, { align: 'right' });
  y += 10;

  // Water body name
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'bold');
  doc.text(reading.water_body_name, 20, y);
  y += 10;

  // Status badge
  const statusColor = WATER_STATUS_COLORS[reading.quality_status] || COLORS.gray;
  doc.setFillColor(...statusColor);
  doc.roundedRect(20, y - 5, 35, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(reading.quality_status.toUpperCase(), 37.5, y, { align: 'center' });

  y += 15;

  // Location info
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Region: ${reading.region}`, 20, y);
  doc.text(`Coordinates: ${reading.latitude.toFixed(6)}, ${reading.longitude.toFixed(6)}`, 20, y + 6);
  y += 20;

  // Measurements table
  const measurements: [string, string, string][] = [];

  if (reading.ph_level !== undefined) {
    const phStatus = reading.ph_level < 6.5 || reading.ph_level > 8.5 ? 'Outside normal range' : 'Normal';
    measurements.push(['pH Level', reading.ph_level.toString(), phStatus]);
  }
  if (reading.turbidity_ntu !== undefined) {
    const turbidityStatus = reading.turbidity_ntu > 5 ? 'Elevated' : 'Normal';
    measurements.push(['Turbidity', `${reading.turbidity_ntu} NTU`, turbidityStatus]);
  }
  if (reading.mercury_level_ppb !== undefined) {
    const mercuryStatus = reading.mercury_level_ppb > 2 ? 'EXCEEDS SAFE LIMIT' : 'Within safe limits';
    measurements.push(['Mercury', `${reading.mercury_level_ppb} ppb`, mercuryStatus]);
  }
  if (reading.arsenic_level_ppb !== undefined) {
    const arsenicStatus = reading.arsenic_level_ppb > 10 ? 'EXCEEDS SAFE LIMIT' : 'Within safe limits';
    measurements.push(['Arsenic', `${reading.arsenic_level_ppb} ppb`, arsenicStatus]);
  }
  if (reading.lead_level_ppb !== undefined) {
    const leadStatus = reading.lead_level_ppb > 10 ? 'EXCEEDS SAFE LIMIT' : 'Within safe limits';
    measurements.push(['Lead', `${reading.lead_level_ppb} ppb`, leadStatus]);
  }
  if (reading.dissolved_oxygen_mgl !== undefined) {
    const doStatus = reading.dissolved_oxygen_mgl < 5 ? 'Low (poor aquatic health)' : 'Adequate';
    measurements.push(['Dissolved Oxygen', `${reading.dissolved_oxygen_mgl} mg/L`, doStatus]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Parameter', 'Value', 'Assessment']],
    body: measurements,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      2: {
        cellWidth: 60,
      },
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const text = data.cell.raw as string;
        if (text.includes('EXCEEDS') || text.includes('poor')) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 20, right: 20 },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Notes
  if (reading.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(reading.notes, 170);
    doc.text(splitNotes, 20, y);
    y += splitNotes.length * 5 + 10;
  }

  // Measurement info
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(20, y, 170, 25, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Measured by: ${reading.measured_by}`, 25, y + 10);
  doc.text(`Measurement date: ${format(new Date(reading.measured_at), 'PPpp')}`, 25, y + 18);

  addFooter(doc, 1);

  return doc;
}

export function generateSummaryReport(stats: DashboardStats, title: string = 'SUMMARY REPORT'): jsPDF {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  let y = addHeader(doc, title);

  // Date range
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Report Period: ${format(new Date(), 'MMMM yyyy')}`, 20, y);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 190, y, { align: 'right' });
  y += 15;

  // Key Statistics
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Statistics', 20, y);
  y += 10;

  // Stats boxes
  const statsData = [
    { label: 'Total Incidents', value: stats.totalIncidents, color: COLORS.primary },
    { label: 'Active Incidents', value: stats.activeIncidents, color: SEVERITY_COLORS.high },
    { label: 'Polluted Water Bodies', value: stats.pollutedWaterBodies, color: WATER_STATUS_COLORS.hazardous },
    { label: 'Active Mining Sites', value: stats.activeMiningSites, color: COLORS.accent },
  ];

  const boxWidth = 40;
  const boxHeight = 25;
  const startX = 20;

  statsData.forEach((stat, index) => {
    const x = startX + (index * (boxWidth + 5));
    doc.setFillColor(...stat.color);
    doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value.toString(), x + boxWidth / 2, y + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, x + boxWidth / 2, y + 20, { align: 'center' });
  });

  y += boxHeight + 15;

  // Incidents by Region
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Incidents by Region', 20, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Region', 'Count', 'Percentage']],
    body: stats.incidentsByRegion.map(r => [
      r.region,
      r.count.toString(),
      `${((r.count / stats.totalIncidents) * 100).toFixed(1)}%`,
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: 20, right: 110 },
  });

  // Incidents by Type
  const typeTableY = y;
  autoTable(doc, {
    startY: typeTableY,
    head: [['Type', 'Count']],
    body: stats.incidentsByType.map(t => [
      t.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      t.count.toString(),
    ]),
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: 115, right: 20 },
  });

  y = Math.max(doc.lastAutoTable.finalY, doc.lastAutoTable.finalY) + 15;

  // Recent Incidents
  if (stats.recentIncidents.length > 0 && y < 220) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Incidents', 20, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Title', 'Region', 'Severity', 'Status']],
      body: stats.recentIncidents.map(i => [
        `INC-${i.id.toString().padStart(4, '0')}`,
        i.title.length > 30 ? i.title.substring(0, 30) + '...' : i.title,
        i.region,
        i.severity.toUpperCase(),
        i.status.toUpperCase(),
      ]),
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
      margin: { left: 20, right: 20 },
    });
  }

  addFooter(doc, 1);

  return doc;
}

export function generateMiningSiteReport(site: MiningSite): jsPDF {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  let y = addHeader(doc, 'MINING SITE REPORT');

  // Report ID and Date
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Site ID: MS-${site.id.toString().padStart(6, '0')}`, 20, y);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 190, y, { align: 'right' });
  y += 10;

  // Site name
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.black);
  doc.setFont('helvetica', 'bold');
  doc.text(site.name, 20, y);
  y += 10;

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    active: [239, 68, 68],
    inactive: [156, 163, 175],
    remediated: [34, 197, 94],
  };
  const statusColor = statusColors[site.status] || COLORS.gray;
  doc.setFillColor(...statusColor);
  doc.roundedRect(20, y - 5, 35, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(site.status.toUpperCase(), 37.5, y, { align: 'center' });

  y += 15;

  // Details table
  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: [
      ['Region', site.region],
      ['District', site.district],
      ['Coordinates', `${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)}`],
      ['Estimated Area', site.estimated_area_hectares ? `${site.estimated_area_hectares} hectares` : 'Unknown'],
      ['First Detected', format(new Date(site.first_detected), 'PPpp')],
      ['Last Activity', site.last_activity_detected ? format(new Date(site.last_activity_detected), 'PPpp') : 'N/A'],
      ['Status', site.status.replace(/\b\w/g, l => l.toUpperCase())],
    ],
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: 20, right: 20 },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Notes
  if (site.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.black);
    doc.text('Notes:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(site.notes, 170);
    doc.text(splitNotes, 20, y);
  }

  addFooter(doc, 1);

  return doc;
}

// Helper to get PDF as buffer for API responses
export function getPdfBuffer(doc: jsPDF): Buffer {
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// Helper to get PDF as base64
export function getPdfBase64(doc: jsPDF): string {
  return doc.output('datauristring');
}
