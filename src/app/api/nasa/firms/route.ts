import { NextRequest, NextResponse } from 'next/server';
import {
  ActiveFireHotspot,
  FireFeatureCollection,
  FireHotspotGeoJSONFeature,
  FireIntensityCategory,
} from '@/types/nasa';

// Default Morocco bounding box: minLng, minLat, maxLng, maxLat
const DEFAULT_MOROCCO_BBOX = '-13.5,27.5,-1.0,36.0';
const DEFAULT_DAYS = '2';

function calculateIntensityCategory(frp: number): FireIntensityCategory {
  if (frp >= 100) return 'EXTREME';
  if (frp >= 50) return 'HIGH';
  if (frp >= 10) return 'MEDIUM';
  return 'LOW';
}

function getStyleForIntensity(category: FireIntensityCategory): { color: string; radius: number } {
  switch (category) {
    case 'EXTREME':
      return { color: '#ff0033', radius: 15 };
    case 'HIGH':
      return { color: '#ff4d00', radius: 12 };
    case 'MEDIUM':
      return { color: '#ff9900', radius: 9 };
    case 'LOW':
    default:
      return { color: '#ffd000', radius: 6 };
  }
}

/**
 * Realistic Moroccan Forest Fire Hotspots for development and fallback
 */
function getMoroccoFallbackHotspots(): ActiveFireHotspot[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'VIIRS-MA-001',
      latitude: 31.2842,
      longitude: -9.6821,
      bright_ti4: 338.4,
      bright_ti5: 299.1,
      frp: 38.6,
      confidence: 'nominal',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '13:42',
      daynight: 'D',
      regionName: 'Essaouira - Smimou Argan Woodlands',
    },
    {
      id: 'VIIRS-MA-002',
      latitude: 31.0254,
      longitude: -9.7128,
      bright_ti4: 326.8,
      bright_ti5: 294.6,
      frp: 18.2,
      confidence: 'nominal',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '13:42',
      daynight: 'D',
      regionName: 'Haha Plateau - Tamanar Thuya Forest',
    },
    {
      id: 'VIIRS-MA-003',
      latitude: 35.1581,
      longitude: -5.1743,
      bright_ti4: 368.5,
      bright_ti5: 315.2,
      frp: 128.4,
      confidence: 'high',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '02:18',
      daynight: 'N',
      regionName: 'Chefchaouen - Talassemtane Ridge (Maritime Pine)',
    },
    {
      id: 'VIIRS-MA-004',
      latitude: 35.0624,
      longitude: -5.2152,
      bright_ti4: 349.2,
      bright_ti5: 305.1,
      frp: 68.7,
      confidence: 'high',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '14:05',
      daynight: 'D',
      regionName: 'Chefchaouen - Bab Taza (Cork Oak)',
    },
    {
      id: 'VIIRS-MA-005',
      latitude: 34.1837,
      longitude: -4.1205,
      bright_ti4: 344.6,
      bright_ti5: 302.3,
      frp: 54.3,
      confidence: 'nominal',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '14:05',
      daynight: 'D',
      regionName: 'Taza - Tazekka National Park / Bab Azhar',
    },
    {
      id: 'VIIRS-MA-006',
      latitude: 33.5126,
      longitude: -5.0924,
      bright_ti4: 318.9,
      bright_ti5: 291.4,
      frp: 9.8,
      confidence: 'low',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '13:42',
      daynight: 'D',
      regionName: 'Ifrane - Ras El Maa (Atlas Cedar Fringe)',
    },
    {
      id: 'VIIRS-MA-007',
      latitude: 35.1852,
      longitude: -6.0824,
      bright_ti4: 334.1,
      bright_ti5: 297.8,
      frp: 26.5,
      confidence: 'nominal',
      satellite: 'VIIRS_SNPP_NRT',
      acq_date: today,
      acq_time: '14:05',
      daynight: 'D',
      regionName: 'Larache - Rmilat Coastal Forest',
    },
  ];
}

