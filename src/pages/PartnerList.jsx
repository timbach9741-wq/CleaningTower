import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/cleaning/Header';

const mockPartners = [
  {
    id: 1,
    tier: 'EXCLUSIVE', // 2번 모델 (지역 독점 단독 배너)
    name: '싹클 마스터 강남점',
    rating: 5.0,
    reviews: 2105,
    desc: '강남구 압도적 1위! 호텔식 프리미엄 홈케어 서비스를 경험해보세요. 하루 딱 한 집만 작업합니다.',
    tags: ['#강남구1위', '#호텔식청소', '#프리미엄'],
    price: '350,000',
    image: '/images/living_room_cleaning.png',
    area: '서울 강남구 전지역'
  },
  {
    id: 2,
    tier: 'PREMIUM', // 1번 모델 (표준 등급제 상위 리스트)
    name: '클린탑 코리아',
    rating: 4.9,
    reviews: 1205,
    desc: '우리집처럼 깨끗하게! 100% 직영팀 운영으로 책임감 있는 홈케어 서비스를 제공합니다.',
    tags: ['#직영팀운영', '#새집증후군', '#살균소독'],
    price: '210,000',
    image: '/images/cleaner_in_action.png',
    area: '서울 전지역 (당일가능)'
  },
  {
    id: 3,
    tier: 'PREMIUM', // 1번 모델
    name: '에코 홈클리닝',
    rating: 4.8,
    reviews: 842,
    desc: '독일제 친환경 세제만 고집합니다. 아이와 반려동물이 있는 집이라면 강력 추천!',
    tags: ['#친환경세제', '#펫프렌들리', '#아토피예방'],
    price: '230,000',
    image: '/images/cleaning_couple_team.png',
    area: '서울 강남/송파'
  },
  {
    id: 4,
    tier: 'BASIC', // 기본 모델
    name: '성실 청소반장',
    rating: 4.9,
    reviews: 248,
    desc: '"입주청소 10년 차 부부가 직접 방문합니다. 안 보이는 틈새부터 하수구 냄새까지 완벽하게 잡아드립니다."',
    tags: ['#부부청소단', '#AS보장', '#베란다특화'],
    price: '200,000',
    image: '/images/living_room_cleaning.png',
    area: '서울/경기 전지역'
  },
  {
    id: 5,
    tier: 'BASIC', // 기본 모델
    name: '반짝반짝 홈케어',
    rating: 4.6,
    reviews: 89,
    desc: '합리적인 가격으로 정성을 다해 청소합니다. 하루 한 집만 꼼꼼히 작업합니다.',
    tags: ['#가성비', '#하루한집', '#피톤치드'],
    price: '190,000',
    image: '/images/living_room_cleaning.png',
    area: '안양/과천'
  }
];

