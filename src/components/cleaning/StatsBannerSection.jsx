import React from 'react';

export default function StatsBannerSection() {
  return (
    <section className="snap-section-short w-full bg-[#043b72] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 sm:gap-8 text-center divide-x-0 md:divide-x md:divide-blue-800/50">
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">12,400+</span>
            <span className="text-sm md:text-base text-blue-100 font-medium">만족한 고객님</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">4.9/5</span>
            <span className="text-sm md:text-base text-blue-100 font-medium">평균 만족도</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">1,240+</span>
            <span className="text-sm md:text-base text-blue-100 font-medium">활동 전문가</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">100%</span>
            <span className="text-sm md:text-base text-blue-100 font-medium">품질 보장제</span>
          </div>
        </div>
      </div>
    </section>
  );
}
