import { getAllIncidents, createIncident } from '@/lib/db-d1';
import type { IncidentInput } from '@/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const status = searchParams.get('status');

    let incidents = await getAllIncidents();

    if (region) {
      incidents = incidents.filter(i => i.region === region);
    }
    if (status) {
      incidents = incidents.filter(i => i.status === status);
    }

    return Response.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return Response.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: IncidentInput = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description', 'latitude', 'longitude', 'region', 'district', 'reported_by', 'severity', 'incident_type'];
    for (const field of requiredFields) {
      if (!body[field as keyof IncidentInput]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate coordinates are within Ghana
    if (body.latitude < 4.5 || body.latitude > 11.5 || body.longitude < -3.5 || body.longitude > 1.5) {
      return Response.json({ error: 'Coordinates must be within Ghana' }, { status: 400 });
    }

    const incident = await createIncident(body);
    return Response.json(incident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return Response.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}
