import React from 'react';
import { CheckCircle } from 'lucide-react';
import QuoteWidget from './QuoteWidget';

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
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Hero Text */}
        <div className="text-slate-900 lg:w-3/5 flex flex-col items-start text-left">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold bg-blue-100 text-blue-700 border border-blue-200 rounded-full">
            ✨ 4대 집중 홈케어 / 100% 본사 직영팀 투입
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.2] tracking-tight">
            이사 앞두고<br/>
            고민 많으셨죠? <br/>
            설렘만 남겨드릴게요.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium mb-8 max-w-lg leading-relaxed">
            입주청소, 새집증후군, 가전 분해청소, 정기청소까지. <br className="hidden sm:block" />
            외주 인력이 아닌 <strong className="font-bold text-slate-900">분야별 전문 정규직 팀</strong>이 <br className="hidden sm:block" />
            당신의 새로운 시작과 일상을 완벽하게 관리합니다.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-slate-700 font-medium">
              <CheckCircle className="w-5 h-5 text-green-500" />
              당일 추가 요금 절대 없음 (계약서 명시)
            </li>
            <li className="flex items-center gap-3 text-slate-700 font-medium">
              <CheckCircle className="w-5 h-5 text-green-500" />
              독일 카처 고온 스팀기 & 친환경 세제 사용
            </li>
          </ul>
        </div>

        {/* 1초 견적기 위젯 */}
        <QuoteWidget />
      </div>
    </section>
  );
}
