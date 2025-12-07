import React from 'react';
import { Section, FadeIn, Button } from './UI';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300">
       {/* Trust Strip */}
       <div className="bg-slate-50 border-b border-slate-200 text-slate-900">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
           <FadeIn>
             <p className="text-center text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest">Built for India’s next-generation environmental intelligence infrastructure</p>
             <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Placeholder texts for logos since we don't have images */}
               <span className="text-lg font-bold font-serif text-slate-800">NDMA</span>
               <span className="text-lg font-bold font-serif text-slate-800">IMD</span>
               <span className="text-lg font-bold font-sans text-slate-800">Smart Cities</span>
               <span className="text-lg font-bold font-sans text-slate-800">NCAP</span>
               <span className="text-lg font-bold font-sans text-slate-800">Digital India</span>
             </div>
           </FadeIn>
         </div>
       </div>

       {/* Final CTA */}
       <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 to-blue-900/20"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Bring AI-grade environmental intelligence to every Indian city.</h2>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="primary" size="lg" withArrow>Try Public Portal</Button>
                <Button variant="secondary" size="lg" withArrow>Access API Documentation</Button>
              </div>
            </FadeIn>
          </div>
       </div>

       {/* Links */}
       <div className="bg-slate-950 py-12 border-t border-slate-900">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8 text-sm">
           <div>
             <h4 className="text-white font-bold mb-4">Ministry of Earth Sciences</h4>
             <p className="text-slate-500 leading-relaxed">
               Prithvi Bhavan, Lodhi Road,<br/>
               New Delhi - 110003
             </p>
           </div>
           
           <div>
             <h4 className="text-white font-bold mb-4">Platform</h4>
             <ul className="space-y-2 text-slate-500">
               <li><a href="#" className="hover:text-teal-400">Decision Support System</a></li>
               <li><a href="#" className="hover:text-teal-400">Open Data Portal</a></li>
               <li><a href="#" className="hover:text-teal-400">API Access</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-4">Resources</h4>
             <ul className="space-y-2 text-slate-500">
               <li><a href="#" className="hover:text-teal-400">Health Advisories</a></li>
               <li><a href="#" className="hover:text-teal-400">Research Papers</a></li>
               <li><a href="#" className="hover:text-teal-400">Annual Reports</a></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-bold mb-4">Legal</h4>
             <ul className="space-y-2 text-slate-500">
               <li><a href="#" className="hover:text-teal-400">Privacy Policy</a></li>
               <li><a href="#" className="hover:text-teal-400">Terms of Use</a></li>
               <li><a href="#" className="hover:text-teal-400">Accessibility</a></li>
             </ul>
           </div>
         </div>
         <div className="text-center text-slate-600 text-xs mt-12">
            © 2024 Government of India. All rights reserved.
         </div>
       </div>
    </footer>
  );
};