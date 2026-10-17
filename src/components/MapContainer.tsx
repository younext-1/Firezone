'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Map as MapLibreMap, NavigationControl, ScaleControl, Marker, Popup, GeoJSONSource, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ActiveFireHotspot, FireHotspotGeoJSONCollection } from '@/types/nasa';
import { NASA_GIBS_LAYERS, getGibsTileUrl, MOROCCO_STUDY_ZONES } from '@/config/nasaGibsLayers';

// Configure MapLibre Web Worker for Next.js / Turbopack
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl(`${window.location.origin}/worker/maplibre-gl-worker.mjs`);
  } catch (err) {
    console.warn('Failed to configure MapLibre worker URL:', err);
  }
}
import {
  Flame,
  Satellite,
  Compass,
  Layers,
  MapPin,
  Crosshair,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sun,
  Activity,
  Mountain,
} from 'lucide-react';

interface MapContainerProps {
  hotspotsData: FireHotspotGeoJSONCollection | null;
  activeGibsLayerId: string | null;
  gibsOpacity: number;
  selectedZoneId: string | null;
  inspectedCoords: { lat: number; lng: number } | null;
  onPointClick: (coords: { lat: number; lng: number }) => void;
  isLoadingTelemetry: boolean;
}

// Free Carto Dark Matter style (High performance, sleek dark styling, no API key required)
const DARK_MATTER_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and GIS User Community',
    },
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const MapContainer: React.FC<MapContainerProps> = ({
  hotspotsData,
  activeGibsLayerId,
  gibsOpacity,
  selectedZoneId,
  inspectedCoords,
  onPointClick,
  isLoadingTelemetry,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const inspectionMarkerRef = useRef<Marker | null>(null);
  const popupRef = useRef<Popup | null>(null);

  const [basemapMode, setBasemapMode] = useState<'dark' | 'satellite'>('dark');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(7.2);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);

  // Initialize MapLibre
  useEffect(() => {
    // Ensure worker URL is set to static public asset
    setWorkerUrl(`${window.location.origin}/worker/maplibre-gl-worker.mjs`);

    // Default centered on Morocco (Essaouira - Atlas - Rif span)
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: basemapMode === 'dark' ? DARK_MATTER_STYLE : (SATELLITE_STYLE as any),
      center: [-9.60, 31.42], // Essaouira default
      zoom: 7.2,
      pitch: 35,
      bearing: -10,
      maxPitch: 75,
      attributionControl: false,
    });

    // Controls
    map.addControl(
      new NavigationControl({
        visualizePitch: true,
        showCompass: true,
      }),
      'bottom-right'
    );

    map.addControl(
      new ScaleControl({
        maxWidth: 140,
        unit: 'metric',
      }),
      'bottom-left'
    );

    map.on('load', () => {
      setMapLoaded(true);
      mapRef.current = map;
    });

    map.on('mousemove', (e) => {
      setCursorPos({
        lat: Math.round(e.lngLat.lat * 10000) / 10000,
        lng: Math.round(e.lngLat.lng * 10000) / 10000,
      });
    });

    map.on('zoom', () => {
      setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
    });

    // Click anywhere on map to trigger point telemetry inspection
    map.on('click', (e) => {
      // Check if clicked directly on an active fire hotspot
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['firms-hotspots-core'],
      });

      if (features.length > 0) {
        // Handled by hotspot click event
        return;
      }

      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      onPointClick(coords);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap Style
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    map.setStyle(basemapMode === 'dark' ? DARK_MATTER_STYLE : (SATELLITE_STYLE as any));
  }, [basemapMode]);

  // Handle Hotspots Rendering (FIRMS)
  const syncHotspotsLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    const sourceId = 'firms-hotspots';
    const glowLayerId = 'firms-hotspots-glow';
    const coreLayerId = 'firms-hotspots-core';
    const labelLayerId = 'firms-hotspots-label';

    const sourceData: any = hotspotsData || {
      type: 'FeatureCollection',
      features: [],
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as GeoJSONSource).setData(sourceData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: sourceData,
      });

      // 1. Outer Thermal Halo / Glow Layer
      map.addLayer({
        id: glowLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            ['*', ['get', 'radius'], 1.2],
            12,
            ['*', ['get', 'radius'], 2.4],
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.35,
          'circle-blur': 0.8,
        },
      });

      // 2. High-intensity Core Layer
      map.addLayer({
        id: coreLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            ['get', 'radius'],
            12,
            ['*', ['get', 'radius'], 1.6],
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.95,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8,
        },
      });

      // 3. Hotspot FRP Label at higher zoom
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        minzoom: 8.5,
        layout: {
          'text-field': ['concat', ['to-string', ['round', ['get', 'frp']]], ' MW'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffeedd',
          'text-halo-color': '#000000',
          'text-halo-width': 1.5,
        },
      });

      // Mouse interactions on hotspots
      map.on('mouseenter', coreLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', coreLayerId, () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', coreLayerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties as ActiveFireHotspot & { color: string; radius: number };
        const coords = (feature.geometry as any).coordinates as [number, number];

        // Open HUD Popup
        if (popupRef.current) popupRef.current.remove();

        const popupNode = document.createElement('div');
        popupNode.className = 'p-3 bg-slate-900 text-slate-100 rounded-lg text-xs space-y-2 max-w-xs shadow-2xl border border-orange-500/50';
        popupNode.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
            <span class="font-bold text-orange-400 flex items-center gap-1">
              🔥 ${props.satellite || 'VIIRS'} Hotspot
            </span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-950 text-orange-300 border border-orange-500/40">
              ${props.intensityCategory || 'ACTIVE'}
            </span>
          </div>
          ${props.regionName ? `<div class="text-[11px] font-semibold text-slate-200">${props.regionName}</div>` : ''}
          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div>FRP: <strong class="text-white text-xs">${props.frp} MW</strong></div>
            <div>Temp (I4): <strong class="text-white text-xs">${props.bright_ti4} K</strong></div>
            <div>Confidence: <strong class="text-white">${props.confidence}</strong></div>
            <div>Acquired: <strong class="text-white">${props.acq_date} ${props.acq_time}</strong></div>
          </div>
          <button id="inspect-hotspot-btn" class="w-full mt-1.5 py-1.5 px-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1">
            <span>Inspect Point Telemetry</span>
          </button>
        `;

        popupRef.current = new Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 15,
          className: 'nasa-firms-popup',
        })
          .setLngLat(coords)
          .setDOMContent(popupNode)
          .addTo(map);

        // Bind button click
        setTimeout(() => {
          const btn = document.getElementById('inspect-hotspot-btn');
          if (btn) {
            btn.onclick = () => {
              onPointClick({ lat: coords[1], lng: coords[0] });
              if (popupRef.current) popupRef.current.remove();
            };
          }
        }, 50);
      });
    }
  }, [hotspotsData, mapLoaded, onPointClick]);

  // Re-sync hotspots when data or style reloads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.isStyleLoaded()) {
      syncHotspotsLayer();
    } else {
      map.once('styledata', syncHotspotsLayer);
    }
  }, [hotspotsData, mapLoaded, syncHotspotsLayer, basemapMode]);

  // Handle NASA GIBS Raster Overlay Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    const gibsSourceId = 'nasa-gibs-source';
    const gibsLayerId = 'nasa-gibs-layer';

    // Remove existing GIBS layer if present
    if (map.getLayer(gibsLayerId)) map.removeLayer(gibsLayerId);
    if (map.getSource(gibsSourceId)) map.removeSource(gibsSourceId);

    if (activeGibsLayerId) {
      const gibsConfig = NASA_GIBS_LAYERS.find((l) => l.id === activeGibsLayerId);
      if (gibsConfig) {
        const tileUrl = getGibsTileUrl(gibsConfig.layerIdentifier);

        map.addSource(gibsSourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          maxzoom: gibsConfig.maxZoom,
          minzoom: gibsConfig.minZoom || 1,
          attribution: 'NASA EOSDIS GIBS',
        });

        // Insert before hotspots layers so hotspots remain visible on top
        const beforeLayer = map.getLayer('firms-hotspots-glow') ? 'firms-hotspots-glow' : undefined;

        map.addLayer(
          {
            id: gibsLayerId,
            type: 'raster',
            source: gibsSourceId,
            paint: {
              'raster-opacity': gibsOpacity,
              'raster-fade-duration': 300,
            },
          },
          beforeLayer
        );
      }
    }
  }, [activeGibsLayerId, mapLoaded, basemapMode]);

  // Update GIBS Opacity dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer('nasa-gibs-layer')) {
      map.setPaintProperty('nasa-gibs-layer', 'raster-opacity', gibsOpacity);
    }
  }, [gibsOpacity, mapLoaded]);

  // Handle Inspection Crosshair Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!inspectedCoords) {
      if (inspectionMarkerRef.current) {
        inspectionMarkerRef.current.remove();
        inspectionMarkerRef.current = null;
      }
      return;
    }

    if (!inspectionMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer pointer-events-none';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 border-orange-400 bg-orange-500/20 flex items-center justify-center animate-ping absolute opacity-75"></div>
        <div class="w-4 h-4 rounded-full border-2 border-white bg-orange-600 shadow-lg flex items-center justify-center relative z-10">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      `;

      inspectionMarkerRef.current = new Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([inspectedCoords.lng, inspectedCoords.lat])
        .addTo(map);
    } else {
      inspectionMarkerRef.current.setLngLat([inspectedCoords.lng, inspectedCoords.lat]);
    }
  }, [inspectedCoords, mapLoaded]);

  // Handle Zone Fly-To
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedZoneId) return;

    const zone = MOROCCO_STUDY_ZONES.find((z) => z.id === selectedZoneId);
    if (zone) {
      map.flyTo({
        center: zone.center,
        zoom: zone.zoom,
        pitch: zone.pitch,
        bearing: zone.bearing,
        duration: 2200,
        essential: true,
      });
    }
  }, [selectedZoneId, mapLoaded]);

  // Toggle 3D Pitch Mode
  const toggle3DMode = () => {
    const map = mapRef.current;
    if (!map) return;

    if (is3DMode) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setIs3DMode(false);
    } else {
      map.easeTo({ pitch: 58, bearing: -20, duration: 1000 });
      setIs3DMode(true);
    }
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden bg-slate-950">
      {/* MapLibre DOM Target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Helper Pill: Coordinates & Map State */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2 shadow-lg">
          <Crosshair className="w-3.5 h-3.5 text-orange-400" />
          {cursorPos ? (
            <span>
              {cursorPos.lat.toFixed(4)}°N, {cursorPos.lng.toFixed(4)}°W
            </span>
          ) : (
            <span>Morocco Wildfire Surveillance</span>
          )}
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Z {currentZoom}</span>
        </div>

        {/* Click to inspect helper */}
        <div className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 items-center gap-1.5 shadow-lg">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Click anywhere to inspect 10-sensor telemetry</span>
        </div>
      </div>

      {/* Floating Basemap & 3D Mode Toggle Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Basemap Switcher (Dark Matter / Satellite) */}
        <div className="bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setBasemapMode('dark')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              basemapMode === 'dark'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark Vector
          </button>
          <button
            onClick={() => setBasemapMode('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              basemapMode === 'satellite'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* 3D Mountain Perspective Button */}
        <button
          onClick={toggle3DMode}
          className={`p-2 rounded-xl border text-xs font-medium backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 ${
            is3DMode
              ? 'bg-orange-600/30 border-orange-500 text-orange-300'
              : 'bg-slate-950/85 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
          title="Toggle 3D Terrain Pitch Mode (Right click + drag also rotates)"
        >
          <Mountain className="w-4 h-4 text-orange-400" />
          <span className="hidden sm:inline">3D Ridge Pitch</span>
        </button>
      </div>

      {/* Telemetry Fetching Floating Spinner */}
      {isLoadingTelemetry && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-slate-950/90 backdrop-blur-md border border-orange-500/60 rounded-full flex items-center gap-2.5 text-xs text-orange-300 shadow-2xl animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span>Fusing NASA Multi-Sensor Telemetry for Point...</span>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
