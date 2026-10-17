'use client';

import React, { useState } from 'react';
import {
  NASA_GIBS_LAYERS,
  NasaGibsLayerConfig,
  getDefaultGibsDate,
} from '@/config/nasaGibsLayers';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sliders,
  Calendar,
  Satellite,
  Info,
} from 'lucide-react';

interface GibsLayerControlProps {
  activeLayerId: string | null;
  opacity: number;
  onLayerSelect: (layerId: string | null) => void;
  onOpacityChange: (opacity: number) => void;
  customDate?: string;
}

export const GibsLayerControl: React.FC<GibsLayerControlProps> = ({
  activeLayerId,
  opacity,
  onLayerSelect,
  onOpacityChange,
  customDate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const activeLayer = NASA_GIBS_LAYERS.find((l) => l.id === activeLayerId);

  return (
    <div className="absolute top-20 left-4 z-20 w-80 sm:w-88 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl text-slate-100 overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div
        className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
            NASA GIBS Satellites
          </span>
          {activeLayer && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3.5">
          {/* Layer Options List */}
          <div className="space-y-1.5">
            {NASA_GIBS_LAYERS.map((layer) => {
              const isActive = activeLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => onLayerSelect(isActive ? null : layer.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      <span className="truncate">{layer.shortName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {layer.sensor} · {layer.temporalResolution}
                    </div>
                  </div>

                  <div className="shrink-0 p-1 rounded hover:bg-slate-800 text-slate-400">
                    {isActive ? (
                      <Eye className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opacity Slider for active layer */}
          {activeLayer && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-300" />
                  Layer Opacity:
                </span>
                <span className="font-mono text-cyan-400 font-semibold">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              {/* Dynamic Legend */}
              {activeLayer.legendGradient && (
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>{activeLayer.legendLabels?.min}</span>
                    {activeLayer.legendLabels?.mid && <span>{activeLayer.legendLabels?.mid}</span>}
                    <span>{activeLayer.legendLabels?.max}</span>
                  </div>
                  <div
                    className="h-2 rounded-full w-full border border-slate-700/60 shadow-inner"
                    style={{
                      background: `linear-gradient(to right, ${activeLayer.legendGradient.join(', ')})`,
                    }}
                  />
                  {activeLayer.units && (
                    <div className="text-right text-[9px] text-slate-500 font-mono">
                      Scale: {activeLayer.units}
                    </div>
                  )}
                </div>
              )}

              {/* Date Notice */}
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  GIBS Date:
                </span>
                <span className="font-mono text-slate-300">
                  {customDate || getDefaultGibsDate(activeLayer.layerIdentifier)}
                </span>
              </div>
            </div>
          )}

          {!activeLayer && (
            <div className="text-[11px] text-slate-500 text-center py-1">
              Select an overlay to project live NASA satellite products onto the Morocco basemap.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
