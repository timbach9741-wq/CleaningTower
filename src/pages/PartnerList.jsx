import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { mockPartners } from '../data/mockPartnersData';
import { REGION_DATA } from '../data/regions';

import RegionSelector from '../components/common/RegionSelector';

const DEFAULT_IMAGES = [
  '/images/living_room_cleaning.webp',
  '/images/cleaner_in_action.webp',
  '/images/cleaning_couple_team.webp',
  '/images/premium_cleaning_setup.webp',
  '/images/sparkling_living_room.webp'
];

const getDeterministicDefaultImage = (docId) => {
  if (!docId) return DEFAULT_IMAGES[0];
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  return DEFAULT_IMAGES[sum % DEFAULT_IMAGES.length];
};

// 고객용 읽기 전용 달력 컴포넌트
const PartnerCalendar = ({ unavailableDates }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const dayCells = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-9 w-full"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isAvailable = !unavailableDates?.includes(dateStr);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    dayCells.push(
      <div
        key={`day-${day}`}
        className={`h-9 w-full rounded-lg flex flex-col items-center justify-center relative text-xs font-bold transition-all
          ${isAvailable 
            ? 'bg-blue-500 text-white shadow-sm' 
            : 'bg-rose-50 text-rose-600 border border-rose-100'
          }
        `}
      >
        <span>{day}</span>
        {isToday && (
          <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-white' : 'bg-rose-500'}`}></span>
        )}
        {isAvailable ? (
          <span className="text-[7px] font-black opacity-90 block mt-0.5 leading-none">가능</span>
        ) : (
          <span className="text-[7px] font-extrabold opacity-80 block mt-0.5 leading-none text-rose-500">마감</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <button type="button" onClick={handlePrevMonth} className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded">&lt; 이전달</button>
        <span className="font-bold text-xs text-slate-800">{year}년 {month + 1}월</span>
        <button type="button" onClick={handleNextMonth} className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded">다음달 &gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
        <div className="text-rose-500">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-blue-500">토</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayCells}
      </div>
    </div>
  );
};

const PartnerDetailModal = ({ partner, onClose, quoteData }) => {
  const navigate = useNavigate();
  const [showServiceSelection, setShowServiceSelection] = useState(false);

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

  const handleSelectService = (type) => {
    navigate(`/quote/${type}`, { 
      state: { 
        selectedPartnerId: partner.id, 
        selectedPartnerName: partner.name 
      } 
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-3 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 pr-2">{partner.name}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0 mt-0.5">✕</button>
          </div>

          {!showServiceSelection ? (
            <>
              <div className="h-56 sm:h-80 w-full rounded-xl overflow-hidden mb-4 bg-slate-50 border border-slate-100 p-4 flex items-center justify-center">
                <img 
                  src={partner.image} 
                  alt={partner.name} 
                  className="max-w-full max-h-full object-contain drop-shadow-md" 
                  loading="lazy"
                  decoding="async"
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

                {/* 모든 파트너에게 상세 정보를 표시 (mock/real 구분 없이) */}
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

                      {/* 실시간 청소 가능일 달력 */}
                      <div className="pt-3 mt-2 border-t border-blue-200/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-blue-600 text-sm">📅</span>
                          <span className="text-blue-900 font-bold text-sm">실시간 청소 가능일</span>
                        </div>
                        <PartnerCalendar unavailableDates={partner.unavailableDates} />
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
                          <div className="grid grid-cols-2 gap-2">
                            {partner.portfolio.slice(0, 4).map((item, idx) => {
                              const isLegacy = typeof item === 'string';
                              const isMock = typeof item === 'object' && item !== null && (item.before || item.after);
                              
                              if (isMock) {
                                return (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    {/* Before/After 이미지 영역 */}
                                    <div className="flex h-24">
                                       <div className="w-1/2 h-full relative border-r border-slate-200">
                                          <img src={item.before} className="w-full h-full object-cover brightness-90" alt="Before" loading="lazy" />
                                          <span className="absolute top-1 left-1 bg-slate-800/80 text-white text-[8px] font-bold px-1 py-0.5 rounded">Before</span>
                                       </div>
                                       <div className="w-1/2 h-full relative">
                                          <img src={item.after} className="w-full h-full object-cover" alt="After" loading="lazy" />
                                          <span className="absolute top-1 right-1 bg-blue-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">After</span>
                                       </div>
                                    </div>
                                    {/* 제목 영역 */}
                                    <div className="px-1.5 py-1 text-center bg-slate-50 border-t border-slate-100">
                                       <p className="text-slate-700 font-bold text-[10px] truncate">{item.title || '작업 사례'}</p>
                                    </div>
                                  </div>
                                );
                              } else if (isLegacy) {
                                return (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="h-24 w-full relative">
                                      <img src={item} className="w-full h-full object-cover" alt="작업 사진" loading="lazy" />
                                    </div>
                                    <div className="px-1.5 py-1 text-center bg-slate-50 border-t border-slate-100">
                                      <p className="text-slate-700 font-bold text-[10px] truncate">작업 사진</p>
                                    </div>
                                  </div>
                                );
                              } else {
                                // 신규 작업 현장 구조 (title, date, images)
                                return (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                                    <div className="h-24 w-full relative bg-slate-50 flex items-center overflow-x-auto snap-x flex-row scrollbar-none">
                                      {item.images && item.images.map((img, i) => (
                                        <img key={i} src={img} className="w-full h-full object-cover snap-start shrink-0" alt={`작업 ${i+1}`} loading="lazy" />
                                      ))}
                                      {item.images && item.images.length > 1 && (
                                        <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full pointer-events-none">
                                          {item.images.length}장 ◀▶
                                        </span>
                                      )}
                                    </div>
                                    <div className="px-1.5 py-1 bg-slate-50 border-t border-slate-100 flex flex-col gap-0.5">
                                       <p className="text-slate-800 font-bold text-[9px] sm:text-[10px] truncate leading-tight">{item.title}</p>
                                       {item.date && <p className="text-slate-400 text-[8px] font-semibold leading-none">{item.date} 작업</p>}
                                    </div>
                                  </div>
                                );
                              }
                            })}
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
                  <button 
                    onClick={() => setShowServiceSelection(true)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
                  >
                    지정 무료 견적 받기
                  </button>
                )}
                <button onClick={onClose} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all">
                  닫기
                </button>
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="text-center mb-6">
                <p className="text-blue-600 font-bold text-sm mb-1">서비스 선택</p>
                <h3 className="text-xl font-black text-slate-900">어떤 청소가 필요하신가요?</h3>
                <p className="text-slate-500 text-xs mt-2">유형에 따라 정확한 견적 산출이 가능합니다.</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handleSelectService('move-in')}
                  className="w-full p-5 rounded-2xl border-2 border-blue-100 bg-white hover:border-blue-500 hover:shadow-md transition-all text-left flex items-center justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
                  <div className="flex-1 pl-2 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-bold text-slate-900 text-[16px] group-hover:text-blue-700 transition-colors">이사청소 / 입주청소</p>
                      <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">평당 1.5만</span>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed">이사 나가고 빈집 상태에서 진행하는 기본 청소</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                    🏠
                  </div>
                </button>

                <button 
                  onClick={() => handleSelectService('residence')}
                  className="w-full p-5 rounded-2xl border-2 border-emerald-100 bg-white hover:border-emerald-500 hover:shadow-md transition-all text-left flex items-center justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400"></div>
                  <div className="flex-1 pl-2 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-bold text-slate-900 text-[16px] group-hover:text-emerald-700 transition-colors">거주청소</p>
                      <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">평당 1.8만</span>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed">현재 짐이 있는 상태에서 진행하는 거주 중 청소</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm">
                    🛋️
                  </div>
                </button>

                <button 
                  onClick={() => handleSelectService('premium')}
                  className="w-full p-5 rounded-2xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-white hover:border-purple-400 hover:shadow-md transition-all text-left flex items-center justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                  <div className="flex-1 pl-2 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-bold text-slate-900 text-[16px] group-hover:text-purple-700 transition-colors">프리미엄 청소</p>
                      <span className="text-[11px] font-extrabold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">평당 2.0만</span>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed">인테리어 공사 완료 후 미세 분진 제거 특화 청소</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform border border-purple-100">
                    ✨
                  </div>
                </button>
              </div>

              <div className="mt-8 flex gap-2">
                <button 
                  onClick={() => setShowServiceSelection(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all"
                >
                  이전으로
                </button>
              </div>
            </div>
          )}
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
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [realPartners, setRealPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [premiumPage, setPremiumPage] = useState(1);
  const [basicPage, setBasicPage] = useState(1);
  const [mixedPage, setMixedPage] = useState(1);
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
    setPremiumPage(1);
    setBasicPage(1);
    setMixedPage(1);
  }, [sortBy, selectedRegions, itemsPerPage]);

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
        const q = query(collection(db, 'partners'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const isBusiness = !!data.companyName;
          const rawName = data.companyName || data.name || '무명 파트너';
          let maskedName = '';
          
          // 개인 이름 및 상호명 모두 마스킹 없이 100% 그대로 다 노출
          maskedName = rawName;

          return {
            ...data,
            id: doc.id,
            tier: data.plan === 'premium' ? 'PREMIUM' : data.plan === 'exclusive' ? 'EXCLUSIVE' : 'BASIC',
            name: maskedName,
            rating: 5.0, // 초기값
            reviews: 0, // 초기값
            desc: data.desc || `안녕하세요. 책임감 있는 청소 약속드립니다.`,
            tags: data.tags && data.tags.length > 0 ? data.tags.map(t => t.startsWith('#') ? t : `#${t}`) : (data.mainServices ? data.mainServices.map(s => `#${s}`) : ['#신규등록']),
            image: (!data.image || data.image === '/images/living_room_cleaning.webp' || data.image === '/images/cleaner_in_action.webp')
              ? getDeterministicDefaultImage(doc.id)
              : data.image,
            area: data.region || '전국',
            monthlyEvent: data.monthlyEvent || '', // 이달의 행사 필드 연동
            portfolio: data.portfolio || [], // 작업 전후 사진
            recentReviews: data.recentReviews || [], // 리뷰 리스트
            isReal: true
          };
        }).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setRealPartners(fetched);
      } catch (error) {
        console.error("Error fetching partners:", error);
      }
    };
    fetchPartners();
  }, []);

  const matchRegion = (partnerArea, selectedRegions) => {
    if (!selectedRegions || selectedRegions.length === 0) return true;
    if (!partnerArea) return false;
    
    const area = partnerArea;
    if (area.includes('전국')) return true;

    return selectedRegions.some(region => {
      // 1. 완전 일치 검사
      if (area.includes(region)) return true;

      // region 파싱: "시도 시군구" (예: "인천 계양구")
      const parts = region.split(' ');
      if (parts.length >= 1) {
        const sido = parts[0]; // "인천", "부산", "경기" 등
        
        // 2. "전지역" 패턴 검사 (예: area가 "인천 전지역"이고 sido가 "인천"인 경우)
        if (area.includes(`${sido} 전지역`) || area.includes(`${sido} 전체`)) {
          return true;
        }

        // 3. 서울/경기가 아닌 지방 광역시/도의 경우, 광역 범위 내 매칭 허용
        const isSeoulOrGyeonggi = (sido === '서울' || sido === '경기');
        if (!isSeoulOrGyeonggi && area.includes(sido)) {
          return true;
        }
      }
      
      return false;
    });
  };

  const {
    filteredPartners,
    exclusivePartners,
    sortedPremium,
    sortedBasic,
    mixedPartners,
    currentPremiumPartners,
    currentBasicPartners,
    currentMixedPartners,
    totalPremiumPages,
    totalBasicPages,
    totalMixedPages
  } = React.useMemo(() => {
    const filtered = [...realPartners, ...mockPartners].filter(p => matchRegion(p.area, selectedRegions));
    const exclusive = filtered.filter(p => p.tier === 'EXCLUSIVE').slice(0, 2);
    const rest = filtered.filter(p => p.tier !== 'EXCLUSIVE');

    let premium = [];
    let basic = [];
    let mixed = [];

    if (sortBy === '추천순') {
      premium = rest.filter(p => p.tier === 'PREMIUM');
      basic = rest.filter(p => p.tier === 'BASIC');
    } else if (sortBy === '평점순') {
      mixed = [...rest].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === '리뷰순') {
      mixed = [...rest].sort((a, b) => b.reviews - a.reviews);
    }

    const tPremiumPages = Math.ceil(premium.length / itemsPerPage);
    const tBasicPages = Math.ceil(basic.length / itemsPerPage);
    const tMixedPages = Math.ceil(mixed.length / itemsPerPage);

    const cPremium = premium.slice((premiumPage - 1) * itemsPerPage, premiumPage * itemsPerPage);
    const cBasic = basic.slice((basicPage - 1) * itemsPerPage, basicPage * itemsPerPage);
    const cMixed = mixed.slice((mixedPage - 1) * itemsPerPage, mixedPage * itemsPerPage);

    return {
      filteredPartners: filtered,
      exclusivePartners: exclusive,
      sortedPremium: premium,
      sortedBasic: basic,
      mixedPartners: mixed,
      currentPremiumPartners: cPremium,
      currentBasicPartners: cBasic,
      currentMixedPartners: cMixed,
      totalPremiumPages: tPremiumPages,
      totalBasicPages: tBasicPages,
      totalMixedPages: tMixedPages
    };
  }, [realPartners, selectedRegions, sortBy, itemsPerPage, premiumPage, basicPage, mixedPage]);

  // 페이지네이션 번호 계산 로직 (모바일 대응을 위해 현재 페이지 주변만 표시)
  const getPageNumbers = (currentPage, totalPages) => {
    const pageNumbers = [];
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const renderPagination = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null;
    
    const handlePageChange = (newPage) => {
      setPage(newPage);
      // 부드러운 스크롤 로직 제거 (해당 위치에서 페이지 갱신)
    };

    return (
      <div className="py-4 flex justify-center items-center gap-2 mt-4">
        <button 
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          &lt;
        </button>
        {getPageNumbers(currentPage, totalPages).map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber)}
            className={`w-8 h-8 flex items-center justify-center rounded-full font-bold transition-colors text-sm ${currentPage === pageNumber ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {pageNumber}
          </button>
        ))}
        <button 
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          &gt;
        </button>
      </div>
    );
  };


  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col overflow-x-hidden">
      <Header onOpenQuote={() => {}} />
      <main className="pt-[80px] lg:pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-grow overflow-x-hidden">
        
        {/* 상단 타이틀 및 정렬 */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div className="w-full lg:w-auto flex justify-between items-center lg:items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-900 tracking-tight text-left break-words">
                    내동네 전문가 찾기
                  </h1>
                </div>
                
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                  {selectedRegions.length > 0 ? (
                    <><span className="text-blue-900 font-bold">{selectedRegions.length}개</span> 지역에 </>
                  ) : (
                    <><span className="text-blue-900 font-bold">전국</span>에 </>
                  )}
                  <span className="text-blue-900 font-bold">{filteredPartners.length}명</span>의 전문가가 대기중입니다.
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
                  <span className="truncate">
                    {selectedRegions.length === 0 
                      ? '내동네 전문가 찾기' 
                      : selectedRegions.length === 1 
                        ? selectedRegions[0] 
                        : `${selectedRegions[0].split(' ')[1]} 외 ${selectedRegions.length - 1}곳`}
                  </span>
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
                <div className="absolute top-full left-0 right-0 lg:left-auto lg:right-0 mt-2 lg:w-[480px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 lg:p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800">지역 선택 (다중 선택 가능)</h3>
                    <button
                      onClick={() => { setSelectedRegions([]); setIsRegionDropdownOpen(false); }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold"
                    >
                      전국 전체보기 (초기화)
                    </button>
                  </div>
                  <RegionSelector 
                    selectedRegions={selectedRegions} 
                    onChange={setSelectedRegions} 
                  />
                  <button
                    onClick={() => setIsRegionDropdownOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-2"
                  >
                    {selectedRegions.length > 0 ? `${selectedRegions.length}개 지역 적용하기` : '적용하기'}
                  </button>
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
                      <img src={partner.image} alt={partner.name} className="w-full h-full object-contain opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" loading="lazy" decoding="async" />
                    </div>
                    <div className="relative z-20 p-4 lg:p-8 flex flex-col h-full justify-between gap-3 lg:gap-6">
                      <div className="text-white w-full">
                        <div className="flex items-center gap-3 lg:gap-5 mb-2 lg:mb-4">
                          {partner.image && (
                            <div className="w-12 h-12 lg:w-20 lg:h-20 bg-white rounded-xl lg:rounded-2xl p-1.5 lg:p-2.5 shadow-xl shrink-0 flex items-center justify-center border border-white/20">
                              <img src={partner.image} alt={partner.name} className="w-full h-full object-contain" loading="lazy" decoding="async" />
                            </div>
                          )}
                          <div>
                            <div className="flex flex-col items-start gap-1 lg:gap-1.5 mb-1.5 lg:mb-2">
                              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[8px] lg:text-[10px] font-black px-2 py-0.5 lg:py-1 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap ring-1 ring-amber-300/50">Premium Exclusive</span>
                              <span className="text-blue-200 text-[9px] lg:text-xs font-semibold break-keep leading-normal">📍 {partner.area} 독점 추천</span>
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
                    <span className="text-slate-400 text-xs lg:text-sm font-medium">총 {sortedPremium.length}건</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {currentPremiumPartners.map(partner => (
                      <div 
                        key={partner.id} 
                        onClick={() => setSelectedPartner(partner)}
                        className="bg-gradient-to-b from-blue-50 to-white rounded-lg lg:rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 transition-all flex flex-col group overflow-hidden relative cursor-pointer h-full"
                      >
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[7px] lg:text-[10px] font-bold py-0.5 px-1.5 lg:py-1 lg:px-3 rounded-br-md lg:rounded-br-lg z-10 shadow-md">
                          ⭐ PREMIUM
                        </div>
                        <div className="w-full h-36 lg:h-56 shrink-0 relative overflow-hidden bg-white border-b border-blue-100 p-4 flex items-center justify-center">
                          <img src={partner.image} alt={partner.name} className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                        </div>
                        <div className="p-2 lg:p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h2 className="text-xs lg:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-0.5">
                              {partner.name}
                            </h2>
                            <div className="text-amber-600 font-bold flex items-center gap-0.5 lg:gap-1 text-[10px] sm:text-[11px] mb-1 lg:mb-2">
                              <span className="text-amber-500">★</span>
                              {partner.rating} ({partner.reviews})
                            </div>
                            <p className="text-slate-400 text-[10px] lg:text-[10px] mb-1.5 lg:mb-2 font-medium line-clamp-1">{partner.area}</p>
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
                            <div className="font-bold text-[10px] lg:text-xs text-blue-700 truncate pr-2">
                              <span className="text-blue-500 mr-1">💎</span>
                              <span className="hidden lg:inline text-blue-500 mr-1 font-semibold">우리업체의 장점:</span>
                              {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }} className="text-blue-700 font-bold text-[10px] lg:text-xs hover:underline flex items-center shrink-0 min-h-[44px] min-w-[44px] justify-center">
                              상세 보기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderPagination(premiumPage, totalPremiumPages, setPremiumPage)}
                </div>

                {/* 일반 파트너 섹션 */}
                <div className="px-1 lg:px-0 mt-8">
                  <div className="flex items-center justify-between mb-3 lg:mb-4 px-1 lg:px-2">
                    <h2 className="font-bold text-slate-700 text-base lg:text-lg">일반 파트너</h2>
                    <span className="text-slate-400 text-xs lg:text-sm font-medium">총 {sortedBasic.length}건</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="p-2 lg:p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h2 className="text-xs lg:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-0.5">
                              {partner.name}
                            </h2>
                            <div className="text-amber-600 font-bold flex items-center gap-0.5 lg:gap-1 text-[10px] sm:text-[11px] mb-1 lg:mb-2">
                              <span className="text-amber-500">★</span>
                              {partner.rating} ({partner.reviews})
                            </div>
                            <p className="text-slate-400 text-[10px] lg:text-[10px] mb-1.5 lg:mb-2 font-medium line-clamp-1">{partner.area}</p>
                            <div className="hidden lg:flex flex-wrap gap-1 mb-2 lg:mb-3 h-8 lg:h-12 overflow-hidden content-start">
                              {partner.tags.map(tag => (
                                <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-500 px-1 lg:px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-semibold group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 lg:pt-3 border-t border-slate-100 mt-auto">
                            <div className="font-bold text-[10px] lg:text-xs text-slate-700 truncate pr-2">
                              <span className="text-amber-500 mr-1">✨</span>
                              <span className="hidden lg:inline text-slate-500 mr-1 font-semibold">우리업체의 장점:</span>
                              {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }} className="text-blue-600 font-bold text-[10px] lg:text-xs hover:underline flex items-center shrink-0 min-h-[44px] min-w-[44px] justify-center">
                              상세 보기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderPagination(basicPage, totalBasicPages, setBasicPage)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
                        <img src={partner.image} alt={partner.name} className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      </div>
                      <div className="p-2 lg:p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h2 className="text-xs lg:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors mb-0.5">
                            {partner.name}
                          </h2>
                          <div className="text-amber-600 font-bold flex items-center gap-0.5 lg:gap-1 text-[10px] sm:text-[11px] mb-1 lg:mb-2">
                            <span className="text-amber-500">★</span>
                            {partner.rating} ({partner.reviews})
                          </div>
                          <p className="text-slate-400 text-[10px] lg:text-[10px] mb-1.5 lg:mb-2 font-medium line-clamp-1">{partner.area}</p>
                          <div className="hidden lg:flex flex-wrap gap-1 mb-2 lg:mb-3 h-8 lg:h-12 overflow-hidden content-start">
                            {partner.tags.map(tag => (
                              <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-500 px-1 lg:px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-semibold group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 lg:pt-3 border-t border-slate-100 mt-auto">
                          <div className="font-bold text-[10px] lg:text-xs text-slate-700 truncate pr-2">
                            <span className="text-amber-500 mr-1">✨</span>
                            <span className="hidden lg:inline text-slate-500 mr-1 font-semibold">우리업체의 장점:</span>
                            {partner.tags.map(t => t.replace('#', '')).join(' · ')}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPartner(partner); }} className="text-blue-600 font-bold text-[10px] lg:text-xs hover:underline flex items-center shrink-0 min-h-[44px] min-w-[44px] justify-center">
                            상세 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(mixedPage, totalMixedPages, setMixedPage)}
              </div>
            )}

            {/* 개별 섹션별 페이지네이션을 적용하여 공통 페이지네이션 삭제 */}
          </div>
        </div>
      </main>

      <PartnerDetailModal partner={selectedPartner} onClose={handleCloseDetail} quoteData={quoteData} />
    </div>
  );
}
