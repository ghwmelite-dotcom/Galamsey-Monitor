export const runtime = 'edge';

import { getSessionFromRequest } from '@/lib/auth-edge';
import { getNotificationById, markNotificationRead, deleteNotification } from '@/lib/db-d1';

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
    const notificationId = parseInt(id);

    const notification = await getNotificationById(notificationId);
    if (!notification) {
      return Response.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.user_id !== parseInt(user.id)) {
      return Response.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body.read) {
      await markNotificationRead(notificationId);
    }

    return Response.json({
      success: true,
      message: 'Notification updated',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    return Response.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const notificationId = parseInt(id);

    const notification = await getNotificationById(notificationId);
    if (!notification) {
      return Response.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (notification.user_id !== parseInt(user.id)) {
      return Response.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteNotification(notificationId);

    return Response.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return Response.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
