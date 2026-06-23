import React, { useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({ onOpenQuote }) {
  const navigate = useNavigate();
  const RECENT_CASES = [
    "서울 송파구 34평 프리미엄 입주청소",
    "경기 화성시 동탄신도시 30평 이사청소",
    "인천 연수구 송도 40평 새집증후군 케어",
    "경기 수원시 광교 34평 프리미엄 입주청소",
    "서울 서초구 28평 거주청소 및 에어컨 케어"
  ];
  
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentCaseIndex((prev) => (prev + 1) % RECENT_CASES.length);
        setFade(true);
      }, 500); // 0.5초 딜레이 후 텍스트 변경
    }, 3500); // 3.5초마다 롤링

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="snap-section relative w-full min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-24 pb-16">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16">
          
          {/* Left Column: Text & CTA — 모바일에서는 이미지 아래로 배치 */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left w-full min-w-0 order-last lg:order-first">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 text-sm font-bold bg-blue-100 text-blue-700 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              프리미엄 입주 케어
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-6xl font-black mb-6 leading-[1.25] tracking-tight text-slate-900 break-keep">
              <span className="sr-only">청소타워 | </span>
              이사 앞두고<br/>
              고민 많으셨죠? <br/>
              <span className="text-blue-600">설렘만 남겨드릴게요.</span>
            </h1>
            
            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 font-medium mb-8 max-w-xl leading-relaxed break-keep">
              입주청소, 새집증후군, 가전 분해청소, 정기청소까지.<br className="hidden sm:block" />
              <strong className="font-bold text-slate-800">분야별 전문 정규직 팀</strong>이 <br className="hidden lg:block" />
              당신의 새로운 시작과 일상을 완벽하게 관리합니다.
            </p>

            {/* Checkpoints */}
            <ul className="space-y-3 mb-10 flex flex-col items-center lg:items-start w-full">
              <li className="flex items-center gap-3 text-slate-700 font-medium bg-white/80 px-4 py-2.5 rounded-lg border border-slate-100 shadow-sm w-full max-w-md break-keep">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="min-w-0 flex-1">독일 카처 고온 스팀기 & 친환경 세제 사용</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium bg-white/80 px-4 py-2.5 rounded-lg border border-slate-100 shadow-sm w-full max-w-md break-keep">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="min-w-0 flex-1">7일간 무상 A/S 확실한 사후 보장</span>
              </li>
            </ul>

            {/* CTA & Social Proof */}
            <div className="flex flex-col gap-3 w-full max-w-md mx-auto lg:mx-0">
              <button 
                onClick={() => navigate('/partners')}
                className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-1 flex items-center justify-center shrink-0"
              >
                바로 전문가 찾기
              </button>
              
            </div>
          </div>

          {/* Right Column: Image — 모바일에서 먼저(위) 노출 */}
          <div className="relative w-full max-w-lg lg:max-w-none mx-auto mt-0 lg:mt-0 px-4 sm:px-0 order-first lg:order-last">
            {/* Background Blob/Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-200/40 blur-3xl rounded-full -z-10"></div>
            
            {/* Main Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="/expert_team_clean.webp" 
                alt="Expert Cleaning Team" 
                className="w-full h-auto object-cover aspect-[4/3] lg:aspect-[4/5] max-h-[600px]"
              />
            </div>

            {/* Floating Live Badge */}
            <div className="absolute -bottom-4 sm:bottom-8 sm:-left-12 -left-2 right-2 sm:right-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-4 sm:pr-8 flex items-center gap-4 z-20 hover:-translate-y-1 transition-transform">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 shadow-inner">
                <div className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600"></span>
                </div>
              </div>
              <div className={`transition-opacity duration-500 flex flex-col min-w-0 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-xs sm:text-sm font-bold text-blue-600 mb-0.5 tracking-tight">실시간 매칭 완료 🔥</span>
                <p className="text-sm sm:text-base font-black text-slate-800 break-keep leading-tight">
                  {RECENT_CASES[currentCaseIndex]}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
