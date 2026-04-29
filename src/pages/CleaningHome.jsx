import React from 'react';
import HeroSection from '../components/cleaning/HeroSection';
import FlipCardSection from '../components/cleaning/FlipCardSection';
import CoreServicesSection from '../components/cleaning/CoreServicesSection';
import PromisesSection from '../components/cleaning/PromisesSection';
import CTASection from '../components/cleaning/CTASection';

export default function CleaningHome() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <HeroSection />
      <FlipCardSection />
      <CoreServicesSection />
      <PromisesSection />
      <CTASection />
    </div>
  );
}
