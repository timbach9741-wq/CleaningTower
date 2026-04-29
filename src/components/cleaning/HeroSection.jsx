import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[700px] flex items-center justify-center overflow-hidden bg-blue-50 pt-20 pb-16">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/cleaner-hero-korean.png" 
          alt="Clean Room Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/80"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        
        {/* Hero Text */}
        <div className="text-white max-w-3xl flex flex-col items-center text-center drop-shadow-md">
          <span className="inline-block px-5 py-2 mb-6 text-sm font-bold bg-blue-600/90 text-white border border-blue-500/50 rounded-full shadow-lg backdrop-blur-sm">
            ✨ 4대 집중 홈케어 / 100% 본사 직영팀 투입
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.2] tracking-tight text-center drop-shadow-xl">
            이사 앞두고<br/>
            고민 많으셨죠? <br/>
            설렘만 남겨드릴게요.
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 font-medium mb-8 max-w-xl leading-relaxed text-center drop-shadow-md">
            입주청소, 새집증후군, 가전 분해청소, 정기청소까지. <br className="hidden sm:block" />
            외주 인력이 아닌 <strong className="font-bold text-white">분야별 전문 정규직 팀</strong>이 <br className="hidden sm:block" />
            당신의 새로운 시작과 일상을 완벽하게 관리합니다.
          </p>
          <ul className="space-y-3 mb-8 flex flex-col items-center">
            <li className="flex items-center gap-3 text-slate-100 font-medium text-center bg-slate-900/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              당일 추가 요금 절대 없음 (계약서 명시)
            </li>
            <li className="flex items-center gap-3 text-slate-100 font-medium text-center bg-slate-900/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              독일 카처 고온 스팀기 & 친환경 세제 사용
            </li>
          </ul>
        </div>

      </div>
    </section>
  );
}
