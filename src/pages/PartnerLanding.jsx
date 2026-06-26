import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/authHelpers';
import Header from '../components/cleaning/Header';
import Footer from '../components/cleaning/Footer';
import SEO from '../components/common/SEO';
import { partnerQnaData } from '../data/partnerQnaData';

const planData = {
  basic: {
    name: '일반 파트너',
    sub: '진입장벽 없이 성사 수수료로 시작',
    features: [
      '입점비/가입비 무료',
      '리뷰/평점 기반 정직한 노출',
      '성사 건당 수수료 정산'
    ],
    pricing: {
      '1month': { monthly: '50,000', total: '50,000', discount: 0 },
      '3month': { monthly: '45,000', total: '135,000', discount: 10 },
      '6month': { monthly: '40,000', total: '240,000', discount: 20 }
    }
  },
  premium: {
    name: '프리미엄 파트너',
    sub: '가장 많은 사장님들이 선택하는 플랜',
    features: [
      '기본 검색 시 상위 그룹 노출',
      '전용 프리미엄 배지 부여',
      '프리미엄 전담 매니저 배정',
      '상세 페이지 브랜딩 영역 제공'
    ],
    pricing: {
      '1month': { monthly: '150,000', total: '150,000', discount: 0 },
      '3month': { monthly: '135,000', total: '405,000', discount: 10 },
      '6month': { monthly: '120,000', total: '720,000', discount: 20, isBest: true }
    }
  },
  exclusive: {
    name: '지역 독점 파트너',
    sub: '특정 지역의 청소 오더를 완벽 독점',
    features: [
      '선택 지역 내 최상단 독점 노출',
      '한 지역당 단 1~2팀 제한',
      '모든 프리미엄 파트너 혜택 포함',
      'B2B 청소 오더 우선 배정'
    ],
    pricing: {
      '1month': { monthly: '300,000', total: '300,000', discount: 0 },
      '3month': { monthly: '270,000', total: '810,000', discount: 10 },
      '6month': { monthly: '240,000', total: '1,440,000', discount: 20 }
    }
  }
};

