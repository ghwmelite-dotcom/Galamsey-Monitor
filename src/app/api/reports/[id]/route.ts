import { getIncidentById, getWaterReadingById, getMiningSiteById, getDashboardStats } from '@/lib/db-d1';
import { generateIncidentReport, generateWaterQualityReport, generateMiningSiteReport, generateSummaryReport, getPdfBuffer } from '@/lib/pdf';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'incident';

    let pdf;
    let filename;

    switch (type) {
      case 'incident': {
        const incident = await getIncidentById(parseInt(id));
        if (!incident) {
          return Response.json(
            { success: false, error: 'Incident not found' },
            { status: 404 }
          );
        }
        pdf = generateIncidentReport(incident);
        filename = `incident-report-${id}.pdf`;
        break;
      }

      case 'water': {
        const reading = await getWaterReadingById(parseInt(id));
        if (!reading) {
          return Response.json(
            { success: false, error: 'Water quality reading not found' },
            { status: 404 }
          );
        }
        pdf = generateWaterQualityReport(reading);
        filename = `water-quality-report-${id}.pdf`;
        break;
      }

      case 'site': {
        const site = await getMiningSiteById(parseInt(id));
        if (!site) {
          return Response.json(
            { success: false, error: 'Mining site not found' },
            { status: 404 }
          );
        }
        pdf = generateMiningSiteReport(site);
        filename = `mining-site-report-${id}.pdf`;
        break;
      }

      case 'summary': {
        const stats = await getDashboardStats();
        pdf = generateSummaryReport(stats, 'ENVIRONMENTAL MONITORING SUMMARY');
        filename = `galamsey-summary-report.pdf`;
        break;
      }

      default:
        return Response.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    const buffer = getPdfBuffer(pdf);
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
