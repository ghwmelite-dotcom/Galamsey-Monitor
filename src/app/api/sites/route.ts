import { getAllMiningSites, createMiningSite } from '@/lib/db-d1';
import type { MiningSiteInput } from '@/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const status = searchParams.get('status');

    let sites = await getAllMiningSites();

    if (region) {
      sites = sites.filter(s => s.region === region);
    }
    if (status) {
      sites = sites.filter(s => s.status === status);
    }

    return Response.json(sites);
  } catch (error) {
    console.error('Error fetching mining sites:', error);
    return Response.json({ error: 'Failed to fetch mining sites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: MiningSiteInput = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'latitude', 'longitude', 'region', 'district', 'status'];
    for (const field of requiredFields) {
      if (!body[field as keyof MiningSiteInput]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const site = await createMiningSite(body);
    return Response.json(site, { status: 201 });
  } catch (error) {
    console.error('Error creating mining site:', error);
    return Response.json({ error: 'Failed to create mining site' }, { status: 500 });
  }
}
