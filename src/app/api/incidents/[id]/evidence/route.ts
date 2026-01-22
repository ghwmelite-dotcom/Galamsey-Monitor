export const runtime = 'edge';

import { getSessionFromRequest } from '@/lib/auth-edge';
import { getIncidentById, getIncidentEvidence, createEvidence, createIncidentUpdate } from '@/lib/db-d1';
import type { FileType } from '@/types';

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

    const evidence = await getIncidentEvidence(incidentId);

    return Response.json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    console.error('Get incident evidence error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch incident evidence' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromRequest(request);
    const { id } = await params;
    const incidentId = parseInt(id);

    const incident = await getIncidentById(incidentId);
    if (!incident) {
      return Response.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const evidence = await createEvidence({
      incident_id: incidentId,
      file_url: body.file_url,
      file_type: body.file_type as FileType,
      file_name: body.file_name,
      file_size: body.file_size,
      thumbnail_url: body.thumbnail_url,
      uploaded_by: user?.id ? parseInt(user.id) : undefined,
      description: body.description,
    });

    // Record the update
    await createIncidentUpdate({
      incident_id: incidentId,
      user_id: user?.id ? parseInt(user.id) : undefined,
      update_type: 'evidence_added',
      new_value: evidence.file_name,
    });

    return Response.json({
      success: true,
      data: evidence,
    });
  } catch (error) {
    console.error('Add evidence error:', error);
    return Response.json(
      { success: false, error: 'Failed to add evidence' },
      { status: 500 }
    );
  }
}
