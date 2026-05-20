import React, { useState } from 'react';
import { REGION_DATA } from '../../data/regions';

interface RegionSelectorProps {
  selectedRegions: string[];
  onChange: (regions: string[]) => void;
}

export default function RegionSelector({ selectedRegions, onChange }: RegionSelectorProps) {
  const [selectedSido, setSelectedSido] = useState('서울');
  const regionsData = REGION_DATA as Record<string, string[]>;

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(regionsData).map(sido => (
          <button
            key={sido}
            type="button"
            onClick={(e) => { e.preventDefault(); setSelectedSido(sido); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 border-2 ${
              selectedSido === sido
                ? 'bg-blue-100 text-blue-700 border-blue-500'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            {sido}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-200 min-h-[100px] content-start">
        {regionsData[selectedSido]?.map(sigungu => {
          const fullRegion = `${selectedSido} ${sigungu}`;
          const isSelected = selectedRegions.includes(fullRegion);
          return (
            <button
              key={fullRegion}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (isSelected) {
                  onChange(selectedRegions.filter(r => r !== fullRegion));
                } else {
                  onChange([...selectedRegions, fullRegion]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
              }`}
            >
              {sigungu}
            </button>
          );
        })}
      </div>
    </div>
  );
}
