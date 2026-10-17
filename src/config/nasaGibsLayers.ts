/**
 * NASA GIBS (Global Imagery Browse Services) WMTS Layer Configurations
 * Standard Web Mercator (EPSG:3857) raster tiles for live multi-sensor overlay
 */

export interface NasaGibsLayerConfig {
  id: string;
  name: string;
  shortName: string;
  layerIdentifier: string;
  matrixSet: string;
  format: 'jpg' | 'png';
  maxZoom: number;
  minZoom?: number;
  defaultOpacity: number;
  sensor: string;
  temporalResolution: string;
  description: string;
  units?: string;
  legendGradient?: string[];
  legendLabels?: { min: string; mid?: string; max: string };
  category: 'basemap' | 'vegetation' | 'temperature' | 'moisture' | 'atmosphere';
}

/**
 * 5 Core NASA GIBS Layers requested for Wildfire Intelligence
 */
export const NASA_GIBS_LAYERS: NasaGibsLayerConfig[] = [
  {
    id: 'gibs-viirs-truecolor',
    name: 'NASA VIIRS SNPP True Color Reflectance',
    shortName: 'True Color (VIIRS)',
    layerIdentifier: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    maxZoom: 9,
    minZoom: 1,
    defaultOpacity: 0.85,
    sensor: 'Suomi NPP / VIIRS',
    temporalResolution: 'Daily NRT',
    description: 'Natural color imagery showing active smoke plumes, burn scars, clouds, and terrain.',
    category: 'basemap',
  },
  {
    id: 'gibs-modis-ndvi',
    name: 'NASA MODIS Normalized Difference Vegetation Index (NDVI)',
    shortName: 'NDVI Vegetation Greenness',
    layerIdentifier: 'MODIS_Terra_NDVI_8Day',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    maxZoom: 9,
    minZoom: 1,
    defaultOpacity: 0.7,
    sensor: 'Terra / MODIS (MOD13Q1)',
    temporalResolution: '8-Day Composite',
    description: 'Chlorophyll vitality and canopy greenness index. Low values identify dead or dried fuel beds.',
    units: 'NDVI (-0.2 to 1.0)',
    legendGradient: ['#8B4513', '#E6C280', '#D0E574', '#55B032', '#006400'],
    legendLabels: { min: 'Barren / Dry (0.0)', mid: 'Shrub (0.4)', max: 'Dense Forest (0.9)' },
    category: 'vegetation',
  },
  {
    id: 'gibs-modis-lst',
    name: 'NASA MODIS Land Surface Temperature (Daytime)',
    shortName: 'Land Surface Temp (LST)',
    layerIdentifier: 'MODIS_Terra_Land_Surface_Temp_Day',
    matrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    maxZoom: 7,
    minZoom: 1,
    defaultOpacity: 0.65,
    sensor: 'Terra / MODIS (MOD11A1)',
    temporalResolution: 'Daily',
    description: 'Radiative skin temperature of canopy and soil. Highlights severe thermal pre-heating.',
    units: '°C (0°C to 55°C)',
    legendGradient: ['#313695', '#74add1', '#fee090', '#f46d43', '#a50026'],
    legendLabels: { min: '< 15°C (Cool)', mid: '35°C (Warm)', max: '> 50°C (Extreme Heat)' },
    category: 'temperature',
  },
  {
    id: 'gibs-smap-moisture',
    name: 'NASA SMAP L4 Analyzed Surface Soil Moisture',
    shortName: 'SMAP Soil Moisture',
    layerIdentifier: 'SMAP_L4_Analyzed_Surface_Soil_Moisture',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    maxZoom: 6,
    minZoom: 1,
    defaultOpacity: 0.7,
    sensor: 'SMAP L-Band Radiometer',
    temporalResolution: '3-Hourly / Daily',
    description: 'Top 5cm volumetric soil moisture (m³/m³). Sub-0.10 m³/m³ indicates acute drought flammability.',
    units: 'm³/m³',
    legendGradient: ['#d73027', '#fdae61', '#ffffbf', '#abd9e9', '#4575b4'],
    legendLabels: { min: '< 0.08 (Severe Dry)', mid: '0.20 (Moderate)', max: '> 0.40 (Saturated)' },
    category: 'moisture',
  },
  {
    id: 'gibs-modis-aod',
    name: 'NASA MODIS Combined Aerosol Optical Depth (Smoke/AOD)',
    shortName: 'Smoke & Aerosol Depth (AOD)',
    layerIdentifier: 'MODIS_Combined_Value_Added_AOD',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    maxZoom: 6,
    minZoom: 1,
    defaultOpacity: 0.65,
    sensor: 'Terra & Aqua / MODIS',
    temporalResolution: 'Daily',
    description: 'Atmospheric optical thickness from wildfire smoke particles, dust, and haze particulates.',
    units: 'AOD unitless (0 to 2.0)',
    legendGradient: ['#2ca02c', '#ffbb78', '#ff7f0e', '#d62728', '#7f0000'],
    legendLabels: { min: '0.0 (Clean Air)', mid: '0.5 (Moderate Haze)', max: '> 1.5 (Dense Smoke)' },
    category: 'atmosphere',
  },
];

