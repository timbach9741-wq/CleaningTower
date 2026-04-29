import React, { useState } from 'react';
import { Check, Minus, Plus, ShieldCheck, Info } from 'lucide-react';
import DaumPostcode from 'react-daum-postcode';

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
  const [houseType, setHouseType] = useState('아파트');
  const [houseSubType, setHouseSubType] = useState('');
  const [size, setSize] = useState(24);
  
  // 사업자 페이지 견적 로직 연동 상태
  const [cleaningType, setCleaningType] = useState('일반'); // 일반/프리미엄 (홈페이지 기본은 일반)
  const [isBetweenCleaning, setIsBetweenCleaning] = useState(false);
  const [isOccupiedCleaning, setIsOccupiedCleaning] = useState(false);

  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isOpenPostcode, setIsOpenPostcode] = useState(false);
  
  const [cleaningDate, setCleaningDate] = useState('');
  const [cleaningTime, setCleaningTime] = useState('');

  // 부가서비스 옵션 상태 (사업자용 로직 적용)
  const [selectedOptions, setSelectedOptions] = useState({});

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

  // 예상 견적 로직 (사업자용 기준: 일반 15,000원, 거주 18,000원, 프리미엄 20,000원)
  const getEstimatedPrice = () => {
    let basePricePerPyeong = cleaningType === '일반' ? 15000 : 20000;
    if (cleaningType === '일반' && isOccupiedCleaning) {
      basePricePerPyeong = 18000;
    }
    
    let total = size * basePricePerPyeong;

    if (isBetweenCleaning) {
      total += 100000;
    }
    
    Object.entries(selectedOptions).forEach(([optId, count]) => {
      const option = optionsList.find(o => o.id === optId);
      if (option) {
        if (optId === 'phytoncide') {
          total += option.price * size * count; // 평당 계산
        } else {
          total += option.price * count;
        }
      }
    });
    
    return total;
  };

  const estimatedPrice = getEstimatedPrice();
  const vatPrice = Math.floor(estimatedPrice * 0.1);
  const totalPriceIncVat = estimatedPrice + vatPrice;

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative text-left mx-auto">
      <div className="absolute -top-3 -right-3">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500 items-center justify-center text-white text-xs font-bold">!</span>
        </span>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">우리집 입주청소 비용은?</h2>
      <p className="text-slate-500 text-sm mb-6">3초 만에 확인하는 투명한 정찰제 견적</p>
      
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
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  houseType === type 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      houseSubType === sub
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              className={`w-full p-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-between border ${
                isBetweenCleaning 
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  isBetweenCleaning ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300'
                }`}>
                  {isBetweenCleaning && <Check className="w-3.5 h-3.5 font-bold" />}
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
              className={`w-full p-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-between border ${
                isOccupiedCleaning 
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                  isOccupiedCleaning ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-300'
                }`}>
                  {isOccupiedCleaning && <Check className="w-3.5 h-3.5 font-bold" />}
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
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <input 
              type="number" 
              value={size}
              onChange={(e) => setSize(Number(e.target.value) || 0)}
              min="10"
              max="100"
              className="w-full bg-transparent p-4 text-slate-900 font-bold text-lg outline-none"
            />
            <span className="text-slate-500 font-bold px-4">평</span>
          </div>
        </div>

        <div className="pt-4 mt-6">
          <label className="block text-slate-700 text-sm font-bold mb-3">🛠 추가 선택 옵션 (사업자 기준)</label>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {optionCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider">{cat.category}</h4>
                <div className="space-y-2">
                  {cat.items.map(opt => {
                    const count = selectedOptions[opt.id] || 0;
                    return (
                      <div 
                        key={opt.id}
                        className={`flex flex-col p-3 rounded-xl border transition-all select-none ${
                          count > 0 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        } ${cat.type === 'toggle' ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                        onClick={() => {
                          if (cat.type === 'toggle') {
                            updateOptionCount(opt.id, count > 0 ? -count : 1);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-bold ${count > 0 ? 'text-blue-800' : 'text-slate-700'}`}>
                              {opt.label}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {opt.id === 'phytoncide' 
                                ? `평당 +${opt.price.toLocaleString()}원` 
                                : `+${opt.price.toLocaleString()}원`}
                            </span>
                          </div>
                          
                          {cat.type === 'toggle' ? (
                            <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${
                                count > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className="w-4 h-4 font-bold" />
                            </div>
                          ) : (
                            <div 
                              className={`flex items-center gap-3 rounded-lg p-1 border transition-colors ${count > 0 ? 'bg-white border-blue-200' : 'bg-white border-slate-200'}`}
                              onClick={(e) => e.stopPropagation()}
                            >
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
                        
                        {count > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-between">
                            <span className="text-xs text-blue-600 font-medium">항목 추가 금액</span>
                            <span className="text-sm text-blue-700 font-bold">
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
        </div>

        {/* 일정 및 주소 */}
        <div className="pt-4 border-t border-slate-200 mt-6">
          <label className="block text-slate-700 text-sm font-bold mb-3">🏠 어디로 언제 방문할까요?</label>
          <div className="space-y-4">
            {isOpenPostcode ? (
              <div className="bg-white rounded-xl overflow-hidden border border-slate-300 shadow-md">
                 <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-slate-700 font-bold text-sm ml-1">주소 검색</span>
                    <button onClick={() => setIsOpenPostcode(false)} className="text-slate-500 p-1 hover:bg-slate-200 rounded-md transition-colors">
                      ✕
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
              <div className="space-y-2">
                <div 
                  onClick={() => setIsOpenPostcode(true)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className={address ? "text-slate-900 font-medium" : "text-slate-500"}>
                    {address || "📍 터치하여 도로명/지번 주소 검색"}
                  </span>
                </div>
                {address && (
                  <input
                    type="text"
                    placeholder="나머지 상세 주소 (동/호수)"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                  />
                )}
              </div>
            )}

            {!isOpenPostcode && (
              <>
                <div className="relative group cursor-pointer">
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
                  <div className={`w-full bg-slate-50 border ${cleaningDate ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm transition-all flex items-center justify-between pointer-events-none`}>
                    <span className={cleaningDate ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                      {cleaningDate ? `📅 ${cleaningDate.replace(/-/g, '. ')}` : '📅 시공 희망 날짜 선택 (최소 3일 후)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(isBetweenCleaning ? ['사이청소 10시 투입', '오전 7~9시 시작', '오후 1~3시 시작'] : ['오전 7~9시 시작', '오후 1~3시 시작']).map(timeOption => (
                    <button
                      key={timeOption}
                      onClick={() => setCleaningTime(timeOption)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        cleaningTime === timeOption
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 mt-6">
          {/* 프리미엄 신뢰도 배너 (경쟁사 분석 반영) */}
          <div className="bg-blue-50 rounded-xl p-3 mb-5 border border-blue-100 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-blue-700">7일 무상 A/S 보장.</strong> 결제 후 불만족 시 다시 방문합니다.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-rose-600">투명한 요금제.</strong> 빌트인 가전, 심한 오염(곰팡이 등) 외 부당한 현장 추가금을 절대 요구하지 않습니다.
              </p>
            </div>
          </div>

          {/* 중간 견적 안내 박스 (사업자용 로직 동기화) */}
          <div className="bg-slate-800 p-5 rounded-2xl flex flex-col shadow-xl gap-3">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400 font-medium">원래 금액 (공급가액)</span>
               <span className="text-slate-200 font-medium">{estimatedPrice.toLocaleString()}원</span>
             </div>
             <div className="flex justify-between items-center text-sm pb-4 border-b border-slate-700">
               <span className="text-rose-400 font-medium">부가세 10%</span>
               <span className="text-rose-400 font-medium">+{vatPrice.toLocaleString()}원</span>
             </div>
             <div className="flex justify-between items-end pt-1">
               <span className="text-blue-300 font-bold text-base mb-1">총 결제 예정 금액</span>
               <div className="text-right">
                 <span className="text-white font-black text-3xl drop-shadow-md">
                   {totalPriceIncVat.toLocaleString()}
                 </span>
                 <span className="text-blue-200 text-base ml-1 font-bold">원</span>
               </div>
             </div>
          </div>
        </div>

        <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/30">
          예약 접수하기
        </button>
      </div>
    </div>
  );
}
