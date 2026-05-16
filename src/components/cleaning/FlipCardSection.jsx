import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function FlipCardSection() {
  // 모바일 환경에서의 터치(클릭) 플립 상태를 관리 (null, 1, 2, 3)
  const [flippedCard, setFlippedCard] = useState(null);

  const handleFlip = (id) => {
    // 이미 뒤집혀 있는 카드를 다시 터치하면 원래대로(null), 아니면 해당 카드를 뒤집음
    setFlippedCard(flippedCard === id ? null : id);
  };

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight break-keep">디테일의 차이가 청소의 격을 만듭니다.</h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium break-keep px-2">데스크톱에서는 마우스를 올리고, 모바일에서는 <strong className="text-blue-600">터치하여</strong> 완벽한 비포/애프터 스케일링을 확인해보세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: 주방 후드 */}
          <div 
            className="group h-[400px] w-full [perspective:1000px] cursor-pointer"
            onClick={() => handleFlip(1)}
          >
            <div className={`relative h-full w-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)] ${flippedCard === 1 ? '[transform:rotateY(180deg)]' : ''}`}>
              
              {/* Front Face (After - Clean) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-white [backface-visibility:hidden] overflow-hidden border border-slate-200">
                <img src="/clean_kitchen.webp" loading="lazy" className="h-2/3 w-full object-cover" alt="주방 후드 깨끗" />
                <div className="h-1/3 p-6 bg-white flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-slate-900">주방 후드망 완전 탈거 세척</h3>
                     <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">After</span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="hidden md:inline">마우스를 올려</span>
                    <span className="md:hidden text-blue-600 font-bold">터치하여</span> 비포 사진 확인 <RotateCcw className="w-4 h-4" />
                  </p>
                </div>
              </div>

              {/* Back Face (Before - Dirty) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-slate-900 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden border border-slate-800">
                <div className="h-2/3 w-full relative">
                  <img src="/dirty_kitchen.webp" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="주방 후드 더러움" />
                </div>
                <div className="h-1/3 p-6 bg-slate-900 flex flex-col justify-center text-white relative z-10">
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-white">최고급 알칼리성 세제 분해</h3>
                     <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-500/30">오염도: 심각</span>
                  </div>
                  <p className="text-sm text-slate-300 break-keep">누렇게 굳어버린 요리 기름때를 안전하고 깨끗하게 살균 철거했습니다.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Card 2: 싱크대 배수구 */}
          <div 
            className="group h-[400px] w-full [perspective:1000px] cursor-pointer"
            onClick={() => handleFlip(2)}
          >
            <div className={`relative h-full w-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)] ${flippedCard === 2 ? '[transform:rotateY(180deg)]' : ''}`} >
              
              {/* Front Face (After) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-white [backface-visibility:hidden] overflow-hidden border border-slate-200">
                <img src="/clean_bathroom.webp" loading="lazy" className="h-2/3 w-full object-cover" alt="화장실 깨끗" />
                <div className="h-1/3 p-6 bg-white flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-slate-900">화장실/배수구 고압 살균</h3>
                     <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">After</span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="hidden md:inline">마우스를 올려</span>
                    <span className="md:hidden text-blue-600 font-bold">터치하여</span> 비포 사진 확인 <RotateCcw className="w-4 h-4" />
                  </p>
                </div>
              </div>

              {/* Back Face (Before) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-slate-900 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden border border-slate-800">
                <div className="h-2/3 w-full relative">
                  <img src="/dirty_bathroom.webp" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="화장실 더러움" />
                </div>
                <div className="h-1/3 p-6 bg-slate-900 flex flex-col justify-center text-white relative z-10">
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-white">트랩 안쪽까지 스케일링</h3>
                     <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-500/30">악취 원인</span>
                  </div>
                  <p className="text-sm text-slate-300 break-keep">음식물 찌꺼기와 깊은 곳의 곰팡이/물때까지 고압 세척했습니다.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: 수전 및 창틀 */}
          <div 
            className="group h-[400px] w-full [perspective:1000px] cursor-pointer"
            onClick={() => handleFlip(3)}
          >
            <div className={`relative h-full w-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)] ${flippedCard === 3 ? '[transform:rotateY(180deg)]' : ''}`} >
              
              {/* Front Face (After) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-white [backface-visibility:hidden] overflow-hidden border border-slate-200">
                <img src="/clean_window.webp" loading="lazy" className="h-2/3 w-full object-cover" alt="창틀 수전 깨끗" />
                <div className="h-1/3 p-6 bg-white flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-slate-900">외풍 차단 창틀 틈새 세척</h3>
                     <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">After</span>
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="hidden md:inline">마우스를 올려</span>
                    <span className="md:hidden text-blue-600 font-bold">터치하여</span> 비포 사진 확인 <RotateCcw className="w-4 h-4" />
                  </p>
                </div>
              </div>

              {/* Back Face (Before) */}
              <div className="absolute inset-0 h-full w-full rounded-2xl bg-slate-900 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden border border-slate-800">
                <div className="h-2/3 w-full relative">
                  <img src="/dirty_window.webp" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80" alt="창틀 더러움" />
                </div>
                <div className="h-1/3 p-6 bg-slate-900 flex flex-col justify-center text-white relative z-10">
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-bold text-white">미세먼지 완벽 제거</h3>
                     <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-500/30">벌레/미세먼지</span>
                  </div>
                  <p className="text-sm text-slate-300 break-keep">스팀 세척기와 전용 브러쉬를 이용해 닦기 힘든 좁은 창틀 먼지까지 제거합니다.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
