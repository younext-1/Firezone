'use client';

import React from 'react';
import { MOROCCO_STUDY_ZONES } from '@/config/nasaGibsLayers';
import {
  Flame,
  Radio,
  MapPin,
  Mountain,
  Satellite,
  Compass,
  Layers,
  Activity,
  ShieldAlert,
} from 'lucide-react';

interface HeaderProps {
  activeZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  hotspotsCount: number;
  isFirmsFallback: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeZoneId,
  onSelectZone,
  hotspotsCount,
  isFirmsFallback,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/50 border border-orange-400/30">
          <Flame className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-mono">
              IGNIS-MA
              <span className="text-orange-500 font-sans font-light">|</span>
              <span className="text-xs font-semibold text-slate-300 font-sans tracking-normal hidden sm:inline">
                NASA Multi-Sensor Wildfire Intelligence
              </span>
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              PHASE 1
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md hidden md:block">
            10-Dataset Environmental Fusion & Telemetry Platform for Morocco
          </p>
        </div>
      </div>

      {/* Quick-Jump Study Zones */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-orange-400" />
          Focus Reserves:
        </span>
        {MOROCCO_STUDY_ZONES.map((zone) => {
          const isActive = activeZoneId === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{zone.name.split('/')[0].trim()}</span>
              {zone.historicalFireRisk === 'Severe' && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Severe Historical Risk" />
              )}
            </button>
          );
        })}
      </div>

      {/* Status Badges & Controls */}
      <div className="flex items-center gap-3">
        {/* Active Hotspots Count */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <Flame className="w-3.5 h-3.5 text-red-500" />
          <span className="font-mono font-bold text-white">{hotspotsCount}</span>
          <span className="text-[11px] text-slate-400">Thermal Hotspots</span>
        </div>

        {/* NASA FIRMS Status */}
        <div
          className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 font-medium ${
            isFirmsFallback
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          }`}
          title={
            isFirmsFallback
              ? 'Running in Moroccan Forest Simulation Mode (Set NASA_FIRMS_MAP_KEY in .env.local for live feed)'
              : 'Connected to Live NASA FIRMS VIIRS 375m NRT Feed'
          }
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">FIRMS:</span>
          <span className="font-semibold">{isFirmsFallback ? 'Demo Fallback' : 'Live VIIRS'}</span>
        </div>

        {/* Telemetry drawer toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
            isSidebarOpen
              ? 'bg-orange-600/20 border-orange-500/50 text-orange-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Toggle Point Telemetry Sidebar"
        >
          <Activity className="w-4 h-4 text-orange-400" />
          <span className="hidden md:inline">Telemetry</span>
        </button>
      </div>
    </header>
  );
};
