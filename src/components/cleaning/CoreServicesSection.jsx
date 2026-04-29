import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function CoreServicesSection() {
  return (
    <section className="py-24 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 mb-4 text-sm font-bold bg-blue-100 text-blue-700 rounded-full">CORE SERVICES</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">데일리하우징 4대 핵심 서비스</h2>
          <p className="text-lg text-slate-600 font-medium">우리가 가장 잘하는 4가지 청소에만 집중하여 변함없는 퀄리티를 약속합니다.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Service 1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group relative">
            <div className="h-56 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
              <img src="/service_move_in.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="입주청소" />
              <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white z-20">입주청소</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">서랍장 안쪽, 배수구 트랩 등 보이지 않는 곳의 먼지까지 완전 탈거하여 고압세척합니다.</p>
              <Link to="/cleaning/move-in" className="flex items-center text-blue-600 text-sm font-bold cursor-pointer group-hover:text-blue-700">
                자세히 보기 <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          {/* Service 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group relative">
            <div className="h-56 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
              <img src="/service_syndrome.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="새집증후군" />
              <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white z-20">새집증후군</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">유해 건축 자재에서 뿜어져 나오는 포름알데히드를 피톤치드 연무 시공으로 완벽 차단합니다.</p>
              <Link to="/cleaning/sick-building" className="flex items-center text-blue-600 text-sm font-bold cursor-pointer group-hover:text-blue-700">
                자세히 보기 <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          {/* Service 3 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group relative">
            <div className="h-56 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
              <img src="/service_appliance.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="에어컨/세탁기 청소" />
              <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white z-20 leading-snug">에어컨/세탁기<br/>청소</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">필터 교체와 다릅니다. 내부 냉각핀과 드럼통 안쪽의 찌든 세균과 곰팡이를 날려버립니다.</p>
              <Link to="/cleaning/appliance" className="flex items-center text-blue-600 text-sm font-bold cursor-pointer group-hover:text-blue-700">
                자세히 보기 <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Service 4 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group relative border-2 border-transparent hover:border-blue-100">
            <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-lg z-30">인기 구독!</div>
            <div className="h-56 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
              <img src="/service_regular.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="집 정기 청소" />
              <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white z-20">집 정기 청소</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">입주 상태를 그대로! 검증된 호텔식 매뉴얼로 각 가정마다 전담 매니저가 지정되어 방문합니다.</p>
              <Link to="/cleaning/regular" className="flex items-center text-blue-600 text-sm font-bold cursor-pointer group-hover:text-blue-700">
                자세히 보기 <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