/**
 * Computes a recent valid date for GIBS imagery.
 * Most satellite products have a 1 to 4 day latency, while NDVI composites are 8-day.
 */
export function getDefaultGibsDate(layerId?: string): string {
  const now = new Date();
  
  // Default to 2 days ago for general NRT layers (ensures global tiles are fully mosaicked)
  let daysAgo = 2;
  
  // For 8-day NDVI composites, fallback 6 days to hit the latest available 8-day window
  if (layerId === 'MODIS_Terra_NDVI_8Day') {
    daysAgo = 6;
  } else if (layerId === 'SMAP_L4_Analyzed_Surface_Soil_Moisture') {
    daysAgo = 3;
  }
  
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Returns the exact WMTS tile URL template for MapLibre GL
 * Template format:
 * https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LayerIdentifier}/default/{Date}/{TileMatrixSet}/{z}/{y}/{x}.{Format}
 */
export function getGibsTileUrl(layerIdentifier: string, dateStr?: string): string {
  const layer = NASA_GIBS_LAYERS.find((l) => l.layerIdentifier === layerIdentifier);
  const format = layer ? layer.format : 'png';
  const matrixSet = layer ? layer.matrixSet : 'GoogleMapsCompatible_Level9';
  const resolvedDate = dateStr || getDefaultGibsDate(layerIdentifier);

  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerIdentifier}/default/${resolvedDate}/${matrixSet}/{z}/{y}/{x}.${format}`;
}

/**
 * Pre-defined Moroccan Study Zones for Rapid Spatial Navigation
 */
export const MOROCCO_STUDY_ZONES = [
  {
    id: 'essaouira',
    name: 'Essaouira / Haha Forests',
    subRegion: 'Arganeraie Biosphere Reserve & Thuya (Tetraclinis articulata)',
    description: 'Vulnerable coastal Mediterranean scrub and endemic Argan woodlands exposed to dry Chergui easterlies.',
    center: [-9.60, 31.42] as [number, number],
    zoom: 10.5,
    pitch: 45,
    bearing: -15,
    primaryVegetation: 'Argania spinosa & Tetraclinis articulata (Thuya)',
    historicalFireRisk: 'High' as const,
  },
  {
    id: 'chefchaouen',
    name: 'Chefchaouen / Talassemtane',
    subRegion: 'Rif Mountains National Park',
    description: 'Steep rugged slopes dominated by Maritime Pine, Cork Oak (Quercus suber), and rare Moroccan Fir.',
    center: [-5.26, 35.17] as [number, number],
    zoom: 11.2,
    pitch: 52,
    bearing: 30,
    primaryVegetation: 'Pinus pinaster & Quercus suber (Cork Oak)',
    historicalFireRisk: 'Severe' as const,
  },
  {
    id: 'ifrane',
    name: 'Ifrane / Middle Atlas',
    subRegion: 'Ifrane National Park',
    description: 'High-elevation mountain forest plateau harboring ancient Atlas Cedar (Cedrus atlantica) and Holm Oak.',
    center: [-5.11, 33.53] as [number, number],
    zoom: 11.0,
    pitch: 40,
    bearing: 0,
    primaryVegetation: 'Cedrus atlantica (Atlas Cedar) & Quercus ilex',
    historicalFireRisk: 'Moderate' as const,
  },
  {
    id: 'taza',
    name: 'Taza / Bab Azhar',
    subRegion: 'Tazekka National Park',
    description: 'Complex junction of the Rif and Middle Atlas mountain systems with dense pine forest fuel beds.',
    center: [-4.01, 34.22] as [number, number],
    zoom: 11.0,
    pitch: 48,
    bearing: -20,
    primaryVegetation: 'Pinus halepensis (Aleppo Pine) & Matorral',
    historicalFireRisk: 'Severe' as const,
  },
];
