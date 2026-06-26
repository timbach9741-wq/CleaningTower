import React, { useState, useEffect } from 'react';
import { Home, Receipt, Edit3, MessageSquare, LogOut, ChevronRight, Sparkles, AlertCircle, Clock, MapPin, Building2, CalendarSync, Gift, Copy, X, Calendar, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser, type SocialUser, logoutUser } from '../lib/authHelpers';

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const [hasActiveOrder, setHasActiveOrder] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRefundAgreed, setIsRefundAgreed] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [myReferralCode, setMyReferralCode] = useState('');
  const [myCoupons, setMyCoupons] = useState(0);
  const [user, setUser] = useState<SocialUser | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    let code = localStorage.getItem('myReferralCode');
    if (!code) {
      code = 'TOWER' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('myReferralCode', code);
    }
    setMyReferralCode(code);

    let coupons = localStorage.getItem('myCoupons');
    if (coupons === null) {
      // 데모를 위해 초기 쿠폰 1장 지급
      localStorage.setItem('myCoupons', '1');
      setMyCoupons(1);
    } else {
      setMyCoupons(parseInt(coupons, 10));
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myReferralCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 font-sans">
      {/* Header Profile */}
      <div className="bg-white px-6 py-8 border-b border-slate-100">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-inner object-cover" />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl shadow-inner">
                {user?.name ? user.name.charAt(0) : '고객'}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">반갑습니다, {user?.name || '고객'}님!</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {user?.provider === 'kakao' && (
                  <span className="bg-[#FEE500] text-[#000000] text-xs font-bold px-2 py-0.5 rounded-md">카카오 연동</span>
                )}
                {user?.provider === 'naver' && (
                  <span className="bg-[#03C75A] text-white text-xs font-bold px-2 py-0.5 rounded-md">네이버 연동</span>
                )}
                <p className="text-slate-500 font-medium text-sm">{user?.email || ''}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="relative p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* 1. 진행 중인 오더 상태 (최우선 노출) */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">내 청소 진행 현황</h2>
          {hasActiveOrder ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    파트너 배정 완료
                  </span>
                  <span className="text-slate-400 text-xs font-medium">예약번호: 240622-A1B2</span>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">서울 강남구 역삼동 푸르지오</h3>
              
              <div className="bg-slate-50/80 rounded-2xl p-4 mt-4 border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar size={18} className="text-blue-500 shrink-0" />
                  <span className="font-bold text-sm">2026. 06. 23 (화) 오전 09:00</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Sparkles size={18} className="text-blue-500 shrink-0" />
                  <span className="font-bold text-sm">프리미엄 입주청소 (32평)</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Receipt size={18} className="text-blue-500 shrink-0" />
                  <span className="font-bold text-sm">결제 예상 금액: <span className="text-blue-600">450,000원</span></span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                    김
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">김청소 파트너</p>
                    <p className="text-xs text-slate-500 font-medium">평점 4.9 ★</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsRefundAgreed(false);
                      setIsCancelModalOpen(true);
                    }}
                    className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors"
                  >
                    예약 취소
                  </button>
                  <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                    연락하기
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-lg text-white text-center"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">새로운 청소가 필요하신가요?</h3>
              <p className="text-blue-100 font-medium mb-6">1분 만에 내 주변 검증된 파트너의 견적을 받아보세요.</p>
              <button 
                onClick={() => navigate('/#quote')}
                className="bg-white text-blue-600 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 hover:scale-105 transition-all shadow-lg w-full sm:w-auto"
              >
                무료 견적 신청하기
              </button>
            </motion.div>
          )}
        </section>

        {/* 2. 나의 홈케어 현황 (이용 횟수 & 리뷰 & 쿠폰) */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Home size={20} className="text-indigo-600" />
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs sm:text-sm mb-1">누적 이용 횟수</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">3</span>
                  <span className="text-base sm:text-lg font-bold text-slate-400">회</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => setIsReviewModalOpen(true)}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Edit3 size={20} className="text-emerald-600" />
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs sm:text-sm mb-1">작성 가능한 리뷰</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600">1</span>
                  <span className="text-base sm:text-lg font-bold text-slate-400">건</span>
                </div>
              </div>
            </div>

            {/* 보유 할인 쿠폰 */}
            <div 
              className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-rose-200 transition-colors cursor-pointer col-span-2 sm:col-span-1"
              onClick={() => setIsReferralModalOpen(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                  <Gift size={20} className="text-rose-600" />
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs sm:text-sm mb-1">보유 할인 쿠폰</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600">{myCoupons}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-400">장</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 빠른 서비스 신청 */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">서비스 신청하기</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => navigate('/quote/move-in')} className="bg-white flex flex-col items-center gap-3 p-4 rounded-2xl shadow-sm border border-slate-100 hover:bg-blue-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Home size={24} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">이사/입주</span>
            </button>
            <button onClick={() => navigate('/quote/business')} className="bg-white flex flex-col items-center gap-3 p-4 rounded-2xl shadow-sm border border-slate-100 hover:bg-blue-50 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">상가/사무실</span>
            </button>

            <button onClick={() => navigate('/quote/regular')} className="bg-white flex flex-col items-center gap-3 p-4 rounded-2xl shadow-sm border border-slate-100 hover:bg-blue-50 transition-colors">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <CalendarSync size={24} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">정기청소</span>
            </button>
          </div>
        </section>

        {/* 4. 내 활동 리스트 메뉴 */}
        <section>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">이용 내역</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">과거 서비스 이용 상세 내역을 확인합니다.</p>
              </div>
              <ChevronRight className="text-slate-300" />
            </div>


            <div className="p-5 sm:p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">1:1 문의 / 고객센터</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">궁금하신 점이나 불편 사항을 신속히 해결해 드립니다.</p>
              </div>
              <ChevronRight className="text-slate-300" />
            </div>
          </div>
        </section>

        {/* 4.5 내 쿠폰함 */}
        <section>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">내 할인 쿠폰</h3>
                <p className="text-slate-500 text-sm mt-0.5">다음 청소 시 바로 사용 가능해요!</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-black text-emerald-600">{myCoupons}</span>
              <span className="text-slate-500 font-bold">장</span>
            </div>
          </div>
        </section>

        {/* 5. 친구 추천 배너 */}
        <section>
          <div onClick={() => setIsReferralModalOpen(true)} className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Gift size={20} className="text-yellow-300" />
                <h3 className="font-bold text-lg">친구 추천하고 1만원 혜택 받기!</h3>
              </div>
              <p className="text-blue-100 text-sm font-medium">청소타워를 추천해주시면 두 분 모두에게 1만원 할인권을 드립니다.</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ChevronRight size={20} className="text-white" />
            </div>
          </div>
        </section>

      </div>

      {/* 친구 추천 모달 */}
      <AnimatePresence>
        {isReferralModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col"
            >
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                  <Gift size={28} />
                </div>
                <button onClick={() => setIsReferralModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 pt-2">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">지인에게 추천하고<br/><span className="text-blue-600">1만원 할인권</span> 받으세요!</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  친구에게 추천인 코드를 공유해주세요.<br/>
                  친구가 예약 시 이 코드를 입력하면 즉시 1만원 할인을 받고, 고객님께도 다음 예약 시 쓸 수 있는 1만원 할인 쿠폰이 발급됩니다.
                </p>
                
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">나의 추천인 코드</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-slate-800 tracking-wider">{myReferralCode}</span>
                    <button 
                      onClick={handleCopyCode}
                      className="p-2 bg-white text-blue-600 border border-slate-200 rounded-xl shadow-sm hover:bg-blue-50 transition-colors"
                    >
                      {isCopied ? <span className="text-xs font-bold px-1 text-emerald-600">복사됨!</span> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleCopyCode}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-sm transition-all active:scale-[0.98]"
                >
                  {isCopied ? '코드가 복사되었습니다!' : '내 추천인 코드 복사하기'}
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 예약 취소 모달 */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col"
            >
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle size={28} />
                </div>
                <button onClick={() => setIsCancelModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 pt-2">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">예약을 취소하시겠습니까?</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  취소하시면 배정된 파트너와의 연결이 해제됩니다. 아래 환불 규정을 꼭 확인해 주세요.
                </p>
                
                <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 mb-6 flex flex-col gap-2">
                  <h4 className="font-bold text-rose-800 text-sm mb-1">예약 취소 정책 안내</h4>
                  <ul className="text-[13px] text-rose-700 space-y-1.5 list-disc list-inside">
                    <li>청소 예정일 <span className="font-bold">3일 전</span>까지: 예약금(50,000원) 전액 환불</li>
                    <li>청소 예정일 <span className="font-bold">2일 전 ~ 당일</span>: <span className="text-rose-600 font-bold underline underline-offset-2">예약금 환불 불가</span><br/><span className="text-[11px] text-rose-500 ml-4 block mt-0.5">(수수료 및 파트너 배정 취소에 대한 기회비용 보상)</span></li>
                  </ul>
                  <div className="mt-3 pt-4 border-t border-rose-100 flex items-center justify-center">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isRefundAgreed}
                        onChange={(e) => setIsRefundAgreed(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer" 
                      />
                      <span className="text-sm font-bold text-rose-800 group-hover:text-rose-600 transition-colors">
                        위 환불 불가 규정을 확인하였으며, 동의합니다.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => {
                      setIsCancelModalOpen(false);
                      setHasActiveOrder(false);
                      alert("예약이 취소되었습니다.");
                    }}
                    disabled={!isRefundAgreed}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed font-bold py-4 rounded-xl text-lg transition-colors"
                  >
                    네, 취소합니다
                  </button>
                  <button 
                    onClick={() => setIsCancelModalOpen(false)}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-sm transition-all"
                  >
                    아니오, 유지할게요
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 작성 가능한 리뷰 목록 모달 */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100"
            >
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Edit3 size={28} />
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 pt-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">작성 가능한 리뷰</h2>
                <p className="text-slate-500 font-medium text-sm mb-6">청소 서비스는 만족스러우셨나요? 소중한 리뷰를 남겨주시면 파트너에게 큰 힘이 됩니다!</p>
                
                <div className="space-y-4">
                  {/* Dummy Completed Order */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block">완료됨</span>
                        <h4 className="font-bold text-slate-900">서울 강남구 역삼동 푸르지오</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">2026. 06. 10 (수) • 프리미엄 입주청소</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">김청소 파트너</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/review-write/123')}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                    >
                      리뷰 작성하기
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
