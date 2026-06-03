import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Upload, ArrowRight, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getDb } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendTelegramAlert } from '../telegramService';
import PartnerGuideModal from '../components/common/PartnerGuideModal';

import { REGION_DATA } from '../data/regions';
import RegionSelector from '../components/common/RegionSelector';

// Define a type for REGION_DATA if not available
type RegionData = { [key: string]: string[] };
const regionsData = REGION_DATA as RegionData;

export default function PartnerSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPlan = location.state?.plan || 'basic';
  const [step, setStep] = useState(1);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [formData, setFormData] = useState({
    plan: initialPlan,
    businessType: '', // 'business' or 'individual'
    companyName: '',
    managerName: '',
    name: '',
    phone: '',
    region: [] as string[],
    regionDetail: '',
    teamSize: '',
    mainServices: [] as string[],
    status: '',
    loginId: '',
    password: '휴대폰 뒤 4자리',
    createdAt: ''
  });
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      const finalRegionArray = formData.region; // Array of 'SIDO SIGUNGU'
      const finalRegionString = [finalRegionArray.join(', '), formData.regionDetail.trim()].filter(Boolean).join(' ');

      const defaultImages = [
        '/images/korean_cleaner_livingroom.png',
        '/images/korean_cleaner_bathroom.png',
        '/images/korean_cleaner_kitchen.png',
        '/images/korean_cleaning_team.png'
      ];
      const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];

      const firestoreData = {
        plan: formData.plan,
        businessType: formData.businessType,
        companyName: formData.companyName,
        managerName: formData.managerName,
        name: formData.name,
        phone: formData.phone,
        region: finalRegionString, // 화면 표시용 (기존 하위 호환)
        regions: finalRegionArray, // 필터링용 배열 신규 추가
        teamSize: formData.teamSize,
        mainServices: formData.mainServices,
        status: formData.plan === 'exclusive' ? 'pending' : 'active', // 지역독점은 승인 대기, 나머지는 자동 승인
        loginId: formData.phone.replace(/[^0-9]/g, ''), // 연락처(숫자만)를 아이디로 사용
        password: formData.password === '휴대폰 뒤 4자리' ? formData.phone.replace(/[^0-9]/g, '').slice(-4) : formData.password,
        isNotificationEnabled: true,
        notificationRegions: finalRegionArray,
        image: randomImage, // 신규 가입 시 랜덤 기본 이미지 배정
        createdAt: new Date().toISOString()
      };

      const dbInstance = getDb();
      if (dbInstance) {
        // ★ 중복 가입 방지: 같은 전화번호(loginId)로 이미 가입된 계정이 있는지 확인
        const duplicateQuery = query(
          collection(dbInstance, 'partners'),
          where('loginId', '==', firestoreData.loginId)
        );
        const duplicateSnapshot = await getDocs(duplicateQuery);
        if (!duplicateSnapshot.empty) {
          alert('이미 해당 연락처로 가입된 계정이 존재합니다.\n파트너스 페이지에서 기존 계정으로 로그인해주세요.');
          return;
        }
        await addDoc(collection(dbInstance, 'partners'), firestoreData);

        // 텔레그램 알림 발송 (비동기)
        try {
          const planLabel = firestoreData.plan === 'exclusive' ? '👑 지역 독점' : firestoreData.plan === 'premium' ? '⭐ 프리미엄' : '일반';
          const businessTypeLabel = firestoreData.businessType === 'business' ? '💼 사업자 팀' : '👤 개인 팀';
          const statusText = firestoreData.status === 'active' ? '⚡ 즉시 자동 승인' : '⏳ 승인 대기';
          const nameToUse = firestoreData.managerName || firestoreData.name || '미기재';

          const message = `🔔 <b>[청소타워 파트너 가입 신청]</b>\n\n` +
            `💎 <b>가입 플랜:</b> ${planLabel}\n` +
            `🏢 <b>사업자 유형:</b> ${businessTypeLabel}\n` +
            `🏢 <b>상호명:</b> ${firestoreData.companyName || '미기재'}\n` +
            `👤 <b>담당자/이름:</b> ${nameToUse}\n` +
            `📱 <b>연락처:</b> ${firestoreData.phone}\n` +
            `📍 <b>주 활동지역:</b> ${firestoreData.region}\n` +
            `👥 <b>투입 규모:</b> ${firestoreData.teamSize || '미기재'}\n` +
            `🛠️ <b>주력 서비스:</b> ${firestoreData.mainServices.join(', ') || '미기재'}\n` +
            `⌛ <b>승인 상태:</b> ${statusText}`;

          sendTelegramAlert(message).catch(err => console.error("텔레그램 발송 오류:", err));
        } catch (tgErr) {
          console.warn("텔레그램 알림 준비 에러:", tgErr);
        }
      }
      
      const actualPassword = formData.phone.replace(/[^0-9]/g, '').slice(-4) || '0000';
      setFormData(prev => ({
        ...prev,
        status: formData.plan === 'exclusive' ? 'pending' : 'active',
        password: actualPassword
      }));
      setStep(4); // 완료 화면
    } catch (e) {
      console.error(e);
      alert(`신청 중 오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          {formData.plan === 'premium' ? '프리미엄 파트너 가입' : formData.plan === 'exclusive' ? '지역 독점 파트너 상담 신청' : '일반 파트너 가입'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {formData.plan === 'exclusive' ? '최상단 100% 독점 노출로 지역 내 압도적 1위를 달성하세요.' : '하루 평균 50건 이상의 오더, 안정적인 수익을 약속합니다.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-100 overflow-hidden relative min-h-[400px]">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full bg-slate-100 h-1.5">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pt-4"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900">어떤 유형으로 가입하시나요?</h3>
                  <p className="text-sm text-slate-500 mt-2">사업자 등록 여부에 따라 필요한 서류가 다릅니다.</p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, businessType: 'business' });
                      handleNext();
                    }}
                    className="w-full relative group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-left transition-all duration-200 active:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">사업자 팀</h4>
                        <p className="text-sm text-slate-500 mt-1">사업자 등록증이 있는 공식 사업체</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, businessType: 'individual' });
                      handleNext();
                    }}
                    className="w-full relative group bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-left transition-all duration-200 active:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">비사업자 (개인/팀)</h4>
                        <p className="text-sm text-slate-500 mt-1">사업자 등록이 안된 팀반장, 프리랜서</p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pt-4 flex flex-col h-full"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">팀장님 정보를 입력해주세요</h3>
                </div>

                <div className="space-y-5 flex-1">
                  {formData.businessType === 'business' ? (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">업체명 <span className="text-slate-400 font-normal text-xs">(선택)</span></label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white"
                          placeholder="예: 클린익스프레스"
                          value={formData.companyName}
                          onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">담당자 명 <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white"
                          placeholder="홍길동 팀장"
                          value={formData.managerName}
                          onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">이름 (팀장님) <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white"
                        placeholder="이름을 입력해주세요"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">연락처 <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value;
                        const clean = val.replace(/[^0-9]/g, '');
                        setFormData(prev => ({
                          ...prev,
                          phone: val,
                          password: clean.length >= 4 ? clean.slice(-4) : '휴대폰 뒤 4자리'
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">주 활동 지역 (다중 선택 가능) <span className="text-rose-500">*</span></label>
                    <div className="mb-3">
                      <RegionSelector 
                        selectedRegions={formData.region}
                        onChange={(regions) => setFormData({ ...formData, region: regions })}
                      />
                    </div>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm"
                      placeholder="상세 지역을 입력해주세요 (선택) 예: 수원, 동탄, 강남구"
                      value={formData.regionDetail}
                      onChange={e => setFormData({ ...formData, regionDetail: e.target.value })}
                    />
                  </div>
                  
                  {/* 추가 정보 제안 컬럼 */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">투입 규모 <span className="text-slate-400 font-normal text-[10px]">(선택)</span></label>
                      <select 
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none focus:bg-white text-slate-700"
                        value={formData.teamSize}
                        onChange={e => setFormData({ ...formData, teamSize: e.target.value })}
                      >
                        <option value="">선택</option>
                        <option value="1인">1인 (개인)</option>
                        <option value="2~3인">2~3인조</option>
                        <option value="4인 이상">4인 이상</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">주력 서비스 <span className="text-slate-400 font-normal text-[10px]">(다중 선택)</span></label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {['입주/이사', '거주청소', '상가/사무실', '가전(에어컨 등)', '새집증후군'].map(svc => {
                          const isSelected = formData.mainServices.includes(svc);
                          return (
                            <button
                              key={svc}
                              type="button"
                              onClick={() => {
                                const current = formData.mainServices;
                                if (isSelected) {
                                  setFormData({ ...formData, mainServices: current.filter(item => item !== svc) });
                                } else {
                                  setFormData({ ...formData, mainServices: [...current, svc] });
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 border ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-600 border-blue-500'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                              }`}
                            >
                              {svc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 비밀번호 설정란 (휴대폰 번호 뒤 4자리 임시 비밀번호 설정) */}
                  <div className="pt-2 border-t border-slate-100 mt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">파트너스 로그인 비밀번호</label>
                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold mb-1 flex items-center justify-between">
                      <span className="tracking-widest text-lg">{formData.password}</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">휴대폰 번호 뒤 4자리</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium ml-1">로그인 시 비밀번호는 휴대폰 번호의 마지막 4자리 숫자입니다.</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl text-slate-600 font-bold bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    이전
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!formData.phone || (!formData.name && !formData.managerName) || formData.region.length === 0}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
                  >
                    다음 단계
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="pt-4 flex flex-col h-full items-center text-center"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={32} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">가입 완료 전 확인해주세요!</h3>
                
                {formData.plan === 'basic' && (
                  <>
                    <p className="text-slate-500 text-sm mb-8 break-keep font-medium">
                      데일리하우징 일반 파트너는 <strong>누구나 무료로</strong> 가입하실 수 있습니다.<br/>
                      지금 바로 파트너로 등록하고 실시간 오더를 확인해보세요.
                    </p>

                    <div className="bg-blue-50 w-full rounded-2xl p-6 text-left mb-8 border border-blue-200">
                      <p className="text-sm text-blue-800 font-bold mb-3">일반 파트너 혜택</p>
                      <ul className="text-sm text-blue-700 space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          가입비 및 초기 등록비 전액 무료
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          전국 실시간 청소 오더 무제한 확인
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          자유로운 일정 관리 및 오더 선택
                        </li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-blue-800 text-sm font-bold">참가 비용</span>
                        <span className="text-blue-600 font-black text-xl">0원 (FREE)</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.plan === 'premium' && (
                  <>
                    <p className="text-slate-500 text-sm mb-8 break-keep font-medium">
                      프리미엄 파트너를 위한 특별한 혜택이 준비되었습니다.<br/>
                      <strong>프로모션 기간 동안 무료로</strong> 프리미엄 기능을 제공해 드립니다.
                    </p>

                    <div className="bg-indigo-50 w-full rounded-2xl p-6 text-left mb-8 border border-indigo-200">
                      <p className="text-sm text-indigo-800 font-bold mb-3">프리미엄 전용 혜택</p>
                      <ul className="text-sm text-indigo-700 space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                          업체 리스트 상단 우선 노출 그룹 배정
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                          신뢰도를 높여주는 프리미엄 전용 배지 부여
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                          전담 매니저를 통한 매칭 효율 최적화
                        </li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-indigo-200 flex justify-between items-center">
                        <span className="text-indigo-800 text-sm font-bold">프로모션 혜택</span>
                        <span className="text-indigo-600 font-black text-xl">0원 (FREE)</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.plan === 'exclusive' && (
                  <>
                    <p className="text-slate-500 text-sm mb-8 break-keep font-medium">
                      지역 독점 파트너(TO 문의) 상담 신청이 접수됩니다.<br/>
                      담당 매니저가 <strong>지역별 잔여 TO 및 운영 안내</strong>를 도와드립니다.
                    </p>

                    <div className="bg-slate-900 w-full rounded-2xl p-6 text-left mb-8 border border-amber-400/30">
                      <p className="text-sm text-amber-400 font-bold mb-3">독점 파트너 혜택</p>
                      <ul className="text-sm text-slate-300 space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400/50 rounded-full" />
                          선택 지역 최상단 100% 독점 노출 보장
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400/50 rounded-full" />
                          지역당 한정된 파트너만 배정 (TO제 운영)
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-400/50 rounded-full" />
                          고품질 프리미엄 오더 최우선 배정
                        </li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                        <span className="text-slate-300 text-sm font-bold">진행 방식</span>
                        <span className="text-amber-400 font-black text-xl">상담 후 승인</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                    />
                    <div className="text-sm text-slate-700 font-medium leading-relaxed">
                      <span className="font-bold text-blue-600">[필수]</span> 청소타워 파트너스 이용약관 및 서비스 운영정책에 동의합니다.
                      <button 
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-800 underline ml-1.5 font-bold"
                      >
                        [약관 보기]
                      </button>
                    </div>
                  </label>
                </div>

                <div className="w-full flex gap-3 mt-auto">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl text-slate-600 font-bold bg-slate-100 active:bg-slate-200 transition-colors"
                  >
                    이전
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!isAgreed}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
                  >
                    {formData.plan === 'exclusive' ? '상담 신청 완료하기' : '가입 완료하기'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-10 flex flex-col items-center text-center pb-6 w-full"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">가입이 완료되었습니다!</h3>
                <p className="text-slate-500 mb-6 break-keep leading-relaxed font-medium">
                  환영합니다!<br/>
                  바로 파트너스 페이지로 이동하여 로그인 후 이용하실 수 있습니다.
                </p>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-sm text-slate-600 leading-relaxed text-left">
                  <p className="mb-2 font-bold text-slate-800">📌 로그인 안내</p>
                  <p className="mb-1">✔ 아이디: <strong className="text-slate-800">{formData.phone}</strong> (입력하신 연락처)</p>
                  <p className="mb-3">✔ 임시 비밀번호: <strong className="text-slate-800">{formData.password}</strong></p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-medium">
                    ⚠️ <strong>보안 위험 알림:</strong><br/>
                    현재 비밀번호는 휴대폰 뒷번호로 설정되어 유출 위험이 매우 높습니다. <strong>로그인 후 반드시 [프로필] 탭에서 비밀번호를 안전하게 변경해 주세요.</strong>
                  </div>
                </div>

                {/* 파트너 정보 입력 가이드 배너 */}
                <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-8 text-left flex items-start gap-3.5 relative overflow-hidden group">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-800">매출을 3.5배 올리는 정보 등록 팁</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                      상호명, 전후사진 갤러리, 이달의 이벤트, 달력 설정 등 오더 매칭을 극대화하는 작성 요령을 확인하세요.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                      필수 입력 가이드 확인하기
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => navigate('/')}
                    className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl active:scale-[0.98] transition-colors"
                  >
                    홈으로
                  </button>
                  <button 
                    onClick={() => navigate('/partner-dashboard', { state: { showLogin: true } })}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform"
                  >
                    파트너스 로그인하러 가기
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* 파트너 약관 보기 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl p-6 relative text-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">청소타워 파트너스 이용약관 및 정책</h3>
                <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-slate-650 text-xl leading-none">✕</button>
              </div>
              
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto pr-1 max-h-[50vh] break-keep">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">제1조 (목적)</h4>
                  <p>본 약관은 청소타워(이하 "회사")가 제공하는 플랫폼 중개 서비스의 이용과 관련하여 회사와 파트너 회원 간의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">제2조 (통신판매중개자로서 책임의 한계)</h4>
                  <p className="font-semibold text-rose-600">청소타워는 청소 서비스의 거래 당사자가 아니며 통신판매중개자입니다. 파트너 대표님이 제공하는 모든 청소 서비스의 수행 품질, 예약 불이행, 현장 기물 파손, 하자 수리 및 고객 배상 책임은 청소 시공을 수행한 파트너사에게 단독으로 귀속됩니다.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">제3조 (개인정보보호 및 보안 준수)</h4>
                  <p>1. 파트너는 서비스 배정 및 상담을 위해 제공받은 고객의 개인정보(이름, 연락처, 주소, 비밀번호 등)를 청소 서비스 제공 이외의 목적으로 제3자에게 유출하거나 보관, 누설, 광고 전송 등 목적 외 용도로 활용할 수 없습니다.</p>
                  <p>2. 위 사항을 위반하여 발생하는 모든 법적 책임(개인정보보호법 위반 등)은 파트너사에게 있으며, 회사는 이에 대해 어떠한 책임도 지지 않습니다.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">제4조 (노무 및 고용관계 부인)</h4>
                  <p>파트너는 플랫폼을 자율적으로 이용하는 독립적인 개인사업자(또는 법인사업자)로서 본사와 근로기준법상 고용 및 근로계약 관계에 있지 않습니다. 파트너는 자율적인 판단에 따라 업무 수탁 여부와 작업 일정을 정합니다.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">제5조 (하자 담보 및 배상책임)</h4>
                  <p>1. 청소 완료 후 3일 이내에 발생한 품질 하자는 파트너사의 책임 하에 무상 A/S 처리를 원칙으로 합니다.</p>
                  <p>2. 작업 중 발생하는 기물 파손 등에 대처하기 위해 파트너사는 영업배상책임보험 또는 일상생활배상책임보험 가입 및 유지에 적극 노력해야 하며, 사고 발생 시 고객과 합의하여 신속하게 배상해야 합니다.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => {
                  setIsAgreed(true);
                  setShowTermsModal(false);
                }}
                className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
              >
                약관 동의 및 닫기
              </button>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 파트너 안내 가이드 모달 */}
      <PartnerGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
}
