import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import HeroSection from '../components/cleaning/HeroSection';
import StatsBannerSection from '../components/cleaning/StatsBannerSection';
import FlipCardSection from '../components/cleaning/FlipCardSection';
import CoreServicesSection from '../components/cleaning/CoreServicesSection';
import PromisesSection from '../components/cleaning/PromisesSection';
import ReviewSection from '../components/cleaning/ReviewSection';
import FloatingCTA from '../components/cleaning/FloatingCTA';
import Footer from '../components/cleaning/Footer';

export default function CleaningHome() {
  const navigate = useNavigate();
  const [isQuoteTypeModalOpen, setIsQuoteTypeModalOpen] = useState(false);
  const [activeQuoteTab, setActiveQuoteTab] = useState('premium');

  const openQuoteModal = () => setIsQuoteTypeModalOpen(true);
  const handleSelectQuoteType = (type) => {
    setIsQuoteTypeModalOpen(false);
    navigate(`/quote/${type}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans relative">
      <Header onOpenQuote={openQuoteModal} />
      <HeroSection onOpenQuote={openQuoteModal} />
      <StatsBannerSection />
      <FlipCardSection />
      <CoreServicesSection />
      <PromisesSection />
      <ReviewSection />
      <Footer />
      <FloatingCTA onOpenQuote={openQuoteModal} />

      {/* Quote Type Selection Modal */}
      {isQuoteTypeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 pb-8 md:p-6 md:pb-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 mb-2 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/50 rounded-full">
                    ✨ 100% 본사 직영팀 · 평당 정찰제
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">원하시는 청소 품질을<br/>선택해주세요</h3>
                </div>
                <button 
                  onClick={() => setIsQuoteTypeModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-slate-50 hover:bg-slate-100 rounded-full"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              
              {/* Tab Switcher */}
              <div className="flex gap-2 p-1.5 bg-slate-50/80 rounded-2xl border border-slate-100 mb-6 mt-2">
                <button
                  onClick={() => setActiveQuoteTab('premium')}
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl text-sm font-bold transition-all relative ${
                    activeQuoteTab === 'premium'
                      ? 'bg-white text-blue-700 shadow-md shadow-slate-200/50 border border-blue-100 ring-1 ring-blue-600/10'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    프리미엄 <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm shadow-red-500/10">추천 ⭐️</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveQuoteTab('general')}
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl text-sm font-bold transition-all ${
                    activeQuoteTab === 'general'
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  일반 청소
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[290px]">
                {activeQuoteTab === 'premium' ? (
                  <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-2xl p-5 border border-blue-100/80 relative overflow-hidden animate-in slide-in-from-left-4 fade-in duration-200 shadow-sm shadow-blue-900/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="mb-4">
                      <span className="text-amber-700 bg-amber-50 border border-amber-200/50 text-[10px] font-bold px-2 py-1 rounded inline-block mb-3 shadow-sm">
                        인테리어 사업자 전용
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight relative z-10 leading-snug">
                        단 1%의 타협도 없는 하이엔드 클리닝
                      </h2>
                      <p className="text-blue-600/80 text-sm font-bold relative z-10">어제 지은 새집처럼, 호텔 같은 쾌적함</p>
                    </div>
                    
                    <ul className="text-sm text-slate-600 space-y-3 mt-6 break-keep relative z-10">
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">리모델링 직후, 분진과 묵은 때가 많은 구축 주택에 추천</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">우리 아이가 누워도 안심할 수 있는 딥 클리닝 케어 마스터 투입</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="text-blue-700 font-bold bg-blue-100/50 px-1.5 py-0.5 rounded border border-blue-200/50 leading-snug">마루콕, 실리콘 무상보수 제공</span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    
                    <div className="mb-4">
                      <span className="bg-slate-200/60 text-slate-600 text-[10px] font-bold px-2 py-1 rounded inline-block mb-3 border border-slate-300/30">
                        가벼운 마음으로 입주하세요
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight relative z-10 leading-snug">
                        기본에 충실한 합리적 선택
                      </h2>
                      <p className="text-slate-500 text-sm font-bold relative z-10">가성비 뛰어난 베이직 클리닝</p>
                    </div>
                    
                    <ul className="text-sm text-slate-600 space-y-3 mt-6 break-keep relative z-10">
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">오염도가 적은 신축 빌라나 원룸에 추천</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">합리적인 비용으로 누리는 전문가의 기본 탈거 & 클리닝</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">눈에 보이는 모든 공간의 생활 오염 완벽 제거</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">입주 전 필수! 기본적인 먼지와 오염을 털어내는 깔끔함</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug font-medium">전용 친환경 세제를 활용한 안심 청소</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handleSelectQuoteType(activeQuoteTab)}
                className={`w-full mt-4 mb-2 py-4 rounded-xl font-black text-[17px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
                  activeQuoteTab === 'premium' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 ring-2 ring-blue-600/20 ring-offset-2' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                }`}
              >
                <span>{activeQuoteTab === 'premium' ? '프리미엄 견적 확인하기' : '일반 청소 견적 확인하기'}</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
