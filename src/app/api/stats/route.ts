import { getDashboardStats } from '@/lib/db-d1';

export const runtime = 'edge';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return Response.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return Response.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
