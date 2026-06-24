import { useState, useEffect, useMemo } from 'react';
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
  Star,
  Paintbrush,
  Home,
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

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
  phone?: string;
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
  adminMemo?: string;
  cleaningTime?: string;
  memo?: string;
  isB2B?: boolean;
}

export interface PartnerUser {
  id: string;
  address?: string;
  totalOrders?: number;
  totalPayback?: number;
  b2bPartnerType?: 'interior' | 'realestate';
  businessType?: 'business' | 'freelancer' | 'non_business';
  companyName?: string;
  managerName?: string;
  name?: string;
  status?: 'active' | 'pending' | 'suspended';
  region?: string;
  regions?: string[];
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
  contractPlan?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  image?: string;
  description?: string;
  portfolio?: any[];
  tags?: string[];
  monthlyEvent?: string;
  unavailableDates?: string[];
  kakaoId?: string;
  naverId?: string;
  isB2B?: boolean;
  email?: string;
  businessNumber?: string;
  businessImageUrl?: string;
}

export interface Review {
  id: string;
  orderId?: string;
  partnerId?: string;
  partnerName?: string;
  customerName?: string;
  rating?: number;
  content?: string;
  images?: string[];
  createdAt?: any;
  serviceType?: string;
  location?: string;
  isHidden?: boolean;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [quotes, setQuotes] = useState<Order[]>([]);
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<Order | null>(null);
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<PartnerUser | null>(null);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [editPlan, setEditPlan] = useState('');
  const [editTierPlan, setEditTierPlan] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminMemoInput, setAdminMemoInput] = useState('');
  
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
  const [partnerFilterPlan, setPartnerFilterPlan] = useState('전체');
  const [partnerFilterTier, setPartnerFilterTier] = useState('전체');

  // B2B 파트너 관리 탭 필터
  const [b2bSearchTerm, setB2bSearchTerm] = useState('');
  const [b2bFilterStatus, setB2bFilterStatus] = useState('전체');


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
    houseSubType: '',
    size: '',
    location: '',
    date: '',
    time: '시간협의',
    price: '',
    detail: '',
  });
  
  const [manualOrderType, setManualOrderType] = useState<'general' | 'interior' | 'realestate'>('general');
  const [selectedB2BPartnerId, setSelectedB2BPartnerId] = useState('');
  
  // 견적 계산 마법사 상태값
  const [isQuoteWizardOpen, setIsQuoteWizardOpen] = useState(true);
  const [wizardOptions, setWizardOptions] = useState<{ [key: string]: number }>({
    phytoncide: 0,
    veranda: 0,
    refrigerator: 0,
    washer: 0,
    ac: 0,
    dishwasher: 0,
    oven: 0,
    mold: 0,
    sticker: 0,
    insulation: 0,
  });
  const [contaminationLevel, setContaminationLevel] = useState<'normal' | 'high' | 'severe'>('normal');
  const [hasNoElevatorSurcharge, setHasNoElevatorSurcharge] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');
  const [selectedWizardOptions, setSelectedWizardOptions] = useState<string[]>([]);
  
  // CRM 고도화용 상태
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [selectedCustomerPhones, setSelectedCustomerPhones] = useState<string[]>([]);
  const [customerSort, setCustomerSort] = useState<'latest' | 'totalSpent'>('latest');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerNoteModalOpen, setIsCustomerNoteModalOpen] = useState(false);
  const [selectedCustomerForNote, setSelectedCustomerForNote] = useState<any>(null);
  const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
  const [bulkMessageText, setBulkMessageText] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    companyName: 'Clean Expert',
    contactNumber: '010-0000-0000',
    businessHours: '평일 09:00 - 18:00 (주말 휴무)',
    priceNormal: 15000,
    pricePremium: 20000
  });
  
  const adminNotifications = quotes.filter(q => q.cancelReason && !q.adminReviewedCancel);

  const calculateEstimatedPrice = (type: string, size: string, forceB2B?: boolean) => {
    const sizeNum = Number(size);
    if (!sizeNum || isNaN(sizeNum) || sizeNum <= 0) return 0;
    
    const isB2B = forceB2B !== undefined ? forceB2B : manualOrderType !== 'general';
    
    let pricePerPyeong = 15000;
    if (isB2B) {
      pricePerPyeong = 20000;
    } else if (type === '프리미엄 청소') {
      pricePerPyeong = 20000;
    } else if (type === '상가/사무실 정기청소') {
      pricePerPyeong = 18000;
    }
    
    const basePrice = sizeNum * pricePerPyeong;
    return basePrice;
  };

  const getWizardCalculations = () => {
    const sizeNum = Number(newQuoteForm.size) || 0;
    
    // 1. 기본 청소비
    let pricePerPyeong = 15000;
    if (manualOrderType !== 'general') {
      pricePerPyeong = 20000;
    } else if (newQuoteForm.type === '프리미엄 청소') {
      pricePerPyeong = 20000;
    } else if (newQuoteForm.type === '상가/사무실 정기청소') {
      pricePerPyeong = 18000;
    }
    const baseCleanPrice = sizeNum * pricePerPyeong;
    
    // 2. 추가 옵션비
    let optionsTotal = 0;
    const selectedOptLabels: string[] = [];
    
    // 피톤치드 (평당 1,000원)
    if (wizardOptions.phytoncide > 0) {
      const pPrice = sizeNum * 1000;
      optionsTotal += pPrice;
      selectedOptLabels.push(`피톤치드 연무소독 (${pPrice.toLocaleString()}원)`);
    }
    // 거실 비확장형 베란다 (+40,000원)
    if (wizardOptions.veranda > 0) {
      optionsTotal += 40000;
      selectedOptLabels.push(`거실 비확장형 베란다 청소 (40,000원)`);
    }
    // 가전 제품 내부 청소 (개당 +30,000원)
    const applianceItems = [
      { id: 'refrigerator', name: '냉장고' },
      { id: 'washer', name: '세탁기' },
      { id: 'ac', name: '에어컨' },
      { id: 'dishwasher', name: '식기세척기' },
      { id: 'oven', name: '오븐' },
    ];
    applianceItems.forEach(item => {
      const count = wizardOptions[item.id] || 0;
      if (count > 0) {
        const itemPrice = count * 30000;
        optionsTotal += itemPrice;
        selectedOptLabels.push(`${item.name} 내부 청소 x${count} (${itemPrice.toLocaleString()}원)`);
      }
    });
    // 특수 오염 제거 (개당 +40,000원)
    const contaminationItems = [
      { id: 'mold', name: '곰팡이 제거' },
      { id: 'sticker', name: '스티커 제거' },
      { id: 'insulation', name: '단열재(뽁뽁이) 제거' },
    ];
    contaminationItems.forEach(item => {
      const count = wizardOptions[item.id] || 0;
      if (count > 0) {
        const itemPrice = count * 40000;
        optionsTotal += itemPrice;
        selectedOptLabels.push(`${item.name} x${count} (${itemPrice.toLocaleString()}원)`);
      }
    });

    // 3. 할증 및 조정
    // 오염도 할증 (기본 청소비 기준)
    let contaminationSurcharge = 0;
    let contaminationRate = 0;
    if (contaminationLevel === 'high') {
      contaminationRate = 10;
      contaminationSurcharge = Math.floor(baseCleanPrice * 0.1);
    } else if (contaminationLevel === 'severe') {
      contaminationRate = 30;
      contaminationSurcharge = Math.floor(baseCleanPrice * 0.3);
    }
    
    // 엘리베이터 할증 (+30,000원)
    const elevatorSurcharge = hasNoElevatorSurcharge ? 30000 : 0;
    
    // 수동 할인액
    const discountVal = Number(customDiscount) || 0;
    
    // 합계 (부가세 제거)
    const supplyTotal = baseCleanPrice + optionsTotal + contaminationSurcharge + elevatorSurcharge - discountVal;
    const grandTotal = supplyTotal;
    
    return {
      baseCleanPrice,
      optionsTotal,
      contaminationSurcharge,
      contaminationRate,
      elevatorSurcharge,
      discountVal,
      supplyTotal,
      vat: 0,
      grandTotal: grandTotal > 0 ? grandTotal : 0,
      selectedOptLabels,
    };
  };


  
  // Firebase Auth 상태 감지
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Firebase Auth로 로그인된 사용자
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      data.sort((a: Order, b: Order) => {
        // createdAt을 기준으로 최신순 정렬 (가장 최근에 들어온 견적이 위로 오도록)
        const getTimestamp = (v: any) => {
          if (!v) return 0;
          if (v.toDate) return v.toDate().getTime();
          if (v.seconds) return v.seconds * 1000;
          if (v instanceof Date) return v.getTime();
          if (typeof v === 'string') return new Date(v).getTime();
          return 0;
        };
        const timeA = getTimestamp(a.createdAt);
        const timeB = getTimestamp(b.createdAt);
        
        if (timeA !== timeB) {
          return timeB - timeA; // 최신 요청이 위로
        }
        
        // createdAt이 같거나 없는 경우 date(청소일) 역순 정렬
        const getStr = (v: any) => typeof v === 'string' ? v : (v && v.toDate ? v.toDate().toISOString() : String(v || ''));
        const dateA = getStr(a.date || a.cleaningDate);
        const dateB = getStr(b.date || b.cleaningDate);
        return dateB.localeCompare(dateA);
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

    const unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Review[];
      data.sort((a: Review, b: Review) => {
        const getTimestamp = (v: any) => {
          if (!v) return 0;
          if (v.toDate) return v.toDate().getTime();
          if (v.seconds) return v.seconds * 1000;
          if (v instanceof Date) return v.getTime();
          if (typeof v === 'string') return new Date(v).getTime();
          return 0;
        };
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      });
      setReviews(data);
    });

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomersData(data);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettingsForm(prev => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => {
      unsubscribe();
      unsubscribePartners();
      unsubscribeReviews();
      unsubscribeCustomers();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    if (selectedQuoteDetail) {
      setAdminMemoInput(selectedQuoteDetail.adminMemo || '');
    } else {
      setAdminMemoInput('');
    }
  }, [selectedQuoteDetail]);

  const handleDeleteReview = async (id: string) => {
    if (!db) return;
    if (confirm("이 리뷰를 영구 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
        alert("리뷰가 정상적으로 삭제되었습니다.");
      } catch (err) {
        console.error("리뷰 삭제 실패:", err);
        alert("리뷰 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'quotes', id), { status: newStatus });
  };

  const handleAssignPartner = async (quoteId: string, partnerId: string, partnerName: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        assignedTo: partnerId,
        designatedPartnerName: partnerName,
        status: '배정완료'
      });
      setSelectedQuoteDetail(prev => prev && prev.id === quoteId ? { 
        ...prev, 
        assignedTo: partnerId, 
        designatedPartnerName: partnerName, 
        status: '배정완료' 
      } : prev);
      alert('파트너 배정이 완료되었습니다.');
    } catch (e) {
      console.error(e);
      alert('파트너 배정 중 오류가 발생했습니다.');
    }
  };

  const handleSaveAdminMemo = async () => {
    if (!db || !selectedQuoteDetail) return;
    try {
      await updateDoc(doc(db, 'quotes', selectedQuoteDetail.id), {
        adminMemo: adminMemoInput
      });
      setSelectedQuoteDetail(prev => prev ? { ...prev, adminMemo: adminMemoInput } : null);
      alert('상담 메모가 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('상담 메모 저장 중 오류가 발생했습니다.');
    }
  };

  const handleApprovePartner = async (id: string) => {
    if (!db) return;
    if (confirm("해당 파트너의 상태를 '활동 중(승인)'으로 변경하시겠습니까?\n※ 6개월 무료 등록이 적용됩니다.")) {
      const now = new Date();
      const expireDate = new Date(now);
      expireDate.setMonth(expireDate.getMonth() + 6);
      await updateDoc(doc(db, 'partners', id), { 
        status: 'active',
        contractPlan: '6개월 (무료)',
        contractStartDate: now.toISOString(),
        contractEndDate: expireDate.toISOString(),
      });
      alert("파트너가 승인되었습니다. (6개월 무료 등록 적용)");
    }
  };

  const handleExtendContract = async (id: string, months: number) => {
    if (!db) return;
    const label = months === 3 ? '3개월' : months === 6 ? '6개월' : '1년';
    if (confirm(`계약을 ${label} 연장하시겠습니까?`)) {
      const now = new Date();
      const expireDate = new Date(now);
      expireDate.setMonth(expireDate.getMonth() + months);
      await updateDoc(doc(db, 'partners', id), {
        contractPlan: label,
        contractStartDate: now.toISOString(),
        contractEndDate: expireDate.toISOString(),
        status: 'active',
      });
      alert(`계약이 ${label} 연장되었습니다.`);
    }
  };

  const getContractStatus = (partner: any) => {
    if (!partner.contractEndDate) return { label: '미설정', color: 'gray', dday: null };
    const now = new Date();
    const end = new Date(partner.contractEndDate);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: '만료', color: 'red', dday: diffDays };
    if (diffDays <= 30) return { label: `D-${diffDays}`, color: 'amber', dday: diffDays };
    return { label: `D-${diffDays}`, color: 'emerald', dday: diffDays };
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

  const openPartnerDetail = (partner: PartnerUser) => {
    setSelectedPartnerDetail(partner);
    setIsEditingContract(false);
    setEditPlan(partner.contractPlan || '');
    setEditTierPlan(partner.plan || 'basic');
    setEditStartDate(partner.contractStartDate ? partner.contractStartDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditEndDate(partner.contractEndDate ? partner.contractEndDate.split('T')[0] : '');
  };

  const handleStartDateChange = (newStart: string) => {
    setEditStartDate(newStart);
    if (editPlan && ['3개월', '6개월', '1년'].includes(editPlan)) {
      const months = editPlan === '3개월' ? 3 : editPlan === '6개월' ? 6 : 12;
      const start = new Date(newStart);
      start.setMonth(start.getMonth() + months);
      setEditEndDate(start.toISOString().split('T')[0]);
    }
  };

  const setContractPeriod = (months: number | 'unlimited') => {
    const startStr = editStartDate || new Date().toISOString().split('T')[0];
    if (months === 'unlimited') {
      setEditEndDate('');
      setEditPlan('무제한');
    } else {
      const start = new Date(startStr);
      start.setMonth(start.getMonth() + months);
      setEditEndDate(start.toISOString().split('T')[0]);
      setEditPlan(`${months === 12 ? '1년' : months + '개월'}`);
    }
  };

  const handleSaveContract = async (partnerId: string) => {
    if (!db) return;
    try {
      const toISO = (dateStr: string) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0); // Local noon to avoid timezone shifts
        return date.toISOString();
      };
      
      const updates = {
        plan: editTierPlan,
        tier: editTierPlan === 'premium' ? 'PREMIUM' : editTierPlan === 'exclusive' ? 'EXCLUSIVE' : 'BASIC',
        contractPlan: editPlan || null,
        contractStartDate: toISO(editStartDate),
        contractEndDate: toISO(editEndDate),
      };
      
      await updateDoc(doc(db, 'partners', partnerId), updates);
      alert("계약 정보가 성공적으로 변경되었습니다.");
      setIsEditingContract(false);
    } catch (e) {
      console.error(e);
      alert("계약 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleSendBusinessUrl = async (partner: PartnerUser) => {
    const businessUrl = `https://clean-partner.dailyhousing.kr`;
    const message = `[입주청소 파트너스]\n${partner.companyName || partner.name}님, 사업자 전용 페이지 주소가 발송되었습니다.\n\nURL: ${businessUrl}\n아이디: ${partner.loginId}\n비밀번호: ${partner.loginPassword || partner.password}`;
    
    const phone = partner.phone;
    if (!phone) {
      alert("전송할 파트너의 전화번호가 등록되어 있지 않습니다.");
      return;
    }

    if (!confirm(`${partner.companyName || partner.name} 대표님께 문자/알림톡을 실제로 발송하시겠습니까?`)) {
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
        return;
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('https://us-central1-house-clean-hub.cloudfunctions.net/sendAlimtalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          phone: phone,
          text: message,
          templateCode: '' // 빈값 전달 시 LMS/SMS로 즉시 발급/전달
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert("문자/알림톡이 성공적으로 발송되었습니다!");
      } else {
        alert(`발송 실패: ${data.message || '알 수 없는 에러가 발생했습니다.'}`);
      }
    } catch (e: any) {
      console.error("URL 발송 오류:", e);
      alert(`알림톡 발송 중 네트워크 오류가 발생했습니다: ${e.message}`);
    }
  };

  const handleCreateQuote = async () => {
    if (!db) return alert("Firebase 연결이 필요합니다.");
    if (!newQuoteForm.name || !newQuoteForm.realPhone || !newQuoteForm.date) {
      alert("고객명, 연락처, 예약일은 필수 입력 항목입니다.");
      return;
    }
    
    try {
      const selectedB2BPartner = manualOrderType !== 'general' ? partners.find(p => p.id === selectedB2BPartnerId) : null;
      
      const numericPrice = parseInt(newQuoteForm.price.replace(/[^0-9]/g, ''), 10) || 0;
      const finalPrice = Math.max(numericPrice - 50000, 0);

      const docData: any = {
        ...newQuoteForm,
        finalPrice,
        house: newQuoteForm.houseSubType ? `${newQuoteForm.house} (${newQuoteForm.houseSubType})` : newQuoteForm.house,
        houseType: newQuoteForm.house,
        houseSubType: newQuoteForm.houseSubType,
        status: '대기중', // 수동 등록 시 기본값
        createdAt: new Date().toISOString(),
        options: selectedWizardOptions, 
        assignedTo: null,
        isUrgent: false,
      };

      if (manualOrderType !== 'general' && selectedB2BPartner) {
        const b2bLoginId = selectedB2BPartner.phone || selectedB2BPartner.loginId || '';
        const businessName = selectedB2BPartner.companyName || selectedB2BPartner.name || '';
        docData.isB2B = true;
        docData.b2bPartnerType = manualOrderType;
        docData.b2bLoginId = b2bLoginId;
        docData.businessName = businessName;
        docData.customerName = businessName;
        docData.name = businessName;
        docData.realPhone = selectedB2BPartner.phone || newQuoteForm.realPhone;
      }

      await addDoc(collection(db, 'quotes'), docData);
      alert("새 예약이 정상적으로 등록되었습니다.");
      setIsCreateQuoteModalOpen(false);
      setNewQuoteForm({
        name: '', realPhone: '', type: '일반 청소', house: '아파트', houseSubType: '',
        size: '', location: '', date: '', time: '시간협의', price: '', detail: ''
      });
      setManualOrderType('general');
      setSelectedB2BPartnerId('');
      setIsQuoteWizardOpen(true);
      setWizardOptions({
        phytoncide: 0, veranda: 0, refrigerator: 0, washer: 0, ac: 0,
        dishwasher: 0, oven: 0, mold: 0, sticker: 0, insulation: 0
      });
      setContaminationLevel('normal');
      setHasNoElevatorSurcharge(false);
      setCustomDiscount('');
      setSelectedWizardOptions([]);
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
        const now = new Date();
        const expireDate = new Date(now);
        expireDate.setMonth(expireDate.getMonth() + 6);
        await addDoc(collection(db, 'partners'), {
          ...newPartnerForm,
          name: newPartnerForm.managerName || newPartnerForm.companyName, // 호환성
          status: 'active', // 관리자가 직접 생성하므로 바로 활동 가능 상태
          isNotificationEnabled: true,
          notificationRegions: [newPartnerForm.region],
          createdAt: now.toISOString(),
          contractPlan: '6개월 (무료)',
          contractStartDate: now.toISOString(),
          contractEndDate: expireDate.toISOString(),
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
      '[필수] 현장 상황에 따라 추가 비용이 발생할 수 있습니다.': 0,
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
  const filteredFinanceQuotes = useMemo(() => {
    return quotes.filter(q => {
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
  }, [quotes, financeStartDate, financeEndDate, financePartnerFilter]);

  // 견적 관리 탭 데이터 필터링 적용 로직
  const filteredQuotesList = useMemo(() => {
    return quotes.filter(q => {
      if (q.cleaningType === '정기' || q.cleaningType === '가전' || q.type === '정기 청소' || q.type === '가전 청소') return false;
      if (quoteFilters.status !== '전체' && q.status !== quoteFilters.status) return false;
      if (quoteFilters.startDate && q.date && q.date < quoteFilters.startDate) return false;
      if (quoteFilters.endDate && q.date && q.date > quoteFilters.endDate) return false;
      return true;
    });
  }, [quotes, quoteFilters]);

  // 간편 신청 접수 탭 데이터 필터링 적용 로직
  const filteredSimpleQuotesList = useMemo(() => {
    return quotes.filter(q => {
      if (q.cleaningType !== '정기' && q.cleaningType !== '가전' && q.type !== '정기 청소' && q.type !== '가전 청소') return false;
      if (quoteFilters.status !== '전체' && q.status !== quoteFilters.status) return false;
      if (quoteFilters.startDate && q.date && q.date < quoteFilters.startDate) return false;
      if (quoteFilters.endDate && q.date && q.date > quoteFilters.endDate) return false;
      return true;
    });
  }, [quotes, quoteFilters]);

  const totalFinances = useMemo(() => {
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
  }, [filteredFinanceQuotes]);

  // CRM 고객 데이터 그룹핑 및 가공 (useMemo 적용)
  const allCustomers = useMemo(() => {
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

    return Array.from(customerMap.values()).map(c => {
      const cData = customersData.find(d => d.id === c.phone) || {};
      return { ...c, note: cData.note || '', isBlacklist: !!cData.isBlacklist };
    }).sort((a, b) => {
      if (customerSort === 'totalSpent') return b.totalSpent - a.totalSpent;
      return b.latestDate.localeCompare(a.latestDate);
    });
  }, [quotes, customersData, customerSort]);

  // CRM 고객 검색 필터 캐싱 (useMemo 적용)
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return allCustomers;
    const term = customerSearchTerm.toLowerCase();
    return allCustomers.filter(c => 
      c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
  }, [allCustomers, customerSearchTerm]);

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
  
  // 파트너 플랜별 통계
  const planCounts = useMemo(() => {
    return {
      total: partners.length,
      plan3m: partners.filter(p => String(p.contractPlan || '').includes('3개월')).length,
      plan6m: partners.filter(p => String(p.contractPlan || '').includes('6개월')).length,
      plan1y: partners.filter(p => String(p.contractPlan || '').includes('1년')).length,
      expiring: partners.filter(p => {
        const cs = getContractStatus(p);
        return cs.color === 'red' || cs.color === 'amber';
      }).length,
    };
  }, [partners]);

  // 파트너 탭 데이터 필터링 로직
  const filteredPartnersList = partners.filter(p => {
    // B2B 파트너 제외
    if (p.isB2B) return false;

    // 1. 상태 필터
    if (partnerFilterStatus !== '전체') {
      if (partnerFilterStatus === 'active' && p.status !== 'active') return false;
      if (partnerFilterStatus === 'pending' && p.status !== 'pending') return false;
    }
    
    // 2. 지역 필터
    if (partnerFilterRegion !== '전체') {
      if (p.region !== partnerFilterRegion) return false;
    }

    // 3. 계약 플랜 필터
    if (partnerFilterPlan !== '전체') {
      const plan = p.contractPlan || '';
      const cs = getContractStatus(p);
      if (partnerFilterPlan === '3개월' && !plan.includes('3개월')) return false;
      if (partnerFilterPlan === '6개월' && !plan.includes('6개월')) return false;
      if (partnerFilterPlan === '1년' && !plan.includes('1년')) return false;
      if (partnerFilterPlan === '만료 임박' && cs.color !== 'red' && cs.color !== 'amber') return false;
    }
    
    // 3-2. 등급 필터 (일반, 프리미엄, 지역독점)
    if (partnerFilterTier !== '전체') {
      const pPlan = p.plan || 'basic';
      if (partnerFilterTier !== pPlan) return false;
    }

    
    // 4. 검색어 필터
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

  // B2B 파트너 탭 데이터 필터링 로직
  const filteredB2BPartnersList = useMemo(() => {
    return partners.filter(p => {
      // B2B 파트너만 포함
      if (!p.isB2B) return false;

      // 1. 상태 필터
      if (b2bFilterStatus !== '전체') {
        if (b2bFilterStatus === 'active' && p.status !== 'active') return false;
        if (b2bFilterStatus === 'pending' && p.status !== 'pending') return false;
        if (b2bFilterStatus === 'suspended' && p.status !== 'suspended') return false;
      }

      // 2. 검색어 필터
      if (b2bSearchTerm) {
        const term = b2bSearchTerm.toLowerCase();
        const matchName = String(p.name || '').toLowerCase().includes(term);
        const matchEmail = String(p.email || '').toLowerCase().includes(term);
        const matchPhone = String(p.phone || '').toLowerCase().includes(term);
        const matchBusinessNumber = String(p.businessNumber || '').toLowerCase().includes(term);
        const matchBankName = String(p.bankName || '').toLowerCase().includes(term);

        if (!matchName && !matchEmail && !matchPhone && !matchBusinessNumber && !matchBankName) {
          return false;
        }
      }
      return true;
    });
  }, [partners, b2bFilterStatus, b2bSearchTerm]);

  // B2B 파트너 승인/정지/삭제 처리 핸들러
  const handleApproveB2BPartner = async (id: string) => {
    if (!db) return;
    if (confirm("해당 B2B 파트너를 승인(활성화)하시겠습니까?")) {
      await updateDoc(doc(db, 'partners', id), { status: 'active' });
      alert("B2B 파트너가 승인되었습니다.");
    }
  };

  const handleSuspendB2BPartner = async (id: string) => {
    if (!db) return;
    if (confirm("해당 B2B 파트너 계정을 정지하시겠습니까?")) {
      await updateDoc(doc(db, 'partners', id), { status: 'suspended' });
      alert("B2B 파트너 계정이 정지되었습니다.");
    }
  };

  const handleDeleteB2BPartner = async (id: string, phone?: string) => {
    if (!db) return;
    if (confirm("정말 이 B2B 파트너를 거절/삭제하시겠습니까?\n이 작업은 파트너 정보와 로그인용 B2B 계정을 모두 삭제하며 복구할 수 없습니다.")) {
      try {
        await deleteDoc(doc(db, 'partners', id));
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
        if (cleanPhone) {
          const q = query(collection(db, 'b2bAccounts'), where('phone', '==', phone));
          const snapshot = await getDocs(q);
          for (const document of snapshot.docs) {
            await deleteDoc(doc(db, 'b2bAccounts', document.id));
          }
        }
        alert("B2B 파트너 및 로그인 계정이 모두 성공적으로 삭제되었습니다.");
      } catch (err) {
        console.error("B2B 파트너 삭제 오류:", err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, loginForm.id, loginForm.password);
      // onAuthStateChanged가 자동으로 isLoggedIn을 true로 설정
    } catch (error: any) {
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
      console.error('Admin login error:', error.code);
    }
  };

  const handleAdminLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      const auth = getAuth();
      await signOut(auth);
      // onAuthStateChanged가 자동으로 isLoggedIn을 false로 설정
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
                placeholder="이메일을 입력하세요"
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

  const handleSaveCustomerNote = async () => {
    if (!db || !selectedCustomerForNote) return;
    try {
      const phone = selectedCustomerForNote.phone;
      await setDoc(doc(db, 'customers', phone), {
        note: selectedCustomerForNote.note || '',
        isBlacklist: selectedCustomerForNote.isBlacklist || false,
        updatedAt: new Date()
      }, { merge: true });
      alert('고객 특이사항이 저장되었습니다.');
      setIsCustomerNoteModalOpen(false);
    } catch (err) {
      console.error('Error saving customer note:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };
  const handleDeleteCustomer = async (phone: string) => {
    if (!db) return;
    if (confirm(`정말 이 고객을 삭제하시겠습니까?\n이 고객의 모든 문의/예약 내역 및 등록된 특이사항 메모가 영구 삭제되며 복구할 수 없습니다.`)) {
      try {
        // 1. customers 컬렉션에서 해당 고객 정보 삭제
        await deleteDoc(doc(db, 'customers', phone));
        
        // 2. quotes 컬렉션에서 해당 고객의 전화번호와 일치하는 모든 견적서 삭제
        const quotesQuery1 = query(collection(db, 'quotes'), where('realPhone', '==', phone));
        const quotesQuery2 = query(collection(db, 'quotes'), where('contactInfo', '==', phone));
        const quotesQuery3 = query(collection(db, 'quotes'), where('phone', '==', phone));
        
        const [snap1, snap2, snap3] = await Promise.all([
          getDocs(quotesQuery1),
          getDocs(quotesQuery2),
          getDocs(quotesQuery3)
        ]);
        
        const deletePromises: Promise<void>[] = [];
        
        const addDeletePromise = (snapshot: any) => {
          snapshot.forEach((d: any) => {
            deletePromises.push(deleteDoc(doc(db, 'quotes', d.id)));
          });
        };
        
        addDeletePromise(snap1);
        addDeletePromise(snap2);
        addDeletePromise(snap3);
        
        await Promise.all(deletePromises);
        alert('고객 정보 및 해당 고객의 모든 예약 내역이 성공적으로 삭제되었습니다.');
      } catch (err) {
        console.error("고객 삭제 중 오류:", err);
        alert("고객 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleBulkMessageSubmit = () => {
    if (!bulkMessageText.trim()) {
      alert('발송할 메시지를 입력해주세요.');
      return;
    }
    console.log(`[Mock 발송] 대상: ${selectedCustomerPhones.length}명`, selectedCustomerPhones);
    console.log(`[Mock 내용]: ${bulkMessageText}`);
    alert(`총 ${selectedCustomerPhones.length}명에게 메시지 발송(Mock)을 완료했습니다.\n\n* 실제 API 발송은 추후 연동됩니다.`);
    setIsBulkMessageModalOpen(false);
    setBulkMessageText('');
    setSelectedCustomerPhones([]);
  };

  const handleSaveSettings = async () => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'general'), settingsForm, { merge: true });
      alert('사이트 설정이 저장되었습니다.');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  };

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
            onClick={() => { setActiveTab('simpleQuotes'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'simpleQuotes' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <FileText size={20} />
            <span className="font-medium">간편 신청 접수</span>
          </button>
          <button 
            onClick={() => { setActiveTab('partners'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'partners' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <UserCheck size={20} />
            <span className="font-medium">청소 파트너 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('interiorPartners'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'interiorPartners' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Paintbrush size={20} />
            <span className="font-medium">인테리어 파트너 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('realestatePartners'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'realestatePartners' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Home size={20} />
            <span className="font-medium">부동산 파트너 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('customers'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Users size={20} />
            <span className="font-medium">고객 관리</span>
          </button>
          <button 
            onClick={() => { setActiveTab('reviews'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reviews' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Star size={20} />
            <span className="font-medium">리뷰/CS 관리</span>
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
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">
                            <div className="flex flex-col gap-0.5">
                              <span>{quote.name}</span>
                              {quote.isB2B && (
                                <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  [사업자] {quote.businessName || ''}
                                </span>
                              )}
                            </div>
                          </td>
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
                  <button 
                    onClick={() => {
                      setIsCreateQuoteModalOpen(true);
                      setManualOrderType('general');
                      setNewQuoteForm(prev => ({
                        ...prev,
                        type: '프리미엄 청소'
                      }));
                    }} 
                    className="px-4 py-2 bg-slate-900 text-sm font-bold rounded-lg text-white hover:bg-slate-800 shadow-sm transition-colors"
                  >
                    + 새 예약 수동등록
                  </button>
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
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">
                            <div className="flex flex-col gap-0.5">
                              <span>{quote.name || quote.customerName || '이름 없음'}</span>
                              {quote.isB2B && (
                                <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  [사업자] {quote.businessName || ''}
                                </span>
                              )}
                            </div>
                          </td>
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
                            {quote.isB2B && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  [사업자] {quote.businessName || ''}
                                </span>
                              </div>
                            )}
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

          {/* SimpleQuotes Tab */}
          {activeTab === 'simpleQuotes' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-800">간편 신청 접수</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    정기 청소 및 가전 청소 신청 내역을 관리합니다. 현재 예약 수: <strong className="text-blue-600">{filteredSimpleQuotesList.length}</strong>건
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setIsFilterModalOpen(true)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-bold rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-1"><Search size={14} /> 필터조회</button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  {/* 데스크탑 뷰: 테이블 */}
                  <table className="hidden lg:table w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">접수번호</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">희망일자</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">신청자명</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">연락처</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">종류</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">진행 상태</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">방문 주소</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-semibold text-gray-500 uppercase">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSimpleQuotesList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">조건에 맞는 데이터가 없습니다.</td>
                        </tr>
                      ) : (
                        filteredSimpleQuotesList.map((quote) => (
                          <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-500">#{quote.id.slice(0,6)}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{quote.date || quote.cleaningDate || '미지정'}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-800">{quote.name || quote.customerName || '이름 없음'}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600">{quote.realPhone || quote.contactInfo || '-'}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600 font-bold text-blue-600">{quote.cleaningType || (quote.type?.includes('정기') ? '정기' : '가전')}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                              <select 
                                className={`text-xs lg:text-sm font-medium border-0 bg-transparent cursor-pointer focus:ring-0 outline-none
                                  ${quote.status === '대기중' ? 'text-amber-600 font-bold' : ''}
                                  ${quote.status === '상담중' ? 'text-blue-600 font-bold' : ''}
                                  ${quote.status === '상담완료' ? 'text-emerald-600 font-bold' : ''}
                                  ${quote.status === '배정완료' ? 'text-indigo-600 font-bold' : ''}
                                  ${quote.status === '취소' ? 'text-red-500 font-bold' : ''}
                                `}
                                value={quote.status}
                                onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                              >
                                <option value="대기중" className="text-gray-800">대기중</option>
                                <option value="상담중" className="text-gray-800">상담중</option>
                                <option value="상담완료" className="text-gray-800">상담완료</option>
                                <option value="배정완료" className="text-gray-800">배정완료</option>
                                <option value="취소" className="text-gray-800">취소</option>
                              </select>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600 truncate max-w-[200px]" title={quote.location}>{quote.location}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                              <button onClick={() => setSelectedQuoteDetail(quote)} className="text-blue-600 hover:text-blue-800 text-xs lg:text-sm font-medium">상세보기</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* 모바일 뷰: 카드 레이아웃 */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {filteredSimpleQuotesList.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm font-medium">조건에 맞는 데이터가 없습니다.</div>
                    ) : (
                      filteredSimpleQuotesList.map((quote) => (
                        <div key={quote.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">#{quote.id.slice(0,6)}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <h4 className="font-bold text-gray-900 text-lg">{quote.name || quote.customerName || '이름 없음'}</h4>
                                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                  {quote.cleaningType || (quote.type?.includes('정기') ? '정기' : '가전')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 font-medium">{quote.date || quote.cleaningDate || '미지정'} ({quote.time || '시간협의'})</div>
                            </div>
                            {/* 진행 상태 select */}
                            <select 
                              className={`text-sm font-bold border-0 bg-transparent cursor-pointer focus:ring-0 outline-none text-right
                                ${quote.status === '대기중' ? 'text-amber-600 font-bold' : ''}
                                ${quote.status === '상담중' ? 'text-blue-600 font-bold' : ''}
                                ${quote.status === '상담완료' ? 'text-emerald-600 font-bold' : ''}
                                ${quote.status === '배정완료' ? 'text-indigo-600 font-bold' : ''}
                                ${quote.status === '취소' ? 'text-red-500 font-bold' : ''}
                              `}
                              value={quote.status}
                              onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                            >
                              <option value="대기중" className="text-gray-800">대기중</option>
                              <option value="상담중" className="text-gray-800">상담중</option>
                              <option value="상담완료" className="text-gray-800">상담완료</option>
                              <option value="배정완료" className="text-gray-800">배정완료</option>
                              <option value="취소" className="text-gray-800">취소</option>
                            </select>
                          </div>

                          <div className="bg-white border border-gray-100 rounded-lg p-3 grid grid-cols-1 gap-2 mt-1 shadow-sm text-xs text-gray-600">
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold">연락처</p>
                              <p className="font-bold text-gray-800">{quote.realPhone || quote.contactInfo || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold">방문 주소</p>
                              <p className="font-bold text-gray-800 truncate" title={quote.location}>{quote.location}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => setSelectedQuoteDetail(quote)} 
                            className="w-full mt-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          >
                            상세 보기
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab - 고객 관리 (realPhone 기준 중복 제거, 검색, 상세 모달 지원) */}
          {activeTab === 'customers' && (() => {
            const handleToggleCustomer = (phone: string) => {
              setSelectedCustomerPhones(prev => 
                prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
              );
            };

            const handleToggleAllCustomers = () => {
              if (selectedCustomerPhones.length === filteredCustomers.length && filteredCustomers.length > 0) {
                setSelectedCustomerPhones([]);
              } else {
                setSelectedCustomerPhones(filteredCustomers.map(c => c.phone));
              }
            };

            return (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-800 border-b border-purple-600 inline-block pb-1">고객 관리 (CRM)</h2>
                  <p className="text-gray-500 mt-2 text-sm">연락처 기준으로 고객을 자동 분류합니다. 총 <strong className="text-purple-600">{allCustomers.length}</strong>명의 고객</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                  <select
                    value={customerSort}
                    onChange={(e) => setCustomerSort(e.target.value as 'latest' | 'totalSpent')}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-purple-500 outline-none bg-gray-50 text-gray-700 w-full md:w-auto"
                  >
                    <option value="latest">최근 이용순</option>
                    <option value="totalSpent">누적 결제액순</option>
                  </select>
                  <div className="flex items-center gap-2 w-full md:w-96 relative">
                    <Search size={18} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="고객명, 연락처 검색..." 
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:border-purple-500 outline-none bg-white text-gray-700 placeholder:text-gray-400 shadow-sm"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    />
                  </div>
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
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            checked={filteredCustomers.length > 0 && selectedCustomerPhones.length === filteredCustomers.length}
                            onChange={handleToggleAllCustomers}
                          />
                        </th>
                        <th className="p-4 font-bold">고객명</th>
                        <th className="p-4 font-bold">연락처</th>
                        <th className="p-4 font-bold text-center">총 문의/완료</th>
                        <th className="p-4 font-bold text-right">누적 결제</th>
                        <th className="p-4 font-bold text-center">등급</th>
                        <th className="p-4 font-bold">메모/특이사항</th>
                        <th className="p-4 font-bold text-center">관리</th>
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
                          // 왜: 고객 등급을 이용 횟수 및 누적 매출 기반으로 자동 분류 (50만원 이상 또는 3회 이상)
                          const isVIP = customer.completedCount >= 3 || customer.totalSpent >= 500000;
                          const grade = isVIP ? 'VIP' : customer.completedCount >= 1 ? '단골' : '신규';
                          const gradeStyle = grade === 'VIP' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : grade === '단골' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200';
                          
                          return (
                            <tr key={customer.phone} className={`hover:bg-slate-50 transition-colors ${customer.isBlacklist ? 'bg-red-50/50' : ''}`}>
                              <td className="p-4 text-center">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                  checked={selectedCustomerPhones.includes(customer.phone)}
                                  onChange={() => handleToggleCustomer(customer.phone)}
                                />
                              </td>
                              <td className="p-4 font-bold text-gray-800">
                                {customer.name}
                                {customer.isBlacklist && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">요주의</span>}
                              </td>
                              <td className="p-4 text-sm font-medium text-gray-600 tracking-wide">{customer.phone}</td>
                              <td className="p-4 text-sm font-bold text-center text-gray-700">
                                {customer.orders.length}건 <span className="text-gray-300">/</span> <span className="text-emerald-600">{customer.completedCount}건</span>
                              </td>
                              <td className="p-4 text-sm font-bold text-right text-gray-800">
                                {customer.totalSpent > 0 ? `₩${customer.totalSpent.toLocaleString()}` : '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${gradeStyle}`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate" title={customer.note}>
                                {customer.note ? (
                                  <span className="text-gray-700 font-medium">{customer.note}</span>
                                ) : (
                                  <span className="text-gray-400 italic">메모 없음</span>
                                )}
                                <button 
                                  onClick={() => { setSelectedCustomerForNote(customer); setIsCustomerNoteModalOpen(true); }}
                                  className="ml-2 text-xs text-blue-600 hover:underline"
                                >
                                  수정
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-3">
                                  <button 
                                    onClick={() => setSelectedQuoteDetail(customer.orders[0])}
                                    className="text-gray-500 hover:text-gray-800 text-sm font-bold hover:underline"
                                  >
                                    내역
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteCustomer(customer.phone)}
                                    className="text-red-500 hover:text-red-700 text-sm font-bold hover:underline"
                                  >
                                    삭제
                                  </button>
                                </div>
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

                          <div className="flex gap-2 mt-1">
                            <button 
                              onClick={() => setSelectedQuoteDetail(customer.orders[0])}
                              className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                              최근 이용 상세 보기
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(customer.phone)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
                            >
                              삭제
                            </button>
                          </div>
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
                      <input 
                        type="text" 
                        value={settingsForm.companyName}
                        onChange={e => setSettingsForm({...settingsForm, companyName: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">대표 연락처</label>
                      <input 
                        type="text" 
                        value={settingsForm.contactNumber}
                        onChange={e => setSettingsForm({...settingsForm, contactNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">영업 시간</label>
                    <input 
                      type="text" 
                      value={settingsForm.businessHours}
                      onChange={e => setSettingsForm({...settingsForm, businessHours: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <hr className="border-gray-100" />
                  
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-4">서비스 가격표 기본값 관리 (평당 단가, 단위: 원)</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="w-40 text-sm text-gray-600 font-medium">일반 청소 (평당)</span>
                        <input 
                          type="number" 
                          value={settingsForm.priceNormal}
                          onChange={e => setSettingsForm({...settingsForm, priceNormal: Number(e.target.value)})}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-40 text-sm text-gray-600 font-medium">프리미엄 청소 (평당)</span>
                        <input 
                          type="number" 
                          value={settingsForm.pricePremium}
                          onChange={e => setSettingsForm({...settingsForm, pricePremium: Number(e.target.value)})}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleSaveSettings}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
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
              
              {/* 파트너 플랜 등급 탭 */}
              <div className="flex border-b border-gray-200 bg-white px-4 pt-2 rounded-xl shadow-sm border overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button
                  onClick={() => setPartnerFilterTier('전체')}
                  className={`px-4 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    partnerFilterTier === '전체'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  전체 파트너스
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    partnerFilterTier === '전체' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {partners.length}
                  </span>
                </button>
                <button
                  onClick={() => setPartnerFilterTier('basic')}
                  className={`px-4 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    partnerFilterTier === 'basic'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  일반
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    partnerFilterTier === 'basic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {partners.filter(p => (p.plan || 'basic') === 'basic').length}
                  </span>
                </button>
                <button
                  onClick={() => setPartnerFilterTier('premium')}
                  className={`px-4 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    partnerFilterTier === 'premium'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  프리미엄
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    partnerFilterTier === 'premium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {partners.filter(p => p.plan === 'premium').length}
                  </span>
                </button>
                <button
                  onClick={() => setPartnerFilterTier('exclusive')}
                  className={`px-4 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                    partnerFilterTier === 'exclusive'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  지역독점
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    partnerFilterTier === 'exclusive' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {partners.filter(p => p.plan === 'exclusive').length}
                  </span>
                </button>
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
                        <th className="p-3 font-bold whitespace-nowrap">가입일</th>
                        <th className="p-3 font-bold whitespace-nowrap">파트너 (업체/담당자)</th>
                        <th className="p-3 font-bold whitespace-nowrap">연락처</th>
                        <th className="p-3 font-bold text-blue-600 bg-blue-50/50 whitespace-nowrap">접속 ID</th>
                        <th className="p-3 font-bold text-blue-600 bg-blue-50/50 whitespace-nowrap">비밀번호(초기)</th>
                        <th className="p-3 font-bold break-keep min-w-[150px]">활동 지역</th>
                        <th className="p-3 font-bold whitespace-nowrap">계약 만료</th>
                        <th className="p-3 font-bold whitespace-nowrap">상태/권한</th>
                        <th className="p-3 font-bold text-center whitespace-nowrap">승인 관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPartnersList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-gray-400">
                            등록되거나 대기 중인 파트너가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredPartnersList.map((partner) => (
                          <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-sm whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '-'}</span>
                                {partner.createdAt && <span className="text-[10px] text-slate-400">{(() => { const d = new Date(partner.createdAt); const now = new Date(); const diff = Math.floor((now.getTime() - d.getTime()) / (1000*60*60*24)); return diff === 0 ? '오늘' : diff < 30 ? `${diff}일 전` : diff < 365 ? `${Math.floor(diff/30)}개월 전` : `${Math.floor(diff/365)}년 전`; })()}</span>}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-gray-800 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{partner.companyName || partner.name}</span>
                                {partner.managerName && <span className="text-xs font-medium text-gray-500">({partner.managerName})</span>}
                                {(() => {
                                  const pPlan = partner.plan || 'basic';
                                  return (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border uppercase leading-none ${
                                      pPlan === 'exclusive' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                      pPlan === 'premium' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {pPlan === 'exclusive' ? '독점' : pPlan === 'premium' ? '프리미엄' : '일반'}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="p-3 text-sm font-medium text-gray-600 tracking-wide whitespace-nowrap">
                              {partner.phone}
                            </td>
                            <td className="p-3 text-sm font-bold text-blue-600 bg-blue-50/20 whitespace-nowrap">
                              {partner.loginId || <span className="text-gray-400 text-xs">-</span>}
                            </td>
                            <td className="p-3 text-sm font-mono text-slate-500 bg-blue-50/20 whitespace-nowrap">
                              {(partner.loginPassword || partner.password) || <span className="text-gray-400 text-xs">-</span>}
                            </td>
                            <td className="p-3 text-sm text-gray-600 max-w-xs break-keep" title={`전체 지역: ${partner.region || '-'}`}>
                              {(() => {
                                const regions = partner.region ? partner.region.split(',').map((r: any) => r.trim()).filter(Boolean) : [];
                                return regions.length > 2 
                                  ? `${regions.slice(0, 2).join(', ')} 외 ${regions.length - 2}곳` 
                                  : partner.region || '-';
                              })()}
                            </td>
                            <td className="p-3">
                              {(() => {
                                const cs = getContractStatus(partner);
                                return (
                                  <div className="flex flex-col gap-1 min-w-[120px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`px-2 py-1.5 rounded-full text-xs font-bold border inline-block whitespace-nowrap ${
                                        cs.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                                        cs.color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                                        cs.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        'bg-gray-100 text-gray-500 border-gray-200'
                                      }`}>
                                        {cs.label}
                                      </span>
                                      {partner.contractPlan && (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block whitespace-nowrap">
                                          {partner.contractPlan}
                                        </span>
                                      )}
                                    </div>
                                    {partner.contractEndDate && (
                                      <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                                        ~{new Date(partner.contractEndDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    {cs.color === 'red' && (
                                      <div className="flex flex-wrap gap-1 mt-1 max-w-[140px]">
                                        <button onClick={() => handleExtendContract(partner.id, 3)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-bold whitespace-nowrap">+3개월</button>
                                        <button onClick={() => handleExtendContract(partner.id, 6)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-bold whitespace-nowrap">+6개월</button>
                                        <button onClick={() => handleExtendContract(partner.id, 12)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-bold whitespace-nowrap">+1년</button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                                partner.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                  : partner.status === 'suspended'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {partner.status === 'active' ? '활동 중' : partner.status === 'suspended' ? '활동 정지' : '승인 대기'}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex flex-col gap-2">
                                {partner.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => openPartnerDetail(partner)}
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
                                    <button 
                                      onClick={() => openPartnerDetail(partner)}
                                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs border border-slate-300 transition-all active:scale-[0.98] mb-1"
                                    >
                                      상세 확인
                                    </button>
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
                                    <button 
                                      onClick={() => handleDeletePartner(partner.id)}
                                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-xs border border-red-200 transition-all active:scale-[0.98] mt-1"
                                    >
                                      영구 삭제
                                    </button>
                                  </>
                                )}

                                {partner.status === 'suspended' && (
                                  <>
                                    <button 
                                      onClick={() => openPartnerDetail(partner)}
                                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg text-xs border border-slate-300 transition-all active:scale-[0.98] mb-1"
                                    >
                                      상세 확인
                                    </button>
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
                              <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                <span className="font-bold text-gray-900 text-lg leading-none">
                                  {partner.businessType === 'business' ? `${partner.companyName} (${partner.managerName})` : partner.name}
                                </span>
                                {partner.businessType === 'business' ? (
                                  <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100"><Building2 size={10} /> 사업자</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded font-bold border border-slate-200"><UserCheck size={10} /> 비사업자</span>
                                )}
                                {(() => {
                                  const pPlan = partner.plan || 'basic';
                                  return (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border uppercase leading-none ${
                                      pPlan === 'exclusive' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                      pPlan === 'premium' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {pPlan === 'exclusive' ? '독점' : pPlan === 'premium' ? '프리미엄' : '일반'}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-xs text-slate-400 font-medium">
                                가입일: {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '-'}
                                {partner.createdAt && <span className="ml-1 text-slate-300">({(() => { const d = new Date(partner.createdAt); const now = new Date(); const diff = Math.floor((now.getTime() - d.getTime()) / (1000*60*60*24)); return diff === 0 ? '오늘' : diff < 30 ? `${diff}일 전` : diff < 365 ? `${Math.floor(diff/30)}개월 전` : `${Math.floor(diff/365)}년 전`; })()})</span>}
                              </p>
                              {(() => {
                                const cs = getContractStatus(partner);
                                return (
                                  <div className="flex items-center flex-wrap gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                      cs.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                                      cs.color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                                      cs.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                      'bg-gray-100 text-gray-500 border-gray-200'
                                    }`}>
                                      계약 {cs.label}
                                    </span>
                                    {partner.contractPlan && (
                                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200 font-bold">
                                        {partner.contractPlan}
                                      </span>
                                    )}
                                    {partner.contractEndDate && (
                                      <span className="text-xs text-gray-400">~{new Date(partner.contractEndDate).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                );
                              })()}
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
                                  onClick={() => openPartnerDetail(partner)}
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
                                <button 
                                  onClick={() => openPartnerDetail(partner)}
                                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl border border-slate-300 transition-all active:scale-[0.98] text-sm"
                                >
                                  상세 확인
                                </button>
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
                                <button 
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  영구 삭제
                                </button>
                              </div>
                            )}

                            {partner.status === 'suspended' && (
                              <div className="flex flex-col gap-2 w-full">
                                <button 
                                  onClick={() => openPartnerDetail(partner)}
                                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl border border-slate-300 transition-all active:scale-[0.98] text-sm"
                                >
                                  상세 확인
                                </button>
                                <div className="flex gap-2 w-full">
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
                                </div>
                              </div>
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

          {(activeTab === 'interiorPartners' || activeTab === 'realestatePartners') && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold border-b border-purple-600 inline-block pb-1">
                    {activeTab === 'interiorPartners' ? '인테리어 파트너 관리' : '부동산 파트너 관리'}
                  </h2>
                  <p className="text-gray-500 mt-2">
                    {activeTab === 'interiorPartners' ? '업체 전용 페이지를 통해 가입한 인테리어 파트너들을 관리합니다.' : '업체 전용 페이지를 통해 가입한 부동산 비즈니스 파트너들을 관리합니다.'}
                  </p>
                </div>
              </div>
              
              {/* B2B 파트너 검색 및 필터 UI */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600 whitespace-nowrap">상태 필터</span>
                    <select 
                      value={b2bFilterStatus}
                      onChange={(e) => setB2bFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:border-purple-500 outline-none bg-gray-50 text-gray-700"
                    >
                      <option value="전체">전체 상태</option>
                      <option value="active">활동 중 (승인)</option>
                      <option value="pending">승인 대기</option>
                      <option value="suspended">계정 정지</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-96 relative">
                  <Search size={18} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={b2bSearchTerm}
                    onChange={(e) => setB2bSearchTerm(e.target.value)}
                    placeholder="대표자/상호명, 연락처, 이메일, 사업자번호 검색..." 
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm font-medium focus:border-purple-500 outline-none bg-gray-50 text-gray-700 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2">
                <div className="overflow-x-auto">
                  {/* 데스크탑 뷰: B2B 파트너 테이블 */}
                  <table className="hidden lg:table w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                        <th className="p-3 font-bold whitespace-nowrap">가입일</th>
                        <th className="p-3 font-bold whitespace-nowrap">상호명/대표자</th>
                        <th className="p-3 font-bold whitespace-nowrap">연락처</th>
                        <th className="p-3 font-bold whitespace-nowrap">이메일</th>
                        <th className="p-3 font-bold whitespace-nowrap">사업자번호</th>
                        <th className="p-3 font-bold whitespace-nowrap">{activeTab === 'interiorPartners' ? '회사 주소' : '사무소 주소'}</th>
                        <th className="p-3 font-bold whitespace-nowrap">누적 오더</th>
                        {activeTab === 'realestatePartners' && (
                          <>
                            <th className="p-3 font-bold whitespace-nowrap">정산 계좌 정보</th>
                            <th className="p-3 font-bold whitespace-nowrap">누적 페이백</th>
                          </>
                        )}
                        <th className="p-3 font-bold whitespace-nowrap">가입 상태</th>
                        <th className="p-3 font-bold text-center whitespace-nowrap">승인 관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredB2BPartnersList.filter(p => p.b2bPartnerType === (activeTab === 'interiorPartners' ? 'interior' : 'realestate')).length === 0 ? (
                        <tr>
                          <td colSpan={activeTab === 'interiorPartners' ? 9 : 11} className="p-12 text-center text-gray-400">
                            등록되거나 대기 중인 {activeTab === 'interiorPartners' ? '인테리어' : '부동산'} 파트너가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredB2BPartnersList.filter(p => p.b2bPartnerType === (activeTab === 'interiorPartners' ? 'interior' : 'realestate')).map((partner) => (
                          <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-sm whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '-'}</span>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-gray-800 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{partner.companyName || partner.name}</span>
                                {partner.businessType === 'non_business' && (
                                  <span className={`px-1.5 py-0.5 text-[9px] rounded font-extrabold ${
                                    partner.b2bPartnerType === 'interior' 
                                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {partner.b2bPartnerType === 'interior' ? '비사업자' : '실장님'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm font-medium text-gray-600 tracking-wide whitespace-nowrap">
                              {partner.phone}
                            </td>
                            <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                              {partner.email || '-'}
                            </td>
                            <td className="p-3 text-sm font-mono text-gray-600 whitespace-nowrap">
                              <div>{partner.businessNumber || '-'}</div>
                              {partner.businessImageUrl && (
                                <a href={partner.businessImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:text-blue-700 underline underline-offset-2 font-bold mt-0.5 inline-block">📄 등록증 보기</a>
                              )}
                            </td>
                            <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                              {partner.address || '-'}
                            </td>
                            <td className="p-3 text-sm font-bold text-blue-600 whitespace-nowrap">
                              {partner.totalOrders || 0}건
                            </td>
                            {activeTab === 'realestatePartners' && (
                              <>
                                <td className="p-3 text-sm">
                                  {partner.bankName ? (
                                    <div className="text-xs text-gray-700">
                                      <span className="font-bold">{partner.bankName}</span> {partner.accountNumber} <span className="text-gray-400">({partner.accountHolder})</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">미등록</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm font-bold text-purple-600 whitespace-nowrap">
                                  {(partner.totalPayback || 0).toLocaleString()}원
                                </td>
                              </>
                            )}
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                                partner.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                  : partner.status === 'suspended'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {partner.status === 'active' ? '활동 중' : partner.status === 'suspended' ? '활동 정지' : '승인 대기'}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex justify-center gap-1.5">
                                {partner.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => handleApproveB2BPartner(partner.id)}
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all active:scale-[0.98]"
                                    >
                                      승인
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteB2BPartner(partner.id, partner.phone)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-200 transition-all active:scale-[0.98]"
                                    >
                                      거절
                                    </button>
                                  </>
                                )}
                                {partner.status === 'active' && (
                                  <>
                                    <button 
                                      onClick={() => handleSuspendB2BPartner(partner.id)}
                                      className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-orange-200 transition-all active:scale-[0.98]"
                                    >
                                      계정 정지
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteB2BPartner(partner.id, partner.phone)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-200 transition-all active:scale-[0.98]"
                                    >
                                      영구 삭제
                                    </button>
                                  </>
                                )}
                                {partner.status === 'suspended' && (
                                  <>
                                    <button 
                                      onClick={() => handleApproveB2BPartner(partner.id)}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-emerald-200 transition-all active:scale-[0.98]"
                                    >
                                      활동 재개
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteB2BPartner(partner.id, partner.phone)}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-200 transition-all active:scale-[0.98]"
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

                  {/* 모바일 뷰: B2B 파트너 카드 */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {filteredB2BPartnersList.filter(p => p.b2bPartnerType === (activeTab === 'interiorPartners' ? 'interior' : 'realestate')).length === 0 ? (
                      <div className="p-12 text-center text-gray-400 font-medium">대기 중인 {activeTab === 'interiorPartners' ? '인테리어' : '부동산'} 파트너가 없습니다.</div>
                    ) : (
                      filteredB2BPartnersList.filter(p => p.b2bPartnerType === (activeTab === 'interiorPartners' ? 'interior' : 'realestate')).map(partner => (
                        <div key={partner.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                <span className="font-bold text-gray-900 text-lg leading-none">
                                  {partner.companyName || partner.name}
                                </span>
                                {partner.businessType === 'non_business' && (
                                  <span className={`px-1.5 py-0.5 text-[9px] rounded font-extrabold border ${
                                    partner.b2bPartnerType === 'interior' 
                                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {partner.b2bPartnerType === 'interior' ? '비사업자' : '실장님'}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-100">{activeTab === 'interiorPartners' ? '인테리어 파트너' : '부동산 파트너'}</span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium">
                                가입일: {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '-'}
                              </p>
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
                          
                          <div className="bg-white border border-slate-100 shadow-sm p-3 rounded-lg flex flex-col gap-2 text-sm mt-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold mb-0.5">연락처</p>
                                <p className="text-slate-800 font-bold tracking-wide">{partner.phone}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold mb-0.5">사업자 번호</p>
                                <p className="text-slate-800 font-bold font-mono">{partner.businessNumber || '-'}</p>
                                {partner.businessImageUrl && (
                                  <a href={partner.businessImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:text-blue-700 underline underline-offset-2 font-bold mt-0.5 inline-block">📄 등록증 보기</a>
                                )}
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] text-slate-400 font-bold mb-0.5">{activeTab === 'interiorPartners' ? '회사 주소' : '사무소 주소'}</p>
                                <p className="text-slate-800 font-bold">{partner.address || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold mb-0.5">누적 오더</p>
                                <p className="text-blue-600 font-bold">{partner.totalOrders || 0}건</p>
                              </div>
                              {activeTab === 'realestatePartners' && (
                                <div>
                                  <p className="text-[10px] text-purple-500 font-bold mb-0.5">누적 페이백</p>
                                  <p className="text-purple-600 font-bold">{(partner.totalPayback || 0).toLocaleString()}원</p>
                                </div>
                              )}
                            </div>
                            {activeTab === 'realestatePartners' && (
                              <div className="border-t border-slate-50 pt-2 mt-1">
                                <p className="text-[10px] text-emerald-500 font-bold mb-0.5">페이백 정산 계좌</p>
                                <p className="text-slate-800 font-bold text-xs">
                                  {partner.bankName ? `${partner.bankName} ${partner.accountNumber} (${partner.accountHolder})` : '미등록'}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-1 flex gap-2">
                            {partner.status === 'pending' && (
                              <div className="flex gap-2 w-full">
                                <button 
                                  onClick={() => handleApproveB2BPartner(partner.id)}
                                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98] active:shadow-none text-sm"
                                >
                                  승인
                                </button>
                                <button 
                                  onClick={() => handleDeleteB2BPartner(partner.id, partner.phone)}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  거절
                                </button>
                              </div>
                            )}
                            {partner.status === 'active' && (
                              <div className="flex gap-2 w-full">
                                <button 
                                  onClick={() => handleSuspendB2BPartner(partner.id)}
                                  className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-3 rounded-xl border border-orange-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  계정 정지
                                </button>
                                <button 
                                  onClick={() => handleDeleteB2BPartner(partner.id, partner.phone)}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  영구 삭제
                                </button>
                              </div>
                            )}
                            {partner.status === 'suspended' && (
                              <div className="flex gap-2 w-full">
                                <button 
                                  onClick={() => handleApproveB2BPartner(partner.id)}
                                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-3 rounded-xl border border-emerald-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  활동 재개
                                </button>
                                <button 
                                  onClick={() => handleDeleteB2BPartner(partner.id, partner.phone)}
                                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition-all active:scale-[0.98] text-sm"
                                >
                                  영구 삭제
                                </button>
                              </div>
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

          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 border-b border-blue-600 inline-block pb-1">리뷰 / CS 관리</h2>
                <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 flex items-center gap-2 shadow-sm">
                  <span className="text-sm font-bold text-gray-600">총 리뷰 수:</span>
                  <span className="text-lg font-black text-blue-600">{reviews.length}개</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm text-gray-600 font-medium">고객이 작성한 리뷰 내역입니다. 문제가 있는 악성 리뷰는 영구 삭제할 수 있습니다.</p>
                </div>
                {reviews.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 font-medium">작성된 리뷰가 없습니다.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                          <th className="p-4 font-bold whitespace-nowrap">작성일</th>
                          <th className="p-4 font-bold whitespace-nowrap">고객명</th>
                          <th className="p-4 font-bold whitespace-nowrap">담당 파트너</th>
                          <th className="p-4 font-bold whitespace-nowrap">별점</th>
                          <th className="p-4 font-bold min-w-[300px]">리뷰 내용</th>
                          <th className="p-4 font-bold text-center whitespace-nowrap">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((r) => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                            <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                              {r.createdAt ? new Date(r.createdAt.toDate ? r.createdAt.toDate() : (r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt)).toLocaleDateString() : '날짜 없음'}
                            </td>
                            <td className="p-4 text-sm font-bold text-gray-800 whitespace-nowrap">{r.customerName}</td>
                            <td className="p-4 text-sm font-bold text-blue-600 whitespace-nowrap">{r.partnerName}</td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={16} fill={i < (r.rating || 0) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-700 whitespace-pre-wrap break-keep">{r.content}</td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button 
                                onClick={() => handleDeleteReview(r.id)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
              {(() => {
                const isSimpleForm = selectedQuoteDetail.cleaningType === '정기' || 
                                     selectedQuoteDetail.cleaningType === '가전' || 
                                     selectedQuoteDetail.type?.includes('정기') || 
                                     selectedQuoteDetail.type?.includes('가전');

                if (isSimpleForm) {
                  return (
                    <div className="space-y-6">
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-blue-600/80 font-bold mb-1">상태 (진행 상황)</p>
                          <select 
                            className="text-sm font-bold border border-blue-200 bg-white rounded-md px-2 py-1 cursor-pointer outline-none text-blue-700 focus:ring-2 focus:ring-blue-500"
                            value={selectedQuoteDetail.status}
                            onChange={(e) => handleStatusChange(selectedQuoteDetail.id, e.target.value)}
                          >
                            <option value="대기중">대기중</option>
                            <option value="상담중">상담중</option>
                            <option value="상담완료">상담완료</option>
                            <option value="배정완료">배정완료</option>
                            <option value="취소">취소</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600/80 font-bold mb-1">담당 배차 파트너</p>
                          <div className="flex items-center gap-2 mt-1">
                            <select
                              value={selectedQuoteDetail.assignedTo || ''}
                              onChange={async (e) => {
                                const partnerId = e.target.value;
                                if (!partnerId) {
                                  if (confirm('배정을 취소하고 대기중 상태로 변경하시겠습니까?')) {
                                    await updateDoc(doc(db, 'quotes', selectedQuoteDetail.id), {
                                      assignedTo: null,
                                      designatedPartnerName: null,
                                      status: '대기중'
                                    });
                                    setSelectedQuoteDetail(prev => prev ? { 
                                      ...prev, 
                                      assignedTo: null, 
                                      designatedPartnerName: undefined, 
                                      status: '대기중' 
                                    } : null);
                                    alert('배정이 취소되었습니다.');
                                  }
                                  return;
                                }
                                const partner = partners.find(p => p.id === partnerId);
                                if (partner) {
                                  const partnerName = partner.companyName || partner.name || '';
                                  if (confirm(`[${partnerName}] 파트너에게 이 견적을 직접 배정하시겠습니까?`)) {
                                    await handleAssignPartner(selectedQuoteDetail.id, partnerId, partnerName);
                                  }
                                }
                              }}
                              className="text-xs border border-gray-300 bg-white rounded-md px-2 py-1 cursor-pointer outline-none text-gray-800 focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
                            >
                              <option value="">배정 대기중 (선택안함)</option>
                              {partners.filter(p => !p.isB2B && p.status === 'active').map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.companyName || p.name}
                                </option>
                              ))}
                            </select>
                            {selectedQuoteDetail.designatedPartnerName && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold shrink-0">지정됨</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 font-bold mb-1">고객명</p>
                          <p className="text-gray-800 font-bold">{selectedQuoteDetail.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold mb-1">연락처</p>
                          <p className="text-gray-800 font-bold tracking-wide">{selectedQuoteDetail.realPhone || selectedQuoteDetail.contactInfo || '등록 번호 없음'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold mb-1">서비스 종류</p>
                          <p className="text-gray-800 font-bold">{selectedQuoteDetail.cleaningType || (selectedQuoteDetail.type?.includes('정기') ? '정기' : '가전')} 청소 (간편 신청)</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold mb-1">희망 방문 일정</p>
                          <p className="text-gray-800 font-bold">{selectedQuoteDetail.date || selectedQuoteDetail.cleaningDate} / {selectedQuoteDetail.time || selectedQuoteDetail.cleaningTime}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 font-bold mb-2">방문 주소</p>
                        <div className="bg-gray-50 p-3 px-4 rounded-xl border border-gray-200">
                          <p className="text-gray-800 font-semibold">{selectedQuoteDetail.location}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 font-bold mb-2">고객 추가 요청사항 (상세 신청 내용)</p>
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 min-h-[80px]">
                          <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{selectedQuoteDetail.detail || selectedQuoteDetail.memo || '기재된 특이사항 없음'}</p>
                        </div>
                      </div>

                      {/* 관리자 상담 메모 영역 */}
                      <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/20">
                        <label className="block text-xs font-bold text-blue-700 mb-2">📝 관리자 상담 메모 (본사 관리용)</label>
                        <textarea
                          value={adminMemoInput}
                          onChange={(e) => setAdminMemoInput(e.target.value)}
                          placeholder="고객과의 통화 이력, 특이사항, 배정 예정 기사 등 관리 목적의 상담 메모를 입력하세요."
                          rows={4}
                          className="w-full border border-blue-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 bg-white text-gray-800 resize-none"
                        />
                        <div className="mt-2.5 flex justify-end">
                          <button
                            onClick={handleSaveAdminMemo}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
                          >
                            상담 메모 저장
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-blue-600/80 font-bold mb-1">상태 (진행 상황)</p>
                          <p className="font-black text-blue-700 text-lg">{selectedQuoteDetail.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600/80 font-bold mb-1">담당 배차 파트너</p>
                          <div className="flex items-center gap-2 mt-1">
                            <select
                              value={selectedQuoteDetail.assignedTo || ''}
                              onChange={async (e) => {
                                const partnerId = e.target.value;
                                if (!partnerId) {
                                  if (confirm('배정을 취소하고 대기중 상태로 변경하시겠습니까?')) {
                                    await updateDoc(doc(db, 'quotes', selectedQuoteDetail.id), {
                                      assignedTo: null,
                                      designatedPartnerName: null,
                                      status: '대기중'
                                    });
                                    setSelectedQuoteDetail(prev => prev ? { 
                                      ...prev, 
                                      assignedTo: null, 
                                      designatedPartnerName: undefined, 
                                      status: '대기중' 
                                    } : null);
                                    alert('배정이 취소되었습니다.');
                                  }
                                  return;
                                }
                                const partner = partners.find(p => p.id === partnerId);
                                if (partner) {
                                  const partnerName = partner.companyName || partner.name || '';
                                  if (confirm(`[${partnerName}] 파트너에게 이 견적을 직접 배정하시겠습니까?`)) {
                                    await handleAssignPartner(selectedQuoteDetail.id, partnerId, partnerName);
                                  }
                                }
                              }}
                              className="text-xs border border-gray-300 bg-white rounded-md px-2 py-1 cursor-pointer outline-none text-gray-800 focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
                            >
                              <option value="">배정 대기중 (선택안함)</option>
                              {partners.filter(p => !p.isB2B && p.status === 'active').map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.companyName || p.name}
                                </option>
                              ))}
                            </select>
                            {selectedQuoteDetail.designatedPartnerName && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold shrink-0">지정됨</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400 font-bold mb-1">고객명</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-gray-800 font-bold">{selectedQuoteDetail.name || selectedQuoteDetail.customerName || '이름 없음'}</p>
                          {selectedQuoteDetail.isB2B && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              [사업자] {selectedQuoteDetail.businessName || ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold mb-1">실제 연락처</p>
                        <p className="text-gray-800 font-bold tracking-wide">{selectedQuoteDetail.realPhone || selectedQuoteDetail.contactInfo || selectedQuoteDetail.phone || '등록 번호 없음'}</p>
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
                        <p className="text-xs text-gray-400 font-bold mb-1">고객 결제 금액</p>
                        <p className="text-rose-600 font-black text-lg">{selectedQuoteDetail.price || '미정'}</p>
                      </div>
                      
                      {/* 파트너 지급액 & 플랫폼 수익 */}
                      {selectedQuoteDetail.price && (() => {
                        const revenue = getPlatformRevenue(selectedQuoteDetail);
                        return (
                          <>
                            <div>
                              <p className="text-xs text-gray-400 font-bold mb-1">파트너 지급액</p>
                              <p className="text-blue-600 font-black text-lg">{revenue.partnerPrice.toLocaleString()}원</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-bold mb-1">플랫폼 수익</p>
                              <p className={`font-black text-lg ${revenue.platformRevenue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {revenue.platformRevenue.toLocaleString()}원
                              </p>
                            </div>
                          </>
                        );
                      })()}
                      
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
                  );
                }
              })()}
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
      {selectedPartnerDetail && (() => {
        const currentPartner = partners.find(p => p.id === selectedPartnerDetail.id) || selectedPartnerDetail;
        return (
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
              
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* 프로필 헤더 - 이미지 + 핵심 정보 */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex-shrink-0">
                    {currentPartner.image ? (
                      <img src={currentPartner.image} alt="업체 이미지" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                        {(currentPartner.companyName || currentPartner.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-black text-slate-900 truncate">{currentPartner.companyName || currentPartner.name || '-'}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentPartner.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        currentPartner.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        currentPartner.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{
                        currentPartner.status === 'active' ? '활동중' :
                        currentPartner.status === 'pending' ? '승인대기' :
                        currentPartner.status === 'suspended' ? '정지' : '미확인'
                      }</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentPartner.plan === 'exclusive' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        currentPartner.plan === 'premium' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>{
                        currentPartner.plan === 'exclusive' ? '👑 지역독점' :
                        currentPartner.plan === 'premium' ? '⭐ 프리미엄' : '일반'
                      }</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {currentPartner.businessType === 'business' ? '💼 사업자 팀' : '👤 개인/프리랜서'}
                      {currentPartner.managerName && currentPartner.businessType === 'business' ? ` · 담당자: ${currentPartner.managerName}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      가입일: {currentPartner.createdAt ? new Date(currentPartner.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {/* 기본 정보 그리드 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-3">📋 기본 정보</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">업체명</p>
                      <p className="text-sm font-bold text-slate-800">{currentPartner.companyName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">담당자/대표</p>
                      <p className="text-sm font-bold text-slate-800">{currentPartner.managerName || currentPartner.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">연락처</p>
                      <p className="text-sm font-bold text-slate-800">{currentPartner.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">팀 규모</p>
                      <p className="text-sm font-bold text-slate-800">{currentPartner.teamSize || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 활동 지역 */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">📍 활동 지역</p>
                  {currentPartner.regions && currentPartner.regions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentPartner.regions.map((r, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-100">{r}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">{currentPartner.region || '-'}</p>
                  )}
                </div>

                {/* 주요 서비스 */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">🛠️ 주요 서비스</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(currentPartner.mainServices) && currentPartner.mainServices.length > 0 ? (
                      currentPartner.mainServices.map((service, index) => (
                        <span key={index} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">{service}</span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">미등록</p>
                    )}
                  </div>
                </div>

                {/* 태그 */}
                {currentPartner.tags && currentPartner.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2">🏷️ 태그</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPartner.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg font-medium">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 업체 소개 */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">📝 업체 소개</p>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {currentPartner.description || <span className="text-slate-400">미등록</span>}
                  </p>
                </div>

                {/* 이달의 행사/이벤트 */}
                {currentPartner.monthlyEvent && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2">🎉 이달의 행사/이벤트</p>
                    <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-100 leading-relaxed">{currentPartner.monthlyEvent}</p>
                  </div>
                )}

                {/* 포트폴리오 (작업 전후 사진) */}
                {currentPartner.portfolio && currentPartner.portfolio.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2">📸 포트폴리오 ({currentPartner.portfolio.length}건)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {currentPartner.portfolio.slice(0, 6).map((item, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                          {item.beforeImage && (
                            <img src={item.beforeImage} alt={`작업전 ${i+1}`} className="w-full h-16 object-cover" />
                          )}
                          {item.afterImage && (
                            <img src={item.afterImage} alt={`작업후 ${i+1}`} className="w-full h-16 object-cover border-t border-slate-100" />
                          )}
                          {item.description && <p className="text-[9px] text-slate-500 p-1 truncate">{item.description}</p>}
                        </div>
                      ))}
                    </div>
                    {currentPartner.portfolio.length > 6 && (
                      <p className="text-[10px] text-slate-400 mt-1 text-center">외 {currentPartner.portfolio.length - 6}건 더 있음</p>
                    )}
                  </div>
                )}

                {/* 정산 계좌 정보 */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 mb-2">🏦 정산 계좌 정보</p>
                  {currentPartner.bankName ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] text-emerald-500">은행</p>
                        <p className="text-sm font-bold text-emerald-800">{currentPartner.bankName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500">계좌번호</p>
                        <p className="text-sm font-bold text-emerald-800">{currentPartner.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500">예금주</p>
                        <p className="text-sm font-bold text-emerald-800">{currentPartner.accountHolder}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-400">미등록</p>
                  )}
                </div>

                {/* 알림 및 설정 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-3">🔔 알림 및 기타 설정</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">오더 알림</p>
                      <p className={`text-sm font-bold ${currentPartner.isNotificationEnabled !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                        {currentPartner.isNotificationEnabled !== false ? '🟢 수신중' : '🔴 꺼짐'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">알림 수신 지역</p>
                      {currentPartner.notificationRegions && currentPartner.notificationRegions.length > 0 ? (
                        <p className="text-xs text-slate-700 font-medium">{currentPartner.notificationRegions.join(', ')}</p>
                      ) : (
                        <p className="text-xs text-slate-400">전체</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">SNS 연동</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {currentPartner.kakaoId && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">카카오</span>}
                        {currentPartner.naverId && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">네이버</span>}
                        {!currentPartner.kakaoId && !currentPartner.naverId && <span className="text-xs text-slate-400">없음</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">비활성 날짜</p>
                      {currentPartner.unavailableDates && currentPartner.unavailableDates.length > 0 ? (
                        <p className="text-xs text-red-500 font-medium">{currentPartner.unavailableDates.length}일 설정됨</p>
                      ) : (
                        <p className="text-xs text-slate-400">없음</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 계약 정보 설정/수정 */}
                {isEditingContract ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-2 animate-in fade-in duration-200">
                    <p className="text-xs font-bold text-blue-700 mb-3">계약 정보 설정/수정</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-600 mb-1">파트너 등급</label>
                        <div className="flex gap-2">
                          {[
                            { key: 'basic', label: '일반' },
                            { key: 'premium', label: '프리미엄' },
                            { key: 'exclusive', label: '지역독점' }
                          ].map(t => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setEditTierPlan(t.key)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                                editTierPlan === t.key
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-600 mb-1">계약 기간 설정</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 3, label: '3개월' },
                            { key: 6, label: '6개월' },
                            { key: 12, label: '1년' },
                            { key: 'unlimited', label: '무제한 (미설정)' }
                          ].map(p => {
                            const isSelected = p.key === 'unlimited'
                              ? editPlan === '무제한' || (!editPlan && !editEndDate)
                              : editPlan === (p.key === 12 ? '1년' : p.key + '개월');
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => setContractPeriod(p.key as any)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border min-w-[70px] ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-blue-600 mb-1">계약 시작일 (선택)</label>
                          <input 
                            type="date"
                            value={editStartDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="text-xs w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-blue-600 mb-1">계약 만료일 (자동계산)</label>
                          <input 
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="text-xs w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setIsEditingContract(false)}
                          className="flex-1 text-xs bg-white text-gray-600 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 font-bold"
                        >
                          취소
                        </button>
                        <button 
                          onClick={() => handleSaveContract(currentPartner.id)}
                          className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg font-bold shadow-sm"
                        >
                          저장하기
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-blue-700">계약 정보</p>
                      <button
                        onClick={() => {
                          setEditPlan(currentPartner.contractPlan || '');
                          setEditStartDate(currentPartner.contractStartDate ? currentPartner.contractStartDate.split('T')[0] : '');
                          setEditEndDate(currentPartner.contractEndDate ? currentPartner.contractEndDate.split('T')[0] : '');
                          setIsEditingContract(true);
                        }}
                        className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded transition-colors"
                      >
                        계약 설정/수정
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-blue-500">플랜</p>
                        <p className="text-sm font-bold text-blue-800">{currentPartner.contractPlan || '미설정'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-500">계약 상태</p>
                        {(() => {
                          const cs = getContractStatus(currentPartner);
                          return (
                            <span className={`px-2 py-1 inline-block mt-1 rounded-full text-xs font-bold border ${
                              cs.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                              cs.color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              cs.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {cs.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div>
                        <p className="text-xs text-blue-500">등록일</p>
                        <p className="text-sm font-bold text-blue-800">
                          {currentPartner.contractStartDate ? new Date(currentPartner.contractStartDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-500">만료일</p>
                        <p className="text-sm font-bold text-blue-800">
                          {currentPartner.contractEndDate ? new Date(currentPartner.contractEndDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                    {getContractStatus(currentPartner).color === 'red' && (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-blue-200">
                        <button onClick={() => { handleExtendContract(currentPartner.id, 3); }} className="flex-1 text-xs bg-white text-blue-600 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 font-bold">+3개월</button>
                        <button onClick={() => { handleExtendContract(currentPartner.id, 6); }} className="flex-1 text-xs bg-white text-blue-600 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 font-bold">+6개월</button>
                        <button onClick={() => { handleExtendContract(currentPartner.id, 12); }} className="flex-1 text-xs bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 font-bold shadow-sm">+1년</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-1">계정 정보</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-gray-400">ID</p>
                      <p className="text-xs font-mono font-bold text-gray-700">{currentPartner.loginId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">PW</p>
                      <p className="text-xs font-mono font-bold text-gray-700">{currentPartner.loginPassword || currentPartner.password || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setSelectedPartnerDetail(null)} className="px-4 py-2 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">닫기</button>
                
                {currentPartner.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        handleDeletePartner(currentPartner.id);
                        setSelectedPartnerDetail(null);
                      }} 
                      className="px-4 py-2 font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 text-sm"
                    >
                      거절 (삭제)
                    </button>
                    <button 
                      onClick={() => {
                        handleApprovePartner(currentPartner.id);
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
        );
      })()}

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
              {/* B2B 의뢰 여부 선택 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOrderType"
                        checked={manualOrderType === 'general'}
                        onChange={() => {
                          setManualOrderType('general');
                          setSelectedB2BPartnerId('');
                          const calculated = calculateEstimatedPrice('일반 청소', newQuoteForm.size, false);
                          setNewQuoteForm(prev => ({
                            ...prev,
                            type: '일반 청소',
                            price: calculated > 0 ? calculated.toLocaleString() + '원' : prev.price
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">일반 고객</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOrderType"
                        checked={manualOrderType === 'interior'}
                        onChange={() => {
                          setManualOrderType('interior');
                          setSelectedB2BPartnerId('');
                          const calculated = calculateEstimatedPrice('프리미엄 청소', newQuoteForm.size, true);
                          setNewQuoteForm(prev => ({
                            ...prev,
                            type: '프리미엄 청소',
                            price: calculated > 0 ? calculated.toLocaleString() + '원' : prev.price
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">인테리어 파트너</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOrderType"
                        checked={manualOrderType === 'realestate'}
                        onChange={() => {
                          setManualOrderType('realestate');
                          setSelectedB2BPartnerId('');
                          const calculated = calculateEstimatedPrice('프리미엄 청소', newQuoteForm.size, true);
                          setNewQuoteForm(prev => ({
                            ...prev,
                            type: '프리미엄 청소',
                            price: calculated > 0 ? calculated.toLocaleString() + '원' : prev.price
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">부동산 파트너</span>
                    </label>
                  </div>
                </div>
                
                {manualOrderType !== 'general' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-bold text-gray-600 mb-1">B2B 파트너사 선택</label>
                    <select
                      value={selectedB2BPartnerId}
                      onChange={(e) => {
                        const partnerId = e.target.value;
                        setSelectedB2BPartnerId(partnerId);
                        const p = partners.find(part => part.id === partnerId);
                        if (p) {
                          setNewQuoteForm(prev => ({
                            ...prev,
                            name: p.companyName || p.name || '',
                            realPhone: p.phone || '',
                          }));
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white text-gray-800"
                    >
                      <option value="">-- B2B 파트너사 선택 (필수) --</option>
                      {partners.filter(p => p.isB2B && p.status === 'active').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.companyName || p.name} ({p.managerName || '담당자 없음'} - {p.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

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
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">서비스 종류</label>
                  <select 
                    value={newQuoteForm.type}
                    disabled={manualOrderType !== 'general'}
                    onChange={e => {
                      const nextType = e.target.value;
                      const calculated = calculateEstimatedPrice(nextType, newQuoteForm.size);
                      setNewQuoteForm({
                        ...newQuoteForm,
                        type: nextType,
                        price: calculated > 0 ? calculated.toLocaleString() + '원' : newQuoteForm.price
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
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
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">상세 구조 (선택)</label>
                  <select 
                    value={newQuoteForm.houseSubType}
                    onChange={e => setNewQuoteForm({...newQuoteForm, houseSubType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white text-gray-800"
                  >
                    <option value="">구조 선택 안함</option>
                    <option value="원룸">원룸</option>
                    <option value="분리형 원룸">분리형 원룸</option>
                    <option value="투룸">투룸</option>
                    <option value="쓰리룸 이상">쓰리룸 이상</option>
                    <option value="복층">복층</option>
                    <option value="기타">기타</option>
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
                    onChange={e => {
                      const nextSize = e.target.value;
                      const calculated = calculateEstimatedPrice(newQuoteForm.type, nextSize);
                      setNewQuoteForm({
                        ...newQuoteForm,
                        size: nextSize,
                        price: calculated > 0 ? calculated.toLocaleString() + '원' : newQuoteForm.price
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    placeholder="예: 32"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-600">수동 견적 금액</label>
                    {calculateEstimatedPrice(newQuoteForm.type, newQuoteForm.size) > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const autoPrice = calculateEstimatedPrice(newQuoteForm.type, newQuoteForm.size);
                          setNewQuoteForm(prev => ({ ...prev, price: autoPrice.toLocaleString() + '원' }));
                        }}
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-extrabold px-1.5 py-0.5 rounded border border-blue-200 transition-colors"
                      >
                        ⚡ 자동 계산 가격 적용
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={newQuoteForm.price}
                    onChange={e => setNewQuoteForm({...newQuoteForm, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    placeholder="예: 350,000원"
                  />
                  {calculateEstimatedPrice(newQuoteForm.type, newQuoteForm.size) > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      💡 마법사 권장가: <span className="text-blue-600 font-bold">{calculateEstimatedPrice(newQuoteForm.type, newQuoteForm.size).toLocaleString()}원</span> (총 결제 금액)
                    </p>
                  )}
                </div>
              </div>

              {/* 견적 계산 마법사 영역 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteWizardOpen(!isQuoteWizardOpen)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🧙‍♂️ 견적 계산 마법사</span>
                  <span>{isQuoteWizardOpen ? '접기 ▲' : '열기 ▼'}</span>
                </button>
                
                {isQuoteWizardOpen && (() => {
                  const calcs = getWizardCalculations();
                  return (
                    <div className="mt-3 bg-purple-50/50 border border-purple-200/80 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-800">
                      <div>
                        <h4 className="text-xs font-black text-purple-900 border-b border-purple-200/60 pb-1.5 mb-2.5">
                          1. 추가 청소 옵션
                        </h4>
                        <div className="space-y-3">
                          {/* 맞춤 청소 */}
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={wizardOptions.phytoncide > 0}
                                onChange={(e) => setWizardOptions(prev => ({ ...prev, phytoncide: e.target.checked ? 1 : 0 }))}
                                className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                              />
                              <span>피톤치드 연무 (+평당 1k)</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={wizardOptions.veranda > 0}
                                onChange={(e) => setWizardOptions(prev => ({ ...prev, veranda: e.target.checked ? 1 : 0 }))}
                                className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                              />
                              <span>비확장 거실베란다 (+40k)</span>
                            </label>
                          </div>
                          
                          {/* 가전 내부 청소 */}
                          <div>
                            <p className="text-[10px] font-black text-purple-700/80 mb-1.5">가전 내부 청소 (개당 +30,000원)</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'refrigerator', name: '냉장고' },
                                { id: 'washer', name: '세탁기' },
                                { id: 'ac', name: '에어컨' },
                                { id: 'dishwasher', name: '식기세척기' },
                                { id: 'oven', name: '오븐' },
                              ].map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-white border border-purple-100 rounded-lg px-2.5 py-1">
                                  <span className="text-xs font-medium">{item.name}</span>
                                  <div className="flex items-center gap-2 select-none">
                                    <button
                                      type="button"
                                      onClick={() => setWizardOptions(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 font-black rounded text-xs flex items-center justify-center"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{wizardOptions[item.id] || 0}</span>
                                    <button
                                      type="button"
                                      onClick={() => setWizardOptions(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 font-black rounded text-xs flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* 특수 오염 제거 */}
                          <div>
                            <p className="text-[10px] font-black text-purple-700/80 mb-1.5">특수 오염 제거 (개당 +40,000원)</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'mold', name: '곰팡이 제거' },
                                { id: 'sticker', name: '스티커 제거' },
                                { id: 'insulation', name: '단열 뽁뽁이 제거' },
                              ].map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-white border border-purple-100 rounded-lg px-2.5 py-1">
                                  <span className="text-xs font-medium">{item.name}</span>
                                  <div className="flex items-center gap-2 select-none">
                                    <button
                                      type="button"
                                      onClick={() => setWizardOptions(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 font-black rounded text-xs flex items-center justify-center"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{wizardOptions[item.id] || 0}</span>
                                    <button
                                      type="button"
                                      onClick={() => setWizardOptions(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                      className="w-5 h-5 bg-slate-100 hover:bg-slate-200 font-black rounded text-xs flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-purple-900 border-b border-purple-200/60 pb-1.5 mb-2.5">
                          2. 현장 할증 및 할인
                        </h4>
                        <div className="space-y-3">
                          {/* 오염도 및 엘리베이터 */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] font-black text-purple-700/80 mb-1">현장 오염도 할증</p>
                              <div className="flex gap-2 mt-1">
                                {[
                                  { value: 'normal', label: '보통(0%)' },
                                  { value: 'high', label: '심함(10%)' },
                                  { value: 'severe', label: '매우(30%)' },
                                ].map(opt => (
                                  <label key={opt.value} className="flex items-center gap-1 cursor-pointer font-semibold select-none">
                                    <input
                                      type="radio"
                                      name="wizardContamination"
                                      value={opt.value}
                                      checked={contaminationLevel === opt.value}
                                      onChange={() => setContaminationLevel(opt.value as any)}
                                      className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-black text-purple-700/80 mb-1">승강기 없는 고층</p>
                              <label className="flex items-center gap-2 cursor-pointer font-semibold mt-1.5 select-none">
                                <input
                                  type="checkbox"
                                  checked={hasNoElevatorSurcharge}
                                  onChange={(e) => setHasNoElevatorSurcharge(e.target.checked)}
                                  className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                />
                                <span>엘리베이터 없는 4층 이상 (+30k)</span>
                              </label>
                            </div>
                          </div>
                          
                          {/* 직접 조정 금액 */}
                          <div>
                            <label className="block text-[10px] font-black text-purple-700/80 mb-1">
                              직접 할인 / 단가 조정액 (-원)
                            </label>
                            <input
                              type="number"
                              value={customDiscount}
                              onChange={(e) => setCustomDiscount(e.target.value)}
                              placeholder="예: 20000 (할인할 금액 입력)"
                              className="w-full border border-purple-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-purple-500 text-gray-800 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 실시간 계산서 영수증 */}
                      <div className="bg-white border border-purple-200 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between font-semibold text-slate-600">
                          <span>기본 청소비 ({newQuoteForm.size ? `${newQuoteForm.size}평` : '평수 미입력'})</span>
                          <span>{calcs.baseCleanPrice.toLocaleString()}원</span>
                        </div>
                        {calcs.optionsTotal > 0 && (
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>추가 옵션 합계</span>
                            <span className="text-purple-600">+{calcs.optionsTotal.toLocaleString()}원</span>
                          </div>
                        )}
                        {calcs.contaminationSurcharge > 0 && (
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>오염도 할증 (+{calcs.contaminationRate}%)</span>
                            <span className="text-rose-600">+{calcs.contaminationSurcharge.toLocaleString()}원</span>
                          </div>
                        )}
                        {calcs.elevatorSurcharge > 0 && (
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>엘리베이터 무 고층 할증</span>
                            <span className="text-rose-600">+{calcs.elevatorSurcharge.toLocaleString()}원</span>
                          </div>
                        )}
                        {calcs.discountVal > 0 && (
                          <div className="flex justify-between font-semibold text-slate-600">
                            <span>임의 추가 할인</span>
                            <span className="text-blue-600">-{calcs.discountVal.toLocaleString()}원</span>
                          </div>
                        )}
                        
                        <div className="border-t border-dashed border-slate-200 my-2 pt-2 flex flex-col gap-1 text-sm font-black text-slate-900">
                          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
                            <span>총 견적 금액</span>
                            <span>{calcs.grandTotal.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-500 text-xs font-semibold">
                            <span>계약금 입금액</span>
                            <span>-50,000원</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span>현장 결제 잔금 (파트너 정산액)</span>
                            <span className="text-purple-700 text-base">{Math.max(calcs.grandTotal - 50000, 0).toLocaleString()}원</span>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (!newQuoteForm.size) {
                              alert("평수를 먼저 입력해야 견적이 정상 계산됩니다.");
                              return;
                            }
                            
                            // 1. 가격 입력
                            setNewQuoteForm(prev => ({
                              ...prev,
                              price: calcs.grandTotal.toLocaleString() + '원'
                            }));
                            
                            // 2. 특이사항(메모)에 상세 내역 덧붙이기
                            let wizardSummary = `[견적 마법사 자동 산출 내역]\n`;
                            wizardSummary += `- 기본 청소비: ${calcs.baseCleanPrice.toLocaleString()}원 (${newQuoteForm.size}평)\n`;
                            if (calcs.selectedOptLabels.length > 0) {
                              wizardSummary += `- 선택 옵션:\n  * ${calcs.selectedOptLabels.join('\n  * ')}\n`;
                            }
                            if (calcs.contaminationSurcharge > 0) {
                              wizardSummary += `- 할증: 오염도 ${contaminationLevel === 'high' ? '심함(+10%)' : '매우 심함(+30%)'} (+${calcs.contaminationSurcharge.toLocaleString()}원)\n`;
                            }
                            if (calcs.elevatorSurcharge > 0) {
                              wizardSummary += `- 할증: 엘리베이터 없는 고층 (+30,000원)\n`;
                            }
                            if (calcs.discountVal > 0) {
                              wizardSummary += `- 할인: 특별 할인 조정 (-${calcs.discountVal.toLocaleString()}원)\n`;
                            }
                            wizardSummary += `- 총 견적 금액: ${calcs.grandTotal.toLocaleString()}원\n`;
                            wizardSummary += `- 계약금 입금: 50,000원\n`;
                            wizardSummary += `- 현장 결제 잔금(파트너 정산액): ${Math.max(calcs.grandTotal - 50000, 0).toLocaleString()}원\n`;
                            wizardSummary += `--------------------------------------\n`;
                            
                            setNewQuoteForm(prev => ({
                              ...prev,
                              detail: prev.detail ? wizardSummary + prev.detail : wizardSummary
                            }));
                            
                            // 3. Firestore options에 저장할 옵션 텍스트들 매핑
                            const finalOptions = calcs.selectedOptLabels.map(label => label.split(' (')[0]);
                            if (contaminationLevel !== 'normal') {
                              finalOptions.push(`오염도 ${contaminationLevel === 'high' ? '심함' : '매우 심함'}`);
                            }
                            if (hasNoElevatorSurcharge) {
                              finalOptions.push(`엘리베이터 없음 (고층)`);
                            }
                            setSelectedWizardOptions(finalOptions);
                            
                            alert("마법사 견적가와 산출 내역이 입력 폼에 적용되었습니다.");
                          }}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg text-xs shadow transition-all mt-1 active:scale-[0.98]"
                        >
                          ⚡ 마법사 가격 및 상세 내역 폼에 적용하기
                        </button>
                      </div>
                    </div>
                  );
                })()}
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

      {/* CRM: Bulk Message Floating Bar */}
      {activeTab === 'customers' && selectedCustomerPhones.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{selectedCustomerPhones.length}명</span>
            <span className="font-bold text-sm">고객 선택됨</span>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
            <button 
              onClick={() => setIsBulkMessageModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm px-5 py-2 rounded-full transition-colors flex items-center gap-2"
            >
              <MessageSquare size={16} /> 알림톡/문자 발송
            </button>
            <button 
              onClick={() => setSelectedCustomerPhones([])}
              className="text-slate-400 hover:text-white text-sm font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* CRM: Customer Note Modal */}
      {isCustomerNoteModalOpen && selectedCustomerForNote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <UserCheck size={20} className="text-purple-600" />
                고객 특이사항 관리
              </h3>
              <button onClick={() => setIsCustomerNoteModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="bg-purple-50 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-purple-900">{selectedCustomerForNote.name} <span className="text-xs font-normal text-purple-700 ml-1">{selectedCustomerForNote.phone}</span></p>
                  <p className="text-xs text-purple-600 mt-0.5">총 결제: ₩{(selectedCustomerForNote.totalSpent || 0).toLocaleString()} (시공 {selectedCustomerForNote.completedCount}회)</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    checked={selectedCustomerForNote.isBlacklist || false}
                    onChange={(e) => setSelectedCustomerForNote({...selectedCustomerForNote, isBlacklist: e.target.checked})}
                  />
                  <span className="font-bold text-red-600 text-sm">요주의 고객 (블랙리스트) 설정</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">메모 (현장 특이점, 고객 성향 등)</label>
                <textarea 
                  value={selectedCustomerForNote.note || ''}
                  onChange={(e) => setSelectedCustomerForNote({...selectedCustomerForNote, note: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-purple-500 outline-none min-h-[120px] resize-none"
                  placeholder="예: 주차 불가능, 추가금 요구에 예민함, VIP 우대 필요 등"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsCustomerNoteModalOpen(false)} className="px-5 py-2.5 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">닫기</button>
              <button 
                onClick={handleSaveCustomerNote}
                className="px-6 py-2.5 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-md text-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRM: Bulk Message Modal */}
      {isBulkMessageModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-purple-50">
              <h3 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                <MessageSquare size={20} className="text-purple-600" />
                알림톡/문자 단체 발송 (Mock)
              </h3>
              <button onClick={() => setIsBulkMessageModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm font-bold text-gray-700 mb-1">발송 대상</p>
                <p className="text-xs text-gray-500">선택된 {selectedCustomerPhones.length}명의 고객에게 일괄 발송됩니다.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">메시지 내용</label>
                <textarea 
                  value={bulkMessageText}
                  onChange={(e) => setBulkMessageText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-purple-500 outline-none min-h-[150px] resize-none"
                  placeholder="예: [청소타워] 여름맞이 에어컨 청소 사전예약 할인 이벤트! ..."
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{bulkMessageText.length} 자</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsBulkMessageModalOpen(false)} className="px-5 py-2.5 font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">취소</button>
              <button 
                onClick={handleBulkMessageSubmit}
                className="px-6 py-2.5 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-md text-sm flex items-center gap-2"
              >
                발송하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
