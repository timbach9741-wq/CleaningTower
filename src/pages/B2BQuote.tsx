import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DaumPostcode from 'react-daum-postcode';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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
      { id: 'extra_charge_notice', label: '[필수] 현장 상황에 따라 추가 비용이 발생할 수 있습니다.', price: 0, isNotice: true },
    ]
  }
];

const optionsList = optionCategories.flatMap(cat => cat.items);

/**
 * 사업자 전용 앱 - 모바일 퍼스트 설계 (Funnel 버전)
 * 
 * 사장님(B2B) 전용 오더 접수 및 실시간 견적 산출 시스템.
 * 긴 스크롤 폼 대신 한 화면에 하나의 컨텍스트만 묻는 스텝(Funnel) 방식으로 설계함.
 */
export default function Quote() {
  const navigate = useNavigate();
  const { type } = useParams();

  // 업체 전용 로그인 상태
  const [isB2BLoggedIn, setIsB2BLoggedIn] = useState(() => {
    return sessionStorage.getItem('b2b_logged_in') === 'true';
  });
  const [b2bLoginForm, setB2bLoginForm] = useState({ id: '', password: '' });
  const [b2bLoginError, setB2bLoginError] = useState('');
  const [b2bLoginLoading, setB2bLoginLoading] = useState(false);
  const [showB2BLoginModal, setShowB2BLoginModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const handleB2BLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setB2bLoginError('');
    setB2bLoginLoading(true);
    try {
      if (!db) {
        // Firebase 미연동 시 데모 로그인
        if (b2bLoginForm.id === 'demo' && b2bLoginForm.password === '1234') {
          sessionStorage.setItem('b2b_logged_in', 'true');
          sessionStorage.setItem('b2b_business_name', '데모 업체');
          setIsB2BLoggedIn(true);
          return;
        }
        setB2bLoginError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }
      const q = query(
        collection(db, 'b2bAccounts'),
        where('loginId', '==', b2bLoginForm.id)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setB2bLoginError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }
      const accountDoc = snapshot.docs[0];
      const accountData = accountDoc.data();
      if (accountData.password !== b2bLoginForm.password) {
        setB2bLoginError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }
      sessionStorage.setItem('b2b_logged_in', 'true');
      sessionStorage.setItem('b2b_business_name', accountData.businessName || accountData.name || '');
      setBusinessName(accountData.businessName || accountData.name || '');
      setIsB2BLoggedIn(true);
      setShowB2BLoginModal(false);
      setPendingSubmit(true);
    } catch (err) {
      console.error(err);
      setB2bLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setB2bLoginLoading(false);
    }
  };

  // 스텝 상태 (0: 서비스 안내, 1: 주거/면적, 2: 세부사항, 3: 일정/주소, 4: 정보입력, 5: 견적완료)
  const [step, setStep] = useState(0);

  // 입력 상태
  const [houseType, setHouseType] = useState('아파트');
  const [houseSubType, setHouseSubType] = useState('');
  const [cleaningType, setCleaningType] = useState<'프리미엄' | '이사' | '거주'>(() => {
    if (type === 'general' || type === '이사') return '이사';
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
  const [isAgreedPersonalInfo, setIsAgreedPersonalInfo] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeRepairCard, setActiveRepairCard] = useState<string | null>(null);
  
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

  // 견적 산출 로직
  const getEstimatedPrice = () => {
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
  };

  const estimatedPrice = getEstimatedPrice();
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
    if (step === 0) {
      // 서비스 안내 → 견적 시작 (유효성 검사 없음)
      setStep(1);
      return;
    }
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
      if (!selectedOptions['extra_charge_notice']) {
        setErrorMsg('현장 상황에 따른 추가 비용 발생 안내사항을 확인하고 동의해주세요.');
        return;
      }
    } else if (step === 3) {
      if (!address.trim()) {
        setErrorMsg('견적 알림 및 매칭을 위해 주소를 반드시 입력해주세요.');
        return;
      }
    } else if (step === 4) {
      if (!contactInfo.trim()) {
        setErrorMsg('모바일 연락처는 필수 항목입니다!');
        return;
      }
      if (!isAgreedPersonalInfo) {
        setErrorMsg('개인정보 제3자 제공 및 약관 동의가 필요합니다.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmitQuote = async () => {
    if (!isAgreedPersonalInfo) {
      alert('개인정보 제3자 제공 및 약관 동의가 필요합니다. 동의란에 체크해주세요.');
      return;
    }
    // 로그인 안 되어있으면 로그인 모달 표시
    if (!isB2BLoggedIn) {
      setShowB2BLoginModal(true);
      return;
    }
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
    if (houseEntrancePw) memoParts.push(`[세대현관] ${houseEntrancePw}`);
    if (memos) memoParts.push(`[추가메모] ${memos}`);

    const finalDetail = memoParts.length > 0 ? memoParts.join('\n') : '특이사항 없음';

    try {
      if (db) {
        await addDoc(collection(db, 'quotes'), {
          isB2B: true, // 사업자 전용 앱 주문 플래그
          date: cleaningDate || '미정',
          time: cleaningTime || '시간협의',
          name: businessName || '기본고객',
          customerName: businessName || '기본고객',
          type: `${cleaningType} 청소`,
          house: houseSubType ? `${houseType} (${houseSubType})` : houseType,
          size: size || 0,
          location: address ? `${address} ${detailAddress}`.trim() : '주소 미상',
          price: totalPriceIncVat.toLocaleString() + '원',
          detail: finalDetail,
          options: optionLabels,
          status: '대기중',
          assignedTo: null,
          realPhone: contactInfo,
          createdAt: new Date().toISOString()
        });
        
        alert('사업자 전용 예약이 성공적으로 접수되었습니다.\n담당 매니저가 확인 후 신속하게 연락드리겠습니다.');
        navigate('/');
      }
    } catch (err) {
      console.error("Failed to save quote", err);
      alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 로그인 성공 후 자동 제출
  const pendingSubmitRef = useRef(false);
  useEffect(() => {
    if (pendingSubmit && isB2BLoggedIn) {
      setPendingSubmit(false);
      // 약간의 딜레이 후 자동 제출
      setTimeout(() => handleSubmitQuote(), 300);
    }
  }, [pendingSubmit, isB2BLoggedIn]);

  // 가입 페이지에서 돌아왔을 때 폼 데이터 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('b2b_draft_quote');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStep(data.step || 0);
        setHouseType(data.houseType || '아파트');
        setHouseSubType(data.houseSubType || '');
        setCleaningType(data.cleaningType || '프리미엄');
        setSize(data.size || 24);
        setBusinessName(data.businessName || '');
        setAddress(data.address || '');
        setFloorType(data.floorType || '장판');
        setWaterCleaning(data.waterCleaning || '가능');
        setParking(data.parking || '가능');
        setElevator(data.elevator || '있음');
        setDetailAddress(data.detailAddress || '');
        setCleaningDate(data.cleaningDate || '');
        setCleaningTime(data.cleaningTime || '');
        setContactInfo(data.contactInfo || '');
        setMemos(data.memos || '');
        setSelectedOptions(data.selectedOptions || {});
        setIsAgreedPersonalInfo(data.isAgreedPersonalInfo || false);
        sessionStorage.removeItem('b2b_draft_quote');
      } catch(e) { /* ignore */ }
    }
  }, []);

  // 가입 페이지로 이동 전 폼 데이터 저장
  const saveAndGoSignup = () => {
    const draft = {
      step, houseType, houseSubType, cleaningType, size,
      businessName, address, floorType, waterCleaning, parking,
      elevator, detailAddress, cleaningDate, cleaningTime,
      contactInfo, memos, selectedOptions, isAgreedPersonalInfo
    };
    sessionStorage.setItem('b2b_draft_quote', JSON.stringify(draft));
    navigate('/b2b/signup');
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (step > 0) {
      setStep(prev => prev - 1);
    } else {
      navigate('/');
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto w-full">
          <button 
            onClick={handlePrev} 
            className="flex items-center justify-center p-1.5 -ml-1.5 text-slate-300 active:bg-white/10 rounded-full transition-colors"
          >
            {/* Step 5 에서는 뒤로가기보다는 홈으로 가거나 수정하기 의도가 다름 */}
            <span className="material-symbols-outlined text-xl">
              {step === 5 ? 'home' : 'arrow_back'}
            </span>
          </button>
          <span className="font-bold text-base text-white tracking-tight text-center flex-1">
            {step === 0 ? '청소타워 서비스 안내' : `사업자 전용 앱 (${cleaningType})`}
          </span>
          {isB2BLoggedIn && (
            <button
              onClick={() => {
                sessionStorage.removeItem('b2b_logged_in');
                sessionStorage.removeItem('b2b_business_name');
                setIsB2BLoggedIn(false);
              }}
              className="text-[11px] text-slate-400 font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              로그아웃
            </button>
          )}
        </div>
      </header>

      <main className={`flex-1 w-full mx-auto ${step === 0 ? 'max-w-6xl p-0 pb-24' : 'max-w-2xl p-5 pb-28 lg:p-8 lg:pb-32'} flex flex-col relative overflow-hidden`}>
        
        {/* Progress Bar (step 0에서는 숨김) */}
        {step > 0 && (
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
        )}

        {/* Content Area within AnimatePresence for slide effect */}
        <div className="flex-1 relative w-full h-full">
          <AnimatePresence mode="wait">

            {/* ================= STEP 0: 서비스 안내 (보수 서비스 강조) ================= */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col"
              >
                {/* Hero Banner */}
                <div className="relative px-5 pt-10 pb-12 lg:pt-24 lg:pb-20 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent pointer-events-none"></div>
                  {/* 데스크톱 글로우 장식 */}
                  <div className="hidden lg:block absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-amber-500/8 blur-[100px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-5 py-2 lg:px-6 lg:py-2.5 mb-6 lg:mb-8 rounded-full bg-amber-500/15 border border-amber-400/30">
                      <span className="text-amber-400 text-sm lg:text-lg">🔧</span>
                      <span className="text-xs lg:text-sm font-bold text-amber-300 tracking-wide">청소타워만의 차별화</span>
                    </div>
                    <h2 className="text-2xl lg:text-[3.2rem] lg:leading-[1.2] font-black text-white mb-3 lg:mb-6 leading-tight tracking-tight break-keep">
                      청소만 하는 곳이 아닙니다.<br/>
                      <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                        하자까지 잡아드립니다.
                      </span>
                    </h2>
                    <p className="text-sm lg:text-lg text-slate-400 font-medium break-keep leading-relaxed max-w-md lg:max-w-lg mx-auto">
                      사장님, 소비자 컴플레인 걱정 마세요.<br/>
                      청소타워가 <strong className="text-white">사전에 차단</strong>해드립니다.
                    </p>
                  </div>
                </div>

                {/* 타사 vs 청소타워 비교 */}
                <div className="px-5 lg:px-8 mb-8 lg:mb-12">
                  <div className="grid grid-cols-2 gap-3 lg:gap-6">
                    {/* 타사 */}
                    <div className="bg-red-950/50 border border-red-500/20 rounded-2xl lg:rounded-3xl p-4 lg:p-8">
                      <div className="flex items-center gap-1.5 lg:gap-2.5 mb-3 lg:mb-5">
                        <span className="text-red-400 text-sm lg:text-xl">⚠️</span>
                        <span className="text-[11px] lg:text-base font-bold text-red-300">타사 업체</span>
                      </div>
                      <ul className="space-y-2 lg:space-y-3.5">
                        {['그냥 청소만 합니다', '보수는 별도 업체 부르세요', '하자 발견해도 내 일 아닙니다', '입주 후? 연락 안 됩니다'].map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5 lg:gap-2.5">
                            <span className="text-red-400/80 text-xs lg:text-base mt-0.5 shrink-0">✗</span>
                            <span className="text-red-200/80 text-[11px] lg:text-[15px] font-medium break-keep leading-snug">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* 청소타워 */}
                    <div className="bg-emerald-950/50 border border-emerald-500/20 rounded-2xl lg:rounded-3xl p-4 lg:p-8 relative overflow-hidden">
                      {/* 글로우 */}
                      <div className="hidden lg:block absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="flex items-center gap-1.5 lg:gap-2.5 mb-3 lg:mb-5 relative z-10">
                        <span className="text-emerald-400 text-sm lg:text-xl">✅</span>
                        <span className="text-[11px] lg:text-base font-bold text-emerald-300">청소타워</span>
                      </div>
                      <ul className="space-y-2 lg:space-y-3.5 relative z-10">
                        {['청소하면서 하자까지 잡습니다', '실리콘·마루·벽지·장판 원스톱', '소비자가 말하기 전에 먼저 합니다', '사장님 평판을 지켜드립니다'].map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5 lg:gap-2.5">
                            <span className="text-emerald-400 text-xs lg:text-base mt-0.5 shrink-0">✓</span>
                            <span className="text-emerald-200/80 text-[11px] lg:text-[15px] font-medium break-keep leading-snug">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 실리콘 · 마루콕 전/후 사진 카드 */}
                <div className="px-5 lg:px-8 mb-6">
                  <h3 className="text-sm lg:text-base font-bold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-amber-500 rounded-full"></span>
                    프리미엄 무상 보수 항목 — 사진을 터치해보세요
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* 마루콕 시공 */}
                    <button
                      type="button"
                      onClick={() => setActiveRepairCard(activeRepairCard === 'marucok' ? null : 'marucok')}
                      className={`w-full text-left rounded-2xl overflow-hidden border transition-all duration-300 ${
                        activeRepairCard === 'marucok'
                          ? 'border-amber-400/40 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[16/9] bg-slate-800 overflow-hidden">
                        {/* Before 이미지 */}
                        <img
                          src="/repair_marucok_before.jpg"
                          alt="마루콕 시공 전"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-[1] ${
                            activeRepairCard === 'marucok' ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        {/* After 이미지 */}
                        <img
                          src="/repair_marucok_after.jpg"
                          alt="마루콕 시공 후"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-[1] ${
                            activeRepairCard === 'marucok' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        {/* Before/After 뱃지 */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-lg transition-colors duration-300 ${
                            activeRepairCard === 'marucok'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {activeRepairCard === 'marucok' ? 'AFTER ✓' : 'BEFORE'}
                          </span>
                        </div>
                        {/* 터치 안내 */}
                        <div className="absolute bottom-3 right-3 z-10">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80">
                            {activeRepairCard === 'marucok' ? '다시 터치하면 전' : '터치하면 후 →'}
                          </span>
                        </div>
                      </div>
                      {/* 텍스트 정보 */}
                      <div className="p-4 bg-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-black text-white">마루콕 시공</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">마루 찍힘·긁힘 복원 · 틈새 충진</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-full">무상</span>
                        </div>
                      </div>
                    </button>

                    {/* 실리콘 보수 */}
                    <button
                      type="button"
                      onClick={() => setActiveRepairCard(activeRepairCard === 'silicone' ? null : 'silicone')}
                      className={`w-full text-left rounded-2xl overflow-hidden border transition-all duration-300 ${
                        activeRepairCard === 'silicone'
                          ? 'border-amber-400/40 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[16/9] bg-slate-800 overflow-hidden">
                        {/* Before 이미지 */}
                        <img
                          src="/repair_silicone_before.png"
                          alt="실리콘 보수 전"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-[1] ${
                            activeRepairCard === 'silicone' ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        {/* After 이미지 */}
                        <img
                          src="/repair_silicone_after.png"
                          alt="실리콘 보수 후"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-[1] ${
                            activeRepairCard === 'silicone' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        {/* Before/After 뱃지 */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-lg transition-colors duration-300 ${
                            activeRepairCard === 'silicone'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {activeRepairCard === 'silicone' ? 'AFTER ✓' : 'BEFORE'}
                          </span>
                        </div>
                        {/* 터치 안내 */}
                        <div className="absolute bottom-3 right-3 z-10">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80">
                            {activeRepairCard === 'silicone' ? '다시 터치하면 전' : '터치하면 후 →'}
                          </span>
                        </div>
                      </div>
                      {/* 텍스트 정보 */}
                      <div className="p-4 bg-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-black text-white">실리콘 보수</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">곰팡이 제거 후 항균 실리콘 재시공</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-full">무상</span>
                        </div>
                      </div>
                    </button>

                    {/* 장판 이음매 용착 */}
                    <button
                      type="button"
                      onClick={() => setActiveRepairCard(activeRepairCard === 'jangpan' ? null : 'jangpan')}
                      className={`w-full text-left rounded-2xl overflow-hidden border transition-all duration-300 ${
                        activeRepairCard === 'jangpan'
                          ? 'border-amber-400/40 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* 이미지 영역 - 좌우 비교 사진 크롭 */}
                      <div className="relative aspect-[16/9] bg-slate-800 overflow-hidden">
                        <div
                          className="absolute inset-0 z-[1] transition-all duration-700 ease-in-out"
                          style={{
                            backgroundImage: 'url(/repair_jangpan.png)',
                            backgroundSize: '200% 140%',
                            backgroundPosition: activeRepairCard === 'jangpan' ? '100% 20%' : '0% 20%',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        {/* Before/After 뱃지 */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-lg transition-colors duration-300 ${
                            activeRepairCard === 'jangpan'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {activeRepairCard === 'jangpan' ? 'AFTER ✓' : 'BEFORE'}
                          </span>
                        </div>
                        {/* 터치 안내 */}
                        <div className="absolute bottom-3 right-3 z-10">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80">
                            {activeRepairCard === 'jangpan' ? '다시 터치하면 전' : '터치하면 후 →'}
                          </span>
                        </div>
                      </div>
                      {/* 텍스트 정보 */}
                      <div className="p-4 bg-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-black text-white">장판 이음매 용착</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">이음매 벌어짐 · 들뜸 열용착 보수</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-full">무상</span>
                        </div>
                      </div>
                    </button>

                    {/* 벽지 들뜸 보수 */}
                    <button
                      type="button"
                      onClick={() => setActiveRepairCard(activeRepairCard === 'wallpaper' ? null : 'wallpaper')}
                      className={`w-full text-left rounded-2xl overflow-hidden border transition-all duration-300 ${
                        activeRepairCard === 'wallpaper'
                          ? 'border-amber-400/40 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[16/9] bg-slate-800 overflow-hidden">
                        {/* Before 이미지 */}
                        <img
                          src="/repair_wallpaper_before.png"
                          alt="벽지 들뜸 보수 전"
                          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 z-[1] ${
                            activeRepairCard === 'wallpaper' ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        {/* After 이미지 */}
                        <img
                          src="/repair_wallpaper_after.png"
                          alt="벽지 들뜸 보수 후"
                          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 z-[1] ${
                            activeRepairCard === 'wallpaper' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        {/* Before/After 뱃지 */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-lg transition-colors duration-300 ${
                            activeRepairCard === 'wallpaper'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {activeRepairCard === 'wallpaper' ? 'AFTER ✓' : 'BEFORE'}
                          </span>
                        </div>
                        {/* 터치 안내 */}
                        <div className="absolute bottom-3 right-3 z-10">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/80">
                            {activeRepairCard === 'wallpaper' ? '다시 터치하면 전' : '터치하면 후 →'}
                          </span>
                        </div>
                      </div>
                      {/* 텍스트 정보 */}
                      <div className="p-4 bg-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-black text-white">벽지 들뜸 보수</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">코너 벌어짐 · 이음새 들뜸 재접착</p>
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-full">무상</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 무상 강조 배너 */}
                <div className="px-5 lg:px-8 mb-6 lg:mb-10">
                  <div className="bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-400/20 rounded-2xl lg:rounded-3xl p-5 lg:p-10 text-center relative overflow-hidden">
                    <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />
                    <span className="text-2xl lg:text-4xl mb-2 lg:mb-4 block relative z-10">✨</span>
                    <p className="text-base lg:text-xl font-black text-white mb-1 lg:mb-2 break-keep relative z-10">
                      청소 비용 그대로,
                    </p>
                    <p className="text-lg lg:text-2xl font-black text-amber-400 mb-2 lg:mb-3 break-keep relative z-10">
                      보수 서비스는 무상입니다.
                    </p>
                    <p className="text-xs lg:text-sm text-slate-400 font-medium break-keep relative z-10">
                      프리미엄 청소 선택 시 추가 비용 없이 보수 포함
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
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
                        { id: '이사', label: '이사청소', sub: '이사나가고 빈집 청소', price: '평당 1.5만' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
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
                  </div>

                  <div>
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

                      {/* 거주 청소는 상단 청소 종류 선택으로 이관되어 여기서는 노출하지 않습니다. */}
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
                          {cleaningType === '이사' 
                            ? '평당 1.5만원' 
                            : (cleaningType === '거주' ? '평당 1.8만원' : '평당 2.0만원')
                          }
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
                          const isNotice = opt.isNotice;
                          const priceDisplay = opt.price > 0 ? `+${opt.price.toLocaleString()}원` : '';
                          
                          return (
                            <div 
                              key={opt.id}
                              className={`flex flex-col p-4 rounded-xl border transition-all select-none ${
                                count > 0 
                                ? 'bg-blue-600/20 border-blue-500 shadow-sm shadow-blue-500/20' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                              } ${(cat.type === 'toggle' || isNotice) ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                              onClick={() => {
                                if (cat.type === 'toggle' || isNotice) {
                                  updateOptionCount(opt.id, count > 0 ? -count : 1);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1 flex-1">
                                  <span className={`text-sm ${count > 0 ? 'text-blue-100 font-bold' : 'text-slate-300'} break-keep`}>
                                    {opt.label}
                                  </span>
                                  {priceDisplay && (
                                    <span className="text-xs text-slate-400">
                                      {priceDisplay}
                                    </span>
                                  )}
                                </div>
                                
                                {(cat.type === 'toggle' || isNotice) ? (
                                  <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                    count > 0 ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-500 text-transparent'
                                  }`}>
                                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                  </div>
                                ) : (
                                  <div 
                                    className={`flex items-center gap-3 rounded-lg p-1 border transition-colors shrink-0 ${count > 0 ? 'bg-slate-900/50 border-blue-500/20' : 'bg-slate-800/50 border-white/5'}`}
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

                              {isNotice && (
                                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400 space-y-1.5 leading-relaxed break-keep">
                                  <div className="font-bold text-slate-300">💡 추가 비용이 발생하는 경우 예시:</div>
                                  <div>• 실내 흡연으로 인한 니코틴 황변 및 냄새 제거 필요 시</div>
                                  <div>• 다량의 쓰레기 방치 및 특수 소독이 필요한 경우 (쓰레기집)</div>
                                  <div>• 곰팡이/스티커/시트지가 일반 범위를 초과하여 전체 면적에 가득한 경우</div>
                                  <div>• 빌트인 가전(냉장고, 에어컨 등) 내부 정밀 분해 청소 추가 요청 시</div>
                                </div>
                              )}

                              {count > 0 && !isNotice && (
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
                            } catch (err) {
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
                      <span className="material-symbols-outlined text-[16px]">business_center</span>
                      업체명 (인테리어 사업자 등)
                    </label>
                    <input
                      type="text"
                      placeholder="예) 인테리어 디자인하우스"
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
                    <label className="block text-slate-300 text-sm font-semibold mb-2">📞 담당자 연락처 <span className="text-rose-400">*</span></label>
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

                  {/* 필수 개인정보 제3자 제공 동의 */}
                  <div className="bg-slate-800/80 rounded-xl p-4 mt-6 border border-white/5">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isAgreedPersonalInfo}
                        onChange={(e) => setIsAgreedPersonalInfo(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-950 text-blue-500 focus:ring-blue-500 accent-blue-600 shrink-0"
                      />
                      <div className="flex-1 text-xs text-slate-300 leading-relaxed break-keep text-left">
                        <span className="font-bold text-blue-400">[필수]</span> 개인정보 제3자 제공 동의 및 책임 한계 안내에 동의합니다.
                        <button 
                          type="button" 
                          onClick={() => setShowPrivacyModal(true)} 
                          className="text-blue-400 hover:text-blue-300 underline ml-1.5 font-bold"
                        >
                          [상세 약관 보기]
                        </button>
                      </div>
                    </label>
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
                  <h2 className="text-2xl font-bold text-white mb-2">사업자 견적서 발급 완료!</h2>
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
                           <span className="text-slate-400 text-sm">
                             {cleaningType === '거주' ? '거주 청소비' : '기본 청소비'}
                           </span>
                           <span className="text-slate-200 font-medium">
                             {((typeof size === 'number' ? size : 0) * 
                               (cleaningType === '이사' ? 15000 : (cleaningType === '거주' ? 18000 : 20000))
                             ).toLocaleString()}원
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
                                    <span className="text-slate-300">{option.price > 0 ? `+${price.toLocaleString()}원` : '확인'}</span>
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
                  <button 
                    onClick={handleSubmitQuote}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined pb-0.5">check_circle</span>
                    예약 접수하기
                  </button>
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
            <div className="max-w-2xl mx-auto relative flex flex-col gap-3">
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
              
              <button
                onClick={handleNext}
                className={`w-full font-bold py-4 rounded-xl text-lg transition-all active:scale-[0.98] ${
                  step === 0
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-600 active:to-amber-700 text-slate-900 shadow-[0_8px_16px_rgba(245,158,11,0.3)]'
                    : 'bg-blue-600 active:bg-blue-700 text-white shadow-[0_8px_16px_rgba(37,99,235,0.25)]'
                }`}
              >
                {step === 0 ? '견적 시작하기 →' : step === 4 ? '다음' : '다음 단계로'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 개인정보 제3자 제공 동의 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 text-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h3 className="text-lg font-bold text-white">개인정보 제3자 제공 동의 및 중개 안내</h3>
                <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
              </div>
              
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed overflow-y-auto pr-1 max-h-[50vh] break-keep text-left">
                <div>
                  <h4 className="font-bold text-white text-sm mb-1.5">1. 개인정보를 제공받는 자</h4>
                  <p>청소타워에 등록된 서비스 수행 파트너사 (소비자가 직접 선택한 업체 혹은 견적 요청 지역 내 활동하는 추천 배정 파트너사)</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-1.5">2. 제공받는 자의 개인정보 이용 목적</h4>
                  <p>청소 견적 상세 안내, 시공 가능 일정 협의, 청소 시공 서비스의 수행 및 사후 관리(A/S) 등 목적</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-1.5">3. 제공하는 개인정보의 항목</h4>
                  <p>신청자명, 연락처, 시공 주소(도로명/지번 및 상세주소), 주거 형태, 면적(평수), 선택 옵션, 비밀번호(공동/현관) 및 고객 추가 요청사항</p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-1.5">4. 개인정보의 보유 및 이용 기간</h4>
                  <p className="font-semibold text-amber-400">청소 서비스 제공 완료 및 요금 정산 완료 시까지 (단, 관계 법령에 의거하여 보존할 필요가 있는 경우 관련 법령이 정한 기간 동안 보관)</p>
                </div>

                <div className="border-t border-white/10 pt-3 mt-3">
                  <h4 className="font-bold text-rose-400 text-sm mb-1.5">5. 통신판매중개 책임 한계 고지 (필수 확인)</h4>
                  <p className="text-slate-300 font-medium">청소타워는 청소 서비스의 통신판매중개자이며 거래 당사자가 아닙니다. 파트너 대표님이 독자적으로 제공하는 청소 서비스의 품질, 시공 미이행, 현장 파손, 하자보수 및 배상 책임은 실제 청소를 수행한 파트너사에게 있으며 본사는 중개 역할만 수행합니다. 동의를 거부하실 수 있으나 동의하지 않으실 경우 견적 요청 및 매칭이 제한됩니다.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
              <button 
                onClick={() => {
                  setIsAgreedPersonalInfo(true);
                  setShowPrivacyModal(false);
                }}
                className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
              >
                약관 동의 및 닫기
              </button>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-650 text-slate-300 text-sm font-bold rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* B2B 로그인 모달 */}
      <AnimatePresence>
        {showB2BLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowB2BLoginModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border-t border-white/10 rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:mb-0"
            >
              {/* 핸들바 */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-blue-500/15 border border-blue-400/30">
                  <span className="text-blue-400 text-xs">🔐</span>
                  <span className="text-[11px] font-bold text-blue-300">업체 인증 필요</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">예약 접수를 위해 로그인해주세요</h3>
                <p className="text-xs text-slate-400 font-medium">작성하신 견적 내용은 그대로 유지됩니다</p>
              </div>

              <form onSubmit={handleB2BLogin} className="space-y-3">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
                  placeholder="아이디 (가입 시 연락처)"
                  value={b2bLoginForm.id}
                  onChange={e => setB2bLoginForm({ ...b2bLoginForm, id: e.target.value })}
                />
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
                  placeholder="비밀번호"
                  value={b2bLoginForm.password}
                  onChange={e => setB2bLoginForm({ ...b2bLoginForm, password: e.target.value })}
                />

                {b2bLoginError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-red-400 text-xs">⚠️</span>
                    <span className="text-red-300 text-xs font-medium">{b2bLoginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={b2bLoginLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                >
                  {b2bLoginLoading ? '인증 중...' : '로그인 후 예약 접수'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={saveAndGoSignup}
                  className="text-sm text-slate-400 font-bold hover:text-white transition-colors"
                >
                  처음이신가요? <span className="text-blue-400 underline underline-offset-4">1분 가입</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
