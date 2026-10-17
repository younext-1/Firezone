'use client';

import React from 'react';
import {
  NasaPointTelemetry,
  CrownFireRiskLevel,
} from '@/types/nasa';
import {
  X,
  Flame,
  Wind,
  Compass,
  Droplets,
  Thermometer,
  Mountain,
  Trees,
  Sun,
  AlertTriangle,
  Layers,
  Activity,
  Gauge,
  Info,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface TelemetrySidebarProps {
  telemetry: NasaPointTelemetry | null;
  isLoading: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

function getRiskCategory(score: number): {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
} {
  if (score >= 76) {
    return {
      label: 'CRITICAL WILDFIRE DANGER',
      textColor: 'text-red-400',
      bgColor: 'bg-red-950/70',
      borderColor: 'border-red-500/50',
      barColor: 'bg-red-500',
    };
  }
  if (score >= 51) {
    return {
      label: 'HIGH IGNITION RISK',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-950/70',
      borderColor: 'border-orange-500/50',
      barColor: 'bg-orange-500',
    };
  }
  if (score >= 26) {
    return {
      label: 'MODERATE FIRE RISK',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-950/70',
      borderColor: 'border-amber-500/50',
      barColor: 'bg-amber-500',
    };
  }
  return {
    label: 'LOW FLAMMABILITY',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-950/70',
    borderColor: 'border-emerald-500/50',
    barColor: 'bg-emerald-500',
  };
}

function getCrownRiskBadge(level: CrownFireRiskLevel) {
  switch (level) {
    case 'EXTREME':
      return { text: 'EXTREME CROWN RISK', color: 'bg-red-600 text-white animate-pulse' };
    case 'HIGH':
      return { text: 'HIGH CROWN RISK', color: 'bg-orange-600 text-white' };
    case 'MODERATE':
      return { text: 'MODERATE CROWN RISK', color: 'bg-amber-600/90 text-white' };
    case 'LOW':
    default:
      return { text: 'LOW CROWN RISK', color: 'bg-emerald-700/80 text-emerald-100' };
  }
}

function getCardinalDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({
  telemetry,
  isLoading,
  onClose,
  onRefresh,
}) => {
  if (!telemetry && !isLoading) {
    return null;
  }

  const risk = telemetry ? getRiskCategory(telemetry.compositeIgnitionRiskScore) : null;
  const crownBadge = telemetry ? getCrownRiskBadge(telemetry.vegetationAndFuel.crownFireRisk) : null;

  // Detect Moroccan Chergui dry easterly wind (approx 60° to 120° bearing)
  const isCherguiWind = telemetry
    ? telemetry.weather.windDirectionDeg >= 55 &&
      telemetry.weather.windDirectionDeg <= 125 &&
      telemetry.weather.relativeHumidityPct < 35
    : false;

  const lstDelta = telemetry
    ? Math.round((telemetry.soilAndSurface.landSurfaceTempCelsius - telemetry.weather.airTempCelsius) * 10) / 10
    : 0;

  return (
    <aside className="w-96 sm:w-[420px] max-w-full bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col h-full shadow-2xl z-30 overflow-hidden text-slate-100 transition-all duration-300">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">Point Telemetry</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              {telemetry ? (
                <>
                  <span>{telemetry.coordinates.lat.toFixed(4)}°N</span>
                  <span>,</span>
                  <span>{telemetry.coordinates.lng.toFixed(4)}°W</span>
                </>
              ) : (
                'Querying NASA Earth Data...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Telemetry"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading && !telemetry ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Fusing Multi-Sensor Datasets...</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Querying NASA SRTM 30m, POWER Climatology, Open-Meteo, MODIS NDVI, ECOSTRESS & SMAP
            </p>
          </div>
        ) : telemetry && risk ? (
          <>
            {/* Chergui Wind Alert Banner if detected */}
            {isCherguiWind && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/60 flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-red-300 uppercase tracking-wide block">
                    Chergui Föhn Wind Warning
                  </span>
                  <span className="text-red-200/90 leading-relaxed">
                    Dry continental easterly wind with low RH ({telemetry.weather.relativeHumidityPct}%) causing rapid
                    canopy desiccation and extreme fire propagation speed.
                  </span>
                </div>
              </div>
            )}

            {/* 1. COMPOSITE IGNITION RISK CARD */}
            <div className={`p-4 rounded-xl border ${risk.borderColor} ${risk.bgColor} shadow-lg relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className={`w-5 h-5 ${risk.textColor}`} />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                    Composite Wildfire Ignition Index
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${crownBadge?.color}`}>
                  {crownBadge?.text}
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
                  {telemetry.compositeIgnitionRiskScore}
                </span>
                <span className="text-sm font-semibold text-slate-300">/ 100</span>
                <span className={`ml-auto text-xs font-bold uppercase tracking-wider ${risk.textColor}`}>
                  {risk.label}
                </span>
              </div>

              {/* Progress meter */}
              <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${risk.barColor}`}
                  style={{ width: `${telemetry.compositeIgnitionRiskScore}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-400">
                <span>0 Low</span>
                <span>25 Mod</span>
                <span>50 High</span>
                <span>75 Extreme 100</span>
              </div>
            </div>

            {/* 2. FIRE WEATHER (NASA POWER & REAL-TIME) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Fire Meteorology (NASA POWER)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">T2M · WS10M · RH2M</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Air Temperature */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Air Temp (2m)</span>
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {telemetry.weather.airTempCelsius}°C
                  </div>
                </div>

                {/* Relative Humidity */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Relative Humidity</span>
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-1 flex items-baseline gap-1">
                    {telemetry.weather.relativeHumidityPct}%
                    {telemetry.weather.relativeHumidityPct < 30 && (
                      <span className="text-[10px] font-sans text-red-400 font-normal">Dry</span>
                    )}
                  </div>
                </div>

                {/* 10m Wind & Flame 2m Wind */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Wind (10m / 2m)</span>
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-sm font-bold font-mono text-white mt-1">
                    {telemetry.weather.windSpeed10mKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Flame level (2m): {telemetry.weather.windSpeed2mKmh} km/h
                  </div>
                </div>

                {/* Wind Direction & Compass */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Wind Direction</span>
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {/* Compass needle graphic */}
                    <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center relative">
                      <div
                        className="w-0.5 h-3 bg-red-400 rounded-full origin-bottom"
                        style={{ transform: `rotate(${telemetry.weather.windDirectionDeg}deg)` }}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-bold font-mono text-white">
                        {telemetry.weather.windDirectionDeg}°
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({getCardinalDirection(telemetry.weather.windDirectionDeg)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solar Shortwave Radiation */}
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Downwelling Solar Radiation:
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {telemetry.weather.solarRadiationWm2} W/m²
                </span>
              </div>
            </div>

            {/* 3. TOPOGRAPHY & ELEVATION (NASA SRTM 30m) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-emerald-400" />
                  Topography (NASA SRTM 30m DEM)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">3x3 Slope Kernel</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 text-center">
                  <div className="text-[10px] text-slate-400">Elevation</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {telemetry.topography.elevationMeters}m
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 text-center">
                  <div className="text-[10px] text-slate-400">Slope Angle</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {telemetry.topography.slopeDegrees}°
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/60 text-center">
                  <div className="text-[10px] text-slate-400">Aspect (Facing)</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {telemetry.topography.aspectDegrees}°
                  </div>
                </div>
              </div>

              {/* South-Facing Solar Exposure Alert */}
              {telemetry.topography.isSouthFacing ? (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200">
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>South-Facing Slope (135°–225°):</strong> High insolation preheats fuel beds and accelerates
                    drying.
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60 text-[11px] text-slate-400">
                  Aspect orientation {telemetry.topography.aspectDegrees}° faces {getCardinalDirection(telemetry.topography.aspectDegrees)} with moderate solar exposure.
                </div>
              )}
            </div>

            {/* 4. CANOPY, FUEL & DROUGHT STRESS (ECOSTRESS + MODIS + GEDI) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Trees className="w-4 h-4 text-lime-400" />
                  Vegetation, Canopy & Fuel (MODIS / GEDI / ECOSTRESS)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">MCD12Q1</span>
              </div>

              {/* Land Cover Classification */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Land Cover / Fuel Complex (MCD12Q1):</span>
                  <span className="font-mono text-slate-300">Code {telemetry.vegetationAndFuel.landCoverCode}</span>
                </div>
                <div className="text-xs font-semibold text-white">
                  {telemetry.vegetationAndFuel.landCoverLabel}
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                  <span>Spread Multiplier:</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {telemetry.vegetationAndFuel.fuelModelSpreadFactor}x
                  </span>
                </div>
              </div>

              {/* ECOSTRESS Evaporative Stress Index (ESI 70m) */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">NASA ECOSTRESS Plant Stress (ESI 70m):</span>
                  <span
                    className={`font-mono font-bold ${
                      telemetry.vegetationAndFuel.ecostressEsi < -1.0
                        ? 'text-red-400'
                        : telemetry.vegetationAndFuel.ecostressEsi < 0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {telemetry.vegetationAndFuel.ecostressEsi}
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  {/* Normalized between -3.0 and +3.0 */}
                  <div
                    className={`h-full rounded-full ${
                      telemetry.vegetationAndFuel.ecostressEsi < -1.0
                        ? 'bg-red-500'
                        : telemetry.vegetationAndFuel.ecostressEsi < 0
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.max(5, Math.min(100, ((telemetry.vegetationAndFuel.ecostressEsi + 3) / 6) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Severe Desiccation (-3.0)</span>
                  <span>Hydrated (+3.0)</span>
                </div>
              </div>

              {/* NDVI & GEDI Canopy Height Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">MODIS NDVI (MOD13Q1)</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {telemetry.vegetationAndFuel.ndvi}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {telemetry.vegetationAndFuel.ndvi > 0.5 ? 'Dense Canopy' : 'Sparse Scrub / Matorral'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">GEDI LiDAR Canopy (25m)</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {telemetry.vegetationAndFuel.gediCanopyHeightMeters}m
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Height Profile (RH100)</div>
                </div>
              </div>
            </div>

            {/* 5. SURFACE THERMAL & SOIL MOISTURE (MODIS LST + SMAP) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-rose-400" />
                  Thermal & Moisture (MODIS LST & SMAP)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">MOD11A1 / SMAP L4</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Land Surface Temperature */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">MODIS Skin LST</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {telemetry.soilAndSurface.landSurfaceTempCelsius}°C
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      lstDelta > 5 ? 'text-rose-400 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Δ +{lstDelta}°C vs Air Temp
                  </div>
                </div>

                {/* SMAP Soil Moisture */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60">
                  <div className="text-[11px] text-slate-400">SMAP Soil Moisture</div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {telemetry.soilAndSurface.smapSurfaceSoilMoistureM3M3}{' '}
                    <span className="text-xs text-slate-400 font-normal">m³/m³</span>
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      telemetry.soilAndSurface.smapSurfaceSoilMoistureM3M3 < 0.10
                        ? 'text-red-400 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {telemetry.soilAndSurface.smapSurfaceSoilMoistureM3M3 < 0.10
                      ? 'Acute Drought (<0.10)'
                      : 'Adequate Moisture'}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. DATA LINEAGE & SATELLITE PROVENANCE */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                NASA Multi-Sensor Attribution (10 Datasets):
              </div>
              <ul className="space-y-1 text-[10px] text-slate-400 pl-4 list-disc font-mono">
                <li>FIRMS: VIIRS 375m & MODIS NRT Hotspots</li>
                <li>Topography: NASA SRTM 30m DEM v3.0</li>
                <li>Meteorology: NASA POWER Climatology & Open-Meteo</li>
                <li>Vegetation: MODIS NDVI (MOD13Q1) & MCD12Q1</li>
                <li>Canopy: NASA GEDI LiDAR 25m RH100 Profile</li>
                <li>Plant Stress: NASA ECOSTRESS 70m ESI</li>
                <li>Thermal: NASA MODIS LST (MOD11A1)</li>
                <li>Soil Moisture: NASA SMAP L4 Surface (0-5cm)</li>
              </ul>
              <div className="pt-1 text-[9px] text-slate-500 font-mono">
                Calculated: {new Date(telemetry.calculatedAt).toLocaleString()}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
};
