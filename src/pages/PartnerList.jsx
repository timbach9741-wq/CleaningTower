import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { mockPartners } from '../data/mockPartnersData';

const PartnerDetailModal = ({ partner, onClose, quoteData }) => {
  const navigate = useNavigate();
  if (!partner) return null;

  const handleConfirmWithPartner = async () => {
    if (!quoteData) return;
    try {
      if (db) {
        await addDoc(collection(db, 'quotes'), {
          ...quoteData,
          assignedTo: partner.id,
          designatedPartnerName: partner.name
        });
        alert(`예약이 성공적으로 접수되었습니다.\n${partner.name} 업체에 견적이 전달되었습니다.\n담당자가 확인 후 곧 연락드리겠습니다.`);
        navigate('/');
      }
    } catch (err) {
      console.error("Failed to save quote", err);
      alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-3 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 pr-2">{partner.name}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0 mt-0.5">✕</button>
          </div>
          <div className="h-56 sm:h-80 w-full rounded-xl overflow-hidden mb-4 bg-slate-50 border border-slate-100 p-4 flex items-center justify-center">
            <img 
              src={partner.image} 
              alt={partner.name} 
              className="max-w-full max-h-full object-contain drop-shadow-md" 
            />
          </div>
          
          <div className="space-y-3">
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{partner.desc}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold mb-0.5">활동 지역</p>
                <p className="text-slate-900 font-medium text-xs truncate">{partner.area}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 overflow-hidden">
                <p className="text-[10px] text-slate-500 font-bold mb-0.5">우리업체의 장점</p>
                <p className="text-blue-600 font-bold text-[11px] truncate">{partner.tags.map(t => t.replace('#', '')).join(', ')}</p>
              </div>
            </div>

            {partner.isReal && (
              <div className="bg-blue-50/50 border border-blue-100 p-3 sm:p-4 rounded-xl mt-3 shadow-sm">
                <h3 className="font-bold text-blue-900 mb-2 text-sm">업체 상세 정보</h3>
                <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-700">
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">업체/팀명:</span> <strong>{partner.name}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">담당자:</span> <strong>{partner.managerName || '매칭 후 공개'}</strong></p>
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">연락처:</span> <strong>안심번호 (매칭 후 안내)</strong></p>
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">직원수:</span> <strong>{partner.teamSize || '미정'}</strong></p>
                  <div className="pt-1.5">
                    <span className="text-slate-500 font-medium block mb-1">가능한 서비스:</span>
                    <div className="flex flex-wrap gap-1">
                      {partner.mainServices?.map(svc => (
                        <span key={svc} className="bg-white shadow-sm border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold text-[9px] sm:text-[10px]">{svc}</span>
                      ))}
                    </div>
                  </div>

                  {/* 이달의 행사 영역 */}
                  <div className="pt-3 mt-2 border-t border-blue-200/60">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-blue-600 text-sm">🎁</span>
                      <span className="text-blue-900 font-bold text-sm">이달의 행사</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm relative">
                      {partner.monthlyEvent ? (
                        <p className="text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-wrap">{partner.monthlyEvent}</p>
                      ) : (
                        <p className="text-slate-400 text-xs">현재 진행 중인 특별한 행사가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* 작업 전후 사진 (Before & After) 영역 */}
                  <div className="pt-4 mt-2 border-t border-blue-200/60">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-blue-600 text-sm">📸</span>
                      <span className="text-blue-900 font-bold text-sm">작업 전후 갤러리</span>
                    </div>
                    {partner.portfolio && partner.portfolio.length > 0 ? (
                      <div className="flex overflow-x-auto pb-2 gap-3 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {partner.portfolio.map((item, idx) => (
                          <div key={idx} className="shrink-0 w-48 snap-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="relative h-24 flex">
                               <div className="w-1/2 h-full relative border-r border-slate-100">
                                  <img src={item.before} className="w-full h-full object-cover filter brightness-90 grayscale-[20%]" alt="Before" />
                                  <span className="absolute top-1 left-1 bg-slate-800/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Before</span>
                               </div>
                               <div className="w-1/2 h-full relative">
                                  <img src={item.after} className="w-full h-full object-cover" alt="After" />
                                  <span className="absolute top-1 right-1 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">After</span>
                               </div>
                            </div>
                            <div className="p-2 text-center bg-slate-50">
                               <p className="text-slate-700 font-bold text-[10px] truncate">{item.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                        <p className="text-slate-400 text-xs">등록된 포트폴리오 사진이 없습니다.</p>
                      </div>
                    )}
                  </div>

                  {/* 고객 리뷰와 평점 영역 */}
                  <div className="pt-4 mt-2 border-t border-blue-200/60">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-600 text-sm">💬</span>
                        <span className="text-blue-900 font-bold text-sm">고객 생생 리뷰</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="text-amber-900 font-black text-xs">{partner.rating}</span>
                        <span className="text-amber-700/60 font-medium text-[10px]">({partner.reviews})</span>
                      </div>
                    </div>
                    
                    {partner.recentReviews && partner.recentReviews.length > 0 ? (
                      <div className="space-y-2">
                        {partner.recentReviews.map((review, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-slate-800 font-bold text-xs">{review.author} 고객님</span>
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex text-amber-400 text-[9px]">
                                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                                <span className="text-slate-400 text-[9px] font-medium">{review.date}</span>
                              </div>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                        <p className="text-slate-400 text-xs">아직 등록된 리뷰가 없습니다.</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
            {quoteData ? (
              <button 
                onClick={handleConfirmWithPartner}
                className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                예약 확정하기
              </button>
            ) : (
              <Link to="/quote/move-in" state={{ selectedPartnerId: partner.id, selectedPartnerName: partner.name }} className="flex-1 flex justify-center items-center py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all">
                지정 무료 견적 받기
              </Link>
            )}
            <button onClick={onClose} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// mockPartners는 '../data/mockPartnersData'에서 import
// 16개 지역 × ~10개 업체 = ~160개 자동 생성


export default function PartnerList() {
  const location = useLocation();
  const navigate = useNavigate();
  const quoteData = location.state?.quoteData || null;

  const [sortBy, setSortBy] = useState('추천순');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [realPartners, setRealPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 1024 ? 4 : 8);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, selectedRegion, itemsPerPage]);

  // 모달 오픈 시 뒤로가기 대응
  useEffect(() => {
    if (!selectedPartner) return;

    // 현재 상태가 이미 모달이 아니라면 히스토리 추가
    const currentState = window.history.state;
    if (!currentState || currentState.modal !== 'partner_detail') {
      window.history.pushState({ modal: 'partner_detail' }, '');
    }

    const handlePopState = (e) => {
      // 뒤로가기 발생 시 모달 닫기
      setSelectedPartner(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedPartner]);

  const handleCloseDetail = () => {
    if (window.history.state?.modal === 'partner_detail') {
      // 닫기 클릭 시 히스토리를 한 칸 뒤로 돌려 popstate를 유발함 (모달 닫힘)
      window.history.back();
    } else {
      setSelectedPartner(null);
    }
  };

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const q = query(collection(db, 'partners'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const rawName = data.companyName || data.name || '무명 파트너';
          const maskedName = rawName.length > 2 
            ? rawName.substring(0, 2) + '*'.repeat(Math.max(1, rawName.length - 3)) + rawName.slice(-1)
            : rawName[0] + '*';

          return {
            id: doc.id,
            tier: data.plan === 'premium' ? 'PREMIUM' : data.plan === 'exclusive' ? 'EXCLUSIVE' : 'BASIC',
            name: maskedName,
            rating: 5.0, // 초기값
            reviews: 0, // 초기값
            desc: data.desc || `안녕하세요. 책임감 있는 청소 약속드립니다.`,
            tags: data.tags && data.tags.length > 0 ? data.tags.map(t => t.startsWith('#') ? t : `#${t}`) : (data.mainServices ? data.mainServices.map(s => `#${s}`) : ['#신규등록']),
            image: data.image || '/images/living_room_cleaning.png',
            area: data.region || '전국',
            monthlyEvent: data.monthlyEvent || '', // 이달의 행사 필드 연동
            portfolio: data.portfolio || [], // 작업 전후 사진
            recentReviews: data.recentReviews || [], // 리뷰 리스트
            isReal: true,
            ...data
          };
        });
        setRealPartners(fetched);
      } catch (error) {
        console.error("Error fetching partners:", error);
      }
    };
    fetchPartners();
  }, []);

  const matchRegion = (partnerArea, selectedRegion) => {
    if (!selectedRegion) return true; // 선택된 지역이 없으면 모두 표시
    if (!partnerArea) return false;
    const area = partnerArea;
    if (area.includes('전국')) return true;

    const regionPrefix = selectedRegion.split(' ')[0]; // '서울', '경기', '인천' 등
    
    // 시/도 단위 '전지역' 매칭
    if (area.includes('전지역') && area.includes(regionPrefix)) return true;
    
    // 세부 지역 키워드 매칭 (괄호, 콤마, 슬래시, 공백 기준 분리)
    const keywords = selectedRegion.split(/[\s/(),]+/).filter(Boolean);
    const detailKeywords = keywords.length > 1 ? keywords.slice(1) : keywords;
    const hasDetailMatch = detailKeywords.some(k => area.includes(k));
    
    if (hasDetailMatch) return true;
    
    // 파트너 area가 포괄적인 경우 (예: "서울/경기 일부")
    if (area.includes(regionPrefix) && area.includes('일부')) return true;

    return false;
  };

  const filteredPartners = [...realPartners, ...mockPartners].filter(p => matchRegion(p.area, selectedRegion));

  const exclusivePartners = filteredPartners.filter(p => p.tier === 'EXCLUSIVE').slice(0, 2);
  const restPartners = filteredPartners.filter(p => p.tier !== 'EXCLUSIVE');

  let sortedPremium = [];
  let sortedBasic = [];
  let mixedPartners = [];

  if (sortBy === '추천순') {
    // 프리미엄 전체 표시 (제한 없음), 그 아래 일반 전체 표시
    sortedPremium = restPartners.filter(p => p.tier === 'PREMIUM');
    sortedBasic = restPartners.filter(p => p.tier === 'BASIC');
  } else if (sortBy === '평점순') {
    mixedPartners = [...restPartners].sort((a, b) => b.rating - a.rating);
  } else if (sortBy === '리뷰순') {
    mixedPartners = [...restPartners].sort((a, b) => b.reviews - a.reviews);
  }

  const totalPages = sortBy === '추천순' 
    ? Math.ceil(sortedBasic.length / itemsPerPage) 
    : Math.ceil(mixedPartners.length / itemsPerPage);

  const currentBasicPartners = sortedBasic.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentMixedPartners = mixedPartners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col">
      <Header onOpenQuote={() => {}} />
      <main className="pt-[80px] lg:pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-grow">
        
        {/* 상단 타이틀 및 정렬 */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div className="w-full lg:w-auto flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight text-left">
                    내동네 전문가 찾기
                  </h1>
                </div>
                
                <p className="text-slate-500 font-medium mt-2">
                  {selectedRegion ? (
                    <><span className="text-blue-900 font-bold">{selectedRegion}</span> 지역에 </>
                  ) : (
                    <><span className="text-blue-900 font-bold">전국</span>에 </>
                  )}
                  <span className="text-blue-900 font-bold">{filteredPartners.length}명</span>의 청소타워 인증 전문가가 대기중입니다.
                </p>
              </div>

              {/* 모바일 정렬 드롭다운 (우측 상단 메뉴바 방향으로 이동) */}
              <div className="relative z-40 lg:hidden shrink-0 mt-1">
                <button 
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-1 text-slate-600 font-bold text-[13px] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors border border-slate-200/50"
                >
                  <span>{sortBy}</span>
                  <svg className={`fill-current h-3 w-3 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-32 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {['추천순', '평점순', '리뷰순'].map(sortType => (
                      <button
                        key={sortType}
                        onClick={() => {
                          setSortBy(sortType);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === sortType ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 font-medium hover:bg-slate-50'}`}
                      >
                        {sortType}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0 relative">
              {/* 모바일: 두 버튼을 나란히 배치 */}
              <div className="flex w-full lg:w-auto gap-2">
                <button 
                  onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                  className="flex-1 lg:flex-none flex justify-center items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 font-bold px-2 lg:px-5 py-3 rounded-xl text-[13px] sm:text-sm shadow-sm transition-all overflow-hidden"
                >
                  <span className="flex-shrink-0">📍</span>
                  <span className="truncate">내동네 전문가 찾기</span>
                  <svg className={`flex-shrink-0 fill-current h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </button>

                <Link 
                  to="/quote/move-in"
                  className="flex-1 lg:flex-none flex justify-center items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 lg:px-6 py-3 rounded-xl text-[13px] sm:text-sm shadow-md hover:shadow-lg transition-all overflow-hidden"
                >
                  <span className="flex-shrink-0">✨</span>
                  <span className="truncate">추천업체 자동 배정</span>
                </Link>
              </div>

              {/* 지역 선택 드롭다운 메뉴 (PC/Mobile 공통) */}
              {isRegionDropdownOpen && (
                <div className="absolute top-full left-0 lg:right-0 mt-2 w-full lg:w-[480px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                  <button
                    onClick={() => { setSelectedRegion(''); setIsRegionDropdownOpen(false); }}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm
                      ${selectedRegion === '' 
                        ? 'bg-blue-600 text-white shadow-blue-200' 
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                      }`}
                  >
                    전국 전체보기
                  </button>
                  {[
                    '서울 강남/서초/송파/강동', 
                    '서울 마포/용산/성동/광진', 
                    '서울 강서/영등포/양천/구로', 
                    '서울 노원/도봉/강북/성북', 
                    '서울 은평/서대문/종로/중구', 
                    '경기 남부 (성남/용인/수원)', 
                    '경기 서남부 (안양/과천/군포)', 
                    '경기 서부 (부천/광명/시흥)', 
                    '경기 북부 (고양/파주/김포)', 
                    '경기 동부 (구리/남양주/하남)', 
                    '인천 전지역',
                    '대전/세종/충청권',
                    '대구/경북권',
                    '부산/울산/경남권',
                    '광주/전라권',
                    '강원/제주권'
                  ].map(region => (
                    <button
                      key={region}
                      onClick={() => { setSelectedRegion(region); setIsRegionDropdownOpen(false); }}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm
                        ${selectedRegion === region 
                          ? 'bg-white text-blue-600 ring-2 ring-blue-500 shadow-blue-100' 
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-white'
                        }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}

              {/* PC 정렬 버튼 (모바일에서는 숨김) */}
              <div className="hidden lg:flex items-center gap-2">
                {['추천순', '평점순', '리뷰순'].map(sortType => (
                  <button
                    key={sortType}
                    onClick={() => setSortBy(sortType)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm border
                      ${sortBy === sortType 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {sortType}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full space-y-12">
            
            {/* 2번 모델: 지역별 독점 파트너 (단독 배너 2개 분할) - 정렬과 무관하게 항상 최상단 고정 */}
            {exclusivePartners.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                {exclusivePartners.map((partner, index) => (
                  <div 
                    key={partner.id} 
                    onClick={() => setSelectedPartner(partner)}
                    className="relative rounded-xl lg:rounded-3xl overflow-hidden shadow-lg lg:shadow-2xl group cursor-pointer border border-blue-900 flex flex-col"
                  >
                    <div className="absolute inset-0 bg-slate-900 z-0"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-blue-800/80 z-5 pointer-events-none"></div>
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4 lg:p-8">
                      <img src={partner.image} alt={partner.name} className="w-full h-full object-contain opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
                    </div>
                    <div className="relative z-20 p-4 lg:p-8 flex flex-col h-full justify-between gap-3 lg:gap-6">
                      <div className="text-white w-full">
                        <div className="flex items-center gap-3 lg:gap-5 mb-2 lg:mb-4">
                          {partner.image && (
                            <div className="w-12 h-12 lg:w-20 lg:h-20 bg-white rounded-xl lg:rounded-2xl p-1.5 lg:p-2.5 shadow-xl shrink-0 flex items-center justify-center border border-white/20">
                              <img src={partner.image} alt={partner.name} className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1 lg:mb-2">
                              <span className="bg-amber-400 text-amber-950 text-[8px] lg:text-[10px] font-black px-1.5 py-0.5 lg:py-1 rounded-full uppercase tracking-wider shadow-sm">Premium Exclusive</span>
                              <span className="text-blue-200 text-[9px] lg:text-xs font-semibold">📍 {partner.area} 독점 추천</span>
                            </div>
                            <h2 className="text-lg lg:text-3xl font-extrabold tracking-tight group-hover:text-amber-300 transition-colors">{partner.name}</h2>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2 lg:mb-4">
                          <span className="text-amber-400 text-xs lg:text-base">★★★★★</span>
                          <span className="font-bold text-[10px] lg:text-sm">{partner.rating}</span>
                          <span className="text-blue-200 text-[9px] lg:text-xs">({partner.reviews})</span>
                        </div>
                        <p className="hidden lg:block text-blue-50 text-xs lg:text-base opacity-90 leading-relaxed mb-4 lg:mb-6 line-clamp-2">
                          {partner.desc}
                        </p>
                        <div className="hidden lg:flex flex-wrap gap-1.5 lg:gap-2">
                          {partner.tags.map(tag => (
                            <span key={tag} className="bg-white/20 backdrop-blur-sm px-2 py-1 lg:px-2.5 rounded-lg text-[10px] lg:text-xs font-bold shadow-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-lg lg:rounded-2xl p-3 lg:p-5 flex flex-col justify-between border border-white/20 w-full shadow-xl mt-auto gap-2.5 lg:gap-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-amber-200 text-[11px] lg:text-sm font-bold">✨ 우리업체의 장점</div>
                          <div className="text-xs lg:text-sm font-bold text-white tracking-tight text-right truncate pl-2">
                            {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }}
                          className="w-full bg-white text-blue-900 font-extrabold text-[12px] lg:text-base py-2.5 lg:py-3.5 rounded-md lg:rounded-xl hover:bg-amber-400 hover:text-amber-950 transition-all shadow-lg text-center flex items-center justify-center gap-1 group/btn"
                        >
                          <span>업체 상세 보기</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 lg:h-4 lg:w-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-0 right-3 lg:right-6 bg-amber-400 text-amber-950 px-2 lg:px-3 py-1 lg:py-1.5 rounded-b-md lg:rounded-b-xl font-black text-[9px] lg:text-xs shadow-md z-30">
                      추천 {index + 1}위 🏆
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 추천순(기본값) 일 때: 프리미엄과 일반을 분리해서 보여줌 */}
            {sortBy === '추천순' ? (
              <>
                {/* 1번 모델: 프리미엄 파트너 리스트 */}
                <div className="bg-white border border-slate-200 rounded-2xl lg:rounded-3xl p-4 md:p-8 shadow-sm relative">
                  <div className="flex items-center justify-between mb-4 lg:mb-6 border-b border-slate-100 pb-3 lg:pb-4">
                    <h2 className="font-bold text-slate-800 text-lg lg:text-xl flex items-center gap-2">
                      <span className="text-blue-600">👍</span> 프리미엄 파트너
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                    {sortedPremium.map(partner => (
                      <div 
                        key={partner.id} 
                        onClick={() => setSelectedPartner(partner)}
                        className="bg-gradient-to-b from-blue-50 to-white rounded-lg lg:rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 transition-all flex flex-col group overflow-hidden relative cursor-pointer h-full"
                      >
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[7px] lg:text-[10px] font-bold py-0.5 px-1.5 lg:py-1 lg:px-3 rounded-br-md lg:rounded-br-lg z-10 shadow-md">
                          ⭐ PREMIUM
                        </div>
                        <div className="w-full h-36 lg:h-56 shrink-0 relative overflow-hidden bg-white border-b border-blue-100 p-4 flex items-center justify-center">
                          <img src={partner.image} alt={partner.name} className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-2 lg:p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h2 className="text-xs lg:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-0.5">
                              {partner.name}
                            </h2>
                            <div className="text-amber-600 font-bold flex items-center gap-0.5 lg:gap-1 text-[8px] lg:text-[11px] mb-1 lg:mb-2">
                              <span className="text-amber-500">★</span>
                              {partner.rating} ({partner.reviews})
                            </div>
                            <p className="text-slate-400 text-[8px] lg:text-[10px] mb-1.5 lg:mb-2 font-medium line-clamp-1">{partner.area}</p>
                            <p className="hidden lg:block text-slate-600 text-xs line-clamp-2 mb-3 h-8">
                              {partner.desc}
                            </p>
                            <div className="hidden lg:flex flex-wrap gap-1 mb-2 lg:mb-3 h-8 lg:h-12 overflow-hidden content-start">
                              {partner.tags.map(tag => (
                                <span key={tag} className="bg-blue-50 border border-blue-200 text-blue-600 px-1 lg:px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 lg:pt-3 border-t border-blue-100 mt-auto">
                            <div className="font-bold text-[9px] lg:text-xs text-blue-700 truncate pr-2">
                              <span className="text-blue-500 mr-1">💎</span>
                              <span className="hidden lg:inline text-blue-500 mr-1 font-semibold">우리업체의 장점:</span>
                              {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }} className="text-blue-700 font-bold text-[8px] lg:text-xs hover:underline flex items-center shrink-0">
                              상세 보기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 일반 파트너 섹션 */}
                <div className="px-1 lg:px-0">
                  <div className="flex items-center justify-between mb-3 lg:mb-4 px-1 lg:px-2">
                    <h2 className="font-bold text-slate-700 text-base lg:text-lg">일반 파트너</h2>
                    <span className="text-slate-400 text-xs lg:text-sm font-medium">총 {sortedBasic.length}건</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                    {currentBasicPartners.map(partner => (
                      <div 
                        key={partner.id} 
                        onClick={() => setSelectedPartner(partner)}
                        className="bg-white rounded-lg lg:rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden cursor-pointer h-full"
                      >
                        <div className="w-full h-36 lg:h-56 shrink-0 relative overflow-hidden bg-white border-b border-slate-100 p-4 flex items-center justify-center">
                          <img 
                            src={partner.image} 
                            alt={partner.name} 
                            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" 
                          />
                        </div>
                        <div className="p-2 lg:p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h2 className="text-xs lg:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-0.5">
                              {partner.name}
                            </h2>
                            <div className="text-amber-600 font-bold flex items-center gap-0.5 lg:gap-1 text-[8px] lg:text-[11px] mb-1 lg:mb-2">
                              <span className="text-amber-500">★</span>
                              {partner.rating} ({partner.reviews})
                            </div>
                            <p className="text-slate-400 text-[8px] lg:text-[10px] mb-1.5 lg:mb-2 font-medium line-clamp-1">{partner.area}</p>
                            <div className="hidden lg:flex flex-wrap gap-1 mb-2 lg:mb-3 h-8 lg:h-12 overflow-hidden content-start">
                              {partner.tags.map(tag => (
                                <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-500 px-1 lg:px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-semibold group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 lg:pt-3 border-t border-slate-100 mt-auto">
                            <div className="font-bold text-[9px] lg:text-xs text-slate-700 truncate pr-2">
                              <span className="text-amber-500 mr-1">✨</span>
                              <span className="hidden lg:inline text-slate-500 mr-1 font-semibold">우리업체의 장점:</span>
                              {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }} className="text-blue-600 font-bold text-[8px] lg:text-xs hover:underline flex items-center shrink-0">
                              상세 보기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl lg:rounded-3xl p-4 md:p-8 shadow-sm relative">
                {/* 평점순/리뷰순 일 때: 프리미엄과 일반 구분 없이 하나로 섞어서 리스트업 */}
                <div className="flex items-center justify-between mb-4 lg:mb-6 border-b border-slate-100 pb-3 lg:pb-4">
                  <h2 className="font-bold text-slate-800 text-lg lg:text-xl flex items-center gap-2">
                    <span className="text-blue-600">📋</span> 전체 파트너 ({sortBy})
                  </h2>
                  <span className="text-slate-400 text-xs lg:text-sm font-medium">총 {mixedPartners.length}건</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                  {currentMixedPartners.map(partner => (
                    <div 
                      key={partner.id} 
                      onClick={() => setSelectedPartner(partner)}
                      className={`bg-white rounded-lg lg:rounded-2xl border ${partner.tier === 'PREMIUM' ? 'bg-slate-50 border-slate-200' : 'border-slate-200'} hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden cursor-pointer h-full`}
                    >
                      {partner.tier === 'PREMIUM' && (
                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[7px] lg:text-[10px] font-bold py-0.5 px-1.5 lg:py-1 lg:px-3 rounded-br-md lg:rounded-br-lg z-10 shadow-sm">
                          PREMIUM
                        </div>
                      )}
                      <div className="w-full h-32 lg:h-48 shrink-0 relative overflow-hidden bg-white border-b border-slate-100 p-4 flex items-center justify-center">
                        <img src={partner.image} alt={partner.name} className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-2 lg:p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h2 className="text-xs lg:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-0.5">
                            {partner.name}
                          </h2>
                          <div className="text-amber-600 font-bold flex items-center gap-0.5 lg:gap-1 text-[8px] lg:text-[11px] mb-1 lg:mb-2">
                            <span className="text-amber-500">★</span>
                            {partner.rating} ({partner.reviews})
                          </div>
                          <p className="text-slate-400 text-[8px] lg:text-[10px] mb-1.5 lg:mb-2 font-medium line-clamp-1">{partner.area}</p>
                          <div className="hidden lg:flex flex-wrap gap-1 mb-2 lg:mb-3 h-8 lg:h-12 overflow-hidden content-start">
                            {partner.tags.map(tag => (
                              <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-500 px-1 lg:px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-semibold group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 lg:pt-3 border-t border-slate-100 mt-auto">
                          <div className="font-bold text-[9px] lg:text-xs text-slate-700 truncate pr-2">
                            <span className="text-amber-500 mr-1">✨</span>
                            <span className="hidden lg:inline text-slate-500 mr-1 font-semibold">우리업체의 장점:</span>
                            {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }} className="text-blue-600 font-bold text-[8px] lg:text-xs hover:underline flex items-center shrink-0">
                            상세 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="py-8 flex justify-center items-center gap-2 mt-4">
                <button 
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &lt;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <PartnerDetailModal partner={selectedPartner} onClose={handleCloseDetail} quoteData={quoteData} />
    </div>
  );
}
