// src/app/page.tsx

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import {
  PollutantExplainer,
  RoleBasedAccess,
  StrategicModules,
  ModelReliabilityMetrics,
  HowItWorks,
  TechStackStrip,
  DownloadsSection,
} from "@/components/Features";
import { MapViz } from "@/components/MapViz";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="flex flex-col pt-24">
        {/* 1. Intro (Light) */}
        <section id="home">
          <Hero />
        </section>

        {/* 2. Authority Strip (Light) */}
        <section>
          <TechStackStrip />
        </section>

        {/* 3. The Problem (Deep Dark) */}
        <section id="pollutants" className="scroll-mt-20">
          <PollutantExplainer />
        </section>

        {/* 4. The Process (Light) */}
        <section className="scroll-mt-20">
          <HowItWorks />
        </section>

        {/* 5. The Demo (Deep Dark) */}
        <section id="monitoring" className="scroll-mt-20">
          <MapViz />
          <ModelReliabilityMetrics />
        </section>

        {/* 6. The Solution (Light) */}
        <section id="policy-simulator" className="scroll-mt-20">
          <StrategicModules />
        </section>

        {/* 7. Access (Deep Dark) */}
        <section id="portals" className="scroll-mt-20">
          <RoleBasedAccess />
        </section>

        {/* 8. Resources (Light) */}
        <section className="scroll-mt-20">
          <DownloadsSection />
        </section>
      </main>

      <Footer />
    </div>
  );
}
