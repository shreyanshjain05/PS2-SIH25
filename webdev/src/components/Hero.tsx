'use client';

import React, { useEffect, useState } from 'react';
import { Button, FadeIn, CountUp } from './UI';
import { AlertTriangle, Wind, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from "next/link";

export const Hero: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-start overflow-hidden pt-32 pb-16 bg-slate-50">
      
      {/* --- NEW GEOMETRIC NETWORK BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        
        {/* Soft Gradient Spots */}
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-teal-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[100px]"></div>

        {/* The Geometric Network SVG - Increased Opacity */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.8]" xmlns="http://www.w3.org/2000/svg">
           <defs>
             <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="#0f172a" stopOpacity="0.1" />
               <stop offset="50%" stopColor="#0f172a" stopOpacity="0.25" />
               <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
             </linearGradient>
           </defs>

           {/* Large Connecting Shapes (The "Constellation" Look) */}
           <g stroke="url(#lineGrad)" strokeWidth="1.5" fill="none">
              {/* Central Poly Structure around text area */}
              <motion.path 
                d="M 100,200 L 400,100 L 800,150 L 900,400 L 600,600 L 200,550 Z" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
              <motion.path 
                d="M 400,100 L 600,50 L 1100,200 L 900,400" 
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: 1, ease: "easeInOut" }} 
              />
              <motion.path 
                d="M 200,550 L 100,800 L 500,900 L 600,600" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
              />
              
              {/* Right Side Structure around widget */}
              <motion.path 
                d="M 900,400 L 1200,350 L 1400,600 L 1100,800 L 600,600" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: 0.8, ease: "easeInOut" }}
              />
              
              {/* Cross Connections */}
              <motion.line 
                x1="400" y1="100" x2="600" y2="600" strokeOpacity="0.15" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 2, ease: "easeInOut" }}
              />
              <motion.line 
                x1="800" y1="150" x2="1200" y2="350" strokeOpacity="0.15" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
              />
           </g>

           {/* Nodes (The dots at vertices) */}
           <g fill="#0f172a" fillOpacity="0.1">
              <motion.circle cx="100" cy="200" r="4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} />
              <motion.circle cx="400" cy="100" r="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} />
              <motion.circle cx="800" cy="150" r="5" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
              <motion.circle cx="900" cy="400" r="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }} />
              <motion.circle cx="600" cy="600" r="4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 }} />
              <motion.circle cx="200" cy="550" r="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.7 }} />
              <motion.circle cx="1200" cy="350" r="6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.0 }} />
              <motion.circle cx="1100" cy="800" r="3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.3 }} />
           </g>

           {/* Floating Accent Dots (Teal/Blue) */}
           <circle cx="800" cy="150" r="3" fill="#0d9488" className="animate-pulse" />
           <circle cx="1200" cy="350" r="4" fill="#2563eb" className="animate-pulse-slow" />
           <circle cx="200" cy="550" r="2" fill="#0d9488" className="animate-bounce" style={{ animationDuration: '3s' }} />
        </svg>

        {/* Subtle Mask to fade edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex-grow">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Left: Text Content */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-8 order-2 lg:order-1 pt-2">
            <FadeIn delay={100}>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 text-[11px] font-bold tracking-widest uppercase hover:shadow-md transition-shadow cursor-default group">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                ISRO Mission
              </div>
            </FadeIn>
            
            <FadeIn delay={200}>
              <h1 className="text-5xl lg:text-[5rem] font-extrabold text-slate-900 tracking-tight leading-[1.05]">
                Advanced <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 animate-shimmer-x bg-[length:200%_auto]">Surveillance.</span> <br/>
                Predictive Action.
              </h1>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-lg font-normal">
                High-precision predictive modeling for <span className="font-bold text-slate-900 bg-slate-100 px-1 rounded">O₃ & NO₂</span>. Transforming 48-hour satellite forecasts into actionable city-level policy decisions.
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                
                <Link href="/dashboard">
                <Button variant="primary" size="lg" withArrow className="shadow-xl shadow-teal-900/10 font-bold tracking-wide">
                  View Forecast
                </Button>  </Link>
                           <Link href="/dashboard/api-keys">
                <Button variant="outline" size="lg" className="bg-white hover:bg-slate-50 border-slate-300 font-semibold tracking-wide">
                  Access API                 </Button>  </Link>
              </div>
            </FadeIn>
          </div>

          {/* Right: Compact Widget */}
          <FadeIn delay={500} className="lg:col-span-5 flex justify-center lg:justify-end items-start order-1 lg:order-2 w-full pt-2">
             <div className="relative w-full max-w-[360px] animate-float">
                
                 {/* Decorative background element behind widget */}
                 <div className="absolute -inset-4 bg-gradient-to-tr from-teal-500/20 to-blue-500/20 rounded-[2rem] blur-xl opacity-50 -z-10"></div>

                 {/* Widget Container - Dark Glass Panel */}
                 <div className="bg-[#0B1221]/95 backdrop-blur-xl rounded-2xl p-6 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] ring-1 ring-white/10 overflow-hidden group hover:scale-[1.01] transition-transform duration-500 ease-out z-20">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 relative z-10 border-b border-white/5 pb-4">
                      <div>
                        <div className="text-[10px] text-teal-400 font-mono font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-sm bg-teal-500"></div> AI Forecast Model
                        </div>
                        <div className="text-white text-lg font-bold flex items-center gap-2 font-heading">
                          New Delhi (NCR) 
                          <span className="relative flex h-2 w-2 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-mono tracking-wider mb-0.5">CONFIDENCE</div>
                        <div className="text-teal-400 font-bold text-xl font-mono tracking-tight">
                          <CountUp end={92.4} decimals={1} suffix="%" />
                        </div>
                      </div>
                    </div>

                    {/* Graph Area */}
                    <div className="relative h-36 w-full mb-6 z-10">
                       {/* Background Grid */}
                       <div className="absolute inset-0 grid grid-cols-4 grid-rows-2">
                          <div className="border-r border-slate-800/50 dashed"></div>
                          <div className="border-r border-slate-800/50 dashed"></div>
                          <div className="border-r border-slate-800/50 dashed"></div>
                          <div className="border-transparent"></div>
                          <div className="border-r border-t border-slate-800/50 dashed"></div>
                          <div className="border-r border-t border-slate-800/50 dashed"></div>
                          <div className="border-r border-t border-slate-800/50 dashed"></div>
                          <div className="border-t border-slate-800/50 dashed"></div>
                       </div>

                       {/* SVG Graph */}
                       <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="o3Fill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Dashed Line (Secondary) */}
                          <path 
                            d="M0,80 C20,78 40,82 60,75 S90,65 100,55" 
                            fill="none" 
                            stroke="#6366f1" 
                            strokeWidth="2" 
                            opacity="0.3"
                            strokeDasharray="3 3"
                            strokeLinecap="round"
                          />

                          {/* Main Prediction Curve */}
                          <path 
                            d="M0,65 C15,62 35,50 50,45 S85,35 100,25" 
                            fill="none" 
                            stroke="#2dd4bf" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            className="animate-draw drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]"
                          />
                          
                          {/* Fill Area */}
                          <path 
                             d="M0,65 C15,62 35,50 50,45 S85,35 100,25 V100 H0 Z" 
                             fill="url(#o3Fill)" 
                             className="opacity-0 animate-[fade-in_1s_ease-out_1s_forwards]"
                          />

                          {/* End Point Marker */}
                          <g className="animate-pulse">
                            <circle cx="100" cy="25" r="3" fill="#0f172a" stroke="#2dd4bf" strokeWidth="2" />
                            <circle cx="100" cy="25" r="6" fill="none" stroke="#2dd4bf" strokeWidth="1" opacity="0.5" />
                          </g>
                       </svg>
                       
                       {/* Time Labels */}
                       <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-3 uppercase tracking-wider font-semibold">
                          <span>Now</span>
                          <span>+12H</span>
                          <span>+24H</span>
                          <span>+48H</span>
                       </div>
                    </div>

                    {/* Metrics Footer */}
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                       <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50 backdrop-blur-sm group/metric hover:bg-slate-800/60 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="w-3 h-3 text-teal-400" />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ozone (O₃)</span>
                          </div>
                          <div className="text-2xl font-bold text-white tracking-tight font-mono">
                            <CountUp end={84} duration={1500} /> 
                            <span className="text-[10px] font-medium text-slate-500 ml-1">ppb</span>
                          </div>
                       </div>
                       <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50 backdrop-blur-sm group/metric hover:bg-slate-800/60 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-3 h-3 text-indigo-400" />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">NO₂ Levels</span>
                          </div>
                          <div className="text-2xl font-bold text-white tracking-tight font-mono">
                            <CountUp end={42} duration={1500} /> 
                            <span className="text-[10px] font-medium text-slate-500 ml-1">µg/m³</span>
                          </div>
                       </div>
                    </div>

                    {/* Alert Strip */}
                    <div className="mt-4 flex items-center gap-3 text-amber-400/90 text-[10px] bg-amber-500/5 px-4 py-2.5 rounded border border-amber-500/10 shadow-inner">
                       <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                       <span className="font-semibold tracking-wide font-mono">WARNING: Rising levels in +36h window</span>
                    </div>

                 </div>
             </div>
          </FadeIn>

        </div>
      </div>
    </div>
  );
};
