import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/cleaning/Header';

export default function PartnerLanding() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col overflow-x-hidden">
      {/* 
        주의: 사업자 페이지 전용 헤더가 필요할 수 있으나, 
        일단 기존 Header를 사용하고 나중에 분리 가능합니다. 
      */}
      <Header onOpenQuote={() => {}} theme="dark" hideQuoteButton={true} />

      <main className="flex-grow">
        {/* 히어로 섹션 */}
        <section className="relative bg-blue-950 text-white pt-40 pb-32 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('/images/cleaner_in_action.webp')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 to-blue-950/95"></div>
          
          <div className="relative max-w-5xl mx-auto text-center z-10">
            <span className="text-amber-400 font-black tracking-wider text-sm md:text-base mb-4 block uppercase px-4 py-1 border border-amber-400/30 rounded-full inline-block bg-amber-400/10 backdrop-blur-md">
              청소타워 Partners
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              청소 전문가님, <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">안정적인 오더</span>가 필요하신가요?
            </h1>
            <p className="text-lg md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed opacity-90 font-medium">
              가입비 0원, 초기 세팅비 0원. <br className="hidden md:block" />
              대한민국 1등 입주청소 플랫폼 '청소타워'과 함께 확실한 매출 성장을 경험하세요.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mt-8">
              <Link 
                to="/partners/register" 
                state={{ plan: 'basic' }}
                className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg hover:bg-white/20 hover:-translate-y-1 transition-all text-center"
              >
                일반 파트너 가입
              </Link>
              <Link 
                to="/partners/register" 
                state={{ plan: 'premium' }}
                className="inline-block bg-blue-600 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] text-center"
              >
                프리미엄 입점 신청
              </Link>
              <Link 
                to="/partners/register" 
                state={{ plan: 'exclusive' }}
                className="inline-block bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg hover:from-amber-300 hover:to-yellow-400 hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(251,191,36,0.5)] text-center"
              >
                지역 독점 상담 신청
              </Link>
            </div>
          </div>
        </section>

        {/* 특장점 섹션 */}
        <section className="py-24 px-4 bg-white relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4 tracking-tight">왜 청소타워 파트너스인가요?</h2>
              <p className="text-lg text-slate-500 font-medium">기존 플랫폼들의 불합리한 수수료와 경쟁 유도를 완벽히 해결했습니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  💸
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">부담 없는 시작</h3>
                <p className="text-slate-600 leading-relaxed">
                  입점비, 가입비, 월 고정비가 전혀 없습니다. 일반 파트너는 오직 성사된 계약에 대해서만 합리적인 수수료를 지불하면 됩니다.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">지역 타겟팅 오더</h3>
                <p className="text-slate-600 leading-relaxed">
                  사장님이 원하시는 활동 지역의 알짜배기 오더만 쏙쏙 꽂아드립니다. 이동 시간을 줄이고 하루 청소 건수를 늘리세요.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  🛡️
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">공정한 노출 시스템</h3>
                <p className="text-slate-600 leading-relaxed">
                  출혈 경쟁을 유도하는 '최저가 입찰제'가 아닙니다. 꼼꼼하게 청소하고 좋은 리뷰를 받으면 자연스럽게 상단에 노출됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 수익화 모델 / 멤버십 안내 섹션 */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-600 font-bold mb-2 block tracking-wider">MEMBERSHIP</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4 tracking-tight">사장님 상황에 맞는 맞춤형 플랜</h2>
              <p className="text-lg text-slate-500 font-medium">처음엔 가볍게 시작하고, 주문이 늘면 업그레이드 하세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              
              {/* 1. 베이직 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative flex flex-col h-full hover:border-blue-300 transition-colors">
                <div className="mb-8">
                  <h3 className="text-slate-500 font-bold mb-1">일반 파트너</h3>
                  <div className="text-3xl font-extrabold text-slate-900 mb-2">BASIC</div>
                  <div className="text-sm text-slate-500">실력으로 승부하는 사장님께 추천</div>
                </div>
                <div className="mb-8 flex-grow">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-slate-700">
                      <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">입점비/가입비 무료</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700">
                      <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">리뷰/평점 기반 노출</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700">
                      <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">성사 건당 소정의 수수료</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <div className="text-2xl font-black text-slate-900 mb-4">₩0<span className="text-base font-normal text-slate-500"> / 월</span></div>
                  <Link to="/partners/register" state={{ plan: 'basic' }} className="block w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-center">
                    무료로 시작하기
                  </Link>
                </div>
              </div>

              {/* 2. 독점 (가장 비쌈, 가운데 강조) */}
              <div className="bg-slate-900 rounded-3xl p-8 border-2 border-amber-400 shadow-2xl relative flex flex-col h-[105%] transform lg:-translate-y-4 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black px-6 py-1 rounded-full text-sm shadow-md whitespace-nowrap">
                  V.I.P EXCLUSIVE
                </div>
                <div className="mb-8">
                  <h3 className="text-amber-400 font-bold mb-1">지역 독점 파트너</h3>
                  <div className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
                    <span className="text-amber-400 text-2xl">👑</span> EXCLUSIVE
                  </div>
                  <div className="text-sm text-slate-300">지역 내 압도적 1위 달성 목표</div>
                </div>
                <div className="mb-8 flex-grow">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-white">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">✓</span> 
                      <span className="break-keep">선택 지역 내 <span className="text-amber-400 font-bold underline decoration-amber-400/50 decoration-2">최상단 독점 노출</span></span>
                    </li>
                    <li className="flex items-start gap-3 text-white">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">한 지역당 단 1~2팀 제한</span>
                    </li>
                    <li className="flex items-start gap-3 text-white">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">프리미엄 혜택 모두 포함</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <div className="text-2xl font-black text-white mb-4">상담 후 결정<span className="text-base font-normal text-slate-400 block sm:inline"> (지역별 상이)</span></div>
                  <Link to="/partners/register" state={{ plan: 'exclusive' }} className="block w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-bold py-4 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-colors shadow-[0_0_15px_rgba(251,191,36,0.3)] text-center">
                    지역 독점 TO 문의
                  </Link>
                </div>
              </div>

              {/* 3. 프리미엄 (오른쪽 일반) */}
              <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-200 shadow-sm relative flex flex-col h-full hover:border-blue-400 transition-colors">
                <div className="mb-8">
                  <h3 className="text-blue-600 font-bold mb-1">프리미엄 파트너</h3>
                  <div className="text-3xl font-extrabold text-slate-900 mb-2">PREMIUM</div>
                  <div className="text-sm text-slate-600">안정적인 오더가 필요한 업체</div>
                </div>
                <div className="mb-8 flex-grow">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-slate-700">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">기본 정렬 시 상위 그룹핑 노출</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">전용 프리미엄 배지 부여</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">✓</span> <span className="break-keep">프리미엄 전담 매니저 배정</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto">
                  <div className="text-2xl font-black text-slate-900 mb-4">무료<span className="text-base font-normal text-slate-500"> (0원)</span></div>
                  <Link to="/partners/register" state={{ plan: 'premium' }} className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-center">
                    프리미엄 무료 가입
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 전환 유도 하단 */}
        <section className="py-20 bg-blue-600 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">지금 가입하면 프리미엄 혜택 평생 무료!</h2>
            <p className="text-blue-100 text-lg mb-10">
              초기 파트너사 전용 오픈 혜택! 가입비 및 유지비 없이 상위 노출 혜택을 누리세요.
            </p>
            <Link to="/partners/register" state={{ plan: 'premium' }} className="inline-block bg-white text-blue-600 font-black py-4 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-xl">
              무료 혜택받고 가입하기
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
