import React from 'react';
import { Link } from 'react-router-dom';

export default function CleaningAppliance() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/cleaning" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            메인으로
          </Link>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">데일리하우징 가전 분해 세척</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="flex-1 w-full bg-slate-50">
        <section className="relative w-full h-[400px] md:h-[500px]">
          <div className="absolute inset-0 bg-slate-900">
            <img src="/service_appliance.png" alt="가전 분해 세척" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-4">CORE SERVICE 03</span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg">가전 분해 세척</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-6 drop-shadow-md">가전 속 찌든 곰팡이를 뽑아냅니다.</h2>
            <p className="text-lg md:text-xl text-indigo-100 font-medium max-w-2xl drop-shadow-sm">
              에어컨 필터만 물로 빨고 계신가요? <br className="hidden md:block" />악취와 전기세 증가의 진짜 원인은 완전히 뜯어서 세척해야 해결됩니다.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-indigo-500 mb-4 block">air</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">에어컨 완전 분해</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                벽걸이, 스탠드, 시스템에어컨 종류 불문. 커버부터 내부 송풍팬, 냉각핀(에바)까지 하나도 남김없이 분해합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-indigo-500 mb-4 block">local_laundry_service</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">세탁기 드럼통 추출</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                통돌이, 드럼세탁기 모두 세탁조 외부의 물때와 세제 찌꺼기를 세탁기 본체에서 아예 들어내어 고압세척합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
              <span className="material-symbols-outlined text-4xl text-indigo-500 mb-4 block">warning</span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">무상 A/S 정책 보장</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                "분해했다가 가전이 고장나면 어떡하죠?" 걱정 마세요. 분해/조립을 전문으로 하는 특수 마스터가 진행하며, 문제 시 100% 책임집니다.
              </p>
            </div>
          </div>

          {/* Pricing Guide */}
          <div className="bg-indigo-900 rounded-3xl p-8 sm:p-12 text-white text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[150px]">ac_unit</span>
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4">빌트인 옵션 안성맞춤 추가 케어</h2>
              <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                입주 전 벽걸이/시스템 구형 에어컨이 설치된 집이신가요? 새집을 청소할 때, 가전까지 깨끗하게 포맷해보세요. 
              </p>
              <div className="inline-block bg-white/10 rounded-xl border border-white/20 p-6 backdrop-blur-md mb-8">
                <div className="text-sm text-indigo-200 mb-2">기본 가전 케어 (벽걸이 1 + 통돌이 1 기준)</div>
                <div className="text-4xl font-black text-white mb-1">+ 120,000<span className="text-xl font-normal text-indigo-200 ml-1">원</span></div>
                <div className="text-xs text-indigo-200 mt-3">* 기기 종류와 대수(시스템 에어컨 등)에 따라 금액이 변동될 수 있습니다.</div>
              </div>
              <div>
                <Link to="/cleaning" className="inline-block bg-white text-indigo-700 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-slate-100 hover:-translate-y-1 transition-all duration-300">
                  청소 결합 견적 확인하기
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
