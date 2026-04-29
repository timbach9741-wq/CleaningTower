import React from 'react';
import { Link } from 'react-router-dom';

export default function CleaningSickBuilding() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/cleaning" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            메인으로
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">데일리하우징 새집증후군 케어</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="flex-1 w-full bg-slate-50">
        <section className="relative w-full h-[400px] md:h-[500px]">
          <div className="absolute inset-0 bg-slate-900">
            <img src="/service_syndrome.png" alt="새집증후군" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <span className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">CORE SERVICE 02</span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">새집증후군 케어</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-6 drop-shadow-md">유해물질로부터 가족의 호흡기를 지킵니다.</h2>
            <p className="text-lg md:text-xl text-emerald-100 font-medium max-w-2xl drop-shadow-sm">
              100% 천연 편백나무 원액을 초미립자 분사하여 <br className="hidden md:block" />가구와 벽지가 뿜어내는 포름알데히드를 완벽히 코팅하고 차단합니다.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-4 block">spa</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">100% 천연 편백수</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                인체에 무해한 최고급 국내산 편백나무 추출액만을 사용합니다. 화학적 탈취제와는 차원이 다른 안정을 보장합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-4 block">blur_on</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">초미립자 고압 연무</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                스프레이 타입이 아닙니다. 나노 단위의 미립자 머신을 사용해 마루 틈새, 가구 내측 깊은 공간까지 입자가 침투합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-4 block">health_and_safety</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">포름알데히드 차단</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                새 인테리어, 새 가구에서 발산되는 1급 발암물질을 중화/코팅 처리하여 아토피와 두통의 원인을 먼저 억제합니다.
              </p>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">시공 프로세스</h2>
            <div className="space-y-6">
              {[
                { step: '01', title: '사전 청소 선행 (입주청소 결합 시)', desc: '표면의 분진과 먼지가 제거되어야 피톤치드 코팅의 효율이 100% 발휘됩니다. 입주청소 완료 시점에서 투입됩니다.' },
                { step: '02', title: '주요 방출지 서랍/선반 탈거', desc: '새 가구의 MDF 합판 단면에서 대부분의 독성이 방출되므로, 서랍을 모두 열어 집중 분사할 준비를 합니다.' },
                { step: '03', title: '1차 고압 연무 분사', desc: '집안 전체 거실/방의 공간을 피톤치드 연무기로 가득 채워 공기 중 유해물질을 중화시킵니다.' },
                { step: '04', title: '2차 국소 부위 집중 코팅', desc: '붙박이장 내측, 신발장, 하부장 등 환기가 어려운 밀폐된 목재 구조물을 대상으로 마이크로 코팅을 진행합니다.' },
              ].map((item, idx) => (
                <div key={idx} className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-emerald-300 transition-colors">
                  <div className="bg-emerald-50 w-24 flex items-center justify-center border-r border-slate-100">
                    <span className="text-2xl font-black text-emerald-600">{item.step}</span>
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Guide */}
          <div className="bg-emerald-900 rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[150px]">eco</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4">청소와 함께 결합 시 압도적 할인율</h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                입주/이사 청소와 동시에 진행하시면 장비 출장비가 면제되어 단독 시공 대비 파격적인 금액에 쾌적한 환경을 누리실 수 있습니다.
              </p>
              <div className="inline-block bg-white/10 rounded-xl border border-white/20 p-6 backdrop-blur-md mb-8">
                <div className="text-sm text-emerald-200 mb-2">프리미엄 피톤치드 시공 추가비</div>
                <div className="text-4xl font-black text-white mb-1">+ 150,000<span className="text-xl font-normal text-emerald-200 ml-1">원</span></div>
                <div className="text-xs text-emerald-200 mt-3">* 평수와 관계없이 정액제로 투입됩니다. (단독 의뢰 시 별도 요금)</div>
              </div>
              <div>
                <Link to="/cleaning" className="inline-block bg-white text-emerald-700 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-emerald-50 hover:shadow-white/30 hover:-translate-y-1 transition-all duration-300">
                  결합 견적 산출해보기
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
