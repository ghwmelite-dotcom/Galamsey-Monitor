import { getIncidentById, getIncidentUpdates } from '@/lib/db-d1';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incidentId = parseInt(id);

    const incident = await getIncidentById(incidentId);
    if (!incident) {
      return Response.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const updates = await getIncidentUpdates(incidentId);

    return Response.json({
      success: true,
      data: updates,
    });
  } catch (error) {
    console.error('Get incident updates error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch incident updates' },
      { status: 500 }
    );
  }
}
