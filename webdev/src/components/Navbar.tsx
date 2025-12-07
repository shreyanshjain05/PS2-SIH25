'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './UI';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Pollutants', href: '#pollutants' },
    { name: 'Monitoring', href: '#monitoring' },
    { name: 'Response System', href: '#policy-simulator' },
    { name: 'Portals', href: '#portals' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50'
          : 'bg-white/90 backdrop-blur-sm border-b border-white/10'
      }`}
    >
      {/* Top Strip */}
      <div className="bg-slate-950 text-slate-400 text-[10px] md:text-xs py-2 px-4 md:px-8 flex justify-between items-center tracking-wide">
        <div className="flex gap-4 items-center font-medium">
          <span className="text-slate-200 tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="w-px h-3 bg-slate-700"></span>
          <span className="tracking-wider">INDIAN SPACE RESEARCH ORGANISATION</span>
        </div>

        <div className="hidden md:flex gap-6 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">Screen Reader Access</span>
          <span className="hover:text-white cursor-pointer transition-colors">Skip to Main Content</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* LEFT SECTION — SIH Logo + Title */}
          <div className="flex items-center gap-4">

            {/* SIH LEFT LOGO */}
            <img 
              src="/SIH2.webp" 
              alt="SIH" 
              className="h-18 w-auto object-contain"
            />

            {/* Title */}
            <a href="#home" className="flex flex-col cursor-pointer group">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight group-hover:text-teal-700">
                NAQFM <span className="text-teal-600">DSS</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
                National Air Quality Forecasting Mission
              </span>
            </a>
          </div>

          {/* CENTER NAV */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-all"
              >
                {item.name}
              </a>
            ))}
          </nav>
{/* RIGHT SECTION — LOGIN + LOGOS */}
<div className="hidden md:flex items-center gap-8 ml-auto">

  {/* Login */}
  <Button 
    variant="primary" 
    size="sm"
    className="shadow-lg shadow-teal-900/10 font-bold tracking-wide px-5 py-2"
  >
    Official Login
  </Button>

  {/* ISRO + INSPACE LOGOS */}
  <div className="flex items-center gap-6">
    <img 
      src="/isro.svg" 
      alt="ISRO" 
      className="h-12 w-auto object-contain opacity-95 hover:opacity-100 transition"
    />
    <img 
      src="/inspace.png" 
      alt="IN-SPACe"
      className="h-11 w-auto object-contain opacity-95 hover:opacity-100 transition"
    />
  </div>

</div>


          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-700 hover:text-teal-700 p-2"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 z-40">
          <div className="flex flex-col p-4 gap-2">

            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-semibold text-slate-600 py-3 px-4 rounded-lg hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}

            <div className="h-px bg-slate-100 my-2"></div>
            <Button variant="primary" className="w-full">Official Login</Button>
          </div>
        </div>
      )}
    </header>
  );
};
