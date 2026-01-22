import { getAllWaterReadings, createWaterReading } from '@/lib/db-d1';
import type { WaterQualityInput } from '@/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const status = searchParams.get('status');

    let readings = await getAllWaterReadings();

    if (region) {
      readings = readings.filter(r => r.region === region);
    }
    if (status) {
      readings = readings.filter(r => r.quality_status === status);
    }

    return Response.json(readings);
  } catch (error) {
    console.error('Error fetching water readings:', error);
    return Response.json({ error: 'Failed to fetch water readings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: WaterQualityInput = await request.json();

    // Validate required fields
    const requiredFields = ['water_body_name', 'latitude', 'longitude', 'region', 'quality_status', 'measured_by'];
    for (const field of requiredFields) {
      if (!body[field as keyof WaterQualityInput]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const reading = await createWaterReading(body);
    return Response.json(reading, { status: 201 });
  } catch (error) {
    console.error('Error creating water reading:', error);
    return Response.json({ error: 'Failed to create water reading' }, { status: 500 });
  }
}
