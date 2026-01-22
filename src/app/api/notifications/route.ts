export const runtime = 'edge';

import { getSessionFromRequest } from '@/lib/auth-edge';
import {
  getUserNotifications,
  getUnreadNotifications,
  markAllNotificationsRead,
  createNotification,
} from '@/lib/db-d1';
import type { NotificationInput } from '@/types';

export async function GET(request: Request) {
  try {
    const user = await getSessionFromRequest(request);

    if (!user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const userId = parseInt(user.id);
    const notifications = unreadOnly
      ? await getUnreadNotifications(userId)
      : await getUserNotifications(userId, limit);

    const unreadNotifications = await getUnreadNotifications(userId);
    const unreadCount = unreadNotifications.length;

    return Response.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionFromRequest(request);

    if (!user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can create notifications for other users
    const body = await request.json();
    const { action, ...notificationData } = body;

    if (action === 'markAllRead') {
      const userId = parseInt(user.id);
      const count = await markAllNotificationsRead(userId);
      return Response.json({
        success: true,
        message: `Marked ${count} notifications as read`,
      });
    }

    // Create notification (admin only)
    if (user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Only admins can create notifications' },
        { status: 403 }
      );
    }

    const input: NotificationInput = {
      user_id: notificationData.user_id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      link: notificationData.link,
    };

    const notification = await createNotification(input);

    return Response.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Notification action error:', error);
    return Response.json(
      { success: false, error: 'Failed to process notification action' },
      { status: 500 }
    );
  }
}