function parseFirmsCsv(csvText: string): ActiveFireHotspot[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const latIdx = headers.indexOf('latitude');
  const lngIdx = headers.indexOf('longitude');
  const brightTi4Idx = headers.indexOf('bright_ti4');
  const brightTi5Idx = headers.indexOf('bright_ti5');
  const frpIdx = headers.indexOf('frp');
  const confIdx = headers.indexOf('confidence');
  const satIdx = headers.indexOf('satellite');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');
  const dnIdx = headers.indexOf('daynight');

  const hotspots: ActiveFireHotspot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < headers.length) continue;

    const lat = parseFloat(parts[latIdx]);
    const lng = parseFloat(parts[lngIdx]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const frp = frpIdx !== -1 && parts[frpIdx] ? parseFloat(parts[frpIdx]) : 10.0;
    const bright_ti4 = brightTi4Idx !== -1 && parts[brightTi4Idx] ? parseFloat(parts[brightTi4Idx]) : 320.0;
    const bright_ti5 = brightTi5Idx !== -1 && parts[brightTi5Idx] ? parseFloat(parts[brightTi5Idx]) : 295.0;

    hotspots.push({
      id: `VIIRS-${lat.toFixed(4)}-${lng.toFixed(4)}-${i}`,
      latitude: lat,
      longitude: lng,
      bright_ti4,
      bright_ti5,
      frp: isNaN(frp) ? 0 : frp,
      confidence: confIdx !== -1 ? parts[confIdx] : 'nominal',
      satellite: satIdx !== -1 ? parts[satIdx] : 'VIIRS_SNPP_NRT',
      acq_date: dateIdx !== -1 ? parts[dateIdx] : new Date().toISOString().split('T')[0],
      acq_time: timeIdx !== -1 ? parts[timeIdx] : '00:00',
      daynight: dnIdx !== -1 && parts[dnIdx] === 'N' ? 'N' : 'D',
    });
  }

  return hotspots;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox') || DEFAULT_MOROCCO_BBOX;
  const days = searchParams.get('days') || DEFAULT_DAYS;
  const mapKey = process.env.NASA_FIRMS_MAP_KEY?.trim();

  let hotspots: ActiveFireHotspot[] = [];
  let isFallback = true;
  let source = 'NASA FIRMS Simulation (Morocco High-Risk Forest Zones)';

  if (mapKey && mapKey !== 'demo' && mapKey.length >= 20) {
    try {
      const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${bbox}/${days}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(firmsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'IGNIS-MA Wildfire Risk Platform / NASA Space Apps',
        },
        next: { revalidate: 300 }, // Cache 5 minutes
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text && !text.toLowerCase().includes('bad request') && !text.toLowerCase().includes('invalid')) {
          const parsed = parseFirmsCsv(text);
          if (parsed.length > 0) {
            hotspots = parsed;
            isFallback = false;
            source = `NASA FIRMS VIIRS 375m (Live NRT Feed, ${days}d)`;
          }
        }
      }
    } catch (err) {
      console.warn('NASA FIRMS API fetch failed, falling back to simulated high-risk hotspots:', err);
    }
  }

  // Graceful fallback if no key or API failed
  if (hotspots.length === 0) {
    hotspots = getMoroccoFallbackHotspots();
    isFallback = true;
  }

  // Format into GeoJSON FeatureCollection
  const features: FireHotspotGeoJSONFeature[] = hotspots.map((spot) => {
    const intensity = calculateIntensityCategory(spot.frp);
    const style = getStyleForIntensity(intensity);

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [spot.longitude, spot.latitude],
      },
      properties: {
        ...spot,
        intensityCategory: intensity,
        radius: style.radius,
        color: style.color,
      },
    };
  });

  const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);

  return NextResponse.json({
    type: 'FeatureCollection',
    features,
    metadata: {
      count: features.length,
      source,
      isFallback,
      timestamp: new Date().toISOString(),
      bbox: [minLng, minLat, maxLng, maxLat],
      hasFirmsKey: Boolean(mapKey && mapKey !== 'demo'),
    },
  });
}
