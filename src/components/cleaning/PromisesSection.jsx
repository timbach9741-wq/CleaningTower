import React from 'react';

export default function PromisesSection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 mb-4 text-sm font-bold bg-indigo-100 text-indigo-700 rounded-full">OUR PROMISE</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight break-keep">당연한 것을 완벽하게 지킵니다.</h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium break-keep px-2">눈속임 없는 정직한 시공과 책임지는 마인드, 데일리하우징의 3가지 원칙입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Promise 1 */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 group">
            <div className="h-60 overflow-hidden relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
              <img src="/promise_disassembly_kr.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="100% 완전 탈거 세척" />
              <div className="absolute top-4 left-4 bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-black text-xl z-20 shadow-lg">1</div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">100% 완전 탈거 세척</h3>
              <p className="text-slate-600 leading-relaxed font-medium break-keep">전등 갓, 환풍기, 서랍장, 하수구 트랩까지 뺄 수 있는 모든 것을 완전히 분해합니다. 보이지 않는 은밀한 곳의 먼지와 곰팡이가 호흡기를 위협하기 때문입니다.</p>
            </div>
          </div>
          
          {/* Promise 2 */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 group">
            <div className="h-60 overflow-hidden relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
              <img src="/promise_experts_kr.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="전원 정규직 마스터 투입" />
              <div className="absolute top-4 left-4 bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-black text-xl z-20 shadow-lg">2</div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">전원 정규직 마스터 투입</h3>
              <p className="text-slate-600 leading-relaxed font-medium break-keep">오더를 던지고 빠지는 일회성 알바생, 하청 용역이 절대 아닙니다. 본사 교육을 이수한 최소 3년 경력의 정규직 팀장이 각 현장에 투입되어 직접 구역을 관리합니다.</p>
            </div>
          </div>
          
          {/* Promise 3 */}
          <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 group">
            <div className="h-60 overflow-hidden relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
              <img src="/promise_warranty.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="7일 무상 A/S 보장" />
              <div className="absolute top-4 left-4 bg-rose-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-black text-xl z-20 shadow-lg">3</div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">7일 무상 A/S 보장</h3>
              <p className="text-slate-600 leading-relaxed font-medium break-keep">당일 바빠서 미처 꼼꼼히 확인하지 못하셨나요? 안심하세요. 결제가 끝났다고 잠수타지 않습니다. 7일 이내 불만족 시 무조건 현장에 다시 방문해 해결합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
