import React from 'react';
import { Link } from 'react-router-dom';

export default function CleaningRegular() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/cleaning" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            메인으로
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">데일리하우징 정기 구독 청소</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="flex-1 w-full bg-slate-50">
        <section className="relative w-full h-[400px] md:h-[500px]">
          <div className="absolute inset-0 bg-slate-900">
            <img src="/service_regular.png" alt="정기 구독 청소" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <span className="bg-rose-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-4 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">star</span> VIP BEST CHOICE
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">집 정기 청소</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-6 drop-shadow-md">입주할 때의 깨끗함, 그대로 유지합니다.</h2>
            <p className="text-lg md:text-xl text-rose-100 font-medium max-w-2xl drop-shadow-sm">
              소중한 주말, 더이상 청소와 피로에 뺏기지 마세요. <br className="hidden md:block" />호텔 하우스키핑 수준의 전담 매니저가 지정 관리합니다.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow border-t-4 border-t-rose-500">
              <span className="material-symbols-outlined text-4xl text-rose-500 mb-4 block">groups</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1:1 전담 매니저 지정</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                매번 다른 사람이 와서 일일이 설명할 필요 없습니다. 오직 우리 집만 관리해 주는 전담 마스터가 배정되어 루틴을 형성합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow border-t-4 border-t-rose-500">
              <span className="material-symbols-outlined text-4xl text-rose-500 mb-4 block">event_available</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">탄력적 일정 조율</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                주 1회, 격주 편하신 주기를 선택하세요. 명절이나 갑작스런 방문객 일정이 생겼을 때 시간표를 플렉시블하게 앞당길 수 있습니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow border-t-4 border-t-rose-500">
              <span className="material-symbols-outlined text-4xl text-rose-500 mb-4 block">water_drop</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">물때 & 기름때 포커싱</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                방 청소기 돌리기는 쉽지만, 화장실 물때와 주방 후드 기름때는 어렵습니다. 정기 구독은 이 '가장 힘든 구역'을 초기화 해드립니다.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-sm relative overflow-hidden mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-8 text-center relative z-10">데일리하우징 정기 구독만의 특별 혜택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4 items-start">
                <div className="bg-rose-100 text-rose-600 p-2 rounded-xl">
                  <span className="material-symbols-outlined">hotel_class</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">프리미엄 호텔식 베딩</h4>
                  <p className="text-sm text-slate-600">침구류 정리 및 매트리스 진드기 흡입 시공이 포함됩니다. (주 1회 플랜)</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4 items-start">
                <div className="bg-rose-100 text-rose-600 p-2 rounded-xl">
                  <span className="material-symbols-outlined">local_florist</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">정기 탈취 관리</h4>
                  <p className="text-sm text-slate-600">방문 시마다 하수구 방충 처리 및 디퓨징을 통해 쾌적한 향을 남깁니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Guide */}
          <div className="bg-rose-900 rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[150px]">calendar_month</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4">구독형 안심 결제 (입주청소 동시 진행)</h2>
              <p className="text-rose-100 text-lg mb-8 max-w-2xl mx-auto">
                입주청소 결제 시 첫 1개월 분이 함께 결제되며, 청소가 완료된 시점부터 매니저 스케줄이 확정 배정됩니다. 첫 달 경험해보시고 해지하셔도 위약금이 전혀 없습니다.
              </p>
              <div className="inline-block bg-white/10 rounded-xl border border-white/20 p-6 backdrop-blur-md mb-8">
                <div className="text-sm text-rose-200 mb-2">월 2회 (격주 방문 기준) 첫 결제 할인분</div>
                <div className="text-4xl font-black text-white mb-1">+ 200,000<span className="text-xl font-normal text-rose-200 ml-1">원</span></div>
                <div className="text-xs text-rose-200 mt-3">* 위 견적은 예상금액이며, 평수와 방문 주기에 따라 달라질 수 있습니다.</div>
              </div>
              <div>
                <Link to="/cleaning" className="inline-block bg-white text-rose-700 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-rose-50 hover:-translate-y-1 transition-all duration-300">
                  첫 구독 시작하기
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
