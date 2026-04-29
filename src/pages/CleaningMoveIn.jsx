import React from 'react';
import { Link } from 'react-router-dom';

export default function CleaningMoveIn() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header / Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/cleaning" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            메인으로
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">데일리하우징 프리미엄 입주청소</h1>
          <div className="w-24"></div> {/* Balance spacer */}
        </div>
      </header>

      <main className="flex-1 w-full bg-slate-50">
        {/* 2. Hero Section */}
        <section className="relative w-full h-[400px] md:h-[500px]">
          <div className="absolute inset-0 bg-slate-900">
            <img src="/service_move_in.png" alt="입주청소" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">CORE SERVICE 01</span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">프리미엄 입주청소</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-6 drop-shadow-md">이전 거주자의 흔적을 완벽하게 지웁니다.</h2>
            <p className="text-lg md:text-xl text-blue-100 font-medium max-w-2xl drop-shadow-sm">
              단순한 겉면 닦기가 아닙니다. <br className="hidden md:block" />보이지 않는 곳의 세균, 묵은 먼지, 악취의 원인까지 100% 완전 분해 세척합니다.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 3. Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-blue-500 mb-4 block">cleaning_services</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">친환경 전용 세제</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                독한 화학 약품 대신 독일제 친환경 프리미엄 세제를 사용하여 임산부와 아이가 있는 집도 안심할 수 있습니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-blue-500 mb-4 block">build_circle</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">완전 탈거 원칙</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                전등 갓, 환풍기 트랩, 서랍장, 배수구 부품 등 분리 가능한 모든 파츠를 탈거한 후 숨은 오염물을 제거합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-blue-500 mb-4 block">bug_report</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">고온 스팀 살균</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                화장실과 주방의 곰팡이, 찌든 때는 120도 이상의 고온 스팀 장비를 투입하여 세균을 99.9% 박멸합니다.
              </p>
            </div>
          </div>

          {/* 4. Process Workflow */}
          <div className="mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">체계적인 클리닝 프로세스</h2>
            <div className="space-y-6">
              {[
                { step: '01', title: '현장 오염도 체크 및 브리핑', desc: '담당 마스터가 현장에 도착하여 구조 및 오염 상태를 진단하고 특이사항을 고객님께 사전 공유합니다.' },
                { step: '02', title: '전체 파츠 완전 탈거', desc: '전등, 하수구 트랩, 수납장 기구 등 클리닝의 기본이 되는 탈거 작업을 가장 먼저 진행합니다.' },
                { step: '03', title: '구역별 맞춤 딥클리닝', desc: '주방의 기름때, 화장실의 물때, 베란다의 곰팡이 등 각 구역의 성질에 맞는 알칼리/산성 전용 세제를 사용해 작업합니다.' },
                { step: '04', title: '고온 스팀 살균 마무리', desc: '균이 증식하기 쉬운 하수구와 변기, 싱크대에 고온 스팀 장비로 철저히 살균합니다.' },
                { step: '05', title: '고객 검수 및 A/S 보장', desc: '청소 완료 후 카카오톡으로 결과 사진을 전송드리며, 직접 현장에 오셔서 검수합니다. (7일 내 무상 A/S 정책 적용)' },
              ].map((item, idx) => (
                <div key={idx} className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-blue-300 transition-colors">
                  <div className="bg-blue-50 w-24 flex items-center justify-center border-r border-slate-100">
                    <span className="text-2xl font-black text-blue-600">{item.step}</span>
                  </div>
                  <div className="p-6 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Pricing Guide */}
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[150px]">calculate</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4">투명하고 합리적인 정찰제</h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                더러우면 무조건 추가금이 붙는 악덕 업체와 다릅니다. <br/>빌트인 가전 세척, 새집증후군 차단 외에는 현장 추가금을 요구하지 않습니다.
              </p>
              <div className="inline-block bg-white/10 rounded-xl border border-white/20 p-6 backdrop-blur-md mb-8">
                <div className="text-sm text-slate-400 mb-2">기본 공급면적 당 (아파트 기준)</div>
                <div className="text-4xl font-black text-blue-400 mb-1">12,000<span className="text-xl font-normal text-slate-200 ml-1">원 / 평</span></div>
                <div className="text-xs text-slate-400 mt-3">* 빌라/다세대 등 구조에 따라 단가가 다를 수 있습니다.</div>
              </div>
              <div>
                <Link to="/cleaning" className="inline-block bg-blue-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-blue-500 hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300">
                  메인에서 예상 견적 계산하기
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