export default function PartnerList() {
  const [sortBy, setSortBy] = useState('추천순');

  const exclusivePartner = mockPartners.find(p => p.tier === 'EXCLUSIVE');
  const restPartners = mockPartners.filter(p => p.tier !== 'EXCLUSIVE');

  let sortedPremium = [];
  let sortedBasic = [];
  let mixedPartners = [];

  if (sortBy === '추천순') {
    sortedPremium = restPartners.filter(p => p.tier === 'PREMIUM');
    sortedBasic = restPartners.filter(p => p.tier === 'BASIC');
  } else if (sortBy === '평점순') {
    mixedPartners = [...restPartners].sort((a, b) => b.rating - a.rating);
  } else if (sortBy === '리뷰순') {
    mixedPartners = [...restPartners].sort((a, b) => b.reviews - a.reviews);
  }

  const getBtnClass = (type) => {
    return sortBy === type 
      ? "px-6 py-2 rounded-full font-bold text-sm bg-blue-900 text-white shadow-sm flex-1 md:flex-none transition-all"
      : "px-6 py-2 rounded-full font-semibold text-sm text-slate-500 hover:text-blue-900 hover:bg-slate-50 transition-all flex-1 md:flex-none";
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col">
      <Header onOpenQuote={() => {}} />
      <main className="pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-grow">
        
        {/* 상단 타이틀 및 정렬 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">파트너 찾기</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">📍 서울 강남구</span>
            </div>
            <p className="text-slate-500 font-medium">선택하신 지역에 <span className="text-blue-900 font-bold">42명</span>의 싹클 인증 전문가가 대기중입니다.</p>
          </div>
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-slate-200 self-stretch md:self-auto transition-all">
            <button onClick={() => setSortBy('추천순')} className={getBtnClass('추천순')}>추천순</button>
            <button onClick={() => setSortBy('평점순')} className={getBtnClass('평점순')}>평점순</button>
            <button onClick={() => setSortBy('리뷰순')} className={getBtnClass('리뷰순')}>리뷰순</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 필터 */}
          <div className="w-full lg:w-1/4 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-28 space-y-8">
              <div>
                <h3 className="font-bold text-blue-900 mb-4 whitespace-nowrap">활동 지역</h3>
                <div className="space-y-3">
                  {['서울', '경기', '인천', '수원', '동탄'].map((label, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked={idx < 2} />
                      <span className="text-slate-600 font-medium group-hover:text-blue-900 transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-blue-900 mb-4 whitespace-nowrap">청소 구역 유형</h3>
                <div className="space-y-3">
                  {['아파트', '빌라/다세대', '사무실/상가'].map((label, idx) => (
                    <label key={`type-${idx}`} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked={idx === 0} />
                      <span className="text-slate-600 font-medium group-hover:text-blue-900 transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-blue-900 mb-4 whitespace-nowrap">파트너 등급</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked />
                    <span className="flex items-center gap-1 text-slate-600 font-medium group-hover:text-blue-900 transition-colors">
                      <span className="text-blue-600 font-bold">💎</span>
                      지역 독점 파트너
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked />
                    <span className="flex items-center gap-1 text-slate-600 font-medium group-hover:text-amber-500 transition-colors">
                      <span className="text-amber-500 font-bold">★</span>
                      프리미엄 파트너
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" defaultChecked />
                    <span className="text-slate-600 font-medium group-hover:text-blue-900 transition-colors">일반 파트너</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4 space-y-12">
            
            {/* 2번 모델: 지역별 독점 파트너 (단독 배너) - 정렬과 무관하게 항상 최상단 고정 */}
            {exclusivePartner && (
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-blue-900">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 to-blue-900/80 z-10"></div>
                <img src={exclusivePartner.image} alt={exclusivePartner.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="relative z-20 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="text-white w-full md:w-2/3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Premium Exclusive</span>
                      <span className="text-blue-200 text-sm font-semibold">📍 {exclusivePartner.area} 독점 추천</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight group-hover:text-amber-300 transition-colors">{exclusivePartner.name}</h2>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-amber-400 text-lg">★★★★★</span>
                      <span className="font-bold">{exclusivePartner.rating}</span>
                      <span className="text-blue-200 text-sm">({exclusivePartner.reviews}개의 리얼 리뷰)</span>
                    </div>
                    <p className="text-blue-50 text-base md:text-lg opacity-90 leading-relaxed mb-6">
                      {exclusivePartner.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exclusivePartner.tags.map(tag => (
                        <span key={tag} className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 shrink-0 w-full md:w-auto shadow-xl">
                    <div className="text-blue-100 text-sm mb-1 font-medium">예상 견적 (30평 기준)</div>
                    <div className="text-3xl font-black text-white mb-4">₩{exclusivePartner.price}~</div>
                    <button className="w-full bg-white text-blue-900 font-bold py-3 px-6 rounded-xl hover:bg-amber-400 hover:text-amber-950 transition-all shadow-lg transform group-hover:-translate-y-1">
                      무료 견적 받기
                    </button>
                  </div>
                </div>
                <div className="absolute top-0 right-8 bg-amber-400 text-amber-950 px-4 py-2 rounded-b-xl font-black text-sm shadow-md z-30">
                  강남구 추천 1위 🏆
                </div>
              </div>
            )}

            {/* 추천순(기본값) 일 때: 프리미엄과 일반을 분리해서 보여줌 */}
            {sortBy === '추천순' ? (
              <>
                {/* 1번 모델: 프리미엄 파트너 리스트 */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm relative">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                      <span className="text-blue-600">👍</span> 프리미엄 추천 파트너
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {sortedPremium.map(partner => (
                      <div key={partner.id} className="bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row group overflow-hidden relative cursor-pointer">
                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold py-1 px-3 rounded-br-lg z-10 shadow-sm">
                          PREMIUM
                        </div>
                        <div className="sm:w-48 h-36 sm:h-auto shrink-0 relative overflow-hidden p-4 pb-0 sm:p-4">
                          <div className="w-full h-full rounded-xl overflow-hidden relative shadow-sm">
                            <img src={partner.image} alt={partner.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        </div>
                        <div className="p-5 pl-2 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1 group-hover:text-blue-700 transition-colors mt-2 sm:mt-0">
                                {partner.name}
                              </h2>
                              <div className="text-amber-600 font-bold flex items-center gap-1 text-xs bg-amber-50 px-2 py-1 rounded border border-amber-100 shadow-sm">
                                <span className="text-amber-500 text-[10px]">★</span>
                                {partner.rating} ({partner.reviews})
                              </div>
                            </div>
                            <p className="text-slate-400 text-xs mb-2 font-medium">{partner.area}</p>
                            <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                              {partner.desc}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {partner.tags.map(tag => (
                                <span key={tag} className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[11px] font-semibold group-hover:border-blue-200 group-hover:text-blue-600 transition-colors shadow-sm">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 mt-auto">
                            <div className="font-bold text-slate-800">₩{partner.price} <span className="text-sm font-normal text-slate-500">~</span></div>
                            <Link to="/" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                              상세 보기 <span>&rarr;</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 일반 파트너 섹션 */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="font-bold text-slate-700 text-lg">일반 파트너</h2>
                    <span className="text-slate-400 text-sm font-medium">총 {sortedBasic.length}건</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedBasic.map(partner => (
                      <div key={partner.id} className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden cursor-pointer p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 shrink-0 relative overflow-hidden rounded-xl bg-slate-100 border border-slate-100 shadow-inner">
                            <img src={partner.image} alt={partner.name} className="object-cover w-full h-full group-hover:opacity-90 transition-opacity" />
                          </div>
                          <div className="flex-grow flex flex-col justify-between h-full">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h2 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {partner.name}
                                </h2>
                              </div>
                              <div className="text-slate-500 font-medium flex items-center gap-1 text-xs mb-1">
                                <span className="text-amber-400 text-[10px]">★</span>
                                {partner.rating} ({partner.reviews})
                              </div>
                              <p className="text-slate-400 text-[10px] mb-2">{partner.area}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                           <div className="font-bold text-sm text-slate-700">₩{partner.price} ~</div>
                           <Link to="/" className="text-slate-400 font-semibold text-xs hover:text-slate-800 transition-colors">
                             상세 보기
                           </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm relative">
                {/* 평점순/리뷰순 일 때: 프리미엄과 일반 구분 없이 하나로 섞어서 리스트업 */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                    <span className="text-blue-600">📋</span> 전체 파트너 ({sortBy})
                  </h2>
                  <span className="text-slate-400 text-sm font-medium">총 {mixedPartners.length}건</span>
                </div>
                <div className="space-y-4">
                  {mixedPartners.map(partner => (
                    <div key={partner.id} className={`rounded-2xl border hover:shadow-md transition-all flex flex-col sm:flex-row group overflow-hidden relative cursor-pointer ${partner.tier === 'PREMIUM' ? 'bg-slate-50 border-slate-200 hover:border-blue-400' : 'bg-white border-slate-200 hover:border-slate-400'}`}>
                      {partner.tier === 'PREMIUM' && (
                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold py-1 px-3 rounded-br-lg z-10 shadow-sm">
                          PREMIUM
                        </div>
                      )}
                      <div className="sm:w-48 h-36 sm:h-auto shrink-0 relative overflow-hidden p-4 pb-0 sm:p-4">
                        <div className="w-full h-full rounded-xl overflow-hidden relative shadow-sm bg-slate-100">
                          <img src={partner.image} alt={partner.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      </div>
                      <div className="p-5 pl-2 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1 group-hover:text-blue-700 transition-colors mt-2 sm:mt-0">
                              {partner.name}
                            </h2>
                            <div className="text-amber-600 font-bold flex items-center gap-1 text-xs bg-amber-50 px-2 py-1 rounded border border-amber-100 shadow-sm">
                              <span className="text-amber-500 text-[10px]">★</span>
                              {partner.rating} ({partner.reviews})
                            </div>
                          </div>
                          <p className="text-slate-400 text-xs mb-2 font-medium">{partner.area}</p>
                          <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                            {partner.desc}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {partner.tags.map(tag => (
                              <span key={tag} className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[11px] font-semibold group-hover:border-blue-200 group-hover:text-blue-600 transition-colors shadow-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 mt-auto">
                          <div className="font-bold text-slate-800">₩{partner.price} <span className="text-sm font-normal text-slate-500">~</span></div>
                          <Link to="/" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                            상세 보기 <span>&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="py-8 flex justify-center">
              <button className="flex items-center gap-2 text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-700 px-6 py-3 rounded-full transition-colors border border-slate-200 shadow-sm">
                더 많은 파트너 보기
                <span className="text-xl">⌄</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
