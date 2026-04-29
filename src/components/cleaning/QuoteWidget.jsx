import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DaumPostcode from 'react-daum-postcode';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Search, Calendar, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

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

export default function QuoteWidget() {
  const [step, setStep] = useState(1);

  // Step 1
  const [houseType, setHouseType] = useState('아파트');
  const [houseSubType, setHouseSubType] = useState('');
  const [size, setSize] = useState(24);
  const [cleaningType] = useState('일반'); 
  const [isBetweenCleaning, setIsBetweenCleaning] = useState(false);
  const [isOccupiedCleaning, setIsOccupiedCleaning] = useState(false);

  // Step 2
  const [selectedOptions, setSelectedOptions] = useState({});

  // Step 3
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isOpenPostcode, setIsOpenPostcode] = useState(false);
  const [cleaningDate, setCleaningDate] = useState('');
  const [cleaningTime, setCleaningTime] = useState('');

  // Step 4
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [memos, setMemos] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBetweenCleaningToggle = () => {
    const nextState = !isBetweenCleaning;
    setIsBetweenCleaning(nextState);
    if (nextState) {
      setCleaningTime('사이청소 10시 투입');
    } else if (cleaningTime === '사이청소 10시 투입') {
      setCleaningTime('');
    }
  };

  const updateOptionCount = (id, delta) => {
    setSelectedOptions(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const newOptions = { ...prev };
      if (next === 0) delete newOptions[id];
      else newOptions[id] = next;
      return newOptions;
    });
  };

  const getEstimatedPrice = () => {
    let basePricePerPyeong = cleaningType === '일반' ? 15000 : 20000;
    if (cleaningType === '일반' && isOccupiedCleaning) {
      basePricePerPyeong = 18000;
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
          total += option.price * currentSize * count; 
        } else {
          total += option.price * count;
        }
      }
    });
    
    return total;
  }

  const estimatedPrice = getEstimatedPrice();
  const vatPrice = Math.floor(estimatedPrice * 0.1);
  const totalPriceIncVat = estimatedPrice + vatPrice;

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
      // no validation required
    } else if (step === 3) {
      if (!address.trim() && !cleaningDate) {
        setErrorMsg('정확한 견적을 위해 주소나 일정을 입력해주세요.');
        return;
      }
    } else if (step === 4) {
      if (!contactInfo.trim()) {
        setErrorMsg('연락처는 필수 항목입니다!');
        return;
      }
      // Submit form
      handleSubmitQuote();
      return; // prevent setting step here
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (step > 1 && step < 5) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmitQuote = async () => {
    setIsSubmitting(true);
    try {
      const optionLabels = Object.entries(selectedOptions).map(([id, count]) => {
        const option = optionsList.find(o => o.id === id);
        if (!option) return null;
        
        const category = optionCategories.find(cat => cat.items.some(i => i.id === id));
        if (category?.type === 'toggle') {
          return option.label;
        }
        return `${option.label} (${count}개)`;
      }).filter(Boolean);
      
      if (isBetweenCleaning) optionLabels.push('당일 이사 (사이청소)');
      if (isOccupiedCleaning && cleaningType === '일반') optionLabels.push('거주 청소 (짐 있음)');

      const memoParts = [];
      if (memos) memoParts.push(`[추가메모] ${memos}`);
      const finalDetail = memoParts.length > 0 ? memoParts.join('\n') : '특이사항 없음';

      if (db) {
        await addDoc(collection(db, 'quotes'), {
          date: cleaningDate || '미정',
          time: cleaningTime || '시간협의',
          name: customerName || '홈페이지 고객',
          customerName: customerName || '홈페이지 고객',
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
        setStep(5); // Go to step 5 (견적완료)
      } else {
        setErrorMsg('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (err) {
      console.error("Failed to save quote", err);
      setErrorMsg('접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden relative text-left mx-auto flex flex-col h-[750px]">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <button 
          onClick={handlePrev} 
          className={`flex items-center justify-center p-2 -ml-2 rounded-full transition-colors ${step > 1 && step < 5 ? 'text-slate-600 hover:bg-slate-100' : 'text-transparent pointer-events-none'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-lg text-slate-800 tracking-tight text-center flex-1 pr-8">
          견적 마법사
        </span>
      </div>

      <div className="flex-1 flex flex-col relative px-6 py-5 overflow-hidden">
        {/* Progress Bar */}
        {step < 5 && (
          <div className="mb-6 shrink-0">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 px-1">
              <span className={step >= 1 ? 'text-blue-600' : ''}>면적/단가</span>
              <span className={step >= 2 ? 'text-blue-600' : ''}>세부사항</span>
              <span className={step >= 3 ? 'text-blue-600' : ''}>일정/주소</span>
              <span className={step >= 4 ? 'text-blue-600' : ''}>정보입력</span>
              <span className={step >= 5 ? 'text-blue-600' : ''}>견적완료</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                initial={{ width: '20%' }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 relative w-full h-full overflow-y-auto custom-scrollbar pr-1 pb-32">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: 면적단가 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">우리집 공간 정보를<br/>알려주세요.</h2>
                  <p className="text-slate-500 text-sm mt-2">입력된 정보를 바탕으로 단가가 적용됩니다.</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">💡 주거 형태</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['아파트', '빌라', '오피스텔'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setHouseType(type);
                            setHouseSubType('');
                          }}
                          className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            houseType === type 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {houseType && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {['원룸', '분리형 원룸', '투룸', '쓰리룸 이상', '복층', '기타'].map(sub => (
                            <button
                              key={sub}
                              onClick={() => setHouseSubType(sub)}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                houseSubType === sub
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
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
                    <label className="block text-slate-700 text-sm font-bold mb-2">🚚 이사 형태 특이사항</label>
                    <div className="space-y-2">
                      <button
                        onClick={handleBetweenCleaningToggle}
                        className={`w-full p-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${
                          isBetweenCleaning 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isBetweenCleaning ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </div>
                          <div className="flex flex-col text-left -mt-0.5">
                            <span className="text-[14px]">당일 이사 후 바로 청소</span>
                            <span className="text-slate-500 text-[11px] font-normal mt-0.5">(사이청소 10시 투입)</span>
                          </div>
                        </div>
                        <span className={isBetweenCleaning ? 'text-blue-600 font-bold' : 'text-slate-500'}>+100,000원</span>
                      </button>

                      <button
                        onClick={() => setIsOccupiedCleaning(!isOccupiedCleaning)}
                        className={`w-full p-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${
                          isOccupiedCleaning 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isOccupiedCleaning ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </div>
                          <div className="flex flex-col text-left -mt-0.5">
                            <span className="text-[14px]">거주청소 (현재 거주 중)</span>
                            <span className="text-slate-500 text-[11px] font-normal mt-0.5">(짐이 있는 상태)</span>
                          </div>
                        </div>
                        <span className={isOccupiedCleaning ? 'text-blue-600 font-bold' : 'text-slate-500'}>평당 1.8만</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">📏 공급 면적 (평)</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-1">
                      <input 
                        type="number" 
                        value={size}
                        onChange={(e) => setSize(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="예: 24"
                        className="flex-1 bg-transparent px-4 py-2 text-slate-900 font-extrabold text-2xl outline-none"
                      />
                      <span className="text-slate-500 font-bold px-2">평</span>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold mr-2 shrink-0">
                        {isOccupiedCleaning ? '평당 1.8만' : '평당 1.5만'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: 세부사항 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">청소 진행 시<br/>추가 옵션을 선택해주세요.</h2>
                  <p className="text-slate-500 text-sm mt-2">필요하지 않다면 바로 다음으로 넘어가셔도 됩니다.</p>
                </div>

                <div className="space-y-6">
                  {optionCategories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-700">{cat.category}</h3>
                      <div className="space-y-2">
                        {cat.items.map(opt => {
                          const count = selectedOptions[opt.id] || 0;
                          return (
                            <div 
                              key={opt.id}
                              className={`flex flex-col p-3.5 rounded-xl border transition-all select-none ${
                                count > 0 
                                ? 'bg-blue-50 border-blue-500 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              } ${cat.type === 'toggle' ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (cat.type === 'toggle') {
                                  updateOptionCount(opt.id, count > 0 ? -count : 1);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-sm font-bold ${count > 0 ? 'text-blue-900' : 'text-slate-700'}`}>
                                    {opt.label}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {opt.id === 'phytoncide' ? `평당 +${opt.price.toLocaleString()}원` : `+${opt.price.toLocaleString()}원`}
                                  </span>
                                </div>
                                
                                {cat.type === 'toggle' ? (
                                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${
                                    count > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent'
                                  }`}>
                                    <Check className="w-4 h-4 font-bold" />
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-3 rounded-lg p-1 border transition-colors ${count > 0 ? 'bg-white border-blue-200' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                                    <button 
                                      onClick={() => updateOptionCount(opt.id, -1)}
                                      disabled={count === 0}
                                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${count > 0 ? 'bg-slate-50 text-slate-600 active:bg-slate-100 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className={`w-5 text-center font-bold text-sm ${count > 0 ? 'text-blue-600' : 'text-slate-600'}`}>{count}</span>
                                    <button 
                                      onClick={() => updateOptionCount(opt.id, 1)}
                                      className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 active:bg-blue-100 hover:bg-blue-100"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: 일정/주소 */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">방문할 주소와<br/>일정을 선택해주세요.</h2>
                </div>

                <div className="space-y-6">
                  {isOpenPostcode ? (
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-300 shadow-md">
                       <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200">
                          <span className="text-slate-700 font-bold text-sm ml-1">주소 검색</span>
                          <button onClick={() => setIsOpenPostcode(false)} className="text-slate-500 hover:bg-slate-200 rounded-md p-1 transition-colors">
                            <Plus className="w-5 h-5 rotate-45" />
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
                      <label className="block text-slate-700 text-sm font-bold mb-2">📍 방문할 주소</label>
                      <div className="space-y-2">
                        <div 
                          onClick={() => setIsOpenPostcode(true)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl px-4 py-4 text-sm transition-all flex items-center justify-between cursor-pointer"
                        >
                          <span className={address ? "text-slate-900 font-bold" : "text-slate-500"}>
                            {address || "터치하여 도로명/지번 주소 검색"}
                          </span>
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        {address && (
                          <input
                            type="text"
                            placeholder="나머지 상세 주소 (동/호수)"
                            value={detailAddress}
                            onChange={(e) => setDetailAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {!isOpenPostcode && (
                    <>
                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">
                          📅 시공 희망 날짜
                          <span className="block text-blue-500 font-normal text-xs mt-1">
                            ※ 원활한 인력 배정을 위해 최소 3일 이후부터 예약 가능합니다.
                          </span>
                        </label>
                        <div className="relative group cursor-pointer">
                          <input
                            type="date"
                            value={cleaningDate}
                            min={(() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 3);
                              return d.toISOString().split('T')[0];
                            })()}
                            onChange={(e) => setCleaningDate(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full bg-slate-50 border ${cleaningDate ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} rounded-xl px-4 py-4 text-sm transition-all flex items-center justify-between pointer-events-none`}>
                            <span className={cleaningDate ? 'text-blue-700 font-bold tracking-wide' : 'text-slate-500'}>
                              {cleaningDate ? cleaningDate.replace(/-/g, '. ') : '터치하여 날짜 선택'}
                            </span>
                            <Calendar className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">⏰ 시공 희망 시간</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(isBetweenCleaning ? ['사이청소 10시 투입', '오전 7~9시 시작', '오후 1~3시 시작'] : ['오전 7~9시 시작', '오후 1~3시 시작']).map(timeOption => (
                            <button
                              key={timeOption}
                              onClick={() => setCleaningTime(timeOption)}
                              className={`py-3.5 rounded-xl text-sm font-bold transition-all ${
                                cleaningTime === timeOption
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {timeOption}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: 정보입력 */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">마지막으로 연락 받으실<br/>정보를 남겨주세요.</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">고객명 (선택)</label>
                    <input
                      type="text"
                      placeholder="예) 홍길동"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">📞 연락처 <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      placeholder="예) 010-0000-0000"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">추가 요청사항 (선택)</label>
                    <textarea
                      placeholder="특이사항이나 궁금한 점을 적어주세요."
                      value={memos}
                      onChange={(e) => setMemos(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 mt-2 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-blue-700">7일 무상 A/S 보장 및 투명한 요금제</strong><br/>
                        결제 후 불만족 시 다시 방문하며, 부당한 추가금을 절대 요구하지 않습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: 견적완료 */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full items-center justify-center text-center px-4 mt-8"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">예약 접수가<br/>완료되었습니다!</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  접수하신 내용은 성공적으로 전달되었으며,<br/>
                  담당자가 내용을 확인한 후 <strong className="text-slate-800">알림톡 또는 문자</strong>로<br/>
                  신속하게 안내해 드리겠습니다.
                </p>
                <div className="bg-slate-50 p-5 rounded-2xl w-full text-left border border-slate-100">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-500">예상 견적 금액</span>
                    <span className="font-bold text-slate-900">{totalPriceIncVat.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-500">시공 희망일</span>
                    <span className="font-bold text-slate-900">{cleaningDate || '미정'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">연락처</span>
                    <span className="font-bold text-slate-900">{contactInfo}</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* 하단 고정 가격 및 버튼 영역 */}
      {step < 5 && (
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 p-5 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {errorMsg && (
            <div className="mb-3 text-rose-500 text-xs font-bold text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-600">총 예상 견적 <span className="text-xs font-normal text-slate-400">(VAT 포함)</span></span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-600">{totalPriceIncVat.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-700">원</span>
            </div>
          </div>
          
          <button 
            onClick={handleNext}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
              isSubmitting 
                ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-blue-500/30'
            }`}
          >
            {isSubmitting ? (
              '접수 중...'
            ) : (
              <>
                {step === 4 ? '예약 접수 완료하기' : '다음 단계로'}
                {step < 4 && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 p-5 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold text-lg transition-all active:scale-[0.98]"
          >
            메인으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