export default function PartnerLanding() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [cycles, setCycles] = useState({
    basic: '6month',
    premium: '6month',
    exclusive: '6month'
  });

  const handlePlanClick = (e, plan) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (user && user.role === 'partner') {
      navigate('/partners/checkout', { state: { plan, partnerId: user.id } });
    } else {
      navigate('/partners/register', { state: { plan } });
    }
  };

  const faqSectionRef = useRef(null);

  const handleCycleChange = (planKey, cycle) => {
    setCycles(prev => ({
      ...prev,
      [planKey]: cycle
    }));
  };

  const categories = ['전체', '가입방법', '수수료/비용', '오더/운영', '멤버십', '정보등록/오류', '정산/탈퇴'];

  const handleToggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleScrollToFaq = (e) => {
    e.preventDefault();
    if (faqSectionRef.current) {
      faqSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 필터링된 Q&A 목록
  const filteredQna = partnerQnaData.filter((item) => {
    const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col overflow-x-hidden">
      <SEO 
        title="청소타워 파트너스 - 청소 업체 가입 및 매출 증대" 
        description="가입비, 중개수수료 0원! 청소타워 파트너스로 가입하고 안정적인 오더를 받아보세요. 입주청소, 이사청소 전문업체 상시 모집." 
        keywords="청소타워파트너스, 청소업체모집, 입주청소가맹점, 이사청소협력업체, 사무실청소대행"
      />
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
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight break-keep">
              청소 전문가님, <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">안정적인 오더</span>가 필요하신가요?
            </h1>
            <p className="text-lg md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed opacity-90 font-medium break-keep">
              가입비 0원, 초기 세팅비 0원. <br className="hidden md:block" />
              대한민국 1등 입주청소 플랫폼 '청소타워'과 함께 확실한 매출 성장을 경험하세요.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mt-8">
              <button 
                onClick={(e) => handlePlanClick(e, 'basic')}
                className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg hover:bg-white/20 hover:-translate-y-1 transition-all text-center"
              >
                일반 파트너 가입
              </button>
              <button 
                onClick={(e) => handlePlanClick(e, 'premium')}
                className="inline-block bg-blue-600 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] text-center"
              >
                프리미엄 입점 신청
              </button>
              <button 
                onClick={(e) => handlePlanClick(e, 'exclusive')}
                className="inline-block bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg hover:from-amber-300 hover:to-yellow-400 hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(251,191,36,0.5)] text-center"
              >
                지역 독점 상담 신청
              </button>
            </div>
            <div className="mt-8 flex justify-center">
              <a 
                href="#faq"
                onClick={handleScrollToFaq}
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold text-sm md:text-base underline underline-offset-4 decoration-2 transition-colors cursor-pointer group bg-white/5 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/10"
              >
                <span>💡 가입방법 및 오류 해결 방법 보기</span>
                <span className="material-symbols-outlined text-base group-hover:translate-y-0.5 transition-transform">arrow_downward</span>
              </a>
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
            <div className="text-center mb-16 flex flex-col items-center">
              <span className="text-blue-600 font-bold mb-2 block tracking-wider">MEMBERSHIP</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4 tracking-tight">사장님 상황에 맞는 맞춤형 플랜</h2>
              <p className="text-lg text-slate-500 font-medium mb-6">주문이 늘어남에 따라 알맞은 플랜을 선택해보세요.</p>
              
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm sm:text-base md:text-lg font-black shadow-lg border border-blue-400/20">
                🎁 신규 파트너 론칭 특별 프로모션: 장기 결제 시 최대 20% 즉시 할인 혜택 제공!
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
              {['basic', 'premium', 'exclusive'].map((key) => {
                const plan = planData[key];
                const billingCycle = cycles[key];
                const pricing = plan.pricing[billingCycle];
                const isPremium = key === 'premium';
                const isExclusive = key === 'exclusive';
                
                // 스타일 분기
                let cardClass = "rounded-3xl p-8 border shadow-sm relative flex flex-col transition-all duration-300 ";
                let buttonClass = "block w-full font-bold py-3.5 rounded-xl text-center transition-all ";
                
                if (isPremium) {
                  // 프리미엄 카드 (가운데 강조)
                  cardClass += "bg-slate-900 text-white border-2 border-blue-500 shadow-2xl lg:-translate-y-4 z-10 scale-[1.02] lg:scale-[1.03]";
                  buttonClass += "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5";
                } else if (isExclusive) {
                  // 독점 카드
                  cardClass += "bg-white text-slate-900 border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md";
                  buttonClass += "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 hover:from-amber-300 hover:to-yellow-400 hover:-translate-y-0.5 shadow-md";
                } else {
                  // 베이직 카드
                  cardClass += "bg-white text-slate-900 border-slate-200 hover:border-blue-300 hover:shadow-md";
                  buttonClass += "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:-translate-y-0.5";
                }

                return (
                  <div key={key} className={cardClass}>
                    {/* 상단 뱃지 */}
                    {isPremium && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-black px-5 py-1.5 rounded-full text-xs shadow-md whitespace-nowrap flex items-center gap-1.5 ring-4 ring-blue-950">
                        🔥 <span>강력 추천! 가장 인기 있는 플랜</span>
                      </div>
                    )}
                    {isExclusive && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black px-4 py-0.5 rounded-full text-xs shadow-sm whitespace-nowrap">
                        👑 VIP EXCLUSIVE
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className={`font-bold mb-1 ${isPremium ? 'text-blue-400' : 'text-slate-500'}`}>
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-extrabold mb-2">{key.toUpperCase()}</div>
                      <div className={`text-sm ${isPremium ? 'text-slate-300' : 'text-slate-500'} break-keep`}>
                        {plan.sub}
                      </div>
                    </div>

                    {/* 카드 내 개월수 선택 컨트롤러 */}
                    <div className="mb-6 flex flex-col gap-2">
                      <span className={`text-xs font-bold ${isPremium ? 'text-slate-400' : 'text-slate-500'}`}>가입 기간 선택</span>
                      <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${isPremium ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {['1month', '3month', '6month'].map((cycle) => {
                          const discountText = cycle === '1month' ? '정상가' : cycle === '3month' ? '10% 할인' : '20% 할인';
                          const isSelected = billingCycle === cycle;
                          
                          // 선택 여부 및 플랜 종류에 따른 서브 텍스트(할인 정보) 색상 지정
                          const discountColor = cycle === '1month' 
                            ? (isSelected ? 'text-white' : (isPremium ? 'text-slate-400' : 'text-slate-500'))
                            : (isSelected ? 'text-rose-200' : 'text-rose-600 font-extrabold');
                          
                          return (
                            <button
                              key={cycle}
                              type="button"
                              onClick={() => handleCycleChange(key, cycle)}
                              className={`py-2 px-1 rounded-lg text-xs sm:text-sm font-bold transition-all text-center ${
                                isSelected
                                  ? isPremium 
                                    ? 'bg-blue-600 text-white shadow scale-[1.03]' 
                                    : 'bg-white text-blue-950 shadow scale-[1.03]'
                                  : isPremium
                                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                              }`}
                            >
                              <div>{cycle === '1month' ? '1개월' : cycle === '3month' ? '3개월' : '6개월'}</div>
                              <div className={`text-[10px] sm:text-[11px] mt-0.5 ${discountColor}`}>
                                {discountText}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-8 flex-grow">
                      <ul className="space-y-4">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className={`font-bold shrink-0 mt-0.5 ${isPremium ? 'text-blue-400' : isExclusive ? 'text-amber-500' : 'text-green-500'}`}>
                              ✓
                            </span>
                            <span className="break-keep">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 요금 정보 */}
                    <div className={`mt-auto pt-6 border-t ${isPremium ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div className="flex flex-col mb-6 text-left">
                        {/* 할인 이전 원가 및 할인율 표기 */}
                        {pricing.discount > 0 ? (
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm line-through opacity-65 ${isPremium ? 'text-slate-400' : 'text-slate-500'}`}>
                              ₩{key === 'basic' ? '50,000' : key === 'premium' ? '150,000' : '300,000'}
                            </span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-600 text-white shadow-sm animate-pulse">
                              {pricing.discount}% 할인
                            </span>
                          </div>
                        ) : (
                          <div className="h-6" />
                        )}

                        {/* 월별 환산 요금 */}
                        <div className="text-2xl lg:text-3xl font-black flex items-baseline gap-1">
                          ₩{pricing.monthly} 
                          <span className={`text-xs font-normal ${isPremium ? 'text-slate-400' : 'text-slate-500'}`}>
                            / 월
                          </span>
                        </div>

                        {/* 장기 할인 총 납부금액 안내 */}
                        {billingCycle !== '1month' ? (
                          <span className={`text-xs mt-1.5 font-bold ${isPremium ? 'text-blue-300' : 'text-blue-600'}`}>
                            (총 {billingCycle === '3month' ? '3개월' : '6개월'} 금액: ₩{pricing.total})
                          </span>
                        ) : (
                          <span className="text-xs mt-1.5 h-4 opacity-0" />
                        )}
                      </div>

                      <button 
                        onClick={(e) => handlePlanClick(e, key)}
                        className={`w-full py-4 rounded-xl font-black text-sm md:text-base transition-all active:scale-[0.98] ${buttonClass}`}
                      >
                        {key === 'basic' ? '일반 파트너로 시작하기' : `${plan.name} 신청하기`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Q&A / FAQ 검색 섹션 */}
        <section id="faq" ref={faqSectionRef} className="py-24 px-4 bg-white border-t border-slate-100 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-blue-600 font-bold mb-2 block tracking-wider uppercase">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-4 tracking-tight">
                자주 묻는 질문 (FAQ)
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                가입, 수수료, 정산 및 시스템 이용에 관한 궁금증을 실시간으로 검색해 보세요.
              </p>
            </div>

            {/* 검색바 */}
            <div className="relative max-w-xl mx-auto mb-10 shadow-sm rounded-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400">search</span>
              </div>
              <input
                type="text"
                placeholder="예: 인증, 사진, 오류, 정산, 수수료 등 검색어 입력..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setExpandedIndex(null); // 검색 시 아코디언 초기화
                }}
                className="block w-full pl-12 pr-10 py-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 text-base transition-all font-medium placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setExpandedIndex(null);
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            {/* 카테고리 탭 */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setExpandedIndex(null); // 카테고리 변경 시 아코디언 초기화
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {cat === '전체' ? '전체보기' : cat}
                </button>
              ))}
            </div>

            {/* 검색 결과 건수 표시 */}
            {searchQuery && (
              <p className="text-sm text-slate-500 mb-6 text-center">
                <span className="text-blue-600 font-bold">"{searchQuery}"</span> 검색 결과 총{' '}
                <span className="text-blue-600 font-bold">{filteredQna.length}</span>건이 검색되었습니다.
              </p>
            )}

            {/* Q&A 리스트 */}
            <div className="space-y-4">
              {filteredQna.length > 0 ? (
                filteredQna.map((item, index) => {
                  const isOpen = expandedIndex === index;
                  return (
                    <div
                      key={index}
                      className={`border rounded-2xl transition-all duration-300 ${
                        isOpen
                          ? 'border-blue-200 bg-blue-50/25 shadow-md shadow-blue-500/5'
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleAccordion(index)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded ${
                              isOpen
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            Q
                          </span>
                          <span className="font-bold text-slate-800 text-sm sm:text-base leading-snug break-keep">
                            {item.q}
                          </span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ml-2 ${
                            isOpen ? 'rotate-180 text-blue-600' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>

                      <div
                        className={`transition-all duration-300 overflow-hidden ${
                          isOpen ? 'max-h-[300px] border-t border-slate-100/50' : 'max-h-0'
                        }`}
                      >
                        <div className="px-6 py-5 text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pl-[38px] relative">
                          <span className="absolute left-6 font-extrabold text-[#16a34a] text-sm">A.</span>
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">search_off</span>
                  <p className="text-slate-500 font-bold text-base mb-2">검색 결과가 없습니다.</p>
                  <p className="text-slate-400 text-xs sm:text-sm mb-6 break-keep">
                    다른 키워드로 검색하시거나, 카테고리 탭을 선택해 보세요.
                  </p>
                  
                  {/* 카카오톡 상담 바로가기 퀵 배너 */}
                  <a
                    href="http://pf.kakao.com/_xnHTnX/chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-black font-extrabold px-6 py-3 rounded-xl text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.24 4.6 6.55-.26.96-.94 3.44-.97 3.56-.03.11.02.22.11.27.09.05.21.05.3 0 .12-.06 3.65-2.48 4.2-2.87.56.09 1.15.13 1.76.13 5.52 0 10-3.51 10-7.84S17.52 3 12 3z" />
                    </svg>
                    <span>1:1 카카오톡 상담하기</span>
                  </a>
                </div>
              )}
            </div>

            {/* 해결이 안 되었을 때 안내 배너 */}
            <div className="mt-16 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-700/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="text-center md:text-left z-10">
                <h3 className="text-lg md:text-xl font-extrabold mb-1">원하시는 답변을 찾지 못하셨나요?</h3>
                <p className="text-xs md:text-sm text-blue-200 opacity-90 break-keep">
                  본사 지원센터로 문의 주시면 친절하게 가입 승인 및 지정을 대행해 드립니다.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 z-10">
                <a
                  href="tel:031-499-9509"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                  <span>전화 상담</span>
                </a>
                <a
                  href="http://pf.kakao.com/_xnHTnX/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#FEE500] hover:bg-[#FDD800] text-black font-extrabold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.24 4.6 6.55-.26.96-.94 3.44-.97 3.56-.03.11.02.22.11.27.09.05.21.05.3 0 .12-.06 3.65-2.48 4.2-2.87.56.09 1.15.13 1.76.13 5.52 0 10-3.51 10-7.84S17.52 3 12 3z" />
                  </svg>
                  <span>카톡 문의</span>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
