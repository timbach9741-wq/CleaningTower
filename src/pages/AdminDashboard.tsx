import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  UserCheck,
  Building2,
  Wallet,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

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
  contactInfo?: string;
  cleaningDate?: string;
  cleaningType?: string;
  detail?: string;
  completedAt?: string;
  completionItems?: string[];
  completionNote?: string;
  adminReviewedCancel?: boolean;
  price?: string;
  cancelPenalty?: string;
  designatedPartnerName?: string;
  createdAt?: string;
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
  loginId?: string;
  loginPassword?: string;
  password?: string;
  phone?: string;
  createdAt?: string;
  plan?: string;
  teamSize?: string;
  mainServices?: string[];
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('adminLoggedIn') === 'true');
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [quotes, setQuotes] = useState<Order[]>([]);
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<Order | null>(null);
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<PartnerUser | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // 파트너 수동 계정 생성 관련 상태
  const [isCreatePartnerModalOpen, setIsCreatePartnerModalOpen] = useState(false);
  const [newPartnerForm, setNewPartnerForm] = useState({
    businessType: 'business',
    companyName: '',
    managerName: '',
    phone: '',
    region: '강남구/서초구/송파구',
    loginId: '',
    loginPassword: ''
  });
  
  // 파트너 관리 탭 필터
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const [partnerFilterStatus, setPartnerFilterStatus] = useState('전체');
  const [partnerFilterRegion, setPartnerFilterRegion] = useState('전체');

  // 재무 탭 데이터 필터 상탯값
  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');
  const [financePartnerFilter, setFinancePartnerFilter] = useState('전체');

  // 견적/예약 관리 탭 필터
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [quoteFilters, setQuoteFilters] = useState({
    status: '전체',
    startDate: '',
    endDate: '',
  });

  // 새 예약 수동 등록
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = useState(false);
  const [newQuoteForm, setNewQuoteForm] = useState({
    name: '',
    realPhone: '',
    type: '일반 청소',
    house: '아파트',
    size: '',
    location: '',
    date: '',
    time: '시간협의',
    price: '',
    detail: '',
  });
  
  const adminNotifications = quotes.filter(q => q.cancelReason && !q.adminReviewedCancel);
  
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      data.sort((a: Order, b: Order) => {
        const getStr = (v: any) => typeof v === 'string' ? v : (v && v.toDate ? v.toDate().toISOString() : String(v || ''));
        const dateA = getStr(a.date || a.cleaningDate);
        const dateB = getStr(b.date || b.cleaningDate);
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA); // 최신 날짜순
        }
        const createdA = getStr(a.createdAt);
        const createdB = getStr(b.createdAt);
        return createdB.localeCompare(createdA); // 최신 등록순
      });
      setQuotes(data);
    });
    
    const unsubscribePartners = onSnapshot(collection(db, 'partners'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as PartnerUser[];
      data.sort((a: PartnerUser, b: PartnerUser) => {
        const getStr = (v: any) => typeof v === 'string' ? v : (v && v.toDate ? v.toDate().toISOString() : String(v || ''));
        const createdA = getStr(a.createdAt);
        const createdB = getStr(b.createdAt);
        return createdB.localeCompare(createdA); // 최신 등록순
      });
      setPartners(data);
    });

    return () => {
      unsubscribe();
      unsubscribePartners();
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'quotes', id), { status: newStatus });
  };

  const handleApprovePartner = async (id: string) => {
    if (!db) return;
    if (confirm("해당 파트너의 상태를 '활동 중(승인)'으로 변경하시겠습니까?")) {
      await updateDoc(doc(db, 'partners', id), { status: 'active' });
      alert("파트너가 정상적으로 승인(활동 재개)되었습니다.");
    }
  };

  const handleSuspendPartner = async (id: string) => {
    if (!db) return;
    if (confirm("해당 파트너의 활동을 '정지'하시겠습니까?")) {
      await updateDoc(doc(db, 'partners', id), { status: 'suspended' });
      alert("파트너가 정지 처리되었습니다.");
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!db) return;
    if (confirm("정말 이 파트너를 거절/삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) {
      await deleteDoc(doc(db, 'partners', id));
      alert("파트너가 삭제되었습니다.");
    }
  };

  const handleSendBusinessUrl = (partner: PartnerUser) => {
    const businessUrl = `https://clean-partner.dailyhousing.kr`;
    const message = `[입주청소 파트너스]\n${partner.companyName || partner.name}님, 사업자 전용 페이지 주소가 발송되었습니다.\n\nURL: ${businessUrl}\n아이디: ${partner.loginId}\n비밀번호: ${partner.loginPassword || partner.password}`;
    alert(`아래 내용으로 파트너에게 URL 발송이 시뮬레이션 되었습니다. (추후 카카오톡 연동 예정)\n\n${message}`);
  };

  const handleCreateQuote = async () => {
    if (!db) return alert("Firebase 연결이 필요합니다.");
    if (!newQuoteForm.name || !newQuoteForm.realPhone || !newQuoteForm.date) {
      alert("고객명, 연락처, 예약일은 필수 입력 항목입니다.");
      return;
    }
    
    try {
      await addDoc(collection(db, 'quotes'), {
        ...newQuoteForm,
        status: '대기중', // 수동 등록 시 기본값
        createdAt: new Date().toISOString(),
        options: [], 
        assignedTo: null,
        isUrgent: false,
      });
      alert("새 예약이 정상적으로 등록되었습니다.");
      setIsCreateQuoteModalOpen(false);
      setNewQuoteForm({
        name: '', realPhone: '', type: '일반 청소', house: '아파트',
        size: '', location: '', date: '', time: '시간협의', price: '', detail: ''
      });
    } catch (e) {
      console.error(e);
      alert("예약 등록에 실패했습니다.");
    }
  };

  const handleCreatePartner = async () => {
    if (!db) return alert("Firebase 연결이 필요합니다. (src/firebase.ts)");
    
    if (!newPartnerForm.loginId || !newPartnerForm.loginPassword || !newPartnerForm.companyName || !newPartnerForm.phone) {
      alert("업체명, 연락처, 아이디, 비밀번호는 필수 입력 항목입니다.");
      return;
    }
    
    if (confirm(`아이디: ${newPartnerForm.loginId}\n비밀번호: ${newPartnerForm.loginPassword}\n위 정보로 파트너 계정을 발급하시겠습니까?`)) {
      try {
        await addDoc(collection(db, 'partners'), {
          ...newPartnerForm,
          name: newPartnerForm.managerName || newPartnerForm.companyName, // 호환성
          status: 'active', // 관리자가 직접 생성하므로 바로 활동 가능 상태
          createdAt: new Date().toISOString()
        });
        
        alert("계정 발급이 완료되었습니다. 해당 파트너에게 접속 정보를 전달해 주세요.");
        setIsCreatePartnerModalOpen(false);
        setNewPartnerForm({
          businessType: 'business',
          companyName: '',
          managerName: '',
          phone: '',
          region: '강남구/서초구/송파구',
          loginId: '',
          loginPassword: ''
        });
      } catch (error) {
        console.error("계정 발급 오류:", error);
        alert("계정 발급 중 오류가 발생했습니다.");
      }
    }
  };

  const getPlatformRevenue = (order: Order | null) => {
    if (!order || !order.price) return { customerPrice: 0, partnerPrice: 0, platformRevenue: 0 };
    
    // 1. 고객 결제 총액 파싱
    const customerPrice = parseInt(String(order.price).replace(/[^0-9]/g, ''), 10) || 0;
    
    // 2. 파트너 예상 지급액 계산
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
    
    // 사이청소 고정 추가금 (10만원 중 파트너 7만원)
    if (isBetween) {
      partnerPrice += 70000;
    }
    
    // 세부 옵션 가격 처리 (70% 지급)
    const optionsPriceMap: Record<string, number> = {
      '냉장고': 30000,
      '세탁기': 30000,
      '에어컨': 30000,
      '식기세척기': 30000,
      '오븐': 30000,
      '곰팡이 제거 (공간당)': 40000,
      '스티커 제거 (공간당)': 40000,
      '단열재 제거 (공간당)': 40000,
      '니코틴 제거 (공간당)': 40000,
      '거실 비확장형 베란다 청소': 40000,
      '피톤치드 연무소독 (평당)': 1000,
      '엘리베이터 없음 (3층 이상)': 30000,
    };
    
    if (order.options && Array.isArray(order.options)) {
      order.options.forEach((optLabel: string) => {
        const match = optLabel.match(/^(.*?)(?:\s*\((\d+)개\))?$/);
        if (match) {
          const baseLabel = match[1].trim();
          const count = match[2] ? parseInt(match[2], 10) : 1;
          
          if (optionsPriceMap[baseLabel] !== undefined) {
            const optPrice = optionsPriceMap[baseLabel];
            if (baseLabel === '거실바닥 친환경 (평당)' || baseLabel === '피톤치드 연무소독 (평당)') {
              partnerPrice += (optPrice * size * count) * 0.7;
            } else {
              partnerPrice += (optPrice * count) * 0.7;
            }
          }
        }
      });
    }
    
    // 파트너 정산액 백원 단위 올림 처리 (천원 단위)
    const roundedPartnerPrice = Math.ceil(partnerPrice / 1000) * 1000;
    const platformRevenue = customerPrice - roundedPartnerPrice;
    
    return {
      customerPrice,
      partnerPrice: roundedPartnerPrice,
      platformRevenue
    };
  };

  // 재무 탭 데이터 필터링 적용 로직
  const filteredFinanceQuotes = quotes.filter(q => {
    if (q.status === '취소') return false; // 기본적으로 취소건은 재무 통계에서 제외
    
    // 1. 기간 필터
    if (financeStartDate && q.date && q.date < financeStartDate) return false;
    if (financeEndDate && q.date && q.date > financeEndDate) return false;
    
    // 2. 파트너 필터
    if (financePartnerFilter !== '전체') {
      const isUnassigned = !q.assignedTo;
      if (financePartnerFilter === '미배정') {
        if (!isUnassigned) return false;
      } else {
        if (q.assignedTo !== financePartnerFilter) return false;
      }
    }
    
    return true;
  });

  // 견적 관리 탭 데이터 필터링 적용 로직
  const filteredQuotesList = quotes.filter(q => {
    if (quoteFilters.status !== '전체' && q.status !== quoteFilters.status) return false;
    if (quoteFilters.startDate && q.date && q.date < quoteFilters.startDate) return false;
    if (quoteFilters.endDate && q.date && q.date > quoteFilters.endDate) return false;
    return true;
  });

  const calculateTotalFinances = () => {
    let totalCustomer = 0;
    let totalPartner = 0;
    let totalPlatform = 0;
    
    filteredFinanceQuotes.forEach(q => {
      const rev = getPlatformRevenue(q);
      totalCustomer += rev.customerPrice;
      totalPartner += rev.partnerPrice;
      totalPlatform += rev.platformRevenue;
    });

    return { totalCustomer, totalPartner, totalPlatform };
  };

  const totalFinances = calculateTotalFinances();

  const handleDownloadExcel = () => {
    // 엑셀(CSV) 한글 깨짐 방지를 위해 BOM(\uFEFF) 추가
    let csvContent = '\uFEFF';
    csvContent += '예약일,상태,예약번호,고객명,연락처,주소,서비스종류,평수,배차파트너,고객결제금액(원),파트너정산액(원),본사마진액(원),마진율(%)\n';
    
    filteredFinanceQuotes.forEach(quote => {
      const rev = getPlatformRevenue(quote);
      const marginRate = rev.customerPrice > 0 ? Math.round((rev.platformRevenue / rev.customerPrice) * 100) : 0;
      
      const row = [
        quote.date,
        quote.status,
        quote.id,
        quote.name,
        quote.realPhone || '-',
        quote.location,
        quote.type,
        quote.size,
        quote.assignedTo || '미배정',
        rev.customerPrice,
        rev.partnerPrice,
        rev.platformRevenue,
        marginRate
      ].map(str => `"${String(str).replace(/"/g, '""')}"`).join(',');
      
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `재무정산내역_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 파트너 탭 데이터 필터링 로직
  const filteredPartnersList = partners.filter(p => {
    // 1. 상태 필터
    if (partnerFilterStatus !== '전체') {
      if (partnerFilterStatus === 'active' && p.status !== 'active') return false;
      if (partnerFilterStatus === 'pending' && p.status !== 'pending') return false;
    }
    
    // 2. 지역 필터
    if (partnerFilterRegion !== '전체') {
      if (p.region !== partnerFilterRegion) return false;
    }
    
    // 3. 검색어 필터
    if (partnerSearchTerm) {
      const term = partnerSearchTerm.toLowerCase();
      const matchName = String(p.name || '').toLowerCase().includes(term);
      const matchCompany = String(p.companyName || '').toLowerCase().includes(term);
      const matchManager = String(p.managerName || '').toLowerCase().includes(term);
      const matchPhone = String(p.phone || '').toLowerCase().includes(term);
      const matchRegion = String(p.region || '').toLowerCase().includes(term);
      
      if (!matchName && !matchCompany && !matchManager && !matchPhone && !matchRegion) {
        return false;
      }
    }
    return true;
  });

  // 파트너 고유 지역 목록 추출 (필터 드롭다운용)
  const uniquePartnerRegions = Array.from(new Set(partners.map(p => p.region).filter(Boolean)));

  // 드롭다운 필터용 파트너 고유 목록 추출
  const uniquePartners = Array.from(new Set(quotes.filter(q => q.assignedTo).map(q => q.assignedTo)));

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.id === 'timbach@naver.com' && loginForm.password === '123456') {
      localStorage.setItem('adminLoggedIn', 'true');
      setIsLoggedIn(true);
    } else {
      alert("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  const handleAdminLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem('adminLoggedIn');
      setIsLoggedIn(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans max-w-md mx-auto shadow-2xl relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 text-center">
            관리자 로그인
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-8 text-center">
            관리자 계정으로 로그인해주세요.
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">아이디 (이메일)</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                placeholder="timbach@naver.com"
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
                placeholder="비밀번호를 입력하세요"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-xl active:scale-[0.98] transition-all flex justify-center"
              >
                관리자 접속
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      
      {/* 모바일 사이드바 오픈 시 어두운 배경 오버레이 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (데스크탑: 고정, 모바일: 슬라이드 아웃) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">CLEAN ADMIN</h1>
            <p className="text-slate-400 text-sm mt-1">관리자 대시보드</p>
          </div>
          {/* 모바일에서만 보이는 닫기 버튼 */}
          <button 
            className="lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">대시보드</span>
          </button>
          <button 
            onClick={() => { setActiveTab('quotes'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'quotes' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <ClipboardList size={20} />
            <span className="font-medium">견적/예약 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('partners'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'partners' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <UserCheck size={20} />
            <span className="font-medium">파트너 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('customers'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Users size={20} />
            <span className="font-medium">고객 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'finance' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Wallet size={20} />
            <span className="font-medium">재무/출금 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <MessageSquare size={20} />
            <span className="font-medium">알림톡 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Settings size={20} />
            <span className="font-medium">사이트 설정</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {!db && (
          <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 text-center shadow-sm">
             <span className="text-rose-600 font-bold text-sm">💡 Firebase 연동 대기중입니다 (src/firebase.ts 정보 미입력)</span>
          </div>
        )}
        {/* Top Header */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* 모바일 햄버거 버튼 */}
            <button 
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            {/* 검색창: 모바일에서는 축소 또는 숨김 (현재는 데스크톱에서만 보이기) */}
            <div className="hidden md:flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg w-64 lg:w-96">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="고객명, 연락처 검색..." 
                className="bg-transparent border-none outline-none w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {adminNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold tracking-tighter">
                    {adminNotifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-sm">최근 알림</h4>
                    {adminNotifications.length > 0 && <span className="text-xs bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">{adminNotifications.length}건</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {adminNotifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400 font-medium">새로운 알림이 없습니다.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {adminNotifications.map((notif: Order) => (
                           <div key={notif.id} className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setSelectedQuoteDetail(notif); setShowNotifications(false); }}>
                             <div className="flex items-center gap-2 mb-2">
                               <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">파트너 취소</span>
                               <span className="text-xs font-bold text-slate-500">#{notif.id.slice(0,6)}</span>
                             </div>
                             <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-relaxed group-hover:text-slate-900">{notif.cancelReason}</p>
                             <div className="flex justify-between items-end mt-2">
                               <p className="text-[11px] font-bold text-slate-400">발주 예약일: {notif.date}</p>
                               <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">확인하기 &rarr;</span>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 lg:gap-3 pl-3 lg:pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                A
              </div>
              <span className="font-medium text-sm hidden sm:block">최고관리자</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">대시보드 개요</h2>
              
              {/* Stat Cards - Firestore 실시간 데이터 기반 */}
              {(() => {
                // 왜: 하드코딩된 더미값 대신 Firestore quotes 데이터로 실통계 계산
                const now = new Date();
                const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                
                // 이번주 시작일 계산 (월요일 기준)
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                const weekStartStr = weekStart.toISOString().slice(0, 10);
                
                const pendingCount = quotes.filter(q => q.status === '대기중').length;
                const weekQuotes = quotes.filter(q => (q.date || '') >= weekStartStr);
                const monthRevenue = quotes
                  .filter(q => (q.date || '').startsWith(thisMonthStr) && q.status !== '취소')
                  .reduce((sum, q) => sum + (parseInt(String(q.price || '0').replace(/[^0-9]/g, ''), 10) || 0), 0);
                const uniquePhones = new Set(quotes.map(q => q.realPhone || q.contactInfo).filter(Boolean));

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <p className="text-gray-500 font-medium text-xs lg:text-sm mb-1">대기중 견적</p>
                      <p className="text-xl lg:text-2xl font-bold text-blue-600">{pendingCount}건</p>
                    </div>
                    <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <p className="text-gray-500 font-medium text-xs lg:text-sm mb-1">이번주 예약</p>
                      <p className="text-xl lg:text-2xl font-bold text-emerald-600">{weekQuotes.length}건</p>
                    </div>
                    <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <p className="text-gray-500 font-medium text-xs lg:text-sm mb-1">이번달 예약매출</p>
                      <p className="text-xl lg:text-2xl font-bold text-purple-600">₩{(monthRevenue / 10000).toFixed(0)}만</p>
                    </div>
                    <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <p className="text-gray-500 font-medium text-xs lg:text-sm mb-1">전체 고객수</p>
                      <p className="text-xl lg:text-2xl font-bold text-orange-600">{uniquePhones.size}명</p>
                    </div>
                  </div>
                );
              })()}

              {/* Recent Quotes Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6 lg:mt-8">
                <div className="px-4 lg:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 text-sm lg:text-base">최근 견적 요청</h3>
                  <button onClick={() => setActiveTab('quotes')} className="text-xs lg:text-sm font-medium text-blue-600 hover:text-blue-700">
                    전체 보기 &rarr;
                  </button>
                </div>
                {/* 테이블 컨테이너에 overflow-x-auto를 주어 모바일에서 스와이프 가능하게 함 */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">요청일</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">고객명</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">서비스 타입</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">배차 상태</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">예상 금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{quote.date}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">{quote.name}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{quote.type}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            {quote.assignedTo ? (
                               <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] lg:text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                 {quote.designatedPartnerName ? `${quote.designatedPartnerName} (지정)` : `${quote.assignedTo} 수락함`}
                               </span>
                            ) : (
                               <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] lg:text-xs font-bold border ${quote.isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                 {quote.isUrgent ? '긴급 (취소건)' : '배차 대기중'}
                               </span>
                            )}
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">{quote.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-800">견적/예약 관리</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    현재 필터 조건에 맞는 예약 수: <strong className="text-blue-600">{filteredQuotesList.length}</strong>건
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setIsFilterModalOpen(true)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-bold rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-1"><Search size={14} /> 필터조회</button>
                  <button onClick={() => setIsCreateQuoteModalOpen(true)} className="px-4 py-2 bg-slate-900 text-sm font-bold rounded-lg text-white hover:bg-slate-800 shadow-sm transition-colors">+ 새 예약 수동등록</button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  {/* 데스크탑 뷰: 테이블 */}
                  <table className="hidden lg:table w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">예약번호</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">요청일</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">고객명</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">서비스 타입</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">배차 파트너</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">진행 상태</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">예상 금액</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredQuotesList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">조건에 맞는 데이터가 없습니다.</td>
                        </tr>
                      ) : (
                        filteredQuotesList.map((quote) => (
                          <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-500">#{quote.id.slice(0,6)}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{quote.date || quote.cleaningDate || '미지정'}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">{quote.name || quote.customerName || '이름 없음'}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{quote.type || quote.cleaningType || '일반 청소'}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                             {quote.assignedTo ? (
                               <span className="text-xs lg:text-sm font-bold text-blue-600">
                                 {quote.designatedPartnerName ? `${quote.designatedPartnerName} (지정)` : quote.assignedTo}
                               </span>
                             ) : (
                               <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] lg:text-xs font-medium ${quote.isUrgent ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200' : 'bg-gray-100 text-gray-500'}`}>
                                 {quote.isUrgent ? '긴급 미정' : '미정 (발주중)'}
                               </span>
                             )}
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <select 
                              className={`text-xs lg:text-sm font-medium border-0 bg-transparent cursor-pointer focus:ring-0 outline-none
                                ${quote.status === '대기중' ? 'text-amber-600' : ''}
                                ${quote.status === '상담완료' ? 'text-blue-600' : ''}
                                ${quote.status === '예약확정' ? 'text-indigo-600' : ''}
                                ${quote.status === '청소완료' ? 'text-emerald-600' : ''}
                              `}
                              value={quote.status}
                              onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                            >
                              <option value="대기중" className="text-gray-800">대기중</option>
                              <option value="상담완료" className="text-gray-800">상담완료</option>
                              <option value="예약확정" className="text-gray-800">예약확정</option>
                              <option value="청소완료" className="text-gray-800">청소완료</option>
                              <option value="취소" className="text-gray-800">취소</option>
                            </select>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">{quote.price}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <button onClick={() => setSelectedQuoteDetail(quote)} className="text-blue-600 hover:text-blue-800 text-xs lg:text-sm font-medium">상세보기</button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>

                  {/* 모바일 뷰: 카드 레이아웃 */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {filteredQuotesList.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm font-medium">조건에 맞는 데이터가 없습니다.</div>
                    ) : (
                      filteredQuotesList.map((quote) => (
                        <div key={quote.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">#{quote.id.slice(0,6)}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <h4 className="font-bold text-gray-900 text-lg">{quote.name || quote.customerName || '이름 없음'}</h4>
                              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{quote.type || quote.cleaningType || '일반 청소'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 font-medium">{quote.date || quote.cleaningDate || '미지정'} ({quote.time || '시간협의'})</div>
                          </div>
                          {/* 진행 상태 select */}
                          <select 
                            className={`text-sm font-bold border-0 bg-transparent cursor-pointer focus:ring-0 outline-none text-right
                              ${quote.status === '대기중' ? 'text-amber-600' : ''}
                              ${quote.status === '상담완료' ? 'text-blue-600' : ''}
                              ${quote.status === '예약확정' ? 'text-indigo-600' : ''}
                              ${quote.status === '청소완료' ? 'text-emerald-600' : ''}
                            `}
                            value={quote.status}
                            onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                          >
                            <option value="대기중" className="text-gray-800">대기중</option>
                            <option value="상담완료" className="text-gray-800">상담완료</option>
                            <option value="예약확정" className="text-gray-800">예약확정</option>
                            <option value="청소완료" className="text-gray-800">청소완료</option>
                            <option value="취소" className="text-gray-800">취소</option>
                          </select>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-lg p-3 grid grid-cols-2 gap-3 mt-1 shadow-sm">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold mb-0.5">배차 파트너</p>
                            {quote.assignedTo ? (
                              <p className="text-xs font-bold text-blue-600 truncate">{quote.designatedPartnerName ? `${quote.designatedPartnerName} (지정)` : quote.assignedTo}</p>
                            ) : (
                              <p className="text-xs font-bold text-gray-400">발주 대기중</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold mb-0.5">예상 결제 금액</p>
                            <p className="text-sm font-black text-slate-800">{quote.price}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedQuoteDetail(quote)} 
                          className="w-full mt-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          예약 상세 보기
                        </button>
                      </div>
                    )))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab - 고객 관리 (realPhone 기준 중복 제거, 검색, 상세 모달 지원) */}
          {activeTab === 'customers' && (() => {
            // 왜: 같은 고객이 여러 견적을 넣으면 중복 표시되므로, realPhone 기준으로 그룹핑
            const customerMap = new Map<string, { name: string; phone: string; orders: Order[]; totalSpent: number; completedCount: number; latestDate: string }>();
            
            quotes.forEach(q => {
              const phone = q.realPhone || q.contactInfo || '';
              if (!phone) return; // 연락처가 없는 건은 제외
              
              const existing = customerMap.get(phone);
              const orderDate = q.date || q.cleaningDate || '';
              const price = parseInt(String(q.price || '0').replace(/[^0-9]/g, ''), 10) || 0;
              const isCompleted = q.status === '청소완료';
              
              if (existing) {
                existing.orders.push(q);
                existing.totalSpent += isCompleted ? price : 0;
                existing.completedCount += isCompleted ? 1 : 0;
                if (orderDate > existing.latestDate) {
                  existing.latestDate = orderDate;
                  existing.name = q.name || q.customerName || existing.name;
                }
              } else {
                customerMap.set(phone, {
                  name: q.name || q.customerName || '이름 없음',
                  phone,
                  orders: [q],
                  totalSpent: isCompleted ? price : 0,
                  completedCount: isCompleted ? 1 : 0,
                  latestDate: orderDate,
                });
              }
            });

            const allCustomers = Array.from(customerMap.values())
              .sort((a, b) => b.latestDate.localeCompare(a.latestDate));

            // 검색 필터 적용
            const customerSearchTerm = (document.getElementById('customer-search-input') as HTMLInputElement)?.value?.toLowerCase() || '';
            const filteredCustomers = allCustomers.filter(c => {
              if (!customerSearchTerm) return true;
              return c.name.toLowerCase().includes(customerSearchTerm) || 
                     c.phone.includes(customerSearchTerm);
            });

            return (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-800 border-b border-purple-600 inline-block pb-1">고객 관리 (CRM)</h2>
                  <p className="text-gray-500 mt-2 text-sm">연락처 기준으로 고객을 자동 분류합니다. 총 <strong className="text-purple-600">{allCustomers.length}</strong>명의 고객</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-96 relative">
                  <Search size={18} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    id="customer-search-input"
                    type="text" 
                    placeholder="고객명, 연락처 검색..." 
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:border-purple-500 outline-none bg-white text-gray-700 placeholder:text-gray-400 shadow-sm"
                    onChange={() => {
                      // 왜: React의 forceUpdate 대신 간단하게 상태 트리거로 리렌더
                      setActiveTab('customers');
                    }}
                  />
                </div>
              </div>

              {/* 고객 통계 요약 카드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium text-xs mb-1">전체 고객 수</p>
                  <p className="text-2xl font-bold text-purple-600">{allCustomers.length}명</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium text-xs mb-1">시공 완료 고객</p>
                  <p className="text-2xl font-bold text-emerald-600">{allCustomers.filter(c => c.completedCount > 0).length}명</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium text-xs mb-1">단골 고객 (2회+)</p>
                  <p className="text-2xl font-bold text-orange-600">{allCustomers.filter(c => c.completedCount >= 2).length}명</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 font-medium text-xs mb-1">누적 매출액</p>
                  <p className="text-2xl font-bold text-blue-600">₩{allCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* 데스크탑 뷰: 테이블 */}
                <div className="overflow-x-auto">
                  <table className="hidden lg:table w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                        <th className="p-4 font-bold">고객명</th>
                        <th className="p-4 font-bold">연락처</th>
                        <th className="p-4 font-bold text-center">총 문의</th>
                        <th className="p-4 font-bold text-center">시공 완료</th>
                        <th className="p-4 font-bold">최근 이용일</th>
                        <th className="p-4 font-bold text-right">누적 결제</th>
                        <th className="p-4 font-bold text-center">등급</th>
                        <th className="p-4 font-bold text-center">상세</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                            {customerSearchTerm ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((customer) => {
                          // 왜: 고객 등급을 이용 횟수 기반으로 자동 분류
                          const grade = customer.completedCount >= 3 ? 'VIP' : customer.completedCount >= 1 ? '단골' : '신규';
                          const gradeStyle = grade === 'VIP' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : grade === '단골' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200';
                          
                          return (
                            <tr key={customer.phone} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold text-gray-800">{customer.name}</td>
                              <td className="p-4 text-sm font-medium text-gray-600 tracking-wide">{customer.phone}</td>
                              <td className="p-4 text-sm font-bold text-center text-gray-700">{customer.orders.length}건</td>
                              <td className="p-4 text-sm font-bold text-center text-emerald-600">{customer.completedCount}건</td>
                              <td className="p-4 text-sm text-gray-600">{customer.latestDate || '-'}</td>
                              <td className="p-4 text-sm font-bold text-right text-gray-800">
                                {customer.totalSpent > 0 ? `₩${customer.totalSpent.toLocaleString()}` : '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${gradeStyle}`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => setSelectedQuoteDetail(customer.orders[0])}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-bold hover:underline"
                                >
                                  보기
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 모바일 뷰: 카드 레이아웃 */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">
                      {customerSearchTerm ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const grade = customer.completedCount >= 3 ? 'VIP' : customer.completedCount >= 1 ? '단골' : '신규';
                      const gradeStyle = grade === 'VIP' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : grade === '단골' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200';
                      
                      return (
                        <div key={customer.phone} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900 text-lg">{customer.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${gradeStyle}`}>
                                  {grade}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 font-medium tracking-wide">{customer.phone}</p>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{customer.latestDate || '-'}</span>
                          </div>
                          
                          <div className="bg-white border border-gray-100 shadow-sm p-3 rounded-lg grid grid-cols-3 gap-2 text-sm">
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 font-bold mb-0.5">문의</p>
                              <p className="text-gray-800 font-bold">{customer.orders.length}건</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 font-bold mb-0.5">완료</p>
                              <p className="text-emerald-600 font-bold">{customer.completedCount}건</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-400 font-bold mb-0.5">누적 결제</p>
                              <p className="text-gray-800 font-bold">{customer.totalSpent > 0 ? `₩${(customer.totalSpent / 10000).toFixed(0)}만` : '-'}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => setSelectedQuoteDetail(customer.orders[0])}
                            className="w-full mt-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          >
                            최근 이용 상세 보기
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            );
          })()}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">사이트 설정</h2>
              
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-800">기본 비즈니스 정보</h3>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">고객에게 노출되는 업체 기본 정보를 수정할 수 있습니다.</p>
                </div>
                <div className="p-4 lg:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">업체명</label>
                      <input type="text" defaultValue="Clean Expert" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">대표 연락처</label>
                      <input type="text" defaultValue="010-0000-0000" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">영업 시간</label>
                    <input type="text" defaultValue="평일 09:00 - 18:00 (주말 휴무)" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <hr className="border-gray-100" />
                  
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-4">서비스 가격표 기본값 관리 (평당 단가, 단위: 원)</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="w-40 text-sm text-gray-600 font-medium">일반 청소 (평당)</span>
                        <input type="number" defaultValue="15000" className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-40 text-sm text-gray-600 font-medium">프리미엄 청소 (평당)</span>
                        <input type="number" defaultValue="20000" className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                      설정 저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold border-b border-rose-600 inline-block pb-1">본사 파트너 관리</h2>
                  <p className="text-gray-500 mt-2">본사에서 직접 업체를 선정하여 가입 권한(아이디/비밀번호)을 부여합니다.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => setIsCreatePartnerModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-md transition-colors whitespace-nowrap"
                  >
                    + 신규 파트너 계정 발급
                  </button>
                </div>
              </div>
              
              {/* 파트너 검색 및 필터 UI */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600 whitespace-nowrap">상태 필터</span>
                    <select 
                      value={partnerFilterStatus}
                      onChange={(e) => setPartnerFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none bg-gray-50 text-gray-700"
                    >
                      <option value="전체">전체 상태</option>
                      <option value="active">활동 중</option>
                      <option value="pending">입금 대기/미승인</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600 whitespace-nowrap">지역 필터</span>
                    <select 
                      value={partnerFilterRegion}
                      onChange={(e) => setPartnerFilterRegion(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none bg-gray-50 text-gray-700 max-w-[150px] truncate"
                    >
                      <option value="전체">전체 지역</option>
                      {uniquePartnerRegions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-96 relative">
                  <Search size={18} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={partnerSearchTerm}
                    onChange={(e) => setPartnerSearchTerm(e.target.value)}
                    placeholder="업체명, 담당자명, 연락처, 지역 검색..." 
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm font-medium focus:border-blue-500 outline-none bg-gray-50 text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2">
                <div className="overflow-x-auto">
                  {/* 데스크탑 뷰: 파트너 테이블 */}
                  <table className="hidden lg:table w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                        <th className="p-4 font-bold">계정 발급일</th>
                        <th className="p-4 font-bold">파트너 (업체/담당자)</th>
                        <th className="p-4 font-bold">연락처</th>
                        <th className="p-4 font-bold text-blue-600 bg-blue-50/50">접속 ID</th>
                        <th className="p-4 font-bold text-blue-600 bg-blue-50/50">비밀번호(초기)</th>
                        <th className="p-4 font-bold">활동 지역</th>
                        <th className="p-4 font-bold">상태/권한</th>
                        <th className="p-4 font-bold text-center">승인 관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPartnersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-gray-400">
                            등록되거나 대기 중인 파트너가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredPartnersList.map((partner) => (
                          <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                              {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '날짜 없음'}
                            </td>
                            <td className="p-4 font-bold text-gray-800">
                              {partner.companyName || partner.name} {partner.managerName && <span className="text-sm font-medium text-gray-500">({partner.managerName})</span>}
                            </td>
                            <td className="p-4 text-sm font-medium text-gray-600 tracking-wide">
                              {partner.phone}
                            </td>
                            <td className="p-4 text-sm font-bold text-blue-600 bg-blue-50/20">
                              {partner.loginId || <span className="text-gray-400 text-xs">-</span>}
                            </td>
                            <td className="p-4 text-sm font-mono text-slate-500 bg-blue-50/20">
                              {(partner.loginPassword || partner.password) || <span className="text-gray-400 text-xs">-</span>}
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {partner.region}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                partner.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                  : partner.status === 'suspended'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {partner.status === 'active' ? '활동 중' : partner.status === 'suspended' ? '활동 정지' : '승인 대기'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col gap-2">
                                {partner.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => setSelectedPartnerDetail(partner)}
                                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 rounded-lg text-xs border border-blue-200 transition-all active:scale-[0.98]"
                                    >
                                      상세 확인
                                    </button>
                                    <button 
                                      onClick={() => handleApprovePartner(partner.id)}
                                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs shadow-md transition-all active:scale-[0.98]"
                                    >
                                      승인 (활성화)
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePartner(partner.id)}
                                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs border border-red-200 transition-all active:scale-[0.98]"
                                    >
                                      거절 (삭제)
                                    </button>
                                  </>
                                )}
                                {partner.status === 'active' && (
                                  <>
                                    <span className="text-xs text-gray-400 font-bold bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 block mb-1">
                                      정상 활동 중
                                    </span>
                                    <button 
                                      onClick={() => handleSendBusinessUrl(partner)}
                                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 rounded-lg text-xs border border-blue-200 transition-all active:scale-[0.98] mb-1"
                                    >
                                      URL 발송
                                    </button>
                                    <button 
                                      onClick={() => handleSuspendPartner(partner.id)}
                                      className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-2 rounded-lg text-xs border border-orange-200 transition-all active:scale-[0.98]"
                                    >
                                      계정 정지
                                    </button>
                                  </>
                                )}
                                {partner.status === 'suspended' && (
                                  <>
                                    <button 
                                      onClick={() => handleApprovePartner(partner.id)}
                                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-2 rounded-lg text-xs border border-emerald-200 transition-all active:scale-[0.98]"
                                    >
                                      활동 재개
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePartner(partner.id)}
                                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs border border-red-200 transition-all active:scale-[0.98] mt-1"
                                    >
                                      영구 삭제
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* 모바일 뷰: 파트너 카드 */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {filteredPartnersList.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 font-medium">대기 중인 파트너가 없습니다.</div>
                    ) : (
                      filteredPartnersList.map(partner => (
                        <div key={partner.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 text-lg leading-none">
                                  {partner.businessType === 'business' ? `${partner.companyName} (${partner.managerName})` : partner.name}
                                </span>
                                {partner.businessType === 'business' ? (
                                  <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100"><Building2 size={10} /> 사업자</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded font-bold border border-slate-200"><UserCheck size={10} /> 비사업자</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-medium">가입일: {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '날짜 없음'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                              partner.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' 
                                : partner.status === 'suspended'
                                ? 'bg-red-50 text-red-600 border-red-200/60'
                                : 'bg-amber-50 text-amber-600 border-amber-200/60'
                            }`}>
                              {partner.status === 'active' ? '활동 중' : partner.status === 'suspended' ? '활동 정지' : '승인 대기'}
                            </span>
                          </div>
                          
                          <div className="bg-white border border-slate-100 shadow-sm p-3 rounded-lg grid grid-cols-2 gap-2 text-sm mt-1">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold mb-0.5">연락처</p>
                              <p className="text-slate-800 font-bold tracking-wide">{partner.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold mb-0.5">주요 활동 지역</p>
                              <p className="text-slate-800 font-bold">{partner.region}</p>
                            </div>
                          </div>
                          
                          <div className="mt-1 flex gap-2">
                            {partner.status === 'pending' && (
                              <div className="flex flex-col gap-2 w-full">
                                <button 
                                  onClick={() => setSelectedPartnerDetail(partner)}
                                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3 rounded-xl border border-blue-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  상세 확인
                                </button>
                                <div className="flex gap-2 w-full">
                                  <button 
                                    onClick={() => handleApprovePartner(partner.id)}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98] active:shadow-none text-sm"
                                  >
                                    승인
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePartner(partner.id)}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-all active:scale-[0.98] text-sm"
                                  >
                                    거절
                                  </button>
                                </div>
                              </div>
                            )}
                            {partner.status === 'active' && (
                              <div className="flex flex-col gap-2 w-full">
                                <div className="bg-slate-50 text-slate-400 font-bold py-3 rounded-xl text-center border border-slate-200 text-sm">
                                  승인 완료
                                </div>
                                <div className="flex gap-2 w-full">
                                  <button 
                                    onClick={() => handleSendBusinessUrl(partner)}
                                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3 rounded-xl border border-blue-200 transition-all active:scale-[0.98] text-sm"
                                  >
                                    URL 발송
                                  </button>
                                  <button 
                                    onClick={() => handleSuspendPartner(partner.id)}
                                    className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-3 rounded-xl border border-orange-200 transition-all active:scale-[0.98] text-sm"
                                  >
                                    계정 정지
                                  </button>
                                </div>
                              </div>
                            )}
                            {partner.status === 'suspended' && (
                              <>
                                <button 
                                  onClick={() => handleApprovePartner(partner.id)}
                                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-3 rounded-xl border border-emerald-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  활동 재개
                                </button>
                                <button 
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  영구 삭제
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 border-b border-blue-600 inline-block pb-1">재무/매출 관리 (실시간)</h2>
                {/* 필터 UI 부분 */}
                <div className="flex flex-wrap items-center gap-2 lg:gap-3 bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">기간</span>
                    <input 
                      type="date" 
                      value={financeStartDate} 
                      onChange={e => setFinanceStartDate(e.target.value)} 
                      className="text-sm font-medium border-none outline-none bg-transparent cursor-pointer text-gray-700 w-auto p-0" 
                    />
                    <span className="text-gray-400 font-bold">~</span>
                    <input 
                      type="date" 
                      value={financeEndDate} 
                      onChange={e => setFinanceEndDate(e.target.value)} 
                      className="text-sm font-medium border-none outline-none bg-transparent cursor-pointer text-gray-700 w-auto p-0" 
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">파트너</span>
                    <select 
                      value={financePartnerFilter} 
                      onChange={e => setFinancePartnerFilter(e.target.value)} 
                      className="text-sm font-medium border-none outline-none bg-transparent cursor-pointer p-0 pr-4 text-gray-700"
                    >
                      <option value="전체">전체 조회</option>
                      <option value="미배정">미배정 (발주대기)</option>
                      {uniquePartners.map(p => (
                         <option key={p as string} value={p as string}>{p as string}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-500">
                  <p className="text-gray-500 font-medium text-sm mb-1">고객 총 결제액 (매출액)</p>
                  <p className="text-2xl font-bold text-slate-800">₩{totalFinances.totalCustomer.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center border-l-4 border-l-orange-500">
                  <p className="text-gray-500 font-medium text-sm mb-1">파트너 총 예상 지급액</p>
                  <p className="text-2xl font-bold text-slate-800">₩{totalFinances.totalPartner.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500">
                  <p className="text-gray-500 font-medium text-sm mb-1">플랫폼 순수익 (본사 마진)</p>
                  <p className="text-2xl font-black text-emerald-600">₩{totalFinances.totalPlatform.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800">오더별 수익 시뮬레이션 상세 시트</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {financeStartDate || financeEndDate || financePartnerFilter !== '전체' ? 
                        <span className="text-blue-600 font-bold">조건에 맞는 {filteredFinanceQuotes.length}건의 오더가 필터링되었습니다.</span> : 
                        `전체 ${filteredFinanceQuotes.length}건의 오더 수익 내역입니다.`}
                    </p>
                  </div>
                  <button onClick={handleDownloadExcel} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors shadow-sm self-start sm:self-auto flex items-center gap-1.5 active:scale-95">
                    <FileText size={16} /> 엑셀 다운로드
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-sm text-gray-500 bg-white">
                        <th className="p-4 font-semibold">예약일 / 번호</th>
                        <th className="p-4 font-semibold">진행 상태</th>
                        <th className="p-4 font-semibold text-right border-l border-gray-100 bg-gray-50/50">고객 결제금액</th>
                        <th className="p-4 font-semibold text-right border-l border-gray-100 bg-slate-50/50">파트너 정산액</th>
                        <th className="p-4 font-semibold text-right border-l border-gray-100 bg-blue-50/50 text-blue-800">본사 마진(수익)</th>
                        <th className="p-4 font-semibold text-center border-l border-gray-100">마진율</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredFinanceQuotes.map(quote => {
                        const rev = getPlatformRevenue(quote);
                        const marginRate = rev.customerPrice > 0 ? Math.round((rev.platformRevenue / rev.customerPrice) * 100) : 0;
                        return (
                          <tr key={quote.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="text-sm font-bold text-slate-800">{quote.date}</p>
                              <p className="text-xs text-slate-400">#{quote.id.slice(0,6)} ({quote.name})</p>
                            </td>
                            <td className="p-4">
                              {quote.status === '청소완료' ? (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">정산가능</span>
                              ) : quote.status === '예약확정' ? (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">배차완료 (진행예정)</span>
                              ) : (
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{quote.status}</span>
                              )}
                            </td>
                            <td className="p-4 text-right border-l border-gray-100 bg-gray-50/30">
                              <span className="font-bold text-slate-700">{rev.customerPrice.toLocaleString()}원</span>
                            </td>
                            <td className="p-4 text-right border-l border-gray-100 bg-slate-50/30">
                              <span className="font-bold text-slate-700">{rev.partnerPrice.toLocaleString()}원</span>
                            </td>
                            <td className="p-4 text-right border-l border-gray-100 bg-blue-50/30">
                              <span className="font-black text-blue-600">{rev.platformRevenue.toLocaleString()}원</span>
                            </td>
                            <td className="p-4 text-center border-l border-gray-100">
                              <span className={`text-xs font-bold ${marginRate >= 30 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {marginRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800 border-b border-indigo-600 inline-block pb-1">알림톡 / 메시지 관리</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">자동 발송 템플릿</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-1 rounded">API 정상 연동</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">[고객용] 예약 접수 완료</span>
                        <div className="w-10 h-5 bg-indigo-500 rounded-full flex items-center px-1"><div className="w-3.5 h-3.5 bg-white rounded-full ml-auto"></div></div>
                      </div>
                      <p className="text-xs text-slate-500">#{'고객명'}님, 요청하신 청소 견적이 접수되었습니다. 곧 담당 파트너가 배정될 예정입니다.</p>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">[고객용] 파트너 배정 완료</span>
                        <div className="w-10 h-5 bg-indigo-500 rounded-full flex items-center px-1"><div className="w-3.5 h-3.5 bg-white rounded-full ml-auto"></div></div>
                      </div>
                      <p className="text-xs text-slate-500">#{'고객명'}님, #{'시공날짜'} 청소를 담당할 파트너 [#{'파트너명'}]가 배정되었습니다.</p>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">[파트너용] 신규 오더 알림</span>
                        <div className="w-10 h-5 bg-indigo-500 rounded-full flex items-center px-1"><div className="w-3.5 h-3.5 bg-white rounded-full ml-auto"></div></div>
                      </div>
                      <p className="text-xs text-slate-500">신규 오더가 등록되었습니다! 지역: #{'지역명'}, 평수: #{'평수'}. 서둘러 수락해주세요.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">수동 메시지 직접 발송</h3>
                  </div>
                  <div className="p-6 flex flex-col flex-1 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">수신자 선택</label>
                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                        <option>전체 파트너 대상 발송</option>
                        <option>전체 고객 대상 (광고성)</option>
                        <option>특정 번호 직접 입력</option>
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="text-xs font-bold text-slate-500 block mb-1">메시지 내용</label>
                      <textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 flex-1 resize-none min-h-[150px]" placeholder="여기에 전송할 텍스트를 입력하세요. 안내, 공지사항, 프로모션 등을 입력할 수 있습니다."></textarea>
                    </div>
                    <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                      지금 발송하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 발주서 상세 모달 */}
      {selectedQuoteDetail && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-xl font-bold tracking-tight">예약 발주서 상세</h3>
                <p className="text-slate-300 text-sm mt-1">예약번호 #{selectedQuoteDetail.id.slice(0,8)}</p>
              </div>
              <button onClick={() => setSelectedQuoteDetail(null)} className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600/80 font-bold mb-1">상태 (진행 상황)</p>
                    <p className="font-black text-blue-700 text-lg">{selectedQuoteDetail.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600/80 font-bold mb-1">담당 배차 파트너</p>
                    <p className="font-bold text-gray-800 text-lg">
                      {selectedQuoteDetail.designatedPartnerName 
                        ? `${selectedQuoteDetail.designatedPartnerName} (지정요청)` 
                        : (selectedQuoteDetail.assignedTo || '대기중 (배정전)')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">고객명</p>
                  <p className="text-gray-800 font-bold">{selectedQuoteDetail.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">실제 연락처</p>
                  <p className="text-gray-800 font-bold tracking-wide">{selectedQuoteDetail.realPhone || '등록 번호 없음'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">서비스 종류</p>
                  <p className="text-gray-800 font-bold">{selectedQuoteDetail.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">희망 일정</p>
                  <p className="text-gray-800 font-bold">{selectedQuoteDetail.date} / {selectedQuoteDetail.time}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">건물 형태 / 면적</p>
                  <p className="text-gray-800 font-bold">{selectedQuoteDetail.house} / {selectedQuoteDetail.size}평</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">예상 결제 금액</p>
                  <p className="text-rose-600 font-black text-lg">{selectedQuoteDetail.price}</p>
                </div>
                
                {/* 세부사항 옵션 표시 */}
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-bold mb-2">선택한 세부 옵션</p>
                  <div className="bg-blue-50/50 flex flex-col p-3 px-4 rounded-xl border border-blue-100">
                    <p className="text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                      {selectedQuoteDetail.options || (selectedQuoteDetail.detail && selectedQuoteDetail.detail.includes('옵션') ? selectedQuoteDetail.detail.split('\n').filter((l: string) => l.includes('옵션')).join('\n') : "선택된 세부 옵션이 없습니다.")}
                    </p>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-bold mb-2">현장 위치 (상세 주소)</p>
                  <div className="bg-gray-50 flex items-center p-3 px-4 rounded-xl border border-gray-200">
                    <p className="text-gray-800 font-semibold">{selectedQuoteDetail.location}</p>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-bold mb-2">고객 요청사항 / 현장 특이사항</p>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 min-h-[80px]">
                    <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{selectedQuoteDetail.detail || '기재된 특이사항 없음'}</p>
                  </div>
                </div>

                {selectedQuoteDetail.completedAt && (
                  <div className="col-span-2 mt-2 p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="bg-white px-2 py-0.5 rounded text-[10px] shadow-sm uppercase tracking-wider text-emerald-600">완료보고</span>
                        작업 완료 점검 내역
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">
                        {new Date(selectedQuoteDetail.completedAt).toLocaleDateString()} {new Date(selectedQuoteDetail.completedAt).toLocaleTimeString().slice(0, -3)}
                      </span>
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm mt-3 flex flex-wrap gap-2">
                       {selectedQuoteDetail.completionItems && selectedQuoteDetail.completionItems.length > 0 ? (
                         selectedQuoteDetail.completionItems.map((item: string, idx: number) => (
                           <span key={idx} className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                             {item}
                           </span>
                         ))
                       ) : (
                         <p className="text-sm text-gray-500 font-medium w-full text-center py-2">체크된 청소 구역 항목이 없습니다.</p>
                       )}
                    </div>
                  </div>
                )}

                {selectedQuoteDetail.cancelReason && (
                  <div className="col-span-2 mt-2 p-5 rounded-xl border-2 border-rose-200 bg-rose-50">
                    <h4 className="font-bold text-rose-800 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="bg-white px-2 py-0.5 rounded text-[10px] shadow-sm uppercase tracking-wider">긴급</span>
                        파트너 취소 정보
                      </span>
                      {!selectedQuoteDetail.adminReviewedCancel && (
                        <span className="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-full font-bold shadow-sm animate-pulse">관리자 미확인</span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs font-bold text-rose-700/70 mb-1.5 flex items-center gap-1">취소 사유</p>
                        <p className="text-sm font-medium text-rose-900 bg-white p-3 border border-rose-100 rounded-lg leading-relaxed h-full shadow-sm">
                          {selectedQuoteDetail.cancelReason}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-bold text-rose-700/70 mb-1.5 flex items-center gap-1">부과된 페널티 상태</p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 border border-rose-100 rounded-lg h-full shadow-sm gap-3">
                          <p className="text-sm font-bold text-rose-600 flex-1">
                            {selectedQuoteDetail.cancelPenalty === 'free' ? '무료 취소 (패널티 없음)' :
                             selectedQuoteDetail.cancelPenalty === 'penalty_3' ? '보증금 3만원 차감' :
                             selectedQuoteDetail.cancelPenalty === 'penalty_10' ? '보증금 10만원 차감 + 7일 정지' :
                             selectedQuoteDetail.cancelPenalty === 'penalty_all' ? '보증금 전액 몰수 + 제명' : 
                             selectedQuoteDetail.cancelPenalty === 'waived' ? '패널티 면제됨' : '알 수 없음'}
                          </p>
                          <button 
                            onClick={async () => {
                              if (confirm('패널티를 면제하시겠습니까?\n이 작업은 파트너의 보증금 차감을 방지합니다.')) {
                                if (!db) return;
                                await updateDoc(doc(db, 'quotes', selectedQuoteDetail.id), { cancelPenalty: 'waived' });
                                setSelectedQuoteDetail({...selectedQuoteDetail, cancelPenalty: 'waived'});
                                alert('패널티가 정상적으로 면제 처리되었습니다.');
                              }
                            }}
                            disabled={selectedQuoteDetail.cancelPenalty === 'free' || selectedQuoteDetail.cancelPenalty === 'waived'}
                            className="text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            페널티 면제
                          </button>
                        </div>
                      </div>
                    </div>
                    {!selectedQuoteDetail.adminReviewedCancel && (
                      <div className="mt-5 flex justify-end">
                        <button 
                          onClick={async () => {
                            if (!db) return;
                            await updateDoc(doc(db, 'quotes', selectedQuoteDetail.id), { adminReviewedCancel: true });
                            setSelectedQuoteDetail({...selectedQuoteDetail, adminReviewedCancel: true});
                          }}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-sm shadow-md transition-all active:scale-95"
                        >
                          위 내용 확인 완료 (알림 지우기)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedQuoteDetail(null)} className="px-5 py-2.5 font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-all focus:ring-2 focus:ring-gray-200">닫기</button>
              <button onClick={() => window.print()} className="px-5 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-all shadow-blue-600/20 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">발주서 PDF 인쇄</button>
            </div>
          </div>
        </div>
      )}

      {/* 파트너 상세 정보 모달 */}
      {selectedPartnerDetail && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-lg font-bold">파트너 가입 정보 확인</h3>
                <p className="text-xs text-slate-300 mt-1">신청한 파트너의 상세 정보를 확인합니다.</p>
              </div>
              <button onClick={() => setSelectedPartnerDetail(null)} className="text-slate-300 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">업체명</p>
                  <p className="text-sm font-bold text-gray-800">{selectedPartnerDetail.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">담당자/대표자명</p>
                  <p className="text-sm font-bold text-gray-800">{selectedPartnerDetail.managerName || selectedPartnerDetail.name || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">연락처</p>
                  <p className="text-sm font-bold text-gray-800">{selectedPartnerDetail.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">신청 플랜</p>
                  <p className="text-sm font-bold text-blue-600">{selectedPartnerDetail.plan || '일반'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 mb-1">활동 지역</p>
                <p className="text-sm font-bold text-gray-800">{selectedPartnerDetail.region || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">팀 규모</p>
                  <p className="text-sm font-bold text-gray-800">{selectedPartnerDetail.teamSize || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">가입일</p>
                  <p className="text-sm font-bold text-gray-800">
                    {selectedPartnerDetail.createdAt ? new Date(selectedPartnerDetail.createdAt).toLocaleDateString() : '날짜 없음'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 mb-1">주요 서비스</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(selectedPartnerDetail.mainServices) ? (
                    selectedPartnerDetail.mainServices.map((service, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                        {service}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-gray-800">{selectedPartnerDetail.mainServices || '-'}</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                <p className="text-xs font-bold text-gray-500 mb-1">계정 정보</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] text-gray-400">ID</p>
                    <p className="text-xs font-mono font-bold text-gray-700">{selectedPartnerDetail.loginId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">PW</p>
                    <p className="text-xs font-mono font-bold text-gray-700">{selectedPartnerDetail.loginPassword || selectedPartnerDetail.password || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setSelectedPartnerDetail(null)} className="px-4 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">닫기</button>
              
              {selectedPartnerDetail.status === 'pending' && (
                <>
                  <button 
                    onClick={() => {
                      handleDeletePartner(selectedPartnerDetail.id);
                      setSelectedPartnerDetail(null);
                    }} 
                    className="px-4 py-2 font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-sm"
                  >
                    거절 (삭제)
                  </button>
                  <button 
                    onClick={() => {
                      handleApprovePartner(selectedPartnerDetail.id);
                      setSelectedPartnerDetail(null);
                    }} 
                    className="px-6 py-2 font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md text-sm"
                  >
                    승인 및 활성화
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 파트너 수동 계정 생성 모달 */}
      {isCreatePartnerModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-lg font-bold">신규 파트너 계정 발급</h3>
                <p className="text-xs text-slate-300 mt-1">지정된 업체에게 로그인 ID와 초기 비밀번호를 부여합니다.</p>
              </div>
              <button onClick={() => setIsCreatePartnerModalOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">업체명 (필수)</label>
                <input 
                  type="text" 
                  value={newPartnerForm.companyName}
                  onChange={e => setNewPartnerForm({...newPartnerForm, companyName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none placeholder:text-gray-300"
                  placeholder="예: 청소타워린 강남지사"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">담당자/대표자명</label>
                  <input 
                    type="text" 
                    value={newPartnerForm.managerName}
                    onChange={e => setNewPartnerForm({...newPartnerForm, managerName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">연락처 (필수)</label>
                  <input 
                    type="text" 
                    value={newPartnerForm.phone}
                    onChange={e => setNewPartnerForm({...newPartnerForm, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">주요 활동 지역 설정</label>
                <input 
                  type="text" 
                  value={newPartnerForm.region}
                  onChange={e => setNewPartnerForm({...newPartnerForm, region: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
                <h4 className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-1">APP 접속 계정 정보 부여</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">로그인 아이디 (ID)</label>
                    <input 
                      type="text" 
                      value={newPartnerForm.loginId}
                      onChange={e => setNewPartnerForm({...newPartnerForm, loginId: e.target.value})}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="partner01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">초기 비밀번호 (비번)</label>
                    <input 
                      type="text" 
                      value={newPartnerForm.loginPassword}
                      onChange={e => setNewPartnerForm({...newPartnerForm, loginPassword: e.target.value})}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="랜덤 영문/숫자 직접 지정"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-blue-600 mt-3 font-medium">※ 위 아이디와 비밀번호를 업체 대표님께 공유해 주십시오. (앱에서 로그인 가능)</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsCreatePartnerModalOpen(false)} className="px-4 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">취소</button>
              <button 
                onClick={handleCreatePartner} 
                className="px-6 py-2 font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md text-sm"
              >
                계정 발급 및 저장
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 예약 필터 모달 */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">예약 목록 필터</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">상태 (진행 상황)</label>
                <select 
                  value={quoteFilters.status}
                  onChange={(e) => setQuoteFilters({...quoteFilters, status: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="전체">전체 상태 조회</option>
                  <option value="대기중">대기중</option>
                  <option value="상담완료">상담완료</option>
                  <option value="예약확정">예약확정</option>
                  <option value="청소완료">청소완료</option>
                  <option value="취소">취소</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">예약일 (시작)</label>
                  <input 
                    type="date"
                    value={quoteFilters.startDate}
                    onChange={(e) => setQuoteFilters({...quoteFilters, startDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">예약일 (종료)</label>
                  <input 
                    type="date"
                    value={quoteFilters.endDate}
                    onChange={(e) => setQuoteFilters({...quoteFilters, endDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setQuoteFilters({ status: '전체', startDate: '', endDate: '' });
                    setIsFilterModalOpen(false);
                  }} 
                  className="px-4 py-2 font-bold text-gray-500 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  필터 초기화
                </button>
                <button 
                  onClick={() => setIsFilterModalOpen(false)} 
                  className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg text-sm hover:bg-blue-700 shadow-sm"
                >
                  적용하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 예약 수동 등록 모달 */}
      {isCreateQuoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold">새 예약 수동 등록</h3>
                <p className="text-xs text-slate-300 mt-1">고객 전화 상담 후 수기로 예약을 등록합니다.</p>
              </div>
              <button onClick={() => setIsCreateQuoteModalOpen(false)} className="text-slate-300 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">고객명 (필수)</label>
                  <input 
                    type="text" 
                    value={newQuoteForm.name}
                    onChange={e => setNewQuoteForm({...newQuoteForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">연락처 (필수)</label>
                  <input 
                    type="text" 
                    value={newQuoteForm.realPhone}
                    onChange={e => setNewQuoteForm({...newQuoteForm, realPhone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">서비스 종류</label>
                  <select 
                    value={newQuoteForm.type}
                    onChange={e => setNewQuoteForm({...newQuoteForm, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="일반 청소">일반 청소</option>
                    <option value="프리미엄 청소">프리미엄 청소</option>
                    <option value="상가/사무실 정기청소">상가/사무실 정기청소</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">건물 형태</label>
                  <select 
                    value={newQuoteForm.house}
                    onChange={e => setNewQuoteForm({...newQuoteForm, house: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="아파트">아파트</option>
                    <option value="빌라">빌라</option>
                    <option value="오피스텔">오피스텔</option>
                    <option value="상가/기타">상가/기타</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">시공 예약일 (필수)</label>
                  <input 
                    type="date" 
                    value={newQuoteForm.date}
                    onChange={e => setNewQuoteForm({...newQuoteForm, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">시작 시간</label>
                  <select 
                    value={newQuoteForm.time}
                    onChange={e => setNewQuoteForm({...newQuoteForm, time: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="오전 08:00">오전 08:00</option>
                    <option value="오전 09:00">오전 09:00</option>
                    <option value="오전 10:00">오전 10:00</option>
                    <option value="오후 01:00">오후 01:00</option>
                    <option value="오후 02:00">오후 02:00</option>
                    <option value="시간협의">시간협의 (추후 결정)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">평수</label>
                  <input 
                    type="number" 
                    value={newQuoteForm.size}
                    onChange={e => setNewQuoteForm({...newQuoteForm, size: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    placeholder="예: 32"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">수동 견적 금액</label>
                  <input 
                    type="text" 
                    value={newQuoteForm.price}
                    onChange={e => setNewQuoteForm({...newQuoteForm, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    placeholder="예: 350,000원"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">현장 주소</label>
                <input 
                  type="text" 
                  value={newQuoteForm.location}
                  onChange={e => setNewQuoteForm({...newQuoteForm, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  placeholder="예: 서울시 강남구 테헤란로 123"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">관리자 메모 / 현장 특이사항</label>
                <textarea 
                  value={newQuoteForm.detail}
                  onChange={e => setNewQuoteForm({...newQuoteForm, detail: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none min-h-[80px]"
                  placeholder="추가 전달사항을 입력하세요."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <button onClick={() => setIsCreateQuoteModalOpen(false)} className="px-5 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">취소</button>
              <button 
                onClick={handleCreateQuote} 
                className="px-6 py-2 font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md text-sm"
              >
                예약 등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
