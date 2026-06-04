import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, UserCircle, Smartphone, Lock, ArrowRight, CheckCircle2, FileUp, Loader2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sendTelegramAlert } from '../telegramService';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessNumber: '',
    businessImage: null as File | null,
    password: '',
    passwordConfirm: '',
  });

  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  const [viewingTerms, setViewingTerms] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const termsContent = {
    terms: "제1조 (목적)\n본 약관은 데일리하우징(이하 '회사')이 제공하는 청소 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.\n\n제2조 (서비스의 제공)\n회사는 고객의 의뢰에 따라 입주/이사 청소를 제공하며, 사이트 내 기준 및 사전에 협의된 견적에 따릅니다. 현장 오염도에 따라 당일 추가금이 발생할 수 있으며, 이에 대한 안내를 필수적으로 진행합니다.",
    privacy: "1. 수집하는 개인정보 항목\n- 필수항목: 이름, 휴대전화번호, 비밀번호\n- 선택항목: 서비스 이용기록, 결제기록\n\n2. 개인정보의 수집 및 이용 목적\n- 서비스 예약 확정 및 요금 정산, 본인 확인, 고객 상담 등\n\n3. 개인정보의 보유 및 이용 기간\n- 회원 탈퇴 시 즉시 파기. 단, 관계 법령에 따라 5년간 별도 보관될 수 있습니다.",
    marketing: "1. 뉴스레터 및 마케팅 정보 수신\n신규 서비스 런칭 안내, 이벤트 및 할인 쿠폰 등 유용한 혜택 정보를 휴대전화 알림톡 또는 문자로 보내드립니다. 고객님은 원치 않으실 경우 언제든지 마이페이지에서 수신 거부를 하실 수 있습니다."
  };

  const handleAgreement = (key: keyof typeof agreements) => {
    if (key === 'all') {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
        marketing: newValue,
      });
    } else {
      const newAgreements = { ...agreements, [key]: !agreements[key] };
      newAgreements.all = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
      setAgreements(newAgreements);
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const verifyBusinessNumber = async () => {
    if (formData.businessNumber.length !== 10) {
      alert("사업자등록번호 10자리를 정확히 입력해주세요.");
      return;
    }

    setIsVerifying(true);
    
    // TODO: 실 서비스 시 아래 코드 주석을 해제하고 공공데이터포털의 국세청 API 키를 넣어주세요.
    /*
    const API_KEY = "여기에_공공데이터포털_API_인코딩_키입력";
    const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${API_KEY}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b_no: [formData.businessNumber] })
      });
      const result = await response.json();
      if (result.data[0].b_stt_cd === '01') { // 01: 계속사업자
        setIsVerified(true);
        alert("✅ 국세청 정상 사업자로 확인되었습니다.");
      } else {
        alert("휴/폐업 상태 등 유효하지 않은 사업자입니다.");
      }
    } catch (e) {
      alert("홈택스 조회를 실패했습니다.");
    }
    */

    // 현재는 API 키가 없으므로 1.5초 후 무조건 승인되는 모킹 로직입니다.
    // 임시 테스트: 1234567890 입력 시 에러 테스트
    setTimeout(() => {
      if (formData.businessNumber === '1234567890') {
        alert("휴/폐업 상태 등 유효하지 않은 사업자입니다.");
        setIsVerified(false);
      } else {
        alert("✅ 국세청 정상 사업자로 확인되었습니다.");
        setIsVerified(true);
      }
      setIsVerifying(false);
    }, 1500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Google Sheets(Apps Script)로 데이터 전송
      // TODO: 발급받은 구글 앱스스크립트(Web App) URL을 입력하세요.
      const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEET_URL || "YOUR_GOOGLE_SCRIPT_URL_HERE";
      
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        businessNumber: formData.businessNumber,
        isAutoApproved: isVerified
      };
      
      // 앱스 스크립트 연결 주소가 입력되었을 때만 전송되도록 처리
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_SCRIPT_URL_HERE") {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // 구글 앱스 스크립트는 이 옵션이 없으면 CORS 에러로 전송이 차단됩니다.
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload)
        });
      }
      
      // 2. Firebase Firestore에 파트너 정보 저장 (관리자 연동)
      try {
        await addDoc(collection(db, "partners"), {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          businessNumber: formData.businessNumber,
          status: isVerified ? 'active' : 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // B2B 전용 로그인 계정 저장 (연락처 = 로그인ID)
        await addDoc(collection(db, "b2bAccounts"), {
          loginId: formData.phone,
          password: formData.password,
          businessName: formData.name,
          phone: formData.phone,
          email: formData.email,
          businessNumber: formData.businessNumber,
          createdAt: new Date().toISOString()
        });
      } catch (fbError) {
        console.error("Firebase 저장 중 오류:", fbError);
      }

      // 텔레그램 알림 발송 (비동기)
      try {
        const approvalText = isVerified ? "⚡ 즉시 자동 승인" : "⏳ 승인 대기";
        const message = `🔔 <b>[청소타워 B2B 가입 신청]</b>\n\n` +
          `👤 <b>대표자명:</b> ${formData.name}\n` +
          `📱 <b>연락처:</b> ${formData.phone}\n` +
          `📧 <b>이메일:</b> ${formData.email}\n` +
          `💼 <b>사업자번호:</b> ${formData.businessNumber}\n` +
          `⌛ <b>승인 상태:</b> ${approvalText}`;
        
        sendTelegramAlert(message).catch(err => console.error("텔레그램 발송 오류:", err));
      } catch (tgErr) {
        console.warn("텔레그램 알림 준비 에러:", tgErr);
      }

      // 3. 임시 로컬 처리 (로그인 상태로 변경)
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userType', 'partner');
      
      // 성공 시 4단계(완료 화면)로 이동
      setStep(4);
    } catch (error) {
      console.error(error);
      alert("회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-12 pb-20 sm:justify-center sm:py-12 sm:px-6 lg:px-8">
      {/* 모바일 최상단 뒤로가기 헤더 */}
      <div className="sm:hidden absolute top-0 left-0 w-full h-14 bg-white border-b border-slate-100 flex items-center px-4">
        <button onClick={() => navigate(-1)} className="text-slate-500 p-2 -ml-2 rounded-lg active:bg-slate-100">
          <ChevronRight className="rotate-180" size={24} />
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 sm:mt-0">
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          간편 회원가입
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium px-4">
          딱 1분이면 완료! 매번 정보 입력할 필요 없이<br/>더 빠른 견적과 예약을 경험하세요.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-sm border-y sm:border sm:rounded-2xl sm:px-10 border-slate-200 overflow-hidden relative min-h-[450px]">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full bg-slate-100 h-1">
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
                className="pt-2 flex flex-col h-full"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">서비스 이용을 위한<br/>필수 약관 동의</h3>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div 
                    onClick={() => handleAgreement('all')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${agreements.all ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements.all ? 'bg-blue-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className={`font-bold ${agreements.all ? 'text-blue-900' : 'text-slate-700'}`}>전체 약관에 동의합니다</span>
                  </div>

                  <div className="space-y-3 px-2">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleAgreement('terms')}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${agreements.terms ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 group-hover:border-blue-400 text-transparent'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">[필수] 서비스 이용약관 동의</span>
                      </div>
                      <button onClick={() => setViewingTerms('terms')} className="text-xs text-slate-400 underline p-1 active:text-slate-600 px-2 font-bold">보기</button>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleAgreement('privacy')}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${agreements.privacy ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 group-hover:border-blue-400 text-transparent'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">[필수] 개인정보 수집 및 이용 동의</span>
                      </div>
                      <button onClick={() => setViewingTerms('privacy')} className="text-xs text-slate-400 underline p-1 active:text-slate-600 px-2 font-bold">보기</button>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleAgreement('marketing')}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${agreements.marketing ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 group-hover:border-blue-400 text-transparent'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">[선택] 혜택 및 마케팅 알림 동의</span>
                      </div>
                      <button onClick={() => setViewingTerms('marketing')} className="text-xs text-slate-400 underline p-1 active:text-slate-600 px-2 font-bold">보기</button>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={handleNext}
                    disabled={!agreements.terms || !agreements.privacy}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    다음으로 <ArrowRight size={18} />
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
                className="pt-2 flex flex-col h-full"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">제휴 파트너 확인을 위해<br/>사업자 정보를 등록해주세요</h3>
                </div>

                <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">사업자 등록번호</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={10}
                        className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all ${isVerified ? 'border-emerald-500 text-emerald-700 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'}`}
                        placeholder="숫자 10자리 입력 (- 제외)"
                        value={formData.businessNumber}
                        readOnly={isVerified}
                        onChange={e => {
                          setFormData({ ...formData, businessNumber: e.target.value.replace(/[^0-9]/g, '') });
                          setIsVerified(false); // 번호가 수정되면 인증 초기화
                        }}
                      />
                      <button 
                        onClick={verifyBusinessNumber}
                        disabled={isVerifying || isVerified || formData.businessNumber.length !== 10}
                        className="px-4 bg-slate-800 text-white font-bold text-sm rounded-xl whitespace-nowrap hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center min-w-[90px]"
                      >
                        {isVerifying ? <Loader2 size={18} className="animate-spin" /> : isVerified ? '확인완료' : '진위확인'}
                      </button>
                    </div>
                    {isVerified && <p className="text-xs text-emerald-600 font-bold mt-2 pl-1">✓ 국세청 정상 사업자 상태가 확인되었습니다.</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">사업자 등록증 사진 올리기</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors group cursor-pointer overflow-hidden min-h-[120px] flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setFormData({ ...formData, businessImage: file });
                        }}
                      />
                      <div className="flex flex-col items-center justify-center p-6 text-slate-500 group-hover:text-blue-600 transition-colors text-center">
                        <FileUp size={32} className="mb-3" />
                        <span className="font-bold text-sm">
                          {formData.businessImage ? formData.businessImage.name : "눌러서 파일 선택"}
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          {formData.businessImage ? "수정하려면 다시 누르세요" : "또는 사업자 등록증 사진을 찾아 드래그"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl text-slate-600 font-bold bg-slate-100"
                  >
                    이전
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!isVerified || !formData.businessImage}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    인증 완료 <ArrowRight size={18} />
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
                className="pt-2 flex flex-col h-full"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">사용하실 이름과<br/>비밀번호를 설정해주세요</h3>
                </div>

                <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <UserCircle size={16} /> 대표자 성함
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="실명을 입력해주세요"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Smartphone size={16} /> 연락처 (휴대폰 번호)
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="숫자만 입력해주세요 (- 제외)"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Mail size={16} /> 이메일 주소 (세금계산서 용도)
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="이메일을 입력해주세요"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Lock size={16} /> 비밀번호
                    </label>

                    {/* 브라우저 자동완성 방어막 (Honeypot) - 브라우저가 이 필드들을 대신 채우도록 유도 */}
                    <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, zIndex: -1 }}>
                      <input type="text" tabIndex={-1} aria-hidden="true" autoComplete="username" defaultValue="" />
                      <input type="password" tabIndex={-1} aria-hidden="true" autoComplete="current-password" defaultValue="" />
                      <input type="password" tabIndex={-1} aria-hidden="true" autoComplete="new-password" defaultValue="" />
                      <input type="text" tabIndex={-1} aria-hidden="true" autoComplete="one-time-code" defaultValue="" />
                    </div>

                    <input
                      type="text"
                      name="b2b_new_secret_key"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={true}
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      style={{ WebkitTextSecurity: 'disc' } as any}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-2"
                      placeholder="비밀번호 6자리 이상"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <input
                      type="text"
                      name="b2b_new_secret_key_confirm"
                      autoComplete="off"
                      spellCheck="false"
                      readOnly={true}
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      style={{ WebkitTextSecurity: 'disc' } as any}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="비밀번호 확인"
                      value={formData.passwordConfirm}
                      onChange={e => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    />
                     {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                        <p className="text-xs text-rose-500 mt-2 font-medium pl-1">비밀번호가 일치하지 않습니다.</p>
                     )}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl text-slate-600 font-bold bg-slate-100"
                  >
                    이전
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.phone || !formData.email || !formData.password || formData.password !== formData.passwordConfirm || isSubmitting}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center"
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '가입 완료'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-10 flex flex-col items-center text-center pb-6"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">제휴 가입이 완료되었습니다!</h3>
                <p className="text-slate-500 mb-4 break-keep leading-relaxed font-medium">
                  사업자 진위확인이 완료되어 <strong className="text-blue-600">자동으로 승인 처리</strong> 되었습니다!
                </p>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-left">
                  <p className="text-xs font-bold text-slate-400 mb-2">로그인 정보</p>
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-700 font-medium">
                      <span className="text-slate-400">아이디:</span> <strong>{formData.phone}</strong>
                    </p>
                    <p className="text-sm text-slate-700 font-medium">
                      <span className="text-slate-400">비밀번호:</span> 가입 시 설정한 비밀번호
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/b2b/quote')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-[0.98] transition-transform shadow-lg"
                >
                  업체 전용 앱으로 이동 →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* 약관 상세 보기 모달 (Bottom Sheet 스타일) */}
      <AnimatePresence>
        {viewingTerms && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center"
            onClick={() => setViewingTerms(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full sm:w-auto sm:min-w-[400px] h-[70vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl p-6 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900">
                  {viewingTerms === 'terms' ? '서비스 이용약관' : viewingTerms === 'privacy' ? '개인정보 수집 및 이용' : '마케팅 알림 동의'}
                </h3>
                <button onClick={() => setViewingTerms(null)} className="text-slate-400 hover:text-slate-600 font-bold px-2">닫기</button>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                {termsContent[viewingTerms as keyof typeof termsContent]}
              </div>
              <button 
                onClick={() => {
                  if (!agreements[viewingTerms as keyof typeof agreements]) {
                    handleAgreement(viewingTerms as keyof typeof agreements);
                  }
                  setViewingTerms(null);
                }}
                className="mt-4 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
              >
                동의하고 닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
