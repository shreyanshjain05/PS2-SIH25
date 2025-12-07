import React from 'react';
import { 
  CloudFog, 
  FlaskConical, 
  Users, 
  ShieldAlert, 
  Stethoscope, 
  Landmark,
  ArrowRight,
  Database,
  Timer,
  Cpu,
  Share2,
  FileText,
  Download,
  Smartphone,
  Satellite,
  Activity,
  Zap,
} from 'lucide-react';
import { Section, FadeIn, Button, CountUp, Badge } from './UI';

export const ModelReliabilityMetrics: React.FC = () => {
  return (
    <div className="bg-slate-950 relative overflow-hidden pb-24 pt-10 border-t border-slate-900/50">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-teal-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
             
             {/* Card texture */}
             <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

            {/* Left: Identity */}
            <div className="flex items-center gap-6 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-10 w-full md:w-auto relative z-10">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                <Activity className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">System Status</h3>
                <div className="flex items-center gap-2 mt-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-xs font-mono text-green-400 uppercase tracking-widest font-semibold">Operational</span>
                </div>
              </div>
            </div>

            {/* Middle: Metrics Grid */}
            <div className="grid grid-cols-3 gap-6 md:gap-16 flex-grow w-full md:w-auto relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Model Confidence</span>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-white tracking-tight"><CountUp end={98.4} decimals={1} suffix="%" /></span>
                  <div className="mb-1.5 text-[10px] px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded border border-teal-500/20">+0.2%</div>
                </div>
              </div>
              
              <div className="flex flex-col border-l border-slate-800 pl-6 md:pl-10">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Forecast Window</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white tracking-tight">T+<CountUp end={48} />h</span>
                </div>
              </div>

              <div className="flex flex-col border-l border-slate-800 pl-6 md:pl-10">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Latency</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white tracking-tight"><CountUp end={45} /></span>
                  <span className="text-sm font-medium text-slate-500 mb-1.5">ms</span>
                </div>
              </div>
            </div>

            {/* Right: Validation */}
            <div className="hidden lg:flex flex-col items-end gap-3 w-full md:w-auto pl-8 border-l border-slate-800 relative z-10">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Data Sources</div>
              <div className="flex -space-x-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-sm z-30" title="CPCB">CP</div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-sm z-20" title="IMD">IMD</div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-sm z-10" title="ISRO">IS</div>
              </div>
            </div>

          </div>
        </FadeIn>
      </div>
    </div>
  );
};

