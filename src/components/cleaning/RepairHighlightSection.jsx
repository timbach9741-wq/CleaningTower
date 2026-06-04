import React, { useState, useEffect, useRef } from 'react';
import { Wrench, ShieldCheck, Sparkles, ChevronRight, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function RepairHighlightSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const repairItems = [
    {
      icon: '🪵',
      title: '장판 보수',
      problem: '들뜸, 긁힘, 찢어짐',
      solution: '들뜬 부분 재접착 및 긁힘 부위 보수 처리',
      detail: '이사 후 장판 상태를 점검하고, 들뜸·긁힘·찢어짐이 발견되면 청소 작업 중에 바로 보수합니다. 별도 업체를 부르지 않아도 됩니다.',
    },
    {
      icon: '🧱',
      title: '타일 보수',
      problem: '줄눈 깨짐, 변색, 곰팡이',
      solution: '줄눈 재시공 및 곰팡이 제거 후 코팅',
      detail: '욕실·주방 타일 줄눈의 깨짐, 변색, 곰팡이를 전문 도구로 제거한 후 깨끗하게 재시공합니다.',
    },
    {
      icon: '💧',
      title: '실리콘 보수',
      problem: '갈라짐, 변색, 곰팡이',
      solution: '기존 실리콘 제거 후 항균 실리콘 재시공',
      detail: '세면대, 욕조, 싱크대 주변의 노후된 실리콘을 완전 제거하고, 항균 실리콘으로 깔끔하게 재시공합니다.',
    },
    {
      icon: '🔧',
      title: '마루콕 시공',
      problem: '마루 틈새 벌어짐, 소음',
      solution: '마루 틈새 충진 및 삐걱거림 해소',
      detail: '마루 판재 사이의 벌어진 틈새를 전용 마루콕으로 충진하여 먼지 유입을 막고 삐걱거림을 잡아줍니다.',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28 px-4 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/8 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]"></div>
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div
          className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-6 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 backdrop-blur-sm">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300 tracking-wide">
              청소타워만의 차별화 서비스
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight break-keep">
            청소만 하는 곳이 아닙니다.<br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              기본 보수까지 함께 합니다.
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto break-keep leading-relaxed">
            사장님, 걱정 마세요. 청소타워는 <strong className="text-white font-bold">장판 · 타일 · 실리콘</strong> 등
            <br className="hidden sm:block" />
            기본적인 보수를 청소와 함께 진행하여
            <br className="hidden sm:block" />
            <strong className="text-amber-400 font-bold">소비자 컴플레인을 사전에 차단</strong>해드립니다.
          </p>
        </div>

        {/* Before → After Comparison Banner */}
        <div
          className={`mb-16 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="grid md:grid-cols-2 gap-4 md:gap-0 max-w-4xl mx-auto">
            {/* Before (Other companies) */}
            <div className="bg-gradient-to-br from-red-950/60 to-red-900/40 backdrop-blur-sm border border-red-500/20 rounded-2xl md:rounded-r-none p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-bold text-red-300">타사 청소 업체</span>
              </div>
              <ul className="space-y-3 relative z-10">
                {[
                  '청소만 하고 철수',
                  '장판 들뜸 — "저희 소관이 아닙니다"',
                  '실리콘 곰팡이 — 그냥 넘어감',
                  '입주 후 소비자 불만 → 사업자 책임',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-red-400 mt-0.5 text-sm font-bold shrink-0">✗</span>
                    <span className="text-red-200/90 text-sm font-medium break-keep">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After (청소타워) */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/40 backdrop-blur-sm border border-emerald-500/20 rounded-2xl md:rounded-l-none p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">청소타워</span>
              </div>
              <ul className="space-y-3 relative z-10">
                {[
                  '청소 + 기본 보수 원스톱 처리',
                  '장판 들뜸 → 현장에서 바로 재접착',
                  '실리콘 곰팡이 → 제거 후 항균 재시공',
                  '입주 시 컴플레인 제로 → 사업자 신뢰 UP',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-emerald-200/90 text-sm font-medium break-keep">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Repair Service Cards */}
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-16 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {repairItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCard(activeCard === idx ? null : idx)}
              className={`relative group text-left w-full rounded-2xl p-6 transition-all duration-300 border backdrop-blur-sm cursor-pointer ${
                activeCard === idx
                  ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-400/40 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]'
              }`}
            >
              {/* Icon */}
              <div className="text-3xl mb-4">{item.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>

              {/* Problem */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-bold text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  {item.problem}
                </span>
              </div>

              {/* Solution */}
              <p className="text-sm text-slate-300 font-medium break-keep leading-relaxed">
                {item.solution}
              </p>

              {/* Expanded detail */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  activeCard === idx ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-400 font-medium break-keep leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>

              {/* Expand hint */}
              <div className={`flex items-center gap-1 mt-3 transition-all duration-300 ${
                activeCard === idx ? 'opacity-0 h-0' : 'opacity-60 h-auto'
              }`}>
                <span className="text-xs text-slate-500 font-medium">자세히 보기</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </div>
            </button>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div
          className={`transition-all duration-1000 delay-[600ms] ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-blue-500/20 to-amber-500/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 text-center">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight break-keep">
                청소 비용 그대로,<br />
                <span className="text-amber-400">보수 서비스는 무상입니다.</span>
              </h3>
              <p className="text-slate-400 font-medium mb-6 break-keep max-w-lg mx-auto">
                프리미엄 청소를 선택하시면 장판, 타일, 실리콘, 마루콕 보수가
                <strong className="text-white"> 추가 비용 없이</strong> 포함됩니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="#services-section"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
                >
                  서비스 더 알아보기
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
