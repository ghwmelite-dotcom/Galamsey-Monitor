export const runtime = 'edge';

import { getSessionFromRequest } from '@/lib/auth-edge';
import { getAdminStats } from '@/lib/db-d1';

export async function GET(request: Request) {
  try {
    const user = await getSessionFromRequest(request);

    if (!user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin, moderator, or authority can access admin stats
    if (!['admin', 'moderator', 'authority'].includes(user.role)) {
      return Response.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const stats = await getAdminStats();

    return Response.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
