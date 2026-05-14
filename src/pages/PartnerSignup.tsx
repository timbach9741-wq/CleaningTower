import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Upload, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

const REGIONS = [
  '전국', '서울', '경기', '인천', '강원', 
  '충북', '충남', '대전', '세종',
  '전북', '전남', '광주', 
  '경북', '경남', '대구', '울산', '부산', '제주'
];

export default function PartnerSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPlan = location.state?.plan || 'basic';
  const [step, setStep] = useState(1);
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
    password: '',
    createdAt: ''
  });
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      const finalRegion = [formData.region.join('/'), formData.regionDetail.trim()].filter(Boolean).join(' ');

      const firestoreData = {
        plan: formData.plan,
        businessType: formData.businessType,
        companyName: formData.companyName,
        managerName: formData.managerName,
        name: formData.name,
        phone: formData.phone,
        region: finalRegion, // 배열이 아닌 문자열로 통합 저장
        teamSize: formData.teamSize,
        mainServices: formData.mainServices,
        status: 'active', // 가입 즉시 완료 상태 부여 (사업자 페이지 URL 전달은 관리자가 별도 진행)
        loginId: formData.phone.replace(/[^0-9]/g, ''), // 연락처(숫자만)를 아이디로 사용
        password: formData.password, // 직접 설정한 비밀번호
        createdAt: new Date().toISOString()
      };

      if (db) {
        await addDoc(collection(db, 'partners'), firestoreData);
      }
      
      setFormData(prev => ({
        ...prev,
        status: 'active'
      }));
      setStep(4); // 완료 화면
    } catch (e) {
      console.error(e);
      alert("신청 중 오류가 발생했습니다.");
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
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">주 활동 지역 (다중 선택 가능) <span className="text-rose-500">*</span></label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {REGIONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const current = formData.region;
                            if (current.includes(r)) {
                              setFormData({ ...formData, region: current.filter(item => item !== r) });
                            } else {
                              setFormData({ ...formData, region: [...current, r] });
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                            formData.region.includes(r)
                              ? 'bg-blue-50 text-blue-600 border-blue-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
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

                  <div className="pt-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {formData.businessType === 'business' ? '사업자등록증 사본 (선택)' : '신분증 사본 (대표자만, 선택)'}
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium mb-2 leading-relaxed">
                      * 지금 업로드하지 않고 나중에 본사에 문자로 보내주셔도 됩니다.<br/>
                      {formData.businessType === 'business' 
                        ? '* 법인명, 사업자번호, 대표자 성명이 또렷하게 나오도록 사진을 찍어주세요.' 
                        : '* 본인 확인용이며 주민번호 뒷자리는 꼭 가리고 올려주세요.'}
                    </p>
                    <div className="relative border border-dashed border-blue-200 rounded-xl p-6 flex flex-col items-center justify-center bg-blue-50/30 text-blue-500 hover:bg-blue-50 focus-within:bg-blue-50 transition-colors cursor-pointer group">
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="클릭하여 파일 선택" />
                      <Upload size={24} className="mb-2 group-hover:-translate-y-1 transition-transform opacity-70" />
                      <span className="text-xs font-bold text-slate-600 mb-1">여기를 터치하여 사진 업로드</span>
                    </div>
                  </div>

                  {/* 비밀번호 설정란 추가 */}
                  <div className="pt-2 border-t border-slate-100 mt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">파트너스 로그인 비밀번호 <span className="text-rose-500">*</span></label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white mb-3"
                      placeholder="비밀번호를 입력해주세요"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <input
                      type="password"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all focus:bg-white ${
                        passwordConfirm && formData.password !== passwordConfirm 
                          ? 'border-rose-300 focus:ring-2 focus:ring-rose-500' 
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="비밀번호를 한번 더 입력해주세요"
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                    />
                    {passwordConfirm && formData.password !== passwordConfirm && (
                      <p className="text-rose-500 text-xs font-bold mt-2 ml-1">비밀번호가 일치하지 않습니다.</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl text-slate-600 font-bold bg-slate-100 active:bg-slate-200"
                  >
                    이전
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={
                      (formData.businessType === 'business' ? !formData.managerName : !formData.name) 
                      || !formData.phone 
                      || formData.region.length === 0
                      || !formData.password
                      || formData.password !== passwordConfirm
                    }
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    다음 단계 <ArrowRight size={18} />
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
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck size={32} className="text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">마지막 단계입니다!</h3>
                
                {formData.plan === 'basic' && (
                  <>
                    <p className="text-slate-500 text-sm mb-8 break-keep">
                      안전한 오더 거래와 노쇼 방지를 위해 초기 <strong>활동 보증금(30만 원)</strong>의 예치가 필요합니다.<br/>
                      * 보증금은 파트너 탈퇴 시 전액 즉시 반환됩니다.
                    </p>

                    <div className="bg-slate-50 w-full rounded-2xl p-6 text-left mb-8 border border-slate-200">
                      <p className="text-xs text-slate-400 font-bold mb-1">입금 계좌번호</p>
                      <p className="text-xl font-black text-slate-900 tracking-wider">우리은행 1002-123-456789</p>
                      <p className="text-sm text-slate-500 mt-1">예금주: (주)클린허브파트너스</p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-bold">입금하실 보증금</span>
                        <span className="text-rose-600 font-black text-xl">300,000원</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.plan === 'premium' && (
                  <>
                    <p className="text-slate-500 text-sm mb-8 break-keep">
                      프리미엄 파트너 가입을 환영합니다!<br/>
                      첫 달 <strong>프리미엄 회비(99,000원)</strong> 결제 및 안내를 위해 가입 완료 후 매니저가 연락을 드립니다.
                    </p>

                    <div className="bg-blue-50 w-full rounded-2xl p-6 text-left mb-8 border border-blue-200">
                      <p className="text-sm text-blue-800 font-bold mb-2">프리미엄 혜택</p>
                      <ul className="text-sm text-blue-700 space-y-1 mb-4">
                        <li>- 우선 상단 노출 그룹 배정</li>
                        <li>- 프리미엄 전용 배지</li>
                        <li>- 전담 파트너 매니저 배정</li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-blue-800 text-sm font-bold">월 회비</span>
                        <span className="text-blue-600 font-black text-xl">99,000원</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.plan === 'exclusive' && (
                  <>
                    <p className="text-slate-500 text-sm mb-8 break-keep">
                      지역 독점 파트너(TO 문의) 상담 신청이 접수됩니다.<br/>
                      담당 매니저가 배정되어 <strong>비용 및 지역 TO 현황</strong>에 대해 상세히 안내해 드립니다.
                    </p>

                    <div className="bg-slate-900 w-full rounded-2xl p-6 text-left mb-8 border border-amber-400/30">
                      <p className="text-sm text-amber-400 font-bold mb-2">독점 파트너 혜택</p>
                      <ul className="text-sm text-slate-300 space-y-1 mb-4">
                        <li>- 선택 지역 최상단 100% 독점 노출</li>
                        <li>- 지역당 1~2팀 한정 TO 배정</li>
                        <li>- 최우선 오더 배정</li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                        <span className="text-slate-300 text-sm font-bold">예상 안내 비용</span>
                        <span className="text-amber-400 font-black text-xl">상담 후 결정</span>
                      </div>
                    </div>
                  </>
                )}

                {formData.plan === 'basic' ? (
                  <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-left">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 accent-rose-600"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                      />
                      <span className="text-sm text-rose-900 font-medium leading-relaxed">
                        [필수] 오더 수락 후 일방적 취소(포기) 및 노쇼 시, 기간과 무관하게 <strong className="text-rose-700">보증금 전액(30만 원)이 즉시 몰수되며 영구 제명</strong>되는 무관용 페널티 정책에 동의합니다.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                      />
                      <span className="text-sm text-blue-900 font-medium leading-relaxed">
                        [필수] 파트너스 가입 및 서비스 운영 정책에 동의하며, 허위 정보 기재 시 제재를 받을 수 있음을 확인합니다.
                      </span>
                    </label>
                  </div>
                )}

                <div className="w-full flex gap-3 mt-auto">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl text-slate-600 font-bold bg-slate-100 active:bg-slate-200"
                  >
                    이전
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!isAgreed}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all"
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
                  <p>✔ 비밀번호: 직접 설정하신 비밀번호</p>
                </div>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => navigate('/')}
                    className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl active:scale-[0.98] transition-colors"
                  >
                    홈으로
                  </button>
                  <button 
                    onClick={() => navigate('/partner-dashboard')}
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
    </div>
  );
}
