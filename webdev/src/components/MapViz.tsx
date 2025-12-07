'use client';

import React, { useState, useEffect } from 'react';
import { Section, FadeIn } from './UI';
import { Play, Pause, RefreshCw, Layers, Scan, Map as MapIcon } from 'lucide-react';

export const MapViz: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeline, setTimeline] = useState(0);
  const [activeCity, setActiveCity] = useState<number | null>(null);

  // 7 Locations Config
  const locations = [
    { id: 1, name: 'New Delhi', x: 25, y: 30, risk: 'High' },
    { id: 2, name: 'Mumbai', x: 18, y: 55, risk: 'Moderate' },
    { id: 3, name: 'Bangalore', x: 28, y: 75, risk: 'Low' },
    { id: 4, name: 'Chennai', x: 42, y: 70, risk: 'Moderate' },
    { id: 5, name: 'Kolkata', x: 62, y: 45, risk: 'High' },
    { id: 6, name: 'Hyderabad', x: 32, y: 60, risk: 'Moderate' },
    { id: 7, name: 'Ahmedabad', x: 12, y: 40, risk: 'High' },
  ];

  // Simulate timeline playback
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeline((prev) => (prev >= 100 ? 0 : prev + 0.25)); // Slower increment for smoother timeline
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Grid definition for HD look
  const rows = 24;
  const cols = 48;

  return (
    <Section className="bg-slate-950 relative overflow-hidden py-0 md:py-0 border-y border-slate-900">
      
      <div className="relative w-full">
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full z-20 p-6 md:p-8 pointer-events-none">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="pointer-events-auto">
                <FadeIn>
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-teal-950/50 border border-teal-500/30 text-teal-400 text-[10px] font-mono tracking-widest uppercase mb-2 backdrop-blur-sm shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <Scan className="w-3 h-3 animate-spin-slow" />
                    Satellite Feed: SENTINEL-5P
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                    Regional Forecast Intelligence
                  </h2>
                </FadeIn>
             </div>
             
             {/* Map Controls */}
             <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-1 flex gap-1 shadow-lg">
                <button className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Toggle Layers">
                  <Layers className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Map View">
                  <MapIcon className="w-4 h-4" />
                </button>
                <div className="w-px bg-slate-700 mx-1"></div>
                <button className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="Refresh Feed">
                  <RefreshCw className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>

        {/* The Map Visualization Container */}
        <div className="relative w-full h-[600px] md:h-[750px] bg-[#02040a] overflow-hidden flex items-center justify-center group cursor-crosshair">
            
            {/* World Map Background (Dark & Subtle) */}
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                 style={{
                   background: `radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 80%)`
                 }}>
            </div>

            {/* HD DOT GRID LAYER (Sharp, Defined) */}
            <div className="relative z-10 grid w-full max-w-7xl aspect-[2/1] mx-auto gap-px opacity-90"
                 style={{ 
                   gridTemplateColumns: `repeat(${cols}, 1fr)`,
                   gridTemplateRows: `repeat(${rows}, 1fr)`
                 }}>
                 
                 {Array.from({ length: rows * cols }).map((_, i) => {
                    const r = Math.floor(i / cols);
                    const c = i % cols;
                    
                    // Convert grid coords to % to match locations
                    const xPct = (c / cols) * 100;
                    const yPct = (r / rows) * 100;

                    let intensity = 0;
                    
                    // Calculate influence from each city location
                    locations.forEach(loc => {
                        // Wind Simulation: Gentle Drift (West -> East) + Slow Breathing
                        // Much smoother coefficients to avoid "haphazard" jumping
                        
                        // Drift: 5% movement across the screen over the full 48h timeline
                        const windDrift = (timeline / 100) * 5; 
                        
                        // Breathing: Very slow sine wave (period of ~300 timeline units)
                        const breathing = Math.sin((timeline * 0.05) + loc.id) * 1.5;
                        
                        const effectiveX = loc.x + windDrift + (Math.cos(timeline * 0.02) * 2);
                        const effectiveY = loc.y + (Math.sin(timeline * 0.03) * 1.5); // Less vertical movement
                        
                        const dx = xPct - effectiveX;
                        const dy = yPct - effectiveY;
                        
                        // Slightly wider spread for softer edges, but still defined
                        // 12 units spread instead of 8 for smoother gradients
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < 12) {
                           // Cubic easing for smoother falloff than linear
                           const factor = (12 - dist) / 12;
                           intensity += factor * factor;
                        }
                    });

                    // Normalize
                    intensity = Math.min(1.2, intensity); // Allow slight oversaturation for hotspots

                    // Threshold for "sharpness"
                    if (intensity < 0.15) return <div key={i} className="bg-transparent" />;

                    // Color Mapping - Smoother transitions
                    let bgClass = 'bg-slate-800';
                    let opacity = 0.2;
                    let shadow = '';
                    
                    if (intensity > 0.85) {
                        bgClass = 'bg-rose-500';
                        shadow = '0 0 10px rgba(244,63,94,0.6)';
                        opacity = 0.95;
                    } else if (intensity > 0.65) {
                        bgClass = 'bg-amber-500';
                        opacity = 0.8;
                    } else if (intensity > 0.4) {
                        bgClass = 'bg-teal-500';
                        opacity = 0.6;
                    } else if (intensity > 0.15) {
                        bgClass = 'bg-indigo-900';
                        opacity = 0.4;
                    }

                    return (
                      <div 
                        key={i} 
                        // Long duration (700ms) creates the smooth morphing effect
                        className={`rounded-sm transition-all duration-700 ease-in-out ${bgClass}`}
                        style={{ 
                            opacity: opacity,
                            boxShadow: shadow
                        }}
                      />
                    );
                 })}
            </div>

            {/* LOCATION MARKERS OVERLAY - Moving in sync with the base clouds */}
            <div className="absolute inset-0 max-w-7xl mx-auto w-full aspect-[2/1] pointer-events-none">
                {locations.map((loc) => (
                    <div 
                        key={loc.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 group/marker pointer-events-auto"
                        style={{ 
                            // Matches the "center" of the cloud drift logic above
                            left: `${loc.x + (timeline / 100) * 5 + (Math.cos(timeline * 0.02) * 2)}%`, 
                            top: `${loc.y + (Math.sin(timeline * 0.03) * 1.5)}%`,
                            transition: 'all 700ms ease-linear' // Smooth movement matching the grid update
                        }}
                        onMouseEnter={() => setActiveCity(loc.id)}
                        onMouseLeave={() => setActiveCity(null)}
                    >
                        {/* The Dot */}
                        <div className={`relative w-4 h-4 flex items-center justify-center`}>
                             <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${loc.risk === 'High' ? 'bg-rose-500' : 'bg-teal-500'}`}></div>
                             <div className={`relative w-2 h-2 rounded-full border border-white shadow-sm ${loc.risk === 'High' ? 'bg-rose-600' : 'bg-teal-600'}`}></div>
                        </div>

                        {/* The Label */}
                        <div className={`
                            flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl transition-all duration-300
                            ${activeCity === loc.id ? 'scale-110 opacity-100 z-50' : 'scale-90 opacity-80 hover:scale-105 hover:opacity-100'}
                        `}>
                            <div className="flex justify-between items-center gap-4 mb-1">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{loc.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    loc.risk === 'High' ? 'bg-rose-500/20 text-rose-400' : 
                                    loc.risk === 'Moderate' ? 'bg-amber-500/20 text-amber-400' : 
                                    'bg-teal-500/20 text-teal-400'
                                }`}>
                                    {loc.risk}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                <span>NO₂: {Math.floor(40 + (loc.id * 5) + (timeline * 0.2))}</span>
                                <span className="w-px h-2 bg-slate-700"></span>
                                <span>O₃: {Math.floor(80 + (loc.id * 3) - (timeline * 0.1))}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Scanning Line */}
            <div className="absolute top-0 bottom-0 w-px bg-teal-400/30 z-20 pointer-events-none"
                 style={{ left: `${timeline}%` }}>
                 <div className="absolute top-0 w-full h-full bg-gradient-to-r from-teal-500/10 to-transparent w-8 -translate-x-full"></div>
            </div>
            
            {/* Legend - Updated */}
            <div className="absolute bottom-32 left-8 bg-slate-950/90 backdrop-blur p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 pointer-events-none z-20 shadow-2xl">
               <div className="text-[10px] uppercase text-slate-500 mb-3 font-bold tracking-wider border-b border-slate-800 pb-2">Forecast Severity</div>
               <div className="space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                   <span>Critical (&gt;400)</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                   <span>Elevated</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-teal-500 rounded-sm"></div>
                   <span>Nominal</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-indigo-900 rounded-sm opacity-50"></div>
                   <span>No Data</span>
                 </div>
               </div>
            </div>

        </div>

        {/* Timeline Scrubber UI */}
        <div className="absolute bottom-0 w-full bg-slate-950/80 backdrop-blur border-t border-slate-800 p-4 md:p-6 z-30">
           <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-6">
                 
                 <div className="flex flex-col gap-1 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Simulation</span>
                    <button 
                      onClick={togglePlay}
                      className="flex items-center gap-2 text-teal-400 hover:text-white transition-colors group"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span className="text-sm font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>
                 </div>
                 
                 <div className="flex-grow relative h-12 bg-slate-900 rounded border border-slate-800 overflow-hidden cursor-pointer group">
                    {/* Background hashes */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 20px)', backgroundSize: '20px 100%' }}></div>
                    
                    {/* Progress Bar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-teal-900/40 border-r-2 border-teal-500 transition-all duration-75 ease-linear shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                      style={{ width: `${timeline}%` }}
                    >
                        <div className="absolute right-0 bottom-1 translate-x-1/2 text-[9px] font-bold text-teal-500 bg-slate-950 px-1 border border-teal-900/50 rounded">T+{Math.floor(timeline * 0.48)}H</div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 pointer-events-none"></div>
                 </div>

                 <div className="flex flex-col items-end gap-1 min-w-[100px]">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Window</span>
                    <span className="text-sm font-bold text-white">+48 HOURS</span>
                 </div>

              </div>
           </div>
        </div>

      </div>
    </Section>
  );
};