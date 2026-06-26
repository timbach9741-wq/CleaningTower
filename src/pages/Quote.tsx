import React, { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DaumPostcode from 'react-daum-postcode';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { sendTelegramAlert } from '../telegramService';
import { getCurrentUser } from '../lib/authHelpers';

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
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const { type } = useParams();
  const location = useLocation();
  
  // 파트너 정보 상태 (우회 시 변경 가능하도록 state로 관리)
  const [partnerId, setPartnerId] = useState<string | null>(() => location.state?.selectedPartnerId || null);
  const [partnerName, setPartnerName] = useState<string | null>(() => location.state?.selectedPartnerName || null);
  const [partnerUnavailableDates, setPartnerUnavailableDates] = useState<string[]>([]);
  const [isInterceptOpen, setIsInterceptOpen] = useState(false);

  // 파트너 가능일 데이터 조회
  useEffect(() => {
    if (!partnerId) {
      setPartnerUnavailableDates([]);
      return;
    }
    const fetchPartnerDates = async () => {
      try {
        const partnerDocRef = doc(db, 'partners', partnerId);
        const partnerSnap = await getDoc(partnerDocRef);
        if (partnerSnap.exists()) {
          const data = partnerSnap.data();
          setPartnerUnavailableDates(data.unavailableDates || []);
          console.log(`[Quote] Loaded partner unavailable dates:`, data.unavailableDates);
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
  const [cleaningType, setCleaningType] = useState<'프리미엄' | '이사' | '거주' | '정기' | '가전'>(() => {
    if (type === 'general' || type === '이사' || type === 'move-in') return '이사';
    if (type === 'residence' || type === '거주') return '거주';
    if (type === 'regular' || type === '정기') return '정기';
    if (type === 'appliance' || type === '가전') return '가전';
    return '프리미엄';
  });
  const [size, setSize] = useState<number | ''>(24);
  const [sizeInputRaw, setSizeInputRaw] = useState<string>('24');
  const [m2Input, setM2Input] = useState<string>('');
  
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState(() => location.state?.preselectedRegion || '');
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
  
  const [referralCode, setReferralCode] = useState('');
  const [isReferralApplied, setIsReferralApplied] = useState(false);
  const handleApplyReferral = () => {
    const trimmed = referralCode.trim();
    if (trimmed.length > 0) {
      const myOwnCode = localStorage.getItem('myReferralCode');
      if (myOwnCode && trimmed === myOwnCode) {
        alert("자신의 추천인 코드는 사용할 수 없습니다. 친구의 추천인 코드를 입력해 주세요.");
        return;
      }
      setIsReferralApplied(true);
      alert("추천인 코드가 적용되어 10,000원이 할인되었습니다.");
    }
  };

  const [myCoupons, setMyCoupons] = useState<number>(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  
  useEffect(() => {
    const storedCoupons = localStorage.getItem('myCoupons');
    if (storedCoupons !== null) {
      setMyCoupons(parseInt(storedCoupons, 10) || 0);
    } else {
      setMyCoupons(1);
      localStorage.setItem('myCoupons', '1');
    }
  }, []);

  const handleApplyCoupon = () => {
    if (myCoupons > 0) {
      setIsCouponApplied(true);
    }
  };

  const handleCancelCoupon = () => {
    setIsCouponApplied(false);
  };
  
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
    if (cleaningType === '정기') return 0;
    let basePricePerPyeong = 15000;
    if (cleaningType === '프리미엄') {
      basePricePerPyeong = 20000;
    } else if (cleaningType === '거주') {
      basePricePerPyeong = 18000;
    } else if (cleaningType === '이사') {
      basePricePerPyeong = 15000;
    }

    const currentSize = typeof size === 'number' ? Math.round(size) : 0;
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

  const referralDiscount = isReferralApplied ? 10000 : 0;
  const couponDiscount = isCouponApplied ? 10000 : 0;
  const depositAmount = 50000; // 고정 매칭비 5만원
  // 현장 결제 예상 잔금 (총 비용 - 매칭비 - 쿠폰)
  const onSitePaymentAmount = Math.max(0, estimatedPrice - depositAmount - referralDiscount - couponDiscount);

  const handleSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSizeInputRaw(val);
    if (val === '') {
      setSize('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setSize(Math.round(num));
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
      if (!selectedOptions['extra_charge_notice']) {
        setErrorMsg('현장 상황에 따른 추가 비용 발생 안내사항을 확인하고 동의해주세요.');
        return;
      }
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
        const isDateUnavailable = partnerUnavailableDates.includes(cleaningDate);
        if (isDateUnavailable) {
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
      if (!isAgreedPersonalInfo) {
        setErrorMsg('개인정보 제3자 제공 및 약관 동의가 필요합니다.');
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
      totalPrice: estimatedPrice,
      status: '대기중',
      createdAt: new Date(),
      userId: getCurrentUser()?.id || null,

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
    if (!isAgreedPersonalInfo) {
      alert('개인정보 제3자 제공 및 약관 동의가 필요합니다. 동의란에 체크해주세요.');
      return;
    }
    try {
      const payload = buildQuotePayload();
      let assignedToId = partnerId;
      let assignedPartnerName = partnerName;

      if (cleaningType === '정기' || cleaningType === '가전') {
        assignedToId = null;
        assignedPartnerName = '본사 수동 배정';
      } else if (!assignedToId && address) {
        // 자동 배정(Fast Booking)인 경우: 배정 로직 없이 전체 파트너에게 알림 전송 (Broadcasting)
        assignedPartnerName = '추천 파트너 (전체 알림 발송됨)';
        console.log(`[빠른 배정] 특정 업체 지정 없이 지역 내 전체 파트너에게 알림을 발송합니다.`);
      }

      // 최종 견적 데이터 저장
      const docRef = await addDoc(collection(db!, 'quotes'), {
        ...payload,
        assignedTo: assignedToId || null,
        designatedPartnerName: assignedPartnerName || null,
        couponApplied: isCouponApplied,
        referralApplied: isReferralApplied,
        discountAmount: referralDiscount + couponDiscount,
        finalPrice: onSitePaymentAmount, // 현장 결제 예상 잔금
        depositAmount: depositAmount // 매칭비(예약금)
      });
      setCreatedQuoteId(docRef.id);

      // 쿠폰 사용 시 보유 쿠폰 차감
      if (isCouponApplied) {
        const nextCoupons = Math.max(0, myCoupons - 1);
        localStorage.setItem('myCoupons', nextCoupons.toString());
        setMyCoupons(nextCoupons);
      }

      // 정기 구독 및 가전 분해 세척 전용 텔레그램 알림 전송
      if (cleaningType === '정기' || cleaningType === '가전') {
        const title = cleaningType === '정기' ? '[정기 구독 청소 신청 접수]' : '[가전 분해 세척 신청 접수]';
        const note = cleaningType === '정기' 
          ? '* 정기 청소 건은 파트너스앱에 노출되지 않으며, 관리자 확인 후 수동 배정이 필요합니다.'
          : '* 가전 세척 건은 파트너스앱에 노출되지 않으며, 관리자 확인 후 수동 배정이 필요합니다.';
        const tgMessage = `<b>🚨 ${title}</b>\n\n` +
                          `• <b>신청자:</b> ${businessName || '이름 미상'}\n` +
                          `• <b>연락처:</b> ${contactInfo}\n` +
                          `• <b>시공 희망일:</b> ${cleaningDate} (${cleaningTime || '시간 협의'})\n` +
                          `• <b>주소:</b> ${address} ${detailAddress}\n` +
                          `• <b>현장 정보:</b> ${houseType} (${houseSubType || '구조 미선택'}) / ${size}평\n` +
                          `• <b>바닥재/주차:</b> ${floorType} / 주차 ${parking}\n` +
                          `• <b>추가 메모:</b> ${memos || '없음'}\n\n` +
                          `<i>${note}</i>`;
        await sendTelegramAlert(tgMessage);
      }
      
      const successMsg = (cleaningType === '정기' || cleaningType === '가전')
        ? `${cleaningType === '정기' ? '정기 구독 청소' : '가전 분해 세척'} 예약이 성공적으로 접수되었습니다.\n상세 상담 및 안내를 위해 본사 담당자가 빠른 시간 내에 연락드리겠습니다.`
        : assignedPartnerName 
          ? `예약이 성공적으로 접수되었습니다.\n${assignedPartnerName} 업체에 견적이 전달되었습니다.`
          : '예약이 성공적으로 접수되었습니다.\n최적의 전문 파트너를 배정 중입니다.';
      
      setSuccessMessage(successMsg);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Failed to save quote", err);
      alert('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleTossPayment = () => {
    if (!createdQuoteId) {
      alert('오류: 접수 번호를 찾을 수 없습니다.');
      return;
    }

    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_GjLJoRLbvxGLwR6M4935V4w2x1G3';
    if (!(window as any).TossPayments) {
      alert('결제 모듈을 로드하는 데 실패했습니다. 페이지를 새로고침 해주세요.');
      return;
    }

    try {
      const tossPayments = (window as any).TossPayments(clientKey);
      
      tossPayments.requestPayment('카드', {
        amount: depositAmount,
        orderId: createdQuoteId,
        orderName: `${cleaningType || '청소'} 서비스 예약 계약금`,
        customerName: businessName || '고객',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('결제창 호출 실패:', error);
      alert('결제창을 여는 도중 에러가 발생했습니다.');
    }
  };

  const handleRemittance = (type: 'toss' | 'kakao') => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobileDevice) {
      alert("모바일 기기에서 토스/카카오톡 앱이 설치되어 있어야 즉시 송금이 가능합니다. PC 환경이시라면 아래 계좌 정보 복사 기능을 이용해 이체해 주세요!");
      return;
    }

    if (type === 'toss') {
      const tossUrl = `supertoss://send?bank=신협&account=131022991902&amount=${depositAmount}`;
      window.location.href = tossUrl;
    } else {
      const kakaoUrl = `kakaotalk://kakaopay/money/to/bank?bank_code=048&account_no=131022991902&amount=${depositAmount}`;
      window.location.href = kakaoUrl;
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('131-022-991902').then(() => {
      alert('계좌번호(신협 131-022-991902)가 복사되었습니다. 주거래 은행 앱에 붙여넣기 하여 이체해 주세요.');
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  const [isSimpleForm, setIsSimpleForm] = useState(() => cleaningType === '정기' || cleaningType === '가전');

  useEffect(() => {
    setIsSimpleForm(cleaningType === '정기' || cleaningType === '가전');
  }, [cleaningType]);

  const handleSimpleFinish = async () => {
    if (!businessName.trim()) {
      alert('신청자 이름을 입력해주세요.');
      return;
    }
    if (!contactInfo.trim()) {
      alert('연락처를 입력해주세요.');
      return;
    }
    if (!address.trim()) {
      alert('방문 주소를 선택해주세요.');
      return;
    }
    if (!cleaningDate) {
      alert('희망 날짜를 선택해주세요.');
      return;
    }
    if (!cleaningTime) {
      alert('희망 시간을 선택해주세요.');
      return;
    }
    if (cleaningType === '가전' && !memos.trim()) {
      alert('원활한 견적 상담을 위해 세척하실 가전 종류를 상세히 기재해주세요.');
      return;
    }
    if (!isAgreedPersonalInfo) {
      alert('개인정보 제3자 제공 및 약관 동의가 필요합니다. 동의란에 체크해주세요.');
      return;
    }
    await handleFinish();
  };

  const handleGoToPartnerList = () => {
    if (!isAgreedPersonalInfo) {
      alert('개인정보 제3자 제공 및 약관 동의가 필요합니다. 동의란에 체크해주세요.');
      return;
    }
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
            {isSimpleForm ? `${cleaningType === '정기' ? '정기 구독 청소' : '가전 청소'} 신청서` : `견적 마법사 (${cleaningType})`}
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-5 pb-28 flex flex-col relative overflow-hidden">
        
        {/* Progress Bar (상단 고정) */}
        {!isSimpleForm && (
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

            {/* ================= 간편 폼 (정기/가전 전용) ================= */}
            {isSimpleForm && (
              <motion.div
                key="simpleForm"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full space-y-6"
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {cleaningType === '정기' ? '정기 구독 청소' : '에어컨/세탁기 청소'}<br/>
                    간편 상담 신청서
                  </h2>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    복잡한 절차 없이 기본 정보만 입력하시면 본사에서 확인 후 친절한 견적 상담 전화를 드립니다.
                  </p>
                </div>

                <div className="space-y-5 pb-6">
                  {/* 이름 */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      👤 신청자 이름 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="예) 홍길동"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 focus:border-blue-600 focus:bg-blue-500/5 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* 연락처 */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      📞 연락처 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="예) 010-0000-0000"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 focus:border-blue-600 focus:bg-blue-500/5 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* 주소 */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      📍 방문할 주소 <span className="text-rose-400">*</span>
                    </label>
                    {isOpenPostcode ? (
                      <div className="bg-white rounded-xl overflow-hidden pb-1 relative transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700">
                        <div className="flex justify-between items-center p-3 bg-slate-100 border-b border-slate-200">
                          <span className="text-slate-700 font-bold text-sm ml-1">주소 검색</span>
                          <button type="button" onClick={() => setIsOpenPostcode(false)} className="text-slate-500 p-1 hover:bg-slate-200 rounded-md transition-colors flex items-center justify-center">
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
                      <div className="space-y-2.5">
                        <div 
                          onClick={() => setIsOpenPostcode(true)}
                          className="w-full bg-white/5 border border-white/15 hover:border-blue-500/50 rounded-xl px-4 py-3.5 text-base transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] active:bg-white/10"
                        >
                          <span className={address ? "text-white" : "text-slate-500"}>
                            {address || "터치하여 도로명/지번 주소 검색"}
                          </span>
                          <span className={`${address ? 'text-blue-400' : 'text-slate-400'} material-symbols-outlined text-xl`}>search</span>
                        </div>
                        {address && (
                          <input
                            type="text"
                            placeholder="나머지 상세 주소 (동/호수)"
                            value={detailAddress}
                            onChange={(e) => setDetailAddress(e.target.value)}
                            className="w-full bg-white/5 border border-white/15 focus:border-blue-500 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none transition-all focus:bg-blue-500/5 mt-1"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* 일정 */}
                  {!isOpenPostcode && (
                    <>
                      <div>
                        <label className="block text-slate-300 text-sm font-semibold mb-2">
                          📅 희망 방문 날짜 <span className="text-rose-400">*</span>
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
                                //
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
                          <div className={`w-full bg-white/5 border ${cleaningDate ? 'border-blue-500 bg-blue-500/10' : 'border-white/15 group-hover:border-blue-500/50'} rounded-xl px-4 py-3.5 text-base transition-all flex items-center justify-between pointer-events-none`}>
                            <span className={cleaningDate ? 'text-blue-100 font-bold tracking-wide' : 'text-slate-500'}>
                              {cleaningDate ? cleaningDate.replace(/-/g, '. ') : '터치하여 날짜 선택'}
                            </span>
                            <span className={`material-symbols-outlined ${cleaningDate ? 'text-blue-400' : 'text-slate-400'} transition-colors`}>
                              calendar_month
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 희망 방문 시간 */}
                      <div>
                        <label className="block text-slate-300 text-sm font-semibold mb-2">
                          ⏰ 희망 방문 시간 <span className="text-rose-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {['오전 7시~9시 시작', '오후 13시~15시 시작'].map(timeOption => (
                            <button
                              key={timeOption}
                              type="button"
                              onClick={() => setCleaningTime(timeOption)}
                              className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
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
                    </>
                  )}

                  {/* 추가 메모 */}
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      ✏️ 상세 신청 내용 {cleaningType === '가전' ? <span className="text-rose-400">*</span> : <span className="text-slate-500">(선택)</span>}
                    </label>
                    <textarea
                      placeholder={
                        cleaningType === '가전' 
                        ? "원활한 상담을 위해 세척하실 가전 종류(예: 스탠드 에어컨 1대, 통돌이 세탁기 1대 등)를 필히 작성해주세요." 
                        : "대략적인 평수나 원하는 주기(예: 주 1회, 격주 등), 요청사항이 있으시면 적어주세요."
                      }
                      value={memos}
                      onChange={(e) => setMemos(e.target.value)}
                      rows={4}
                      className="w-full bg-white/5 border border-white/15 focus:border-blue-600 focus:bg-blue-500/5 rounded-xl px-4 py-4 text-base text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* 동의 */}
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
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

                  {/* 제출 버튼 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSimpleFinish}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-base shadow-[0_8px_16px_rgba(37,99,235,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      상담 신청서 제출하기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 1: 주거 형태 및 평수 ================= */}
            {!isSimpleForm && step === 1 && (
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
                        { id: '정기', label: '정기 구독 청소', sub: '평수/주기별 맞춤 홈케어', price: '상담 후 결정' },
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => setCleaningType(item.id as '프리미엄' | '이사' | '거주' | '정기')}
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
                    <label className="block text-slate-300 text-sm font-semibold mb-2">📐 공급 면적</label>
                    {/* m² → 평 변환기 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-400 text-lg shrink-0">calculate</span>
                      <input
                        type="number"
                        value={m2Input}
                        onChange={(e) => setM2Input(e.target.value)}
                        placeholder="m² 입력"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-all
                                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-blue-300 text-sm font-bold shrink-0">m²</span>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(m2Input);
                          if (!isNaN(val) && val > 0) {
                            const pyeong = Math.round(val / 3.3058);
                            setSize(pyeong);
                            setSizeInputRaw(String(pyeong));
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-xs font-bold text-white whitespace-nowrap shrink-0"
                      >
                        변환
                      </button>
                    </div>

                    <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3.5 mb-4 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-rose-500 text-[18px] shrink-0 mt-0.5">error</span>
                      <div className="flex-1 text-xs leading-relaxed break-keep">
                        <div className="text-rose-200/90 font-bold">
                          견적 면적은 반드시 <span className="text-white underline underline-offset-2 font-black">공급 면적(분양 평수)</span>으로 입력해 주세요.
                        </div>
                        <div className="text-[11px] text-rose-300/70 mt-1 font-semibold">
                          (실평수 기입 시 현장 추가금이 발생할 수 있습니다.)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 border border-white/15 rounded-xl p-4 focus-within:border-blue-500 focus-within:bg-blue-500/5 transition-all">
                      <div className="flex flex-1 items-center gap-2 mr-3">
                        <input 
                          type="number" 
                          value={sizeInputRaw}
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
                          {cleaningType === '정기' || cleaningType === '가전' ? '상담 후 결정' :
                           cleaningType === '이사' ? '평당 1.5만원' : 
                           cleaningType === '거주' ? '평당 1.8만원' : 
                           '평당 2.0만원'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 중간 견적 안내 박스 */}
                <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-800/60 p-4 rounded-xl flex flex-col border border-white/5 shadow-lg gap-3">
                  {cleaningType === '정기' || cleaningType === '가전' ? (
                    <div className="text-center py-2 text-blue-300 font-bold text-sm">
                      {cleaningType === '정기' 
                        ? '정기 구독 청소는 평수 및 주기에 따라 상담 후 요금이 결정됩니다.'
                        : '가전 분해 세척은 기기 종류 및 대수에 따라 상담 후 요금이 결정됩니다.'
                      }
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-end pt-1">
                        <span className="text-blue-300 font-bold text-[15px] mb-1">총 청소 비용 (예상)</span>
                        <div className="text-right">
                          <span className="text-white font-black text-2xl drop-shadow-md">
                            {estimatedPrice.toLocaleString()}
                          </span>
                          <span className="text-blue-200 text-sm ml-1 font-bold">원</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= STEP 2: 세부사항 선택 ================= */}
            {!isSimpleForm && step === 2 && (
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
            {!isSimpleForm && step === 3 && (
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
            {!isSimpleForm && step === 4 && (
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
            {!isSimpleForm && step === 5 && (
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
                  <h2 className="text-2xl font-bold text-white mb-2">{cleaningType === '정기' || cleaningType === '가전' ? '예약 상담 신청 완료!' : '예상 견적서 발급 완료!'}</h2>
                  <p className="text-slate-400 text-sm">{cleaningType === '정기' || cleaningType === '가전' ? '입력해주신 정보를 바탕으로 상담 도와드리겠습니다.' : '입력해주신 정보 기반의 산출 금액입니다.'}</p>
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
                        {isReferralApplied && cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center mt-3">
                            <span className="text-emerald-400 text-sm font-bold">추천인 코드 할인</span>
                            <span className="text-emerald-400 font-bold">-{referralDiscount.toLocaleString()}원</span>
                         </div>
                       )}

                       {isCouponApplied && cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center mt-2">
                            <span className="text-emerald-400 text-sm font-bold">할인 쿠폰 적용</span>
                            <span className="text-emerald-400 font-bold">-{couponDiscount.toLocaleString()}원</span>
                         </div>
                       )}
                     </div>
                     
                     <div className="space-y-3 pb-4 border-b border-dashed border-white/10 mb-4">
                       {cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">{cleaningType === '거주' ? '거주 청소비 (기본비용 포함)' : '기본 청소비'}</span>
                            <span className="text-slate-200 font-medium">
                              {((typeof size === 'number' ? size : 0) * (cleaningType === '프리미엄' ? 20000 : cleaningType === '거주' ? 18000 : 15000)).toLocaleString()}원
                            </span>
                         </div>
                       )}
                       {(cleaningType === '정기' || cleaningType === '가전') && (
                         <div className="text-center py-2 text-blue-300 font-bold text-sm">
                            {cleaningType === '정기' 
                              ? '정기 구독 청소는 평수 및 주기에 따라 상담 후 요금이 결정됩니다.'
                              : '가전 분해 세척은 기기 종류 및 대수에 따라 상담 후 요금이 결정됩니다.'}
                         </div>
                       )}
                       {isBetweenCleaning && cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">당일 이사 (사이청소)</span>
                            <span className="text-slate-200 font-medium">+100,000원</span>
                         </div>
                       )}
                       {elevator === '없음' && isHighFloorWithoutElevator && cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">엘리베이터 없음 (3층 이상)</span>
                            <span className="text-slate-200 font-medium">+30,000원</span>
                         </div>
                       )}
                       {Object.keys(selectedOptions).length > 0 && cleaningType !== '정기' && cleaningType !== '가전' && (
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
                           <span className="text-slate-400 text-sm font-bold">총 청소 요금 (현장 결제 예상액)</span>
                           <span className="text-slate-200 font-bold">{cleaningType === '정기' || cleaningType === '가전' ? '상담 후 결정' : `${estimatedPrice.toLocaleString()}원`}</span>
                       </div>

                       <div className="flex justify-between items-center mt-2 border-b border-white/10 pb-3">
                           <span className="text-blue-300 text-sm font-bold">플랫폼 예약금 (오늘 결제)</span>
                           <span className="text-blue-300 font-bold">{cleaningType === '정기' || cleaningType === '가전' ? '50,000원' : `${depositAmount.toLocaleString()}원`}</span>
                       </div>
                       
                       {isReferralApplied && cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center mt-3">
                            <span className="text-emerald-400 text-sm font-bold">추천인 코드 할인</span>
                            <span className="text-emerald-400 font-bold">-{referralDiscount.toLocaleString()}원 (현장 차감)</span>
                         </div>
                       )}

                       {isCouponApplied && cleaningType !== '정기' && cleaningType !== '가전' && (
                         <div className="flex justify-between items-center mt-2">
                            <span className="text-emerald-400 text-sm font-bold">할인 쿠폰 적용</span>
                            <span className="text-emerald-400 font-bold">-{couponDiscount.toLocaleString()}원 (현장 차감)</span>
                         </div>
                       )}
                     </div>

                     <div className="flex flex-col gap-1 pt-2 mt-2">
                        <div className="flex justify-between items-end">
                          <span className="text-rose-300 text-base font-bold mb-1">예상 현장 결제 잔금</span>
                          <div className="text-right">
                            <span className="text-[32px] font-black text-rose-400 leading-none shadow-rose-500/50 drop-shadow-md">
                              {cleaningType === '정기' || cleaningType === '가전' ? '상담 후 결정' : onSitePaymentAmount.toLocaleString()}
                            </span>
                            {cleaningType !== '정기' && cleaningType !== '가전' && <span className="text-rose-300 text-base ml-1 font-bold">원</span>}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 text-right mt-1">* 예약금과 쿠폰 할인이 모두 차감된 최종 금액입니다.</p>
                     </div>
                   </div>
                </div>

                {/* 보유 할인 쿠폰 사용 */}
                {cleaningType !== '정기' && cleaningType !== '가전' && myCoupons > 0 && (
                  <div className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-white/5 flex flex-col gap-2">
                    <span className="text-[13px] text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                      보유 할인 쿠폰
                    </span>
                    <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">친구 추천 1만원 할인 쿠폰</span>
                        <span className="text-xs text-slate-400">보유 수량: {myCoupons}장</span>
                      </div>
                      <button 
                        type="button"
                        onClick={isCouponApplied ? handleCancelCoupon : handleApplyCoupon}
                        className={`font-bold py-1.5 px-3.5 rounded-xl text-xs sm:text-sm transition-all ${
                          isCouponApplied 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                        }`}
                      >
                        {isCouponApplied ? '적용 취소' : '쿠폰 적용'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 추천인 코드 입력란 */}
                {cleaningType !== '정기' && cleaningType !== '가전' && (
                  <div className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-white/5 flex flex-col gap-2">
                    <span className="text-[13px] text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">redeem</span>
                      추천인 코드
                    </span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="추천인 코드를 입력하세요"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        disabled={isReferralApplied}
                        className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                      <button 
                        onClick={handleApplyReferral}
                        disabled={isReferralApplied || referralCode.trim().length === 0}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all"
                      >
                        {isReferralApplied ? '적용 완료' : '적용'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 계약금 입금 안내 */}
                <div className="bg-blue-950/40 rounded-xl p-4 mb-4 border border-blue-500/20 text-left">
                  <p className="text-blue-400 text-[13px] font-bold mb-1.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    예약 확정을 위한 계약금 입금 안내
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    원활한 서비스 진행과 노쇼 방지를 위해{' '}
                    <strong className="text-rose-400 font-bold">
                      플랫폼 예약금 {depositAmount.toLocaleString()}원
                    </strong>
                    을 아래 방법으로 입금해 주시면 예약이 최종 확정됩니다.
                  </p>

                  {/* 간편 송금 버튼 제거됨 */}

                  {/* 계좌 정보 */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-slate-400 font-medium text-sm">입금 계좌</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-400 tracking-wider select-all text-xl md:text-2xl">신협 131-022-991902</span>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-100 rounded-lg text-sm font-bold transition-all border border-white/20 active:scale-95 whitespace-nowrap"
                        >
                          복사
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                      <span className="text-slate-400 font-medium text-sm">예금주</span>
                      <span className="text-slate-100 font-bold text-lg md:text-xl">주식회사 청소타워</span>
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
                  <div className={`grid ${(partnerName || cleaningType === '정기' || cleaningType === '가전') ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <button 
                      onClick={handleFinish}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl text-sm md:text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined pb-0.5 text-lg">bolt</span>
                      {cleaningType === '정기' ? '정기 구독 청소 예약하기' : cleaningType === '가전' ? '가전 분해 세척 예약하기' : (partnerName ? `${partnerName} 파트너에게 지정 예약` : '빠른 예약 (자동 배정)')}
                    </button>
                    {!partnerName && cleaningType !== '정기' && cleaningType !== '가전' && (
                      <button 
                        onClick={handleGoToPartnerList}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-sm md:text-base shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined pb-0.5 text-lg">search</span>
                        파트너 직접 선택
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="tel:031-499-9509"
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-white/15"
                    >
                      <span className="material-symbols-outlined text-lg">call</span>
                      전화 상담
                    </a>
                    <a
                      href="http://pf.kakao.com/_xnHTnX/chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-bold py-4 rounded-xl text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.24 4.6 6.55-.26.96-.94 3.44-.97 3.56-.03.11.02.22.11.27.09.05.21.05.3 0 .12-.06 3.65-2.48 4.2-2.87.56.09 1.15.13 1.76.13 5.52 0 10-3.51 10-7.84S17.52 3 12 3z"/></svg>
                      카카오톡 문의
                    </a>
                  </div>
                  <p className="text-center text-xs text-slate-500 mt-1">
                    사무실 <a href="tel:031-499-9509" className="text-slate-400 hover:text-blue-400 transition-colors">031-499-9509</a> (평일 09:00~18:00)
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* 하단 플로팅 네비게이션 버튼 (Step 1~4 전용) */}
      <AnimatePresence>
        {step < 5 && !isSimpleForm && (
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
                  href="tel:031-499-9509"
                  className="w-14 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-[0.95] border border-white/15"
                  aria-label="전화 상담"
                >
                  <span className="material-symbols-outlined text-[22px]">call</span>
                </a>
                <a
                  href="http://pf.kakao.com/_xnHTnX/chat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] flex items-center justify-center rounded-xl shadow-sm transition-all active:scale-[0.95]"
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

      {/* 개인정보 제3자 제공 동의 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 text-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col justify-between">
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
      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-blue-600">check_circle</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 whitespace-pre-wrap">{successMessage}</h3>
              
              <div className="bg-blue-50/80 rounded-xl p-4 mt-5 border border-blue-100 text-left">
                <p className="text-blue-800 font-bold mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">info</span>
                  예약 확정 안내
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  원활한 서비스 진행과 노쇼 방지를 위해 <strong className="text-rose-500 font-black">계약금 {depositAmount.toLocaleString()}원</strong>만 입금해주시면 예약이 최종 확정됩니다.
                </p>
                <div className="bg-white p-4 rounded-xl border border-blue-200 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <span className="text-slate-500 font-medium text-sm">입금 계좌</span>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-700 tracking-wider text-xl md:text-2xl select-all">신협 131-022-991902</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <span className="text-slate-500 font-medium text-sm">예금주</span>
                    <span className="font-bold text-slate-900 text-lg md:text-xl">주식회사 청소타워</span>
                  </div>
                </div>

                {/* 에스크로 심사 완료 후 활성화 예정
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold">또는 간편 결제</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleTossPayment}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <span className="material-symbols-outlined text-lg">credit_card</span>
                  카드/간편결제 결제하기
                </button>
                */}
              </div>
            </div>
            <div className="p-4 pt-0">
              <button 
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-lg"
              >
                확인 및 메인으로 이동
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

