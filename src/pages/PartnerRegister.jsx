import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PartnerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    phone: '',
    regions: [],
    services: [],
    businessType: 'business',
  });
  const [selectedCity, setSelectedCity] = useState('서울');

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = () => {
    // 실제 프로덕션에서는 이 시점에 API 호출 또는 Firebase 저장 로직을 추가합니다.
    setStep(4); // 완료 화면으로 이동
  };

  const toggleRegion = (region) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(region) 
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }));
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service) 
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const REGION_DATA = {
    '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
    '경기': ['수원시', '고양시', '용인시', '성남시', '부천시', '화성시', '안산시', '남양주시', '안양시', '평택시', '시흥시', '파주시', '의정부시', '김포시', '광주시', '광명시', '군포시', '하남시', '오산시', '양주시', '이천시', '구리시', '안성시', '포천시', '의왕시', '양평군', '여주시', '동두천시', '가평군', '과천시', '연천군'],
    '인천': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '부산': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
    '광주': ['동구', '서구', '남구', '북구', '광산구'],
    '대전': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산': ['중구', '남구', '동구', '북구', '울주군'],
    '세종': ['세종특별자치시'],
    '강원': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충북': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충남': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전북': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전남': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경북': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경남': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주': ['제주시', '서귀포시']
  };
  const SERVICE_TYPES = ['입주 청소', '이사 청소', '거주 청소', '상가/사무실', '부분 청소'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <button onClick={() => navigate('/partners/join')} className="text-xl font-black text-blue-900 tracking-tighter">
          Ssak-Cle <span className="text-blue-600">Partners</span>
        </button>
        {step < 4 && (
          <button onClick={() => navigate('/partners/join')} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            취소
          </button>
        )}
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
          
          {/* 상단 진행률 표시 (Progress Bar) */}
          {step < 4 && (
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          )}

          <div className="p-6 md:p-8 pt-10">
            {/* Step 1: 기본 정보 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2 text-sm font-bold text-blue-600 tracking-wider">STEP 1 OF 3</div>
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight leading-snug">빠르고 안전한 가입을 위해<br/>간편 인증을 진행해주세요.</h2>
                
                <div className="space-y-3 mb-8">
                  <button className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 3c-5.52 0-10 3.58-10 8 0 2.86 1.83 5.37 4.6 6.84-.46 1.6-1.39 4.88-1.42 5.03-.05.21.08.26.23.16.12-.08 4.77-3.19 6.59-4.38.33.02.66.04 1 .04 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>
                    카카오로 3초 만에 시작하기
                  </button>
                  <button className="w-full bg-[#03C75A] hover:bg-[#02b351] text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/></svg>
                    네이버로 시작하기
                  </button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-400 font-medium">또는 직접 입력하기</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">상호명 (또는 활동명)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      placeholder="예) 싹클 클리닝, 홍길동 반장"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">대표자 성함 (본인)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      placeholder="홍길동"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">연락처</label>
                    <input 
                      type="tel" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    onClick={nextStep}
                    disabled={!formData.companyName || !formData.ownerName || !formData.phone}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-md disabled:shadow-none"
                  >
                    다음 단계로
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: 지역 및 서비스 선택 (버튼 클릭 방식) */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 -ml-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span> 이전
                </button>
                <div className="mb-2 text-sm font-bold text-blue-600 tracking-wider">STEP 2 OF 3</div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight leading-snug">주로 활동하시는 지역과<br/>서비스를 선택해주세요.</h2>
                <p className="text-sm text-slate-500 mb-6 font-medium">다중 선택이 가능합니다.</p>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-slate-800">활동 지역 (시/도 선택)</label>
                      <span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-md">{formData.regions.length}개 지역 선택됨</span>
                    </div>
                    <div className="flex overflow-x-auto pb-3 gap-2 mb-4 scrollbar-hide">
                      {Object.keys(REGION_DATA).map(city => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                            selectedCity === city
                              ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>

                    <label className="block text-sm font-bold text-slate-800 mb-3">상세 지역 (다중 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {REGION_DATA[selectedCity].map(region => {
                        const fullRegionName = `${selectedCity} ${region}`;
                        return (
                          <button
                            key={fullRegionName}
                            onClick={() => toggleRegion(fullRegionName)}
                            className={`px-4 py-2.5 rounded-full text-sm font-bold border transition-all active:scale-95 ${
                              formData.regions.includes(fullRegionName)
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {region}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">제공 가능 서비스</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_TYPES.map(service => (
                        <button
                          key={service}
                          onClick={() => toggleService(service)}
                          className={`px-4 py-2.5 rounded-full text-sm font-bold border transition-all active:scale-95 ${
                            formData.services.includes(service)
                              ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <button 
                    onClick={nextStep}
                    disabled={formData.regions.length === 0 || formData.services.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-md disabled:shadow-none"
                  >
                    다음 단계로
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: 파일 첨부 및 완료 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 -ml-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span> 이전
                </button>
                <div className="mb-2 text-sm font-bold text-blue-600 tracking-wider">STEP 3 OF 3</div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight leading-snug">마지막으로 활동 자격을<br/>인증해 주세요.</h2>
                <p className="text-sm text-slate-500 mb-6 font-medium">안전한 파트너 환경을 위해 신분증 또는 사업자등록증이 필요합니다.</p>
                
                {/* 사업자 유형 토글 */}
                <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setFormData({...formData, businessType: 'business'})}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      formData.businessType === 'business' 
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    법인/개인 사업자
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, businessType: 'individual'})}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      formData.businessType === 'individual' 
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    프리랜서 (일반 업자)
                  </button>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-blue-500">
                      {formData.businessType === 'business' ? 'domain' : 'badge'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-700 mb-1">
                    {formData.businessType === 'business' ? '사업자등록증 사진 첨부' : '신분증 사진 첨부'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    JPG, PNG 파일 (최대 5MB)
                    {formData.businessType === 'individual' && <><br/><span className="text-red-500 font-bold">* 주민등록번호 뒷자리는 반드시 가려주세요</span></>}
                  </p>
                  <p className="text-xs text-blue-500 font-bold mt-3 underline">스마트폰 앨범/카메라에서 바로 선택</p>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-pulse">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-bold text-amber-900">가입 즉시 BASIC 플랜 적용 (가입비 무료)</p>
                    <p className="text-xs text-amber-800 mt-1">심사 완료 후, 프리미엄 3개월 무료 이벤트 신청 안내를 별도로 보내드립니다!</p>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={handleComplete}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-colors text-lg shadow-lg shadow-slate-900/20"
                  >
                    가입 신청 완료하기
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: 완료 화면 */}
            {step === 4 && (
              <div className="text-center py-8 animate-in zoom-in-95 fade-in duration-500">
                <div className="w-24 h-24 bg-green-50 border-4 border-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-5xl text-green-500 font-bold">check</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">신청이 완료되었습니다!</h2>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                  <strong className="text-slate-900">{formData.ownerName}</strong> 사장님, 환영합니다.<br/>
                  영업일 기준 1~2일 내에 서류 검토 후<br/>앱 다운로드 및 입점 승인 안내를<br/>카카오톡으로 보내드립니다.
                </p>
                <button 
                  onClick={() => navigate('/')}
                  className="bg-blue-50 text-blue-700 font-bold py-3.5 px-8 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                >
                  메인 홈페이지로 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
