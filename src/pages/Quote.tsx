import React, { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DaumPostcode from 'react-daum-postcode';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const optionCategories = [
  {
    category: '맞춤 청소',
    type: 'toggle',
    items: [
      { id: 'phytoncide', label: '피톤치드 연무소독 (평당)', price: 1000 },
      { id: 'veranda', label: '거실 비확장형 베란다 청소', price: 40000 },
    ]
  },
  {
    category: '가전 내부 청소(나사 분해청소 아님)',
    type: 'stepper',
    items: [
      { id: 'refrigerator', label: '냉장고', price: 30000 },
      { id: 'washer', label: '세탁기', price: 30000 },
      { id: 'ac', label: '에어컨', price: 30000 },
      { id: 'dishwasher', label: '식기세척기', price: 30000 },
      { id: 'oven', label: '오븐', price: 30000 },
    ]
  },
  {
    category: '특수 오염 제거(벽지는 서비스 불가)',
    type: 'stepper',
    items: [
      { id: 'mold', label: '곰팡이 제거 (공간당)', price: 40000 },
      { id: 'sticker', label: '스티커 제거 (공간당)', price: 40000 },
      { id: 'insulation', label: '단열재 제거 (공간당)', price: 40000 },
      { id: 'nicotine', label: '니코틴 제거 (공간당)', price: 40000 },
    ]
  }
];

const optionsList = optionCategories.flatMap(cat => cat.items);

interface PartnerData {
  id?: string;
  status?: string;
  plan?: string;
  region?: string;
  area?: string;
  companyName?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * 입주청소 사업자용 홈페이지 - 모바일 퍼스트 설계 (Funnel 버전)
 * 
 * 긴 스크롤 폼 대신 한 화면에 하나의 컨텍스트만 묻는 스텝(Funnel) 방식으로 변경.
 * 전환율(Conversion Rate)을 높이기 위해 사용자 피로도를 낮추고 직관적으로 설계함.
 */
export default function Quote() {
  const navigate = useNavigate();
  const { type } = useParams();
  const location = useLocation();
  
  // 파트너 정보 상태 (우회 시 변경 가능하도록 state로 관리)
  const [partnerId, setPartnerId] = useState<string | null>(() => location.state?.selectedPartnerId || null);
  const [partnerName, setPartnerName] = useState<string | null>(() => location.state?.selectedPartnerName || null);
  const [partnerAvailableDates, setPartnerAvailableDates] = useState<string[]>([]);
  const [isInterceptOpen, setIsInterceptOpen] = useState(false);

  // 파트너 가능일 데이터 조회
  useEffect(() => {
    if (!partnerId) {
      setPartnerAvailableDates([]);
      return;
    }
    const fetchPartnerDates = async () => {
      try {
        const partnerDocRef = doc(db, 'partners', partnerId);
        const partnerSnap = await getDoc(partnerDocRef);
        if (partnerSnap.exists()) {
          const data = partnerSnap.data();
          setPartnerAvailableDates(data.availableDates || []);
          console.log(`[Quote] Loaded partner available dates:`, data.availableDates);
        } else {
          console.warn(`[Quote] Partner document not found for ID: ${partnerId}`);
        }
      } catch (err) {
        console.error('[Quote] Failed to fetch partner available dates:', err);
      }
    };
    fetchPartnerDates();
  }, [partnerId]);

  // 스텝 상태 (1: 주거/면적, 2: 일정/주소, 3: 연락처/메모, 4: 결과)
  const [step, setStep] = useState(1);

  // 입력 상태
  const [houseType, setHouseType] = useState('아파트');
  const [houseSubType, setHouseSubType] = useState('');
  const [cleaningType, setCleaningType] = useState<'프리미엄' | '이사' | '거주'>(() => {
    if (type === 'general' || type === '이사' || type === 'move-in') return '이사';
    if (type === 'residence' || type === '거주') return '거주';
    return '프리미엄';
  });
  const [size, setSize] = useState<number | ''>(24);
  
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [floorType, setFloorType] = useState('장판');
  const [waterCleaning, setWaterCleaning] = useState('가능');
  const [parking, setParking] = useState('가능');
  const [elevator, setElevator] = useState('있음');
  const [isHighFloorWithoutElevator, setIsHighFloorWithoutElevator] = useState(false);
  const [commonEntrancePw, setCommonEntrancePw] = useState('');
  const [houseEntrancePw, setHouseEntrancePw] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isOpenPostcode, setIsOpenPostcode] = useState(false);
  const [cleaningDate, setCleaningDate] = useState('');
  const [cleaningTime, setCleaningTime] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [memos, setMemos] = useState('');
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [isBetweenCleaning, setIsBetweenCleaning] = useState(false);
  
  const handleBetweenCleaningToggle = () => {
    const nextState = !isBetweenCleaning;
    setIsBetweenCleaning(nextState);
    if (nextState) {
      setCleaningTime('사이청소 10시 투입');
    } else if (cleaningTime === '사이청소 10시 투입') {
      setCleaningTime('');
    }
  };
  
  const updateOptionCount = (id: string, delta: number) => {
    setSelectedOptions(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const newOptions = { ...prev };
      if (next === 0) {
        delete newOptions[id];
      } else {
        newOptions[id] = next;
      }
      return newOptions;
    });
  };

  // 에러 메시지
  const [errorMsg, setErrorMsg] = useState('');

  const estimatedPrice = React.useMemo(() => {
    let basePricePerPyeong = 15000;
    if (cleaningType === '프리미엄') {
      basePricePerPyeong = 20000;
    } else if (cleaningType === '거주') {
      basePricePerPyeong = 18000;
    } else if (cleaningType === '이사') {
      basePricePerPyeong = 15000;
    }

    const currentSize = typeof size === 'number' ? size : 0;
    let total = currentSize * basePricePerPyeong;

    if (isBetweenCleaning) {
      total += 100000;
    }

    Object.entries(selectedOptions).forEach(([optId, count]) => {
      const option = optionsList.find(o => o.id === optId);
      if (option) {
        if (optId === 'phytoncide') {
          total += option.price * currentSize * count; // 평당 단가 적용
        } else {
          total += option.price * count;
        }
      }
    });

    if (elevator === '없음' && isHighFloorWithoutElevator) {
      total += 30000;
    }

    return total;
  }, [cleaningType, size, isBetweenCleaning, selectedOptions, elevator, isHighFloorWithoutElevator]);

  const vatPrice = Math.floor(estimatedPrice * 0.1);
  const totalPriceIncVat = estimatedPrice + vatPrice;

  const handleSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setSize('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setSize(num);
    }
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!houseSubType) {
        setErrorMsg('상세 구조(원룸, 투룸 등)를 선택해주세요.');
        return;
      }
      if (size === '' || size <= 0) {
        setErrorMsg('공급 면적(평수)을 올바르게 입력해주세요.');
        return;
      }
    } else if (step === 2) {
      // Step 2: 세부사항 선택 (필수/옵션 추가 시 여기서 밸리데이션 처리)
    } else if (step === 3) {
      if (!address.trim()) {
        setErrorMsg('견적 산출 및 파트너 배정을 위해 정확한 방문 주소를 입력해주세요.');
        return;
      }
      if (!cleaningDate) {
        setErrorMsg('시공 희망 날짜를 선택해주세요.');
        return;
      }
      if (!cleaningTime) {
        setErrorMsg('시공 희망 시간을 선택해주세요.');
        return;
      }
      // 파트너 지정 예약인 경우 청소 가능일 여부 검증
      if (partnerId) {
        const isDateAvailable = partnerAvailableDates.includes(cleaningDate);
        if (!isDateAvailable) {
          setIsInterceptOpen(true);
          return; // 모달 오픈 후 진행 차단
        }
      }
    } else if (step === 4) {
      if (!businessName.trim()) {
        setErrorMsg('신청자 이름은 필수 항목입니다!');
        return;
      }
      if (!contactInfo.trim()) {
        setErrorMsg('모바일 연락처는 필수 항목입니다!');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const buildQuotePayload = () => {
    const optionLabels = Object.entries(selectedOptions).map(([id, count]) => {
      const option = optionsList.find(o => o.id === id);
      if (!option) return null;
      
      const category = optionCategories.find(cat => cat.items.some(i => i.id === id));
      if (category?.type === 'toggle') {
        return option.label; // 토글 항목은 수량 표시 안 함
      }
      return `${option.label} (${count}개)`;
    }).filter(Boolean) as string[];
    
    if (isBetweenCleaning) optionLabels.push('당일 이사 (사이청소)');
    if (cleaningType === '거주') optionLabels.push('거주 청소 (짐 있음)');
    if (elevator === '없음' && isHighFloorWithoutElevator) optionLabels.push('엘리베이터 없음 (3층 이상)');

    const memoParts = [];
    if (floorType) memoParts.push(`[바닥재] ${floorType}`);
    if (waterCleaning) memoParts.push(`[물청소] ${waterCleaning}`);
    if (parking) memoParts.push(`[주차여부] ${parking}`);
    if (elevator) memoParts.push(`[엘리베이터] ${elevator}`);
    if (commonEntrancePw) memoParts.push(`[공동현관] ${commonEntrancePw}`);
    if (houseEntrancePw) memoParts.push(`[현관비밀번호] ${houseEntrancePw}`);
    if (detailAddress) memoParts.push(`[상세주소] ${detailAddress}`);
    if (memos) memoParts.push(`[추가메모] ${memos}`);

    // ★ PartnerDashboard가 읽는 필드명(type, date, time, house, detail 등)과
    //   Quote가 저장하는 필드명(cleaningType, cleaningDate 등) 양쪽 모두 호환되도록
    //   alias 필드를 함께 저장합니다.
    const memoText = memoParts.join('\n');
    return {
      // 원본 필드 (Quote 내부 로직용)
      houseType,
      houseSubType,
      size,
      cleaningType,
      options: optionLabels,
      cleaningDate,
      cleaningTime,
      address,
      contactInfo,
      memo: memoText,
      totalPrice: totalPriceIncVat,
      status: '대기중',
      createdAt: new Date(),

      // ★ PartnerDashboard 호환용 alias 필드
      type: `${cleaningType} 청소`,                              // Dashboard: order.type
      date: cleaningDate,                                        // Dashboard: order.date
      time: cleaningTime,                                        // Dashboard: order.time
      location: address ? `${address} ${detailAddress}`.trim() : '주소 미상', // Dashboard: order.location
      house: houseSubType ? `${houseType} (${houseSubType})` : houseType, // Dashboard: order.house
      detail: memoText,                                          // Dashboard: job.detail
      phone: contactInfo,                                        // Dashboard: job.phone (폴백용)
      businessName: businessName || '',                           // Dashboard: job.businessName
      customerName: businessName || '',                           // Dashboard: job.customerName (폴백용)
    };
  };

  const handleFinish = async () => {
    try {
      const payload = buildQuotePayload();
      let assignedToId = partnerId;
      let assignedPartnerName = partnerName;

      // 자동 배정(Fast Booking)인 경우: 배정 로직 없이 전체 파트너에게 알림 전송 (Broadcasting)
      if (!assignedToId && address) {
        assignedPartnerName = '추천 파트너 (전체 알림 발송됨)';
        console.log(`[빠른 배정] 특정 업체 지정 없이 지역 내 전체 파트너에게 알림을 발송합니다.`);
      }

      // 최종 견적 데이터 저장
      await addDoc(collection(db!, 'quotes'), {
        ...payload,
        assignedTo: assignedToId || null,
        designatedPartnerName: assignedPartnerName || null
      });
      
      const successMsg = assignedPartnerName 
        ? `예약이 성공적으로 접수되었습니다.\n${assignedPartnerName} 업체에 견적이 전달되었습니다.\n담당자가 확인 후 곧 연락드리겠습니다.`
        : '예약이 성공적으로 접수되었습니다.\n최적의 전문 파트너를 배정 중입니다.\n담당자가 확인 후 곧 연락드리겠습니다.';
      
      alert(successMsg);
      navigate('/');
    } catch (err) {
      console.error("Failed to save quote", err);
      alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleGoToPartnerList = () => {
    const payload = buildQuotePayload();
    navigate('/partners', { state: { quoteData: payload } });
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto w-full">
          <button 
            onClick={handlePrev} 
            className="flex items-center justify-center p-1.5 -ml-1.5 text-slate-300 active:bg-white/10 rounded-full transition-colors"
          >
            {/* Step 5 에서는 뒤로가기보다는 홈으로 가거나 수정하기 의도가 다름 */}
            <span className="material-symbols-outlined text-xl">
              {step === 5 ? 'home' : 'arrow_back'}
            </span>
          </button>
          <span className="font-bold text-base text-white tracking-tight text-center flex-1 pr-8">
            견적 마법사 ({cleaningType})
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-5 pb-28 flex flex-col relative overflow-hidden">
        
        {/* Progress Bar (상단 고정) */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2.5 px-1">
            <span className={step >= 1 ? 'text-blue-400' : ''}>면적/단가</span>
            <span className={step >= 2 ? 'text-blue-400' : ''}>세부사항</span>
            <span className={step >= 3 ? 'text-blue-400' : ''}>일정/주소</span>
            <span className={step >= 4 ? 'text-blue-400' : ''}>정보입력</span>
            <span className={step >= 5 ? 'text-blue-400' : ''}>견적완료</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              initial={{ width: '20%' }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Content Area within AnimatePresence for slide effect */}
        <div className="flex-1 relative w-full h-full">
          <AnimatePresence mode="wait">
            
            {/* ================= STEP 1: 주거 형태 및 평수 ================= */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    청소하실 공간의<br/>정보를 알려주세요.
                  </h2>
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                    선택하신 <strong className="text-blue-400">{cleaningType} 청소</strong> 맞춤 단가가 적용됩니다.
                  </p>
                </div>
                
                <div className="space-y-7 flex-1">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-3">🧹 청소 종류 선택</label>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {[
                        { id: '프리미엄', label: '프리미엄 입주청소', sub: '인테리어 공사완료후 분진이 많은 현장', price: '평당 2.0만' },
                        { id: '거주', label: '거주청소', sub: '거주중 상태청소', price: '평당 1.8만' },
                        { id: '이사', label: '이사청소', sub: '이사나가고 빈집 청소', price: '평당 1.5만' },
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => setCleaningType(item.id as '프리미엄' | '이사' | '거주')}
                          className={`p-4 rounded-xl text-left transition-all active:scale-[0.98] border flex items-center justify-between ${
                            cleaningType === item.id 
                            ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-[15px] font-bold ${cleaningType === item.id ? 'text-blue-100' : 'text-slate-300'}`}>
                              {item.label}
                            </span>
                            <span className={`text-[11px] mt-0.5 ${cleaningType === item.id ? 'text-blue-300/80' : 'text-slate-500'}`}>
                              {item.sub}
                            </span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${cleaningType === item.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                            {item.price}
                          </span>
                        </button>
                      ))}
                    </div>

                    <label className="block text-slate-300 text-sm font-semibold mb-3">💡 주거 형태</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['아파트', '빌라', '오피스텔'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setHouseType(type);
                            setHouseSubType('');
                          }}
                          className={`py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                            houseType === type 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/50' 
                            : 'bg-white/5 text-slate-300 border border-white/10 active:bg-white/10'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {houseType && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {['원룸', '분리형 원룸', '투룸', '쓰리룸 이상', '복층', '기타'].map(sub => (
                             <button
                               key={sub}
                               onClick={() => setHouseSubType(sub)}
                               className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                 houseSubType === sub
                                 ? 'bg-blue-500 text-white shadow-sm'
                                 : 'bg-white/10 text-slate-300 border border-white/10 active:bg-white/20'
                               }`}
                             >
                               {sub}
                             </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-3">🚚 이사 형태 특이사항</label>
                    <div className="space-y-3">
                      <button
                        onClick={handleBetweenCleaningToggle}
                        className={`w-full p-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-between border ${
                          isBetweenCleaning 
                          ? 'bg-blue-600/20 shadow-sm shadow-blue-500/20 border-blue-500' 
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isBetweenCleaning ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-500'
                          }`}>
                            {isBetweenCleaning && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                          </div>
                          <div className="flex flex-col text-left -mt-0.5">
                            <span className={`${isBetweenCleaning ? 'text-blue-100' : 'text-slate-300'} text-[14px]`}>
                              당일 이사 후 바로 청소
                            </span>
                            <span className={`${isBetweenCleaning ? 'text-blue-300' : 'text-slate-500'} text-[11px] font-normal mt-0.5`}>
                              (사이청소 10시 투입)
                            </span>
                          </div>
                        </div>
                        <span className={isBetweenCleaning ? 'text-blue-300 font-bold' : 'text-slate-400'}>
                          +100,000원
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-3">📏 공급 면적 (평)</label>
                    <div className="flex items-center justify-between bg-white/5 border border-white/15 rounded-xl p-4 focus-within:border-blue-500 focus-within:bg-blue-500/5 transition-all">
                      <div className="flex flex-1 items-center gap-2 mr-3">
                        <input 
                          type="number" 
                          value={size}
                          onChange={handleSizeChange}
                          placeholder="예: 24"
                          className="flex-1 bg-transparent text-left text-3xl font-bold text-white outline-none
                                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                     placeholder-slate-600 w-full"
                        />
                        <span className="text-slate-400 text-lg font-medium whitespace-nowrap">평</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-slate-400 text-[10px] mb-0.5">단가</span>
                        <span className="text-blue-300 text-xs font-bold bg-blue-500/20 px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                          {cleaningType === '이사' ? '평당 1.5만원' : 
                           cleaningType === '거주' ? '평당 1.8만원' : 
                           '평당 2.0만원'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 중간 견적 안내 박스 */}
                <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-800/60 p-4 rounded-xl flex flex-col border border-white/5 shadow-lg gap-3">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400 font-medium">원래 금액 (공급가액)</span>
                     <span className="text-slate-200 font-medium">{estimatedPrice.toLocaleString()}원</span>
                   </div>
                   <div className="flex justify-between items-center text-sm pb-3 border-b border-white/10">
                     <span className="text-rose-400 font-medium">부가세 10%</span>
                     <span className="text-rose-400 font-medium">+{vatPrice.toLocaleString()}원</span>
                   </div>
                   <div className="flex justify-between items-end pt-1">
                     <span className="text-blue-300 font-bold text-[15px] mb-1">총 결제 예정 금액</span>
                     <div className="text-right">
                       <span className="text-white font-black text-2xl drop-shadow-md">
                         {totalPriceIncVat.toLocaleString()}
                       </span>
                       <span className="text-blue-200 text-sm ml-1 font-bold">원</span>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 2: 세부사항 선택 ================= */}
            {step === 2 && (
              <motion.div
                key="step2_details"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    청소 진행 시<br/>참고사항을 선택해주세요.
                  </h2>
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                    선택하신 옵션에 따라 견적 금액이 변동될 수 있습니다.
                  </p>
                </div>
                
                <div className="space-y-8 flex-1 overflow-y-auto pr-1 pb-4">
                  {optionCategories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-4">
                      <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">
                        {cat.category}
                      </h3>
                      <div className="space-y-3">
                        {cat.items.map(opt => {
                          const count = selectedOptions[opt.id] || 0;
                          const priceDisplay = `+${opt.price.toLocaleString()}원`;
                          
                          return (
                            <div 
                              key={opt.id}
                              className={`flex flex-col p-4 rounded-xl border transition-all select-none ${
                                count > 0 
                                ? 'bg-blue-600/20 border-blue-500 shadow-sm shadow-blue-500/20' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                              } ${cat.type === 'toggle' ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                              onClick={() => {
                                if (cat.type === 'toggle') {
                                  updateOptionCount(opt.id, count > 0 ? -count : 1);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-sm ${count > 0 ? 'text-blue-100 font-bold' : 'text-slate-300'}`}>
                                    {opt.label}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {priceDisplay}
                                  </span>
                                </div>
                                
                                {cat.type === 'toggle' ? (
                                  <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                                    count > 0 ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-500 text-transparent'
                                  }`}>
                                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                  </div>
                                ) : (
                                  <div 
                                    className={`flex items-center gap-3 rounded-lg p-1 border transition-colors ${count > 0 ? 'bg-slate-900/50 border-blue-500/20' : 'bg-slate-800/50 border-white/5'}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button 
                                      onClick={() => updateOptionCount(opt.id, -1)}
                                      disabled={count === 0}
                                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${count > 0 ? 'bg-white/5 text-slate-300 active:bg-white/10 hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}
                                    >
                                      <span className="material-symbols-outlined text-lg">remove</span>
                                    </button>
                                    <span className={`w-4 text-center font-bold ${count > 0 ? 'text-blue-100' : 'text-slate-600'}`}>{count}</span>
                                    <button 
                                      onClick={() => updateOptionCount(opt.id, 1)}
                                      className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-300 active:bg-blue-500/40 hover:bg-blue-500/30"
                                    >
                                      <span className="material-symbols-outlined text-lg">add</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {count > 0 && (
                                <div className="mt-3 pt-3 border-t border-blue-500/30 flex items-center justify-between">
                                  <span className="text-xs text-blue-200">항목 추가 금액</span>
                                  <span className="text-sm text-blue-300 font-bold">
                                    {opt.id === 'phytoncide'
                                      ? `+${(opt.price * (typeof size === 'number' ? size : 0) * count).toLocaleString()}원` 
                                      : `+${(opt.price * count).toLocaleString()}원`}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ================= STEP 3: 일정 및 주소 ================= */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    어디로 언제<br/>방문할까요?
                  </h2>
                </div>
                
                <div className="space-y-6 flex-1">
                  {isOpenPostcode ? (
                    <div className="bg-white rounded-xl overflow-hidden pb-1 relative transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700">
                       <div className="flex justify-between items-center p-3 bg-slate-100 border-b border-slate-200">
                          <span className="text-slate-700 font-bold text-sm ml-1">주소 검색</span>
                          <button onClick={() => setIsOpenPostcode(false)} className="text-slate-500 p-1 hover:bg-slate-200 rounded-md transition-colors flex items-center justify-center">
                             <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                       </div>
                       <DaumPostcode 
                          onComplete={(data) => {
                             setAddress(data.address);
                             setIsOpenPostcode(false);
                          }}
                          autoClose
                          style={{ height: '350px' }}
                       />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">📍 방문할 주소</label>
                      <div className="space-y-3">
                        <div 
                          onClick={() => setIsOpenPostcode(true)}
                          className="w-full bg-white/5 border border-white/15 hover:border-blue-500/50 rounded-xl px-4 py-4 text-base transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] active:bg-white/10"
                        >
                          <span className={address ? "text-white" : "text-slate-500"}>
                            {address || "터치하여 도로명/지번 주소 검색"}
                          </span>
                          <span className={`${address ? 'text-blue-400' : 'text-slate-400'} material-symbols-outlined text-xl`}>search</span>
                        </div>
                        {address && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                          >
                            <input
                              type="text"
                              placeholder="나머지 상세 주소 (동/호수)"
                              value={detailAddress}
                              onChange={(e) => setDetailAddress(e.target.value)}
                              className="w-full bg-white/5 border border-white/15 hover:border-blue-500/50 focus:border-blue-500 rounded-xl px-4 py-4 text-base text-white placeholder-slate-500 focus:outline-none transition-all focus:bg-blue-500/5 mt-1"
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isOpenPostcode && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <label className="block text-slate-300 text-sm font-semibold mb-2">
                        📅 시공 희망 날짜
                        <span className="block text-blue-400 font-normal text-[11px] mt-1">
                          ※ 원활한 인력 배정을 위해 최소 3일 이후부터 예약 가능합니다.
                        </span>
                      </label>
                      <div 
                        className="relative group cursor-pointer"
                        onClick={(e) => {
                          const input = e.currentTarget.querySelector('input');
                          if (input && 'showPicker' in input) {
                            try {
                              input.showPicker();
                            } catch {
                              // showPicker not supported or failed
                            }
                          }
                        }}
                      >
                        <input
                          type="date"
                          value={cleaningDate}
                          min={(() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()}
                          onChange={(e) => setCleaningDate(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full bg-white/5 border ${cleaningDate ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-white/15 group-hover:border-blue-500/50 group-active:bg-white/10'} rounded-xl px-4 py-4 text-base transition-all flex items-center justify-between pointer-events-none`}>
                          <span className={cleaningDate ? 'text-blue-100 font-bold tracking-wide' : 'text-slate-500'}>
                            {cleaningDate ? cleaningDate.replace(/-/g, '. ') : '터치하여 날짜 선택'}
                          </span>
                          <span className={`material-symbols-outlined ${cleaningDate ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400/70'} transition-colors`}>
                            calendar_month
                          </span>
                        </div>
                      </div>

                      {/* 시공 희망 시간 선택 UI */}
                      <div className="mt-6">
                        <label className="block text-slate-300 text-sm font-semibold mb-3">⏰ 시공 희망 시간</label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {(isBetweenCleaning ? ['사이청소 10시 투입', '오전 7시~9시 시작', '오후 13시~15시 시작'] : ['오전 7시~9시 시작', '오후 13시~15시 시작']).map(timeOption => (
                            <button
                              key={timeOption}
                              onClick={() => setCleaningTime(timeOption)}
                              className={`py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                cleaningTime === timeOption
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/50' 
                                : 'bg-white/5 text-slate-300 border border-white/10 active:bg-white/10'
                              }`}
                            >
                              {timeOption}
                            </button>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= STEP 4: 연락처 및 메모 ================= */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    연락 가능한 정보를<br/>남겨주세요.
                  </h2>
                </div>
                
                <div className="space-y-6 flex-1">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-1.5 ${cleaningType === '프리미엄' ? 'text-amber-300/90' : 'text-slate-300'}`}>
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      신청자 이름 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="예) 홍길동"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={`w-full rounded-xl px-4 py-4 text-base text-white placeholder-slate-500 focus:outline-none transition-all ${
                        cleaningType === '프리미엄' 
                        ? 'bg-amber-900/10 border border-amber-500/30 focus:border-amber-500 focus:bg-amber-500/5' 
                        : 'bg-white/5 border border-white/15 focus:border-blue-600 focus:bg-blue-500/5'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">📞 신청자 연락처 <span className="text-rose-400">*</span></label>
                    <input
                      type="tel"
                      placeholder="예) 010-0000-0000"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-all focus:bg-blue-500/5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">바닥재 종류</label>
                      <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                        {['장판', '마루'].map(type => (
                          <button
                            key={type}
                            onClick={() => setFloorType(type)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                              floorType === type ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">물청소 가능 여부</label>
                      <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                        {['가능', '불가능'].map(type => (
                          <button
                            key={type}
                            onClick={() => setWaterCleaning(type)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                              waterCleaning === type ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">주차 가능 여부</label>
                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                      {['가능', '불가능'].map(type => (
                        <button
                          key={type}
                          onClick={() => setParking(type)}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            parking === type ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">엘리베이터 유무</label>
                    <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                      {['있음', '없음'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setElevator(type);
                            if (type === '있음') setIsHighFloorWithoutElevator(false);
                          }}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            elevator === type ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {elevator === '없음' && (
                      <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={isHighFloorWithoutElevator}
                            onChange={(e) => setIsHighFloorWithoutElevator(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-800"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-rose-200 font-bold">3층 이상입니다 (계단 작업)</span>
                            <span className="text-xs text-rose-300/70 mt-0.5">※ 장비 운반으로 인해 3만원이 추가됩니다.</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">공동현관 비밀번호</label>
                      <input
                        type="text"
                        placeholder="예) *1234#"
                        value={commonEntrancePw}
                        onChange={(e) => setCommonEntrancePw(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-all focus:bg-blue-500/5"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">세대 현관 비밀번호</label>
                      <input
                        type="text"
                        placeholder="예) 1234*"
                        value={houseEntrancePw}
                        onChange={(e) => setHouseEntrancePw(e.target.value)}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-all focus:bg-blue-500/5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">✏️ 추가 요청사항 및 메모</label>
                    <textarea
                      placeholder="시공 현장의 특이사항이나 특히 신경써야 할 부분이 있다면 자세히 적어주세요."
                      value={memos}
                      onChange={(e) => setMemos(e.target.value)}
                      rows={4}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-all resize-none focus:bg-blue-500/5"
                    ></textarea>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 5: 견적 결과 (최종 완료 화면) ================= */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-6 pt-2">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30"
                  >
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">예상 견적서 발급 완료!</h2>
                  <p className="text-slate-400 text-sm">입력해주신 정보 기반의 산출 금액입니다.</p>
                </div>

                {/* 영수증 형태의 결과 영수증 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 shadow-xl relative overflow-hidden">
                   {/* 장식용 텍스쳐 */}
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                   
                   <div className="relative z-10">
                     <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                        <span className="text-slate-400 text-sm">희망 일정</span>
                        <div className="flex flex-col items-end">
                           <span className="text-white font-bold text-[15px]">
                             {cleaningDate ? `${cleaningDate.replace(/-/g, '.')} (${['일', '월', '화', '수', '목', '금', '토'][new Date(cleaningDate).getDay()]})` : '일정 미정'}
                           </span>
                           <span className="text-slate-400 text-xs mt-1">{cleaningTime || '시간 협의'}</span>
                        </div>
                     </div>

                     <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                        <span className="text-slate-400 text-sm">시공 종류</span>
                        <div className="flex flex-col items-end">
                           <span className="text-white font-bold text-[15px]">{cleaningType} 청소</span>
                           <span className="text-slate-400 text-xs mt-1">{houseSubType ? `${houseType} (${houseSubType})` : houseType} · {size}평</span>
                        </div>
                     </div>
                     
                     <div className="space-y-3 pb-4 border-b border-dashed border-white/10 mb-4">
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">{cleaningType === '거주' ? '거주 청소비 (기본비용 포함)' : '기본 청소비'}</span>
                          <span className="text-slate-200 font-medium">
                            {((typeof size === 'number' ? size : 0) * (cleaningType === '프리미엄' ? 20000 : cleaningType === '거주' ? 18000 : 15000)).toLocaleString()}원
                          </span>
                       </div>
                       {isBetweenCleaning && (
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">당일 이사 (사이청소)</span>
                            <span className="text-slate-200 font-medium">+100,000원</span>
                         </div>
                       )}
                       {elevator === '없음' && isHighFloorWithoutElevator && (
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">엘리베이터 없음 (3층 이상)</span>
                            <span className="text-slate-200 font-medium">+30,000원</span>
                         </div>
                       )}
                       {Object.keys(selectedOptions).length > 0 && (
                         <div className="flex flex-col gap-1">
                           <div className="flex justify-between items-center mt-1">
                              <span className="text-slate-400 text-sm text-balance">추가 선택 옵션</span>
                           </div>
                           <div className="pl-2.5 border-l-2 border-blue-900/40 space-y-1.5 mt-1 pb-1">
                             {Object.entries(selectedOptions).map(([optId, count]) => {
                               const option = optionsList.find(o => o.id === optId);
                               const currentSize = typeof size === 'number' ? size : 0;
                               const price = option ? (optId === 'phytoncide' ? option.price * currentSize * count : option.price * count) : 0;
                               
                               return option ? (
                                 <div key={optId} className="flex justify-between text-[13px] text-slate-400">
                                   <span>· {option.label} {count > 1 ? `x ${count}` : ''}</span>
                                   <span className="text-slate-300">+{price.toLocaleString()}원</span>
                                 </div>
                               ) : null;
                             })}
                           </div>
                         </div>
                       )}
                       
                       {/* 비비용성 정보 요약 */}
                       <div className="mt-3 bg-slate-800/50 rounded-lg p-3 border border-white/5">
                         <span className="text-xs text-slate-500 font-bold mb-2 block">입력된 현장 정보</span>
                         <div className="flex flex-wrap gap-1.5">
                           <span className="text-[11px] bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/10">바닥: {floorType}</span>
                           <span className="text-[11px] bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/10">물청소: {waterCleaning}</span>
                           <span className="text-[11px] bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/10">주차: {parking}</span>
                           <span className="text-[11px] bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/10">엘리베이터: {elevator}</span>
                         </div>
                       </div>

                       <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-2">
                          <span className="text-slate-400 text-sm font-bold">총 공급가액</span>
                          <span className="text-slate-200 font-bold">{estimatedPrice.toLocaleString()}원</span>
                       </div>
                       <div className="flex justify-between items-center mt-2">
                          <span className="text-rose-400 text-sm font-medium">부가세 (10%)</span>
                          <span className="text-rose-400 font-medium">+{vatPrice.toLocaleString()}원</span>
                       </div>
                     </div>

                     <div className="flex justify-between items-end pt-2">
                        <span className="text-blue-300 text-base font-bold mb-1">최종 예상 결제액</span>
                        <div className="text-right">
                          <span className="text-[32px] font-black text-white leading-none shadow-blue-500/50 drop-shadow-md">
                            {totalPriceIncVat.toLocaleString()}
                          </span>
                          <span className="text-blue-200 text-base ml-1 font-bold">원</span>
                        </div>
                     </div>
                   </div>
                </div>

                {/* 신뢰도 문구 */}
                <div className="bg-slate-800/80 rounded-xl p-4 mb-6 flex flex-col gap-1.5">
                  <p className="text-[13px] text-slate-300 leading-relaxed text-center font-medium break-keep">
                    본 견적은 예상 금액이며, 오염도나 현장 상황에 따라<br/>
                    약간의 차이가 발생할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-3 mt-auto">
                  <div className={`grid ${partnerName ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <button 
                      onClick={handleFinish}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl text-sm md:text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined pb-0.5 text-lg">bolt</span>
                      {partnerName ? `${partnerName} 파트너에게 지정 예약` : '빠른 예약 (자동 배정)'}
                    </button>
                    {!partnerName && (
                      <button 
                        onClick={handleGoToPartnerList}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-sm md:text-base shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined pb-0.5 text-lg">search</span>
                        파트너 직접 선택
                      </button>
                    )}
                  </div>
                  <a
                    href="http://pf.kakao.com/_xxxxxx/chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-bold py-4 rounded-xl text-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.24 4.6 6.55-.26.96-.94 3.44-.97 3.56-.03.11.02.22.11.27.09.05.21.05.3 0 .12-.06 3.65-2.48 4.2-2.87.56.09 1.15.13 1.76.13 5.52 0 10-3.51 10-7.84S17.52 3 12 3z"/></svg>
                    카카오톡으로 문의하기
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* 하단 플로팅 네비게이션 버튼 (Step 1~4 전용) */}
      <AnimatePresence>
        {step < 5 && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-white/10 px-4 py-4 z-40"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            <div className="max-w-lg mx-auto relative flex flex-col gap-3">
              {/* 공중에 띄워진 에러 메세지 */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-12 left-0 w-full text-center pointer-events-none"
                  >
                    <span className="inline-block bg-rose-500/90 text-white text-[13px] font-bold px-4 py-2 rounded-full shadow-lg">
                      {errorMsg}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex gap-2">
                <a
                  href="http://pf.kakao.com/_xxxxxx/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-[0.95]"
                  aria-label="카카오톡 문의하기"
                >
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.24 4.6 6.55-.26.96-.94 3.44-.97 3.56-.03.11.02.22.11.27.09.05.21.05.3 0 .12-.06 3.65-2.48 4.2-2.87.56.09 1.15.13 1.76.13 5.52 0 10-3.51 10-7.84S17.52 3 12 3z"/></svg>
                </a>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-[0_8px_16px_rgba(37,99,235,0.25)] transition-all active:scale-[0.98]"
                >
                  {step === 4 ? '다음' : '다음 단계로'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 우회 안내 모달 */}
      <AnimatePresence>
        {isInterceptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-800 border border-slate-700 text-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative flex flex-col"
            >
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-lg font-bold text-white">파트너 일정 확인 필요</h3>
              </div>
              
              <p className="text-slate-300 text-sm leading-relaxed mb-6 break-keep">
                선택하신 날짜(<span className="text-blue-400 font-bold">{cleaningDate}</span>)는 <span className="text-white font-bold">{partnerName}</span> 파트너의 청소 가능일이 아닙니다. 아래 옵션 중 하나를 선택해주세요.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsInterceptOpen(false)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-650"
                >
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  시공 날짜 변경하기
                </button>
                
                <button
                  onClick={() => {
                    setIsInterceptOpen(false);
                    setPartnerId(null);
                    setPartnerName(null);
                    setStep(4);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">bolt</span>
                  추천 파트너 자동 배정으로 전환
                </button>
                
                <button
                  onClick={() => {
                    setIsInterceptOpen(false);
                    handleGoToPartnerList();
                  }}
                  className="w-full bg-transparent hover:bg-white/5 text-slate-300 font-bold py-3.5 px-4 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                  다른 파트너 선택하러 가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