export const HowItWorks: React.FC = () => {
  return (
    <Section className="bg-slate-50 py-24 border-y border-slate-200 relative overflow-hidden">
       {/* Background Decoration: Poly-Network - More Evident */}
       <svg className="absolute inset-0 w-full h-full opacity-[0.8] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
         <g stroke="#0f172a" strokeWidth="1" fill="none" opacity="0.15">
            <path d="M -100,500 L 200,300 L 500,400 L 800,200 L 1200,300" />
            <path d="M 500,400 L 600,600 L 1000,700" strokeDasharray="4 4" />
            <circle cx="200" cy="300" r="3" fill="#0f172a" />
            <circle cx="500" cy="400" r="4" fill="#0f172a" />
            <circle cx="800" cy="200" r="3" fill="#0f172a" />
         </g>
       </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         <FadeIn>
           <div className="flex flex-col md:flex-row justify-between items-end mb-16">
              <div className="max-w-xl">
                <div className="text-teal-600 font-mono text-xs tracking-widest uppercase mb-3 font-bold">Process Architecture</div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">From Orbit to Insight.</h2>
              </div>
           </div>
         </FadeIn>
         
         {/* Pipeline Visual */}
         <div className="relative">
            {/* Desktop Line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-slate-200 rounded-full overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500 to-transparent w-1/3 animate-shimmer-x opacity-20"></div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
               {[
                 { title: "Acquisition", icon: Satellite, sub: "Sentinel-5P + Ground Sensors", step: "01" },
                 { title: "Processing", icon: Cpu, sub: "Ensemble ML Models", step: "02" },
                 { title: "Prediction", icon: Zap, sub: "48h Forecasting Engine", step: "03" },
                 { title: "Delivery", icon: Smartphone, sub: "API & Public Alerts", step: "04" },
               ].map((item, i) => (
                 <FadeIn key={i} delay={i * 100} className="relative pt-4 md:pt-8 group">
                    <div className="md:absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-teal-500 rounded-full z-10 hidden md:block group-hover:scale-125 transition-transform duration-300 shadow-sm"></div>
                    
                    <div className="bg-white hover:bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-100 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                       <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 z-0"></div>
                       <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-colors">
                              <item.icon className="w-6 h-6" />
                            </div>
                            <span className="text-4xl font-black text-slate-100 group-hover:text-slate-50 font-mono transition-colors">{item.step}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.sub}</p>
                       </div>
                    </div>
                 </FadeIn>
               ))}
            </div>
         </div>
      </div>
    </Section>
  );
};

export const TechStackStrip: React.FC = () => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 py-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px)', backgroundSize: '100px 100%' }}></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded bg-white">Built With</span>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 grayscale hover:grayscale-0 transition-all duration-500"><div className="flex items-center gap-8">

  <div className="flex items-center gap-2">
    <img src="/terraform.svg" alt="Terraform" className="h-6 w-6" />
    <span className="font-serif font-bold text-xl text-slate-800 tracking-tight">
      Terraform
    </span>
  </div>

  <div className="flex items-center gap-2">
    <img src="/next-16-svgrepo-com.svg" alt="Next.js" className="h-6 w-6" />
    <span className="font-sans font-bold text-lg text-slate-700">
      Next.js
    </span>
  </div>

  <div className="flex items-center gap-2">
    <img src="/azure.svg" alt="Microsoft Azure" className="h-6 w-6" />
    <span className="font-mono font-bold text-lg text-slate-700">
      Microsoft Azure
    </span>
  </div>

  <div className="flex items-center gap-2">
    <img src="/elysiajs.svg" alt="ElysiaJS" className="h-6 w-6" />
    <span className="font-sans font-bold text-lg text-slate-700">
      ElysiaJS
    </span>
  </div>

  <div className="flex items-center gap-2">
    <img
      src="/better-auth_dark.svg"
      alt="BetterAuth"
      className="h-6"
    />
    <span className="font-serif font-bold text-xl text-slate-800 tracking-tight">
      BetterAuth
    </span>
  </div>

</div>

          </div>
        </div>
      </div>
    </div>
  );
};

export const DownloadsSection: React.FC = () => {
  return (
    <Section className="bg-slate-50 py-24 relative overflow-hidden border-t border-slate-200">
      {/* Texture - More evident */}
      <div className="absolute inset-0 opacity-[0.06]" 
           style={{ 
             backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }}>
      </div>
      <div className="absolute -left-20 top-1/2 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-slate-200 pb-8">
          <div>
             <h3 className="text-2xl font-bold text-slate-900 mb-2">Technical Documentation</h3>
             <p className="text-slate-500">Resources for policy makers, researchers, and developers.</p>
          </div>
          <Button variant="outline" size="sm" className="mt-6 md:mt-0 bg-white hover:bg-slate-100">
            View Full Archive
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Forecast Methodology v4.2", type: "PDF", size: "2.4 MB", desc: "Ensemble ML Architecture Whitepaper" },
            { title: "Annual Impact Report 2024", type: "PDF", size: "5.1 MB", desc: "National pollution reduction statistics" },
            { title: "Data Dictionary (JSON)", type: "API", size: "Live", desc: "Schema definition for Business API" }
          ].map((doc, i) => (
            <div key={i} className="group bg-white border border-slate-200 hover:border-teal-400 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg cursor-pointer">
               <div className="flex justify-between items-start mb-5">
                  <div className="p-2.5 bg-slate-50 rounded-lg text-teal-600 group-hover:text-white group-hover:bg-teal-600 transition-colors border border-slate-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
               </div>
               <h4 className="font-bold text-slate-900 mb-1.5 transition-colors">{doc.title}</h4>
               <p className="text-xs text-slate-500 mb-5">{doc.desc}</p>
               <div className="flex items-center gap-2">
                 <Badge color="bg-slate-100 text-slate-600 border border-slate-200">{doc.type}</Badge>
                 <span className="text-[10px] text-slate-500">{doc.size}</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export const PollutantExplainer: React.FC = () => {
  return (
    <Section className="bg-slate-50 py-24 border-y border-slate-200 relative overflow-hidden">
      {/* Background Shapes: Poly-Network - More Evident */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.8] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
         <g stroke="#0f172a" strokeWidth="1" fill="none" opacity="0.15">
            <path d="M 1200,100 L 1000,400 L 600,300 L 400,600" />
            <circle cx="1000" cy="400" r="4" fill="#0f172a" />
            <circle cx="600" cy="300" r="3" fill="#0f172a" />
         </g>
      </svg>
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Header Area */}
          <div className="lg:col-span-4 sticky top-32">
            <FadeIn>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Target Pollutants
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                Invisible Killers.<br/>
                <span className="text-teal-600">Visible Impact.</span>
              </h2>
              <p className="text-lg text-slate-600 font-light mb-8 leading-relaxed">
                Moving beyond simple PM2.5 monitoring. NAQFM leverages hyperspectral satellite data to detect gaseous precursors before they become hazardous smog.
              </p>
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  Why it matters?
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  O₃ and NO₂ are primary triggers for respiratory inflammation and crop yield reduction, costing India approx 1.4% of GDP annually.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Cards Area */}
          <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
            <FadeIn delay={100} className="h-full">
              <div className="h-full p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity animate-float">
                  <CloudFog className="w-32 h-32 text-blue-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300 border border-blue-100 group-hover:border-blue-500">
                      <CloudFog className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-4xl font-black text-slate-100 group-hover:text-blue-50 transition-colors font-mono">O₃</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ground-Level Ozone</h3>
                  <div className="w-12 h-1 bg-blue-500 rounded-full mb-4"></div>
                  <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                    A secondary pollutant formed by sunlight-driven reactions between NOx and VOCs. Peaks in afternoons, causing invisible lung damage.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                     <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">Respiratory Distress</span>
                     <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">Crop Damage</span>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200} className="h-full">
              <div className="h-full p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity animate-float-delayed">
                   <FlaskConical className="w-32 h-32 text-purple-500" />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300 border border-purple-100 group-hover:border-purple-500">
                      <FlaskConical className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-4xl font-black text-slate-100 group-hover:text-purple-50 transition-colors font-mono">NO₂</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Nitrogen Dioxide</h3>
                  <div className="w-12 h-1 bg-purple-500 rounded-full mb-4"></div>
                  <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                    A byproduct of high-temperature combustion in vehicles and power plants. A key precursor to PM2.5 and acid rain.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                     <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">Urban Haze</span>
                     <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">Inflammation</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </Section>
  );
};

export const RoleBasedAccess: React.FC = () => {
  const roles = [
    {
      title: "Citizen Portal",
      icon: Users,
      desc: "Real-time local alerts, health advisories & mask recommendations.",
      color: "teal",
      tag: "Public"
    },
    {
      title: "Ministry Command",
      icon: Landmark,
      desc: "Interstate coordination dashboard & compliance monitoring.",
      color: "blue",
      tag: "Restricted"
    },
    {
      title: "Business API",
      icon: Database,
      desc: "Integration for logistics planning & healthcare supply chains.",
      color: "indigo",
      tag: "Developer"
    },
    {
      title: "Admin Console",
      icon: ShieldAlert,
      desc: "Model calibration, sensor health status & user management.",
      color: "rose",
      tag: "Admin"
    }
  ];

  return (
    <Section className="bg-slate-950 py-24 border-y border-slate-900 relative overflow-hidden">
      {/* Clean Dark Background - Removed Hex Grid */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[120px] rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
           <FadeIn>
             <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Unified Intelligence Architecture</h2>
             <p className="text-slate-400 text-lg font-light">
               One underlying AI model, four specialized interfaces. Ensuring seamless data flow from satellite sensors to street-level action.
             </p>
           </FadeIn>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-teal-900/10 h-full flex flex-col z-10">
                <div className={`absolute top-0 left-0 w-full h-1 bg-${role.color}-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="flex justify-between items-start mb-6">
                   <div className={`w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-${role.color}-400 group-hover:bg-${role.color}-600 group-hover:text-white group-hover:border-${role.color}-500 transition-all duration-300`}>
                     <role.icon className="w-6 h-6" />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">{role.tag}</span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{role.title}</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed flex-grow">{role.desc}</p>
                
                <div className="flex items-center text-xs font-bold text-slate-500 group-hover:text-teal-400 transition-colors cursor-pointer pt-4 border-t border-slate-800">
                  ACCESS MODULE <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  );
};

export const StrategicModules: React.FC = () => {
  return (
    <Section className="bg-slate-50 py-24 border-y border-slate-200 relative overflow-hidden">
      {/* Background Flow Lines: Constellation - More Evident */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.8] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
         <g stroke="#0f172a" strokeWidth="1" fill="none" opacity="0.15">
           <path d="M 0,200 L 300,100 L 600,200 L 900,100" />
           <circle cx="300" cy="100" r="3" fill="#0f172a" />
           <circle cx="600" cy="200" r="4" fill="#0f172a" />
         </g>
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-20">
               <div className="text-teal-600 font-mono text-xs tracking-widest uppercase mb-3 font-bold">Response Mechanism</div>
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">From Prediction to Policy.</h2>
               <p className="text-lg text-slate-600 font-light">
                 How NAQFM translates raw satellite data into preemptive government action.
               </p>
            </div>
         </FadeIn>
         
         {/* Workflow Steps */}
         <div className="relative grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-teal-200 via-blue-200 to-indigo-200 border-t border-dashed border-slate-300 -z-10 animate-shimmer-x"></div>

            <FadeIn delay={100} className="relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-teal-200 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
               <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <Timer className="w-10 h-10 text-teal-600" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">1</div>
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Early Warning</h3>
               <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 bg-teal-50 px-2 py-1 rounded">T-72 Hours</div>
               <p className="text-slate-600 text-sm leading-relaxed">
                 Generates automated alerts 3 days in advance. Allows cities to implement GRAP measures (halting construction, diverting traffic) before pollution peaks.
               </p>
            </FadeIn>

            <FadeIn delay={200} className="relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-200 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
               <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="w-10 h-10 text-blue-600" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">2</div>
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Policy Simulator</h3>
               <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 bg-blue-50 px-2 py-1 rounded">Digital Twin AI</div>
               <p className="text-slate-600 text-sm leading-relaxed">
                 "What-If" Analysis Engine. Officials can simulate the impact of interventions (e.g., "Odd-Even Rule") on the forecasted air quality model in real-time.
               </p>
            </FadeIn>

            <FadeIn delay={300} className="relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-indigo-200 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
               <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <Share2 className="w-10 h-10 text-indigo-600" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">3</div>
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Public Dissemination</h3>
               <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 bg-indigo-50 px-2 py-1 rounded">Multi-Channel API</div>
               <p className="text-slate-600 text-sm leading-relaxed">
                 Instantly pushes validated data to public billboards, hospital networks, and media outlets to minimize public exposure risks.
               </p>
            </FadeIn>
         </div>
      </div>
    </Section>
  );
};