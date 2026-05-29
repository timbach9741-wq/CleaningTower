import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import Footer from '../components/cleaning/Footer';
import FloatingCTA from '../components/cleaning/FloatingCTA';
import CTASection from '../components/cleaning/CTASection';
import ReviewSection from '../components/cleaning/ReviewSection';
import { Sparkles, Home, Building2, Bed, Droplets, Info, CheckCircle2, ShieldCheck, Wind, Bug, Thermometer } from 'lucide-react';

export default function ServiceGuide() {
  const navigate = useNavigate();
  const [isQuoteTypeModalOpen, setIsQuoteTypeModalOpen] = useState(false);
  const [activeQuoteTab, setActiveQuoteTab] = useState('premium');
  const [activeScopeTab, setActiveScopeTab] = useState('kitchen');

  const openQuoteModal = () => setIsQuoteTypeModalOpen(true);
  const handleSelectQuoteType = (type) => {
    setIsQuoteTypeModalOpen(false);
    navigate(`/quote/${type}`);
  };

  const services = [
    {
      icon: <Sparkles className="w-8 h-8 text-blue-500" />,
      title: '입주 청소',
      subtitle: '신축 아파트/빌라/오피스텔',
      description: '신축 공사 후 발생하는 미세분진, 시멘트 가루, 유해물질(새집증후군 원인)을 완벽하게 제거합니다.',
      features: ['친환경 베이크아웃', '틈새 분진 제거 집중 케어'],
    },
    {
      icon: <Home className="w-8 h-8 text-indigo-500" />,
      title: '이사 청소',
      subtitle: '구옥/거주 이력 있는 집',
      description: '이전 거주자가 남긴 찌든 때, 기름때, 생활 오염, 곰팡이 등을 흔적 없이 지워냅니다.',
      features: ['주방/욕실 정밀 딥클리닝', '각종 세균 살균 소독'],
    },
    {
      icon: <Bed className="w-8 h-8 text-teal-500" />,
      title: '거주 청소',
      subtitle: '현재 살고 있는 집',
      description: '일상생활 중 쌓인 묵은 때와 먼지를 정리합니다. 이사 청소에 준하는 대청소 서비스입니다.',
      features: ['가전/가구 보양 작업 후 진행', '거주자의 호흡기를 위한 친환경 케어'],
    },
    {
      icon: <Building2 className="w-8 h-8 text-amber-500" />,
      title: '상가/사무실 청소',
      subtitle: '사무공간 및 상업시설',
      description: '사업장 오픈 전/후 인테리어 잔여물 제거 및 쾌적한 업무 환경 조성을 위한 전문 청소입니다.',
      features: ['바닥 왁싱 코팅', '유리창 맑음 케어'],
    },
  ];

  const scopes = {
    kitchen: {
      title: '주방',
      items: [
        '후드 필터 탈거 및 찌든 기름때 세척',
        '가스레인지/인덕션 찌든 때 제거',
        '싱크대 배수구 정밀 살균 및 악취 제거',
        '상/하부장 내부 및 걸레받이 탈거 후 숨은 먼지 제거',
      ],
    },
    bathroom: {
      title: '욕실',
      items: [
        '환풍기 커버 및 배수구 탈거 세척 (머리카락 및 오염물 제거)',
        '변기, 세면대, 욕조 찌든 때 제거 및 살균 소독',
        '거울, 샤워부스 물때 제거 및 코팅 처리',
        '타일 사이 줄눈 곰팡이 억제 및 세척',
      ],
    },
    room: {
      title: '방/거실',
      items: [
        '천장, 벽면, 몰딩의 도배풀 및 부유 먼지 제거',
        '전등갓 탈거 후 내부 벌레 사체 및 먼지 세척',
        '콘센트, 스위치, 방문 손잡이 미세 먼지 제거',
        '바닥 재질(강마루, 장판, 타일 등)에 맞춘 전용 세정제 클리닝',
      ],
    },
    window: {
      title: '창틀/베란다',
      items: [
        '내부 유리창 및 창틀 모서리 찌든 때 세척',
        '방충망 가볍게 털기 (파손 방지)',
        '베란다/다용도실 바닥 타일 물청소 및 배수구 세척',
      ],
      notice: '안전상의 이유로 외부(바깥) 창문 유리면은 기본 청소 범위에서 제외됩니다. (별도 문의 필요)',
    },
  };

  const processSteps = [
    { step: 'Step 1', title: '예약 상담', desc: '평수, 구조, 오염도를 확인하고 투명한 견적을 산출합니다.' },
    { step: 'Step 2', title: '현장 방문', desc: '청소 당일 현장을 확인하고 특이사항을 고객과 사전 공유합니다.' },
    { step: 'Step 3', title: '집중 클리닝', desc: '각 구역별 전문 인력과 장비가 투입되어 체계적으로 청소합니다.' },
    { step: 'Step 4', title: '자체 검수', desc: '팀장이 1차로 미흡한 부분이 없는지 꼼꼼히 크로스 체크합니다.' },
    { step: 'Step 5', title: '고객 동반 검수', desc: '고객님과 함께 최종 결과를 확인하며 피드백을 수렴합니다.' },
    { step: 'Step 6', title: '결제 및 안심 보증', desc: '만족 시 결제가 진행되며, A/S 정책을 안내합니다.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      <Header onOpenQuote={openQuoteModal} theme="dark" />

      {/* 1. 도입부 (Hero Section) */}
      <section className="pt-32 pb-20 px-4 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 font-bold text-sm mb-4 border border-blue-400/30">
            청소타워 프리미엄 서비스 안내
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight break-keep">
            보이지 않는 곳까지 완벽하게,<br/>
            <span className="text-blue-400">청소타워의 프리미엄 클리닝</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-medium break-keep mb-8 max-w-2xl mx-auto">
            검증된 정규직 전문가, 친환경 세제, 최첨단 장비로 당신의 공간을 새롭게 디자인합니다.
          </p>
        </div>
      </section>

      {/* 2. 제공 서비스 (Our Services) */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">맞춤형 클리닝 서비스</h2>
            <p className="text-slate-500 font-medium text-lg">고객님의 상황에 딱 맞는 서비스를 선택하세요.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {services.map((svc, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                    {svc.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{svc.title}</h3>
                    <p className="text-blue-600 font-bold text-sm">{svc.subtitle}</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-6 font-medium break-keep min-h-[48px]">{svc.description}</p>
                <div className="space-y-2">
                  {svc.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 구역별 상세 청소 범위 */}
      <section className="py-20 px-4 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">구역별 상세 청소 범위</h2>
            <p className="text-slate-500 font-medium text-lg">어디까지 청소해주는지 투명하게 공개합니다.</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {Object.entries(scopes).map(([key, scope]) => (
              <button
                key={key}
                onClick={() => setActiveScopeTab(key)}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                  activeScopeTab === key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {scope.title}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-6">{scopes[activeScopeTab].title} 청소 범위</h3>
            <ul className="space-y-4 mb-6">
              {scopes[activeScopeTab].items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-slate-700 font-medium leading-relaxed break-keep">{item}</span>
                </li>
              ))}
            </ul>
            {scopes[activeScopeTab].notice && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-amber-800 break-keep">{scopes[activeScopeTab].notice}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. 청소타워만의 특별함 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">청소타워만의 프리미엄 디테일</h2>
            <p className="text-slate-500 font-medium text-lg">장비와 세제부터 다른 1%의 차이</p>
          </div>

          <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-6 lg:gap-8">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Wind className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">친환경 안심 세제</h3>
              <p className="text-slate-600 font-medium break-keep">
                아이와 반려동물이 핥아도 안전한 독일/미국산 친환경 인증 세제만을 사용합니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                <Bug className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">철저한 도구 분리</h3>
              <p className="text-slate-600 font-medium break-keep">
                화장실용, 주방용, 방용 걸레를 엄격히 분리 사용하여 교차 오염을 100% 차단합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 체계적인 작업 프로세스 (Timeline) */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4 tracking-tight">체계적인 6단계 작업 프로세스</h2>
            <p className="text-slate-400 font-medium text-lg">표준화된 매뉴얼로 변함없는 퀄리티를 약속합니다.</p>
          </div>

          <div className="relative">
            {/* Vertical Line for mobile, Horizontal for md+ */}
            <div className="absolute left-[27px] md:left-0 top-0 bottom-0 md:bottom-auto md:top-6 w-0.5 md:w-full md:h-0.5 bg-slate-800"></div>
            
            <div className="flex flex-col md:flex-row gap-8 md:gap-4 justify-between relative z-10">
              {processSteps.map((step, idx) => (
                <div key={idx} className="flex md:flex-col items-start md:items-center gap-4 md:gap-6 relative">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex flex-col items-center justify-center shrink-0 border-4 border-slate-900 shadow-lg text-white font-black">
                    <span className="text-[10px] opacity-80 leading-none mb-0.5">STEP</span>
                    <span className="text-xl leading-none">{idx + 1}</span>
                  </div>
                  <div className="pt-2 md:pt-0 md:text-center md:flex-1">
                    <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 font-medium break-keep md:max-w-[140px]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. 100% 안심 A/S 보증 */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 md:p-12 border border-blue-100 text-center">
          <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">100% 안심 A/S 보증</h2>
          <p className="text-lg text-slate-600 font-medium mb-8 break-keep max-w-2xl mx-auto">
            청소 품질에 자신 있기에 가능한 청소타워만의 약속입니다.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
              <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                무상 A/S 보장
              </h3>
              <p className="text-slate-600 font-medium text-sm break-keep">
                청소 완료 후 미흡한 부분이 발견되면, <strong className="text-blue-600">3일 이내 100% 무상 A/S</strong>를 진행해 드립니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
              <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                배상 책임 보험 가입
              </h3>
              <p className="text-slate-600 font-medium text-sm break-keep">
                청소 중 발생하는 예기치 못한 파손 및 훼손에 대해 안전하게 보상받으실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 고객 후기 (Review Section) */}
      <ReviewSection />

      {/* 8. CTA */}
      <CTASection onOpenQuote={openQuoteModal} />

      <Footer />
      <FloatingCTA onOpenQuote={openQuoteModal} />

      {/* Quote Modal */}
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
                    </ul>
                  </div>
                )}
              </div>

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
