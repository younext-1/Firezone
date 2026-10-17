'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { GibsLayerControl } from '@/components/GibsLayerControl';
import { TelemetrySidebar } from '@/components/TelemetrySidebar';
import {
  FireHotspotGeoJSONCollection,
  NasaPointTelemetry,
} from '@/types/nasa';
import { MOROCCO_STUDY_ZONES } from '@/config/nasaGibsLayers';

// Dynamic import with SSR disabled for WebGL / MapLibre GL
const MapContainer = dynamic(() => import('@/components/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-300">
      <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-sm font-semibold tracking-wide">Initializing MapLibre WebGL Engine...</span>
      <span className="text-xs text-slate-500 mt-1">Connecting to Morocco GIS Surveillance Grids</span>
    </div>
  ),
});

export default function DashboardPage() {
  const [hotspotsData, setHotspotsData] = useState<FireHotspotGeoJSONCollection | null>(null);
  const [activeGibsLayerId, setActiveGibsLayerId] = useState<string | null>(null);
  const [gibsOpacity, setGibsOpacity] = useState<number>(0.75);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('essaouira');

  // Point Inspection State
  const [inspectedCoords, setInspectedCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 31.42,
    lng: -9.60,
  });
  const [telemetry, setTelemetry] = useState<NasaPointTelemetry | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Metadata State
  const [isFirmsFallback, setIsFirmsFallback] = useState<boolean>(true);
  const [hotspotsCount, setHotspotsCount] = useState<number>(0);

  // Fetch FIRMS Active Fires Hotspots
  const fetchHotspots = useCallback(async () => {
    try {
      const res = await fetch('/api/nasa/firms?days=2');
      if (res.ok) {
        const data: FireHotspotGeoJSONCollection = await res.json();
        setHotspotsData(data);
        setHotspotsCount(data.metadata?.count || data.features.length);
        setIsFirmsFallback(Boolean(data.metadata?.isFallback));
      }
    } catch (err) {
      console.error('Failed to load FIRMS hotspots:', err);
    }
  }, []);

  // Fetch Unified NASA Point Telemetry
  const fetchPointTelemetry = useCallback(async (coords: { lat: number; lng: number }) => {
    setInspectedCoords(coords);
    setIsLoadingTelemetry(true);
    setIsSidebarOpen(true);

    try {
      const res = await fetch(`/api/nasa/environment?lat=${coords.lat}&lng=${coords.lng}`);
      if (res.ok) {
        const data: NasaPointTelemetry = await res.json();
        setTelemetry(data);
      } else {
        console.warn('Failed to fetch environment telemetry:', res.statusText);
      }
    } catch (err) {
      console.error('Error fetching point telemetry:', err);
    } finally {
      setIsLoadingTelemetry(false);
    }
  }, []);

  // On mount: fetch hotspots & initial telemetry for default Essaouira zone
  useEffect(() => {
    fetchHotspots();
    fetchPointTelemetry({ lat: 31.42, lng: -9.60 });
  }, [fetchHotspots, fetchPointTelemetry]);

  // Handle Quick-Jump Study Zone Selection
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const zone = MOROCCO_STUDY_ZONES.find((z) => z.id === zoneId);
    if (zone) {
      fetchPointTelemetry({ lat: zone.center[1], lng: zone.center[0] });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* Top Navigation Bar */}
      <Header
        activeZoneId={selectedZoneId}
        onSelectZone={handleSelectZone}
        hotspotsCount={hotspotsCount}
        isFirmsFallback={isFirmsFallback}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Mission Control Work Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Interactive 3D/2D GIS Map */}
        <MapContainer
          hotspotsData={hotspotsData}
          activeGibsLayerId={activeGibsLayerId}
          gibsOpacity={gibsOpacity}
          selectedZoneId={selectedZoneId}
          inspectedCoords={inspectedCoords}
          onPointClick={fetchPointTelemetry}
          isLoadingTelemetry={isLoadingTelemetry}
        />

        {/* Floating NASA GIBS Layer Switcher */}
        <GibsLayerControl
          activeLayerId={activeGibsLayerId}
          opacity={gibsOpacity}
          onLayerSelect={setActiveGibsLayerId}
          onOpacityChange={setGibsOpacity}
        />

        {/* Right-Hand Scientific Telemetry Drawer */}
        {isSidebarOpen && (
          <TelemetrySidebar
            telemetry={telemetry}
            isLoading={isLoadingTelemetry}
            onClose={() => setIsSidebarOpen(false)}
            onRefresh={() => inspectedCoords && fetchPointTelemetry(inspectedCoords)}
          />
        )}
      </div>
    </div>
  );
}
