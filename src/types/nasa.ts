/**
 * NASA Earth Observation & Multi-Sensor Wildfire Intelligence Type Definitions
 * IGNIS-MA: Phase 1 Platform Types
 */

export type FireIntensityCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type CrownFireRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type FireConfidence = 'low' | 'nominal' | 'high' | string;

/**
 * 1. Active Fire Hotspot (NASA FIRMS VIIRS 375m & MODIS)
 */
export interface ActiveFireHotspot {
  id: string;
  latitude: number;
  longitude: number;
  bright_ti4: number; // Brightness temperature I-4 (Kelvin)
  bright_ti5: number; // Brightness temperature I-5 (Kelvin)
  frp: number; // Fire Radiative Power (MW)
  confidence: FireConfidence;
  satellite: string; // 'VIIRS_SNPP_NRT' | 'MODIS_NRT' | string
  acq_date: string;
  acq_time: string;
  daynight: 'D' | 'N';
  intensityCategory?: FireIntensityCategory;
  regionName?: string;
}

/**
 * GeoJSON representation for MapLibre sources
 */
export interface FireHotspotGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: ActiveFireHotspot & {
    radius: number;
    color: string;
  };
}

export interface FireHotspotGeoJSONCollection {
  type: 'FeatureCollection';
  features: FireHotspotGeoJSONFeature[];
  metadata?: {
    count: number;
    source: string;
    isFallback: boolean;
    timestamp: string;
    bbox: [number, number, number, number];
  };
}

export type FireFeatureCollection = FireHotspotGeoJSONCollection;

/**
 * 2. Topography Telemetry (NASA SRTM 30m DEM)
 */
export interface TopographyTelemetry {
  elevationMeters: number;
  slopeDegrees: number; // 3x3 elevation kernel computed slope
  aspectDegrees: number; // 0°–360° compass direction
  isSouthFacing: boolean; // true if 135° <= aspect <= 225° (solar drying zone)
}

/**
 * 3. Weather Telemetry (NASA POWER API + Open-Meteo)
 */
export interface WeatherTelemetry {
  windSpeed10mKmh: number; // WS10M
  windSpeed2mKmh: number; // WS2M (flame-level surface wind)
  windDirectionDeg: number; // WD10M (0° - 360°)
  relativeHumidityPct: number; // RH2M (%)
  airTempCelsius: number; // T2M (°C)
  solarRadiationWm2: number; // ALLSKY_SFC_SW_DWN (W/m²)
}

/**
 * 4. Vegetation and Fuel Telemetry (NASA MODIS MOD13Q1, ECOSTRESS ESI, MCD12Q1, GEDI LiDAR)
 */
export interface VegetationAndFuelTelemetry {
  ndvi: number; // -1.0 to 1.0 (MOD13Q1)
  ecostressEsi: number; // -3.0 to +3.0 (ECOSTRESS 70m Evaporative Stress Index)
  landCoverCode: number; // IGBP 1–17 (MCD12Q1)
  landCoverLabel: string; // e.g. "Closed Shrublands / Argania & Thuya"
  fuelModelSpreadFactor: number; // 0.0 to 2.0 multiplier
  gediCanopyHeightMeters: number; // NASA GEDI LiDAR 25m profile
  crownFireRisk: CrownFireRiskLevel;
}

/**
 * 5. Soil and Surface Telemetry (NASA MODIS LST MOD11A1 & NASA SMAP)
 */
export interface SoilAndSurfaceTelemetry {
  landSurfaceTempCelsius: number; // MOD11A1 LST (°C)
  smapSurfaceSoilMoistureM3M3: number; // SMAP volumetric soil moisture (m³/m³)
}

/**
 * Unified Point Telemetry Inspection Payload
 * Returned when querying any coordinate on the map
 */
export interface NasaPointTelemetry {
  coordinates: {
    lat: number;
    lng: number;
  };
  topography: TopographyTelemetry;
  weather: WeatherTelemetry;
  vegetationAndFuel: VegetationAndFuelTelemetry;
  soilAndSurface: SoilAndSurfaceTelemetry;
  compositeIgnitionRiskScore: number; // 0 to 100 composite scientific wildfire ignition index
  calculatedAt: string;
  dataSources: {
    firms: string;
    srtm: string;
    power: string;
    modisNdvi: string;
    ecostressEsi: string;
    gediLidar: string;
    modisLst: string;
    smap: string;
    mcd12q1: string;
  };
}

/**
 * Preset Moroccan Ecological Forest Study Zones
 */
export interface StudyZone {
  id: string;
  name: string;
  subRegion: string;
  description: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  primaryVegetation: string;
  historicalFireRisk: 'Moderate' | 'High' | 'Severe';
}
