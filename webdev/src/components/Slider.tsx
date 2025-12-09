"use client";

import React, { useState, useRef } from "react";
import { AlertTriangle, Database, EyeOff, Info, Lock, X } from "lucide-react";

const ForecastingVisualizer: React.FC = () => {
  // Maximum percentage the user can drag to (Represents end-of-available-data)
  const MAX_T = 85;

  // Slider value represents 't' (Present time) as a percentage
  const [tValue, setTValue] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showStartTooltip, setShowStartTooltip] = useState(true);
  const [showLimitTooltip, setShowLimitTooltip] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);

  // Visualization windows (percent)
  const WINDOW_SIZE = 30; // size of rolling window (t-K -> t)
  const FORECAST_HORIZON = 20; // distance to t+K

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateValueFromPointer(e);
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateValueFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const updateValueFromPointer = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rawPercentage = (x / rect.width) * 100;
    const clampedPercentage = Math.max(0, Math.min(MAX_T, rawPercentage));
    setTValue(clampedPercentage);

    // limit tooltip
    setShowLimitTooltip(rawPercentage >= MAX_T - 0.5);
  };

  // Derived positions
  const windowStart = Math.max(0, tValue - WINDOW_SIZE);
  const windowWidth = Math.max(0.5, tValue - windowStart);
  const targetPos = Math.min(100, tValue + FORECAST_HORIZON);

  return (
    <div className="w-full select-none py-12 relative">
      {/* Header (small) */}
      <div className="flex justify-between items-end mb-6 text-sm font-bold tracking-wide">
        <div className="text-emerald-400 flex items-center gap-2 drop-shadow-md">
          <Database size={18} />
          <span>KNOWN HISTORY (Valid)</span>
        </div>
        <div className="text-rose-500 flex items-center gap-2 drop-shadow-md">
          <span>UNKNOWN FUTURE (Leakage)</span>
          <EyeOff size={18} />
        </div>
      </div>

      {/* Track */}
      <div
        className="relative h-28 w-full group cursor-ew-resize"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={trackRef}
      >
        <div
          className="absolute top-0 left-0 w-full h-full rounded-2xl overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
        >
          {/* Unknown (red) base */}
          <div className="absolute inset-0 bg-rose-950 bg-stripes-red shadow-[inset_0_0_50px_rgba(225,29,72,0.3)]"></div>

          {/* Known (green) overlay */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-900 to-emerald-600/90 border-r-4 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-75 ease-out z-10"
            style={{ width: `${tValue}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
          </div>

          {/* Rolling window */}
          <div
            className="absolute top-3 bottom-3 bg-emerald-400/20 border-2 border-emerald-300 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-75 ease-out flex items-center justify-center z-20 backdrop-blur-sm"
            style={{
              left: `${windowStart}%`,
              width: `${windowWidth}%`,
            }}
          >
            <span className="text-emerald-100 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2 drop-shadow-md">
             ROLLING MEAN
            </span>
          </div>

          {/* Data limit wall */}
          <div
            className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-slate-500 z-0 opacity-50"
            style={{ left: `${MAX_T}%` }}
          >
            <div className="absolute top-2 right-1 text-[10px] text-slate-500 font-mono rotate-90 origin-top-right whitespace-nowrap">
              DATA LIMIT
            </div>
          </div>

          {/* Forecast target */}
          {targetPos <= 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none"
              style={{ left: `${targetPos}%`, transform: "translateX(-50%)" }}
            >
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)] border-2 border-white animate-pulse"></div>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-400 whitespace-nowrap">Target</span>
              </div>
            </div>
          )}
        </div>

        {/* Present 't' handle visualization */}
        <div
          className="absolute -top-3 -bottom-3 w-1 z-30 transition-all duration-75 ease-out pointer-events-none"
          style={{ left: `${tValue}%` }}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white shadow-[0_0_15px_white]"></div>

          {/* Top label */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-3 flex flex-col items-center pointer-events-none">
            <div className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap border-2 border-slate-200">
              Present (t)
            </div>
            <div className="w-0.5 h-3 bg-white mt-1"></div>
          </div>

          {/* Limit tooltip (when hitting MAX_T) */}
          {showLimitTooltip && (
            <div className="absolute top-1/2 left-full ml-4 -translate-y-1/2 w-52 z-50 animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none">
              <div className="bg-rose-600 text-white text-xs p-3 rounded-lg shadow-2xl border border-rose-400 relative">
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-rose-600 rotate-45 border-l border-b border-rose-400"></div>
                <div className="flex items-start gap-2">
                  <Lock size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <strong className="block mb-0.5">End of Available Data</strong>
                    <span className="opacity-90 leading-tight block text-[13px]">
                      Cannot move 'Present' further — future data does not exist yet.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Handle grip visual */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-14 bg-slate-800 rounded-full border-4 border-white shadow-2xl flex flex-col items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing pointer-events-none">
            <div className="w-8 h-0.5 bg-slate-600/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"></div>
            <div className="w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
          </div>
        </div>
      </div>

      {/* Bottom markers */}
      <div className="relative h-12 w-full mt-4 font-mono text-xs text-slate-500">
        <div className="absolute transition-all duration-75 group" style={{ left: `${windowStart}%`, transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-3 bg-emerald-500/50 mx-auto mb-1"></div>
          <div className="text-emerald-400 font-bold">t-k</div>

          {/* start tooltip */}
          {showStartTooltip && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 z-40">
              <div className="bg-slate-800 text-slate-200 p-2.5 rounded-lg border border-slate-700 shadow-xl text-[11px] leading-snug relative text-center">
                <button
                  onClick={() => setShowStartTooltip(false)}
                  className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white rounded-full p-0.5 hover:bg-slate-600 transition-colors"
                >
                  <X size={10} />
                </button>
                <div className="w-3 h-3 bg-slate-800 absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-45 border-t border-l border-slate-700"></div>
                <span>Start of historical window used for calculation</span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute transition-all duration-75 font-bold text-white flex flex-col items-center" style={{ left: `${tValue}%`, transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-4 bg-white mx-auto mb-1"></div>
          t
        </div>

        <div className="absolute transition-all duration-75 text-rose-400 flex flex-col items-center" style={{ left: `${Math.min(100, targetPos)}%`, transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-3 bg-rose-500/50 mx-auto mb-1"></div>
          t+k
        </div>
      </div>

    </div>
  );
};

const ForecastingVisualizerPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-950 bg-grid-pattern relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-5xl w-full space-y-8 z-10">
        <div className="text-center space-y-4">
        
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-4xl">
            Rolling Mean & <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Data Leakage</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400">
            Understand why <span className="text-emerald-400">historical data</span> drives the model and why touching the <span className="text-rose-400">red zone</span> breaks the laws of forecasting.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 p-8 sm:p-12 ring-1 ring-white/10">
          <ForecastingVisualizer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-400">
          <div className="flex flex-col p-6 bg-slate-900/60 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <span className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Safe Zone (Green)
            </span>
            <p>Features computed here (like rolling means) are valid. This is the <strong>Known World</strong>.</p>
          </div>
          <div className="flex flex-col p-6 bg-slate-900/60 rounded-xl border border-slate-700">
            <span className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              The Present (t)
            </span>
            <p>The strict boundary. All calculations must stop here. Crossing it is cheating.</p>
          </div>
          <div className="flex flex-col p-6 bg-slate-900/60 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-colors">
            <span className="font-bold text-rose-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Danger Zone (Red)
            </span>
            <p>Future data. Accessing this for training creates a model that fails in production.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingVisualizerPage;
