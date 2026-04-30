import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import HeroSection from '../components/cleaning/HeroSection';
import StatsBannerSection from '../components/cleaning/StatsBannerSection';
import FlipCardSection from '../components/cleaning/FlipCardSection';
import CoreServicesSection from '../components/cleaning/CoreServicesSection';
import PromisesSection from '../components/cleaning/PromisesSection';
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
      <Footer />
      <FloatingCTA onOpenQuote={openQuoteModal} />

      {/* Quote Type Selection Modal */}
      {isQuoteTypeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 mb-2 text-[10px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-full">
                    ✨ 100% 본사 직영팀 · 평당 정찰제
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">원하시는 청소 품질을<br/>선택해주세요</h3>
                </div>
                <button 
                  onClick={() => setIsQuoteTypeModalOpen(false)} 
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              
              {/* Tab Switcher */}
              <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 mb-6 mt-2">
                <button
                  onClick={() => setActiveQuoteTab('premium')}
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl text-sm font-bold transition-all relative ${
                    activeQuoteTab === 'premium'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-900/50 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    프리미엄 <span className="text-[10px] text-red-100 bg-red-500 px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm shadow-red-500/50">추천 ⭐️</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveQuoteTab('general')}
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl text-sm font-bold transition-all ${
                    activeQuoteTab === 'general'
                      ? 'bg-slate-700 text-white shadow-lg border border-slate-600'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  일반 청소
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[290px]">
                {activeQuoteTab === 'premium' ? (
                  <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/50 rounded-2xl p-5 border border-blue-500/20 relative overflow-hidden animate-in slide-in-from-left-4 fade-in duration-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    
                    <div className="mb-4">
                      <span className="text-amber-300 bg-amber-900/40 border border-amber-500/30 text-[10px] font-bold px-2 py-1 rounded inline-block mb-3 shadow-sm">
                        인테리어 사업자 전용
                      </span>
                      <h2 className="text-xl font-black text-white mb-1.5 tracking-tight relative z-10 leading-snug">
                        단 1%의 타협도 없는 하이엔드 클리닝
                      </h2>
                      <p className="text-blue-300 text-sm font-medium relative z-10">어제 지은 새집처럼, 호텔 같은 쾌적함</p>
                    </div>
                    
                    <ul className="text-sm text-blue-100/80 space-y-3 mt-6 break-keep relative z-10">
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">리모델링 직후, 분진과 묵은 때가 많은 구축 주택에 추천</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">우리 아이가 누워도 안심할 수 있는 딥 클리닝 케어 마스터 투입</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-blue-400 text-sm mt-0.5 font-bold">✓</span>
                        <span className="text-white font-bold bg-blue-500/20 px-1.5 py-0.5 rounded leading-snug">마루콕, 실리콘 무상보수 제공</span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    
                    <div className="mb-4">
                      <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-1 rounded inline-block mb-3">
                        가벼운 마음으로 입주하세요
                      </span>
                      <h2 className="text-xl font-black text-white mb-1.5 tracking-tight relative z-10 leading-snug">
                        기본에 충실한 합리적 선택
                      </h2>
                      <p className="text-slate-400 text-sm font-medium relative z-10">가성비 뛰어난 베이직 클리닝</p>
                    </div>
                    
                    <ul className="text-sm text-slate-300 space-y-3 mt-6 break-keep relative z-10">
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">오염도가 적은 신축 빌라나 원룸에 추천</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">합리적인 비용으로 누리는 전문가의 기본 탈거 & 클리닝</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">눈에 보이는 모든 공간의 생활 오염 완벽 제거</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">입주 전 필수! 기본적인 먼지와 오염을 털어내는 깔끔함</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-slate-500 text-sm mt-0.5 font-bold">✓</span>
                        <span className="leading-snug">전용 친환경 세제를 활용한 안심 청소</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handleSelectQuoteType(activeQuoteTab)}
                className={`w-full mt-6 py-4 rounded-xl font-black text-[17px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl ${
                  activeQuoteTab === 'premium' 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50' 
                    : 'bg-slate-100 hover:bg-white text-slate-900 shadow-white/10'
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
