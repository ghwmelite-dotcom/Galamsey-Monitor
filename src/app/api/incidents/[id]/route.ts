export const runtime = 'edge';

import { getSessionFromRequest } from '@/lib/auth-edge';
import {
  getIncidentById,
  updateIncidentStatus,
  updateIncidentVerification,
  addIncidentNote,
  createIncidentUpdate,
} from '@/lib/db-d1';
import type { VerificationStatus } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await getIncidentById(parseInt(id));

    if (!incident) {
      return Response.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    return Response.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromRequest(request);

    if (!user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const incidentId = parseInt(id);
    const body = await request.json();

    const incident = await getIncidentById(incidentId);
    if (!incident) {
      return Response.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const userId = parseInt(user.id);
    let updatedIncident;

    // Update status
    if (body.status) {
      const oldStatus = incident.status;
      updatedIncident = await updateIncidentStatus(incidentId, body.status);

      // Record the update
      await createIncidentUpdate({
        incident_id: incidentId,
        user_id: userId,
        update_type: 'status_change',
        old_value: oldStatus,
        new_value: body.status,
        notes: body.notes,
      });
    }

    // Update verification status (admin/moderator only)
    if (body.verification_status) {
      if (!['admin', 'moderator', 'authority'].includes(user.role)) {
        return Response.json(
          { success: false, error: 'Only moderators can verify incidents' },
          { status: 403 }
        );
      }

      updatedIncident = await updateIncidentVerification(
        incidentId,
        body.verification_status as VerificationStatus,
        userId,
        body.admin_notes
      );
    }

    // Add note
    if (body.note) {
      await addIncidentNote(incidentId, userId, body.note);
      updatedIncident = await getIncidentById(incidentId);
    }

    return Response.json({
      success: true,
      data: updatedIncident || await getIncidentById(incidentId),
    });
  } catch (error) {
    console.error('Update incident error:', error);
    return Response.json(
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}
