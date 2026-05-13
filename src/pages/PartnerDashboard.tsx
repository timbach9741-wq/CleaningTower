import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, CheckCircle, AlertTriangle, Phone, Home, List, User, Briefcase, Info, Bell } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export interface Order {
  id: string;
  type?: string;
  date?: string;
  time?: string;
  location?: string;
  house?: string;
  size?: string;
  options?: string[];
  status?: string;
  assignedTo?: string | null;
  partnerName?: string;
  isUrgent?: boolean;
  cancelReason?: string;
  businessName?: string;
  name?: string;
  customerName?: string;
  realPhone?: string;
  detail?: string;
  completedAt?: string;
  completionItems?: string[];
  completionNote?: string;
  cancelPenalty?: string;
}

export interface PartnerUser {
  id: string;
  businessType?: 'business' | 'freelancer';
  companyName?: string;
  managerName?: string;
  name?: string;
  status?: 'active' | 'pending' | 'suspended';
  region?: string;
  isNotificationEnabled?: boolean;
  notificationRegions?: string[];
}

export default function Partner() {
  const [activeTab, setActiveTab] = useState<'new' | 'my' | 'profile'>('new');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [jobToCancel, setJobToCancel] = useState<Order | null>(null);
  const [jobToComplete, setJobToComplete] = useState<Order | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [completionNote, setCompletionNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [quotes, setQuotes] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<PartnerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(!localStorage.getItem('partnerId'));
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(location.state?.showLogin || false);
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });

  useEffect(() => {
    if (!db) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(data);
    });
    
    const loggedInId = localStorage.getItem('partnerId');
    let unsubscribeUser: Unsubscribe | null = null;
    
    if (loggedInId) {
      unsubscribeUser = onSnapshot(doc(db, 'partners', loggedInId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCurrentUser({ id: docSnapshot.id, ...docSnapshot.data() } as PartnerUser);
        } else {
          // 문서가 없으면 로그아웃 처리
          localStorage.removeItem('partnerId');
          setShowLanding(true);
          setShowLogin(true);
        }
        setIsLoading(false);
      });
    } else {
      setTimeout(() => setIsLoading(false), 0);
    }

    return () => {
      unsubscribe();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const mockSettlements = [
    {
      id: 1,
      date: '2026-04-10',
      location: '서울 강남구 역삼동 푸르지오',
      totalPrice: 350000,
      fee: 245000,
      settledAmount: 105000,
      status: '입금 완료',
    },
    {
      id: 2,
      date: '2026-04-12',
      location: '서울 서초구 반포동 래미안',
      totalPrice: 420000,
      fee: 294000,
      settledAmount: 126000,
      status: '입금 완료',
    },
    {
      id: 3,
      date: '2026-04-15',
      location: '경기 성남시 분당구 정자동',
      totalPrice: 280000,
      fee: 196000,
      settledAmount: 84000,
      status: '정산 대기',
    }
  ];

  // 내 일정: 날짜 오름차순(가까운 날짜부터), '상담완료' 상태인 오더만
  const myJobs = [...quotes]
    .filter(o => o.assignedTo === currentUser?.id && o.status === '상담완료')
    .sort((a, b) => {
      const timeA = (a.date && a.time) ? new Date(`${a.date} ${a.time}`).getTime() : 0;
      const timeB = (b.date && b.time) ? new Date(`${b.date} ${b.time}`).getTime() : 0;
      return (timeA || 0) - (timeB || 0);
    });
    
  // 대기중인 오더: 긴급 오더 최우선, 그 다음 날짜 오름차순
  const remainingOrders = [...quotes]
    .filter(o => o.status === '대기중' && (!o.assignedTo || o.assignedTo === currentUser?.id))
    .sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      const timeA = (a.date && a.time) ? new Date(`${a.date} ${a.time}`).getTime() : 0;
      const timeB = (b.date && b.time) ? new Date(`${b.date} ${b.time}`).getTime() : 0;
      return (timeA || 0) - (timeB || 0);
    });

  // 무관용 위약금(페널티) 정책 함수
  const getPenaltyInfo = () => {
    return { penalty: 300000, penaltyText: '보증금 전액 몰수 + 영구 제명', title: '취소 불가 (무관용 원칙)' };
  };

  // 안전 보증금(선입금) 상태 모의 
  const depositBalance = 300000;

  const completionChecklistData = [
    {
      category: '방/거실',
      items: ['벽, 천장', '내부 유리창(외창 제외)', '스위치, 콘센트', '문틀', '창문틀', '서랍장 내/외부', '실내등 및 조명(디자인등/샹들리에 제외)']
    },
    {
      category: '주방/싱크대',
      items: ['싱크대 내/외부', '싱크대 타일', '가스레인지(인덕션)', '배수구 오염', '레인지 후드(외부만)']
    },
    {
      category: '화장실/욕실',
      items: ['화장실 배수구', '좌변기 및 주변 청소', '타일 및 사이', '천장, 벽면, 바닥', '환풍시설(고착화 제외)', '수도꼭지', '선반(수건 장) 상부']
    },
    {
      category: '현관/베란다',
      items: ['출입문 내부', '신발장 내/외부', '베란다 바닥', '베란다 문틀', '베란다 내부 유리창', '베란다 배수구']
    }
  ];

  const handleToggleCheckItem = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleCheckAll = (categoryItems: string[]) => {
    const allChecked = categoryItems.every(i => checkedItems.includes(i));
    if (allChecked) {
      setCheckedItems(prev => prev.filter(i => !categoryItems.includes(i)));
    } else {
      setCheckedItems(prev => {
        const newSet = new Set([...prev, ...categoryItems]);
        return Array.from(newSet);
      });
    }
  };

  const totalChecklistItems = completionChecklistData.reduce((acc, curr) => acc + curr.items.length, 0);

  const handleConfirmComplete = async () => {
    if (!db || !jobToComplete) return;
    try {
      await updateDoc(doc(db, 'quotes', jobToComplete.id), {
        status: '정산대기',
        completedAt: new Date().toISOString(),
        completionItems: checkedItems,
        completionNote: completionNote
      });
      alert('작업 완료 및 정산 요청이 접수되었습니다.');
      setShowCompletionModal(false);
      setJobToComplete(null);
      setCheckedItems([]);
      setCompletionNote('');
    } catch (e) {
      console.error(e);
      alert("작업 완료 처리 중 오류가 발생했습니다.");
    }
  };

  const getPartnerPrice = (order: Order | null) => {
    if (!order) return "0";
    
    // 견적 마법사에서 넘어온 총 결제 금액(부가세 포함)을 기반으로 계산
    if (order.price) {
      const numericPrice = parseInt(order.price.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(numericPrice)) {
        // 예: 부가세를 제외한 공급가액(원래 금액) 계산
        const supplyPrice = Math.round(numericPrice / 1.1);
        
        // 공급가의 70%를 파트너 수익으로 책정 (천원 단위 올림 처리)
        const partnerPrice = Math.ceil((supplyPrice * 0.7) / 1000) * 1000;
        return partnerPrice.toLocaleString();
      }
    }

    // 구버전 데이터나 price 필드가 없는 경우의 Fallback
    let unitPrice = 10000;
    const isPremium = order.type?.includes('프리미엄') || false;
    const isOccupied = order.options?.includes('거주 청소 (짐 있음)') || false;
    const isBetween = order.options?.includes('당일 이사 (사이청소)') || false;
    
    if (isPremium) {
      unitPrice = 14000;
    } else if (isOccupied) {
      unitPrice = 12000;
    }
    
    const size = parseInt(order.size || '0', 10) || 0;
    let partnerPrice = unitPrice * size;
    
    if (isBetween) {
      partnerPrice += 70000;
    }
    
    const roundedPrice = Math.ceil(partnerPrice / 1000) * 1000;
    return roundedPrice.toLocaleString();
  };

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailSheet(true);
  };

  const handleAttemptAccept = () => {
    setShowDetailSheet(false);
    setTimeout(() => {
      setShowWarningModal(true);
    }, 200); // 딜레이를 주어 시트가 닫힌 후 경고창이 뜨게 함
  };

  const handleAcceptJob = async () => {
    if (!db || !selectedOrder || !currentUser) return;
    try {
      await updateDoc(doc(db, 'quotes', selectedOrder.id), {
        status: '상담완료', 
        assignedTo: currentUser.id,
        partnerName: currentUser.businessType === 'business' ? `${currentUser.companyName} (${currentUser.managerName})` : currentUser.name
      });
      setShowWarningModal(false);
      setSelectedOrder(null);
      setActiveTab('my');
    } catch (e) {
      console.error(e);
      alert("수락 중 오류가 발생했습니다.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!db || !jobToCancel) return;
    try {
      // 1. 상태를 '대기중'으로 돌리고 assignedTo를 지움
      // 2. 다른 기사님들을 위해 isUrgent 플래그 세팅
      await updateDoc(doc(db, 'quotes', jobToCancel.id), {
        status: '대기중', 
        assignedTo: null,
        isUrgent: true, // 긴급 대타 태그 (단가 +10% 업그레이드됨)
        cancelReason: cancelReason
      });
      alert('오더가 취소되었습니다. 본사 관리자에게 페널티 알림이 전송됩니다.');
      setShowCancelModal(false);
      setJobToCancel(null);
      setCancelReason('');
    } catch (e) {
      console.error(e);
      alert("취소 처리 중 오류가 발생했습니다.");
    }
  };

  const handleToggleNotification = async (currentStatus: boolean) => {
    if (!db || !currentUser) return;
    try {
      await updateDoc(doc(db, 'partners', currentUser.id), {
        isNotificationEnabled: !currentStatus
      });
    } catch (e) {
      console.error(e);
      alert('설정 변경 중 오류가 발생했습니다.');
    }
  };

  const handleSaveRegions = async (value: string) => {
    if (!db || !currentUser) return;
    try {
      const regionsArray = value.split(',').map(r => r.trim()).filter(r => r.length > 0);
      await updateDoc(doc(db, 'partners', currentUser.id), {
        notificationRegions: regionsArray
      });
      alert('알림 희망 지역이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('지역 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'partners'), 
        where('loginId', '==', loginForm.id),
        where('password', '==', loginForm.password)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const partnerDoc = querySnapshot.docs[0];
        localStorage.setItem('partnerId', partnerDoc.id);
        setCurrentUser({ id: partnerDoc.id, ...partnerDoc.data() });
        setShowLogin(false);
        setShowLanding(false);
      } else {
        alert("아이디 또는 비밀번호가 일치하지 않습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('partnerId');
    setCurrentUser(null);
    setShowLanding(true);
    setShowLogin(true); // 바로 로그인 화면을 띄워줌
  };

  if (showLanding) {
    if (showLogin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans max-w-md mx-auto shadow-2xl relative">
          <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 z-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              파트너 로그인
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-8">
              발급받은 로그인 아이디와 비밀번호를 입력해주세요.
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">아이디 (ID)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  placeholder="예: clean_1234"
                  value={loginForm.id}
                  onChange={e => setLoginForm({ ...loginForm, id: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  placeholder="6자리 비밀번호"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-xl active:scale-[0.98] transition-all disabled:bg-slate-300 flex justify-center"
                >
                  {isLoading ? '인증중...' : '파트너 시스템 접속'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center flex flex-col gap-3">
              <button
                onClick={() => setShowLogin(false)}
                className="text-sm text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                ← 이전 화면 (홈)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden font-sans max-w-md mx-auto shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="/cleaner-hero-korean.png" 
            alt="파트너스 배경" 
            className="w-full h-full object-cover opacity-40 object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/20"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center justify-end h-screen p-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 mx-auto w-max inline-flex border border-blue-400/30 bg-blue-500/20 text-blue-300 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/20 backdrop-blur-md">
              ✨ 가입비 0원 · 플랫폼 수수료 최저 보장
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight leading-[1.3] drop-shadow-xl">
              매월 <span className="text-blue-400">오더 걱정 없이</span><br/>청소에만 집중하세요
            </h1>
            <p className="text-slate-300 font-medium mb-10 text-sm leading-relaxed break-keep">
              클린파트너스는 검증된 사업자 및 프리랜서 반장님들과 함께합니다. 가입만 하시면 지역별 안정적인 오더를 즉각 배정해 드립니다.
            </p>
            <button 
              onClick={() => navigate('/partners/join')}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_10_20px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2 border border-blue-400/50"
            >
              새로운 파트너 가입 신청 <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button 
              onClick={() => setShowLogin(true)}
              className="w-full mt-4 py-3 text-slate-400 font-bold active:scale-[0.98] transition-all text-sm underline decoration-slate-600 underline-offset-4"
            >
              이미 가입하셨나요? 아이디/비번 로그인
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold max-w-md mx-auto shadow-2xl">로딩중...</div>;
  }

  // 승인 대기중일 경우 락 스크린 표시
  if (currentUser && currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans tracking-tight max-w-md mx-auto shadow-2xl">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-amber-200">
          <AlertTriangle size={36} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">가입 승인 대기 중</h1>
        <p className="text-slate-600 mb-8 font-medium break-keep leading-relaxed text-sm">
          <span className="font-bold text-slate-800 tracking-wide text-base">
            {currentUser.businessType === 'business' ? currentUser.companyName : currentUser.name}
          </span> 파트너님, 가입을 환영합니다!<br/>
          원활한 오더 진행을 위해 초기 <strong className="text-rose-500">활동 보증금(30만 원)</strong>의 예치가 필요합니다.<br/>
          입금이 확인되면 관리자가 즉시 승인해 드립니다.
        </p>

        <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-left mb-8 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-400 font-bold mb-1">입금 전용 계좌번호</p>
          <p className="text-2xl font-black text-slate-900 tracking-wider">우리은행 1002-123-456789</p>
          <p className="text-sm text-slate-500 mt-1 font-medium">예금주: (주)클린허브파트너스</p>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-600 text-sm font-bold">안전 보증금</span>
            <span className="text-rose-600 font-black text-2xl tracking-tight">300,000<span className="text-base ml-1">원</span></span>
          </div>
        </div>

        <div className="w-full flex justify-center mt-4">
          <div className="bg-blue-50 text-blue-700 px-5 py-3 rounded-xl text-xs font-bold animate-pulse shadow-sm border border-blue-100 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            입금 확인 대기 중... 관리자 시스템에서 처리됩니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* 상단 헤더 */}
      <header className="bg-white px-5 pt-10 pb-4 sticky top-0 z-10 shadow-sm relative">
        {!db && (
          <div className="absolute top-0 left-0 right-0 bg-rose-500 text-white text-[10px] py-1 text-center font-bold">
            ❗ Firebase 연동 대기중 (src/firebase.ts 설정 필요)
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">클린파트너스</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">환영합니다, {currentUser?.businessType === 'business' ? currentUser?.managerName : currentUser?.name} 파트너님</p>
          </div>
          <div className="text-right bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block mb-0.5 font-bold">안전 보증금 잔액</span>
            <span className="font-black text-emerald-600 text-lg flex items-center gap-1">
              {depositBalance.toLocaleString()}<span className="text-sm font-bold">원</span>
            </span>
          </div>
        </div>
      </header>

      {/* 내부 컨텐츠 영역 */}
      <main className="flex-1 p-5 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'new' && (
            <motion.div 
              key="new"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-blue-600/20 text-white">
                <Info size={24} className="shrink-0 text-blue-200 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-1">오더 선점은 선착순입니다.</h3>
                  <p className="text-xs text-blue-100 font-medium leading-relaxed opacity-90">
                    수락된 오더는 취소가 불가능하며, 무단 불참 시 보증금이 몰수되고 즉시 영구제명 됩니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-lg text-slate-800">새로운 오더 <span className="text-blue-600">{remainingOrders.length}건</span></h2>
              </div>

              {remainingOrders.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Briefcase size={48} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-500 font-medium text-sm">현재 대기중인 오더가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {remainingOrders.map((order, idx) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden active:scale-[0.98] transition-transform"
                      onClick={() => handleOpenDetail(order)}
                    >
                      <div className="p-5">
                        {order.isUrgent && (
                          <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full mb-2 inline-flex items-center gap-1 shadow-sm animate-pulse">
                            🔥 긴급 대타 / 단가 +10% 
                          </span>
                        )}
                        {order.assignedTo === currentUser?.id && (
                          <span className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full mb-2 ml-1 inline-flex items-center gap-1 shadow-sm">
                            🎯 지정 견적 대기
                          </span>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`${order.isUrgent ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'} font-bold text-xs px-3 py-1.5 rounded-lg border`}>{order.type}</span>
                          <span className="text-slate-900 font-black tracking-tight text-xl">{getPartnerPrice(order)}원</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                            <Calendar size={18} className="text-slate-400 shrink-0" />
                            <span className="text-slate-900">{order.date}</span> <span className="text-blue-600 font-bold">{order.time}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                            <MapPin size={18} className="text-slate-400 shrink-0" />
                            {order.location ? order.location.split(' ').slice(0, 3).join(' ') : '주소 미상'} <span className="text-xs text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded ml-1">상세비공개</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                            <Home size={18} className="text-slate-400 shrink-0" />
                            {order.house} · <span className="text-slate-900 font-bold">{order.size}평</span>
                          </div>
                          {order.options && order.options.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                              {order.options.map((opt: string, i: number) => (
                                <span key={i} className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-1 rounded-md">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'my' && (
            <motion.div 
              key="my"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
               <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-lg text-slate-800">확정된 내 작업 일정</h2>
              </div>

              {myJobs.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <CheckCircle size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="text-slate-500 font-medium">수락한 작업 일정이 없습니다.</p>
                  <button onClick={() => setActiveTab('new')} className="mt-4 text-blue-600 text-sm font-bold bg-blue-50 px-4 py-2 rounded-lg">새 오더 보러가기</button>
                </div>
              ) : (
                myJobs.map(job => (
                  <motion.div key={job.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                    <div className="p-5 pl-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">확정완료</span>
                        <span className="text-xs font-bold text-slate-500">{job.type}</span>
                      </div>
                      
                      {/* 1. 시공 날짜 */}
                      <div className="mb-4">
                        <div className="text-xs text-slate-500 font-bold mb-1">시공 날짜</div>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight">{job.date} <span className="text-emerald-600">{job.time}</span></h3>
                      </div>
                      
                      {/* 상세 정보 노출 구역 */}
                      <div className="relative p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200 mb-4">
                        
                        {/* 2. 시공 주소 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><MapPin size={14}/> 시공 주소</div>
                           <span className="text-sm font-bold text-slate-900 leading-snug">{job.location}</span>
                        </div>
                        
                        <div className="h-px w-full bg-slate-200"></div>
                        
                        {/* 2-5. 업체명(담당자) */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><User size={14}/> 업체명 (담당자)</div>
                           <span className="text-sm font-bold text-slate-900 leading-snug">{job.businessName || job.name || job.customerName || '고객(이름 미상)'}</span>
                        </div>

                        <div className="h-px w-full bg-slate-200"></div>
                        
                        {/* 3. 담당자 연락처 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><Phone size={14}/> 담당자 연락처</div>
                           <span className="text-sm font-black text-blue-600">{job.realPhone || '010-0000-0000'}</span>
                        </div>
                        
                        <div className="h-px w-full bg-slate-200"></div>

                        {/* 4. 추가 요청 및 메모 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><Info size={14}/> 추가 요청 및 메모</div>
                           <span className="text-[13px] font-medium text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm mt-0.5 whitespace-pre-wrap">
                             {job.detail || '기재된 특이사항이 없습니다.'}
                           </span>
                        </div>

                        {/* 5. 선택 옵션 */}
                        {job.options && job.options.length > 0 && (
                          <>
                            <div className="h-px w-full bg-slate-200"></div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5">
                                <span className="material-symbols-outlined text-[14px]">checklist</span> 
                                고객 선택 옵션
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-0.5">
                                {job.options.map((opt: string, i: number) => (
                                  <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold px-2 py-1 rounded-md">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="h-px w-full bg-slate-200 mt-4 mb-4"></div>
                      <div className="flex justify-between items-end mb-4">
                        <div className="flex flex-col items-start gap-3 w-full max-w-[60%]">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setJobToComplete(job);
                              setShowCompletionModal(true);
                              setCheckedItems([]); // 초기화
                              setCompletionNote('');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-3 rounded-xl text-sm shadow-md transition-all active:scale-[0.98] w-full border border-blue-500 shadow-blue-500/20"
                          >
                            작업 완료 및 정산 보고
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setJobToCancel(job);
                              setShowCancelModal(true);
                            }}
                            className="text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-2 py-1.5 rounded-md transition-colors w-full text-left"
                          >
                            피치못할 사정으로 오더 포기 (페널티)
                          </button>
                        </div>
                        <div className="text-right pb-1">
                          <div className="text-xs font-bold text-slate-400 mb-0.5">최종 예상 수익</div>
                          <p className="font-black text-slate-900 text-2xl leading-none">{getPartnerPrice(job)}원</p>
                        </div>
                      </div>
                    </div>  
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User size={40} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900">{currentUser?.businessType === 'business' ? `${currentUser?.companyName} (${currentUser?.managerName})` : currentUser?.name}</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">활동 지역: {currentUser?.region}</p>
                <div className="mt-6 flex justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">총 누적 오더</p>
                    <p className="text-xl font-black text-slate-900">12건</p>
                  </div>
                  <div className="w-px bg-slate-200 mx-2"></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">보증금 상태</p>
                    <p className="text-xl font-black text-emerald-600">안전</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-1.5"><Bell size={18} className="text-blue-600"/> 새로운 오더 알림</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">내 지역에 오더가 등록되면 즉시 알림</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={currentUser?.isNotificationEnabled !== false} 
                      onChange={() => handleToggleNotification(currentUser?.isNotificationEnabled !== false)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="h-px bg-slate-100 w-full mb-4"></div>
                
                <div className="mb-2">
                  <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5"><MapPin size={16} className="text-slate-400"/> 알림 수신 희망 지역</h3>
                  <p className="text-[11px] text-slate-400 mb-3 font-medium">설정된 지역의 오더만 알림을 받습니다.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="regionInput"
                      placeholder="예: 강남구, 서초구" 
                      defaultValue={currentUser?.notificationRegions ? currentUser.notificationRegions.join(', ') : (currentUser?.region || '')}
                      className="flex-1 bg-slate-50 border border-slate-200 text-sm px-3 py-2.5 rounded-xl outline-none focus:border-blue-400 transition-colors font-medium"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('regionInput') as HTMLInputElement;
                        if (input) handleSaveRegions(input.value);
                      }}
                      className="bg-slate-900 text-white font-bold text-xs px-4 rounded-xl active:scale-[0.98] transition-transform"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                <button 
                  onClick={() => setShowSettlementModal(true)}
                  className="w-full text-left px-5 py-4 font-bold text-slate-700 flex justify-between items-center bg-white active:bg-slate-50"
                >
                  정산 내역 확인 <span className="text-slate-400">→</span>
                </button>
                <button 
                  onClick={() => setShowWithdrawalModal(true)}
                  className="w-full text-left px-5 py-4 font-bold text-slate-700 flex justify-between items-center bg-white active:bg-slate-50"
                >
                  보증금 출금 신청 <span className="text-slate-400">→</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-4 font-bold text-slate-700 flex justify-between items-center bg-white active:bg-slate-50 border-t border-slate-100"
                >
                  로그아웃 <span className="text-slate-400">→</span>
                </button>
                <button 
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full text-left px-5 py-4 font-bold text-rose-600 flex justify-between items-center bg-rose-50 active:bg-rose-100 border-t border-slate-100"
                >
                  파트너 탈퇴하기 <span className="text-slate-400">→</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 오더 상세 시트 (바텀 시트) */}
      <AnimatePresence>
        {showDetailSheet && selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailSheet(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                <div className="mb-6">
                  <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-lg border border-blue-100 mb-3 inline-block">{selectedOrder.type}</span>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedOrder.location ? selectedOrder.location.split(' ').slice(0, 3).join(' ') : '주소 미상'}</h2>
                  <p className="text-slate-500 font-medium break-keep">상세 주소는 수락 시 1초 만에 즉시 완전 공개됩니다.</p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm">일정</span>
                    <span className="text-slate-900 font-bold">{selectedOrder.date} ({selectedOrder.time})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm">주거형태</span>
                    <span className="text-slate-900 font-bold">{selectedOrder.house} · {selectedOrder.size}평</span>
                  </div>
                  {selectedOrder.options && selectedOrder.options.length > 0 && (
                    <div className="flex flex-col pt-3 border-t border-slate-200">
                      <span className="text-slate-500 font-medium text-sm mb-2">고객 선택 옵션</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedOrder.options.map((opt: string, i: number) => (
                          <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold px-2.5 py-1 rounded-md">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-slate-500 font-medium text-sm">예상 수익</span>
                    <span className="text-blue-600 font-black text-xl">{getPartnerPrice(selectedOrder)}원</span>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5"><Info size={16}/> 고객 특이사항</h3>
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm font-medium border border-amber-100 whitespace-pre-wrap">
                    {selectedOrder.detail}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowDetailSheet(false)} className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-600 font-bold active:bg-slate-200">
                    닫기
                  </button>
                  <button onClick={handleAttemptAccept} className="flex-[2] py-4 rounded-xl bg-slate-900 text-white font-bold active:bg-slate-800 shadow-xl shadow-slate-900/20">
                    이 오더 수락하기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 수락 경고 모달 (노쇼/무단취소 경고) */}
      <AnimatePresence>
        {showWarningModal && selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWarningModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10"
            >
              <div className="bg-rose-500 p-6 flex flex-col items-center text-center text-white">
                <div className="bg-white/20 p-3 rounded-full mb-3">
                  <AlertTriangle size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black">수락 전 엄중 경고</h2>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-[15px] font-black text-rose-800 break-keep leading-snug">
                  오더 수락 후 일방적 취소(노쇼 포함) 시 즉시 플랫폼에서 <span className="underline decoration-wavy decoration-rose-500">영구 강퇴</span> 처리됩니다.
                </div>
                <ul className="text-sm text-slate-600 space-y-3 list-disc pl-5 break-keep font-medium leading-relaxed">
                  <li>무단 취소 시 사전 납부한 <strong>안전 보증금이 환불되지 않으며 페널티로 몰수됩니다.</strong></li>
                  <li>수락 버튼을 누르면 고객의 <strong>정확한 주소 및 연락처</strong>가 공개됩니다.</li>
                  <li>본인의 일정과 인력을 확실히 점검하신 후 수락해주세요.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 p-6 pt-0">
                <button 
                  onClick={handleAcceptJob}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-transform"
                >
                  네, 책임지고 수락합니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 오더 취소(포기) 모달 */}
      <AnimatePresence>
        {showCancelModal && jobToCancel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className={`p-6 flex flex-col items-center text-center text-white ${getPenaltyInfo().penalty >= 100000 ? 'bg-rose-600' : 'bg-slate-900'}`}>
                <div className="bg-white/20 p-3 rounded-full mb-3">
                  <AlertTriangle size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black">{getPenaltyInfo().title}</h2>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto">
                <p className="text-sm border-b border-slate-100 pb-3 text-slate-600 font-medium break-keep leading-relaxed text-center">
                  시공 확정 후 취소 시 고객 신뢰 하락에 따른 <strong className="text-rose-600">본사 페널티</strong>가 즉시 부과됩니다.
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">시공 일자</span>
                    <span className="text-slate-900 font-black">{jobToCancel.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">적용 페널티</span>
                    <span className="text-rose-600 font-black">{getPenaltyInfo().penaltyText}</span>
                  </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 block mb-1">피치 못할 사유 입력 (최소 5자 이상) <span className="font-normal text-slate-400 block mt-0.5">사고/입원 등 면책 사유는 본사 카카오톡으로 증빙서류 제출 필수</span></label>
                   <textarea 
                     value={cancelReason}
                     onChange={(e) => setCancelReason(e.target.value)}
                     placeholder="예상치 못한 사정(사고, 응급실 방문 등)을 구체적으로 기재해주세요."
                     className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-rose-400 resize-none h-24 bg-white shadow-inner"
                   ></textarea>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-6 pt-2 shrink-0 border-t border-slate-100">
                <button 
                  onClick={handleConfirmCancel}
                  disabled={cancelReason.trim().length < 5}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl active:scale-[0.98] transition-all"
                >
                  페널티 감수하고 시공 취소하기
                </button>
                <button 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  되돌아가기 (일정 유지)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 정산 내역 시트 */}
      <AnimatePresence>
        {showSettlementModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettlementModal(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 overflow-hidden shadow-2xl h-[80vh] flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0 text-center">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                <h2 className="text-xl font-black text-slate-900">정산 내역 확인</h2>
                <p className="text-sm text-slate-500 mt-1">완료된 오더의 정산 내역을 보여줍니다.</p>
              </div>
              <div className="p-0 overflow-y-auto flex-1 bg-slate-50 relative">
                {mockSettlements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 p-6">
                    <Briefcase size={48} className="opacity-20" />
                    <p className="font-bold">현재 정산 가능한 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {mockSettlements.map((item) => (
                      <div key={item.id} className="p-5 bg-white mb-2 shadow-sm border-y border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.status === '입금 완료' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {item.status}
                          </span>
                          <span className="text-slate-400 text-sm font-medium">{item.date}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-3">{item.location}</h3>
                        
                        <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                          <div className="flex justify-between items-center text-slate-900 font-bold">
                            <span>최종 정산액</span>
                            <span className="text-blue-600 text-lg">{item.settledAmount.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex-shrink-0">
                <button onClick={() => setShowSettlementModal(false)} className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold active:bg-slate-800">
                  닫기
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 보증금 출금 모달 */}
      <AnimatePresence>
        {showWithdrawalModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawalModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 text-center pt-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List size={32} />
                </div>
                <h2 className="text-xl font-black mb-2 text-slate-900">보증금 출금 신청</h2>
                <p className="text-slate-500 text-sm font-medium break-keep">
                  현재 남은 보증금 전액 출금을 신청하시겠습니까?<br/>신청 시 1~2 영업일 내로 가입된 계좌로 입금됩니다.
                </p>
              </div>
              <div className="flex flex-col gap-2 p-6 pt-2">
                <button 
                  onClick={() => {
                    alert('출금 신청이 접수되었습니다. (영업일 기준 1~2일 소요)');
                    setShowWithdrawalModal(false);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg active:scale-[0.98] transition-transform"
                >
                  출금 신청하기
                </button>
                <button 
                  onClick={() => setShowWithdrawalModal(false)}
                  className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 파트너 탈퇴 모달 */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaveModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10"
            >
              <div className="bg-slate-900 p-6 flex flex-col items-center text-center text-white">
                <div className="bg-white/10 p-3 rounded-full mb-3">
                  <User size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black">정말 탈퇴하시겠습니까?</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 font-medium break-keep leading-relaxed text-center">
                  진행 중인 스케줄이 있을 경우 탈퇴가 제한될 수 있습니다. 탈퇴처리 이후 모든 데이터는 삭제되며 복구할 수 없습니다.
                </p>
              </div>

              <div className="flex flex-col gap-2 p-6 pt-0">
                <button 
                  onClick={() => {
                    alert('성공적으로 탈퇴되었습니다.');
                    setShowLeaveModal(false);
                  }}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl active:scale-[0.98] transition-transform"
                >
                  네, 탈퇴합니다
                </button>
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  className="w-full py-4 bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/30 rounded-xl active:scale-[0.98] transition-transform"
                >
                  아니요, 계속 활동하겠습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 작업 완료 및 정산 보고 모달 (체크리스트) */}
      <AnimatePresence>
        {showCompletionModal && jobToComplete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompletionModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="bg-blue-600 p-6 flex flex-col items-center text-center text-white shrink-0">
                <div className="bg-white/20 p-3 rounded-full mb-3">
                  <CheckCircle size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black">작업 완료 보고서</h2>
                <p className="text-blue-100 text-sm mt-2 font-medium break-keep">
                  실제 청소를 완료한 항목만 정확히 체크해 주세요.<br/>(전체 항목을 다 체크하지 않아도 보고서 제출이 가능합니다.)
                </p>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center text-sm mb-1">
                     <span className="text-slate-500 font-bold">시공 주소</span>
                     <span className="text-slate-900 font-black">{jobToComplete.location}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500 font-bold">진행도</span>
                     <span className="text-blue-600 font-black">{checkedItems.length} / {totalChecklistItems} 완료</span>
                  </div>
                </div>

                <div className="space-y-5">
                  {completionChecklistData.map((categoryData, idx) => {
                    const allChecked = categoryData.items.every(i => checkedItems.includes(i));
                    
                    return (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                          <h3 className="font-black text-slate-800">{categoryData.category}</h3>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">전체 선택</span>
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${allChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={allChecked}
                                onChange={() => handleCheckAll(categoryData.items)}
                              />
                              {allChecked && <CheckCircle size={14} className="text-white" />}
                            </div>
                          </label>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {categoryData.items.map((item, itemIdx) => {
                            const isChecked = checkedItems.includes(item);
                            return (
                              <label key={itemIdx} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>{item}</span>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors border-2 shrink-0 ml-3 ${isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={() => handleToggleCheckItem(item)}
                                  />
                                  {isChecked && <CheckCircle size={16} className="text-white" />}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
                  <h3 className="font-black text-slate-800 text-sm mb-2">추가 보고 사항 (선택)</h3>
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="오염도가 심했던 부분이나, 특이사항이 있다면 자유롭게 기재해 주세요."
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none h-24 bg-slate-50"
                  ></textarea>
                </div>
              </div>

              <div className="p-5 bg-white border-t border-slate-100 shrink-0 space-y-2">
                <button 
                  onClick={handleConfirmComplete}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  최종 완료 및 정산 요청하기 <span className="material-symbols-outlined text-[18px]">task_alt</span>
                </button>
                <button 
                  onClick={() => setShowCompletionModal(false)}
                  className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 하단 네비게이션 바 */}
      <nav className="bg-white border-t border-slate-100 fixed bottom-0 max-w-md w-full pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center px-2 py-1">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex flex-col items-center justify-center p-3 transition-colors ${activeTab === 'new' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={22} className={activeTab === 'new' ? 'drop-shadow-md' : ''} />
            <span className={`text-[10px] mt-1.5 ${activeTab === 'new' ? 'font-bold' : 'font-medium'}`}>발주게시판</span>
          </button>
          <button 
            onClick={() => setActiveTab('my')}
            className={`flex-1 flex flex-col items-center justify-center p-3 transition-colors relative ${activeTab === 'my' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className="relative">
              <Calendar size={22} className={activeTab === 'my' ? 'drop-shadow-md' : ''} />
              {myJobs.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {myJobs.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-1.5 ${activeTab === 'my' ? 'font-bold' : 'font-medium'}`}>내 스케줄</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center p-3 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User size={22} className={activeTab === 'profile' ? 'drop-shadow-md' : ''} />
            <span className={`text-[10px] mt-1.5 ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>내 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
