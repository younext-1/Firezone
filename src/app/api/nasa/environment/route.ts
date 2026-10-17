import { NextRequest, NextResponse } from 'next/server';
import { fuseNasaPointTelemetry } from '@/lib/nasaDataFusion';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { error: 'Missing required query parameters: "lat" and "lng"' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided. lat must be between -90 and 90, lng between -180 and 180.' },
      { status: 400 }
    );
  }

  try {
    const telemetry = await fuseNasaPointTelemetry(lat, lng);

    return NextResponse.json(telemetry, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    console.error('Error computing NASA point telemetry fusion:', err);
    return NextResponse.json(
      { error: 'Failed to fuse NASA point telemetry', message: err.message },
      { status: 500 }
    );
  }
}
