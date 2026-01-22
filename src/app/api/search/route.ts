import { globalSearch, searchIncidents, searchWaterBodies, searchMiningSites } from '@/lib/db-d1';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'incidents', 'water', 'sites'
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!query || query.trim().length < 2) {
      return Response.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    let results;

    switch (type) {
      case 'incidents':
        results = await searchIncidents(query, limit);
        break;
      case 'water':
        results = await searchWaterBodies(query, limit);
        break;
      case 'sites':
        results = await searchMiningSites(query, limit);
        break;
      default:
        results = await globalSearch(query, limit);
    }

    return Response.json({
      success: true,
      data: results,
      query,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
