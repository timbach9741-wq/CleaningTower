import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, CheckCircle, AlertTriangle, Phone, Home, List, User, Briefcase, Info, Bell, CalendarCheck, Sparkles } from 'lucide-react';
import { db, storage, getMessagingInstance } from '../firebase';
import PartnerGuideModal from '../components/common/PartnerGuideModal';
import { getToken } from 'firebase/messaging';
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate, useLocation } from 'react-router-dom';
import { REGION_DATA } from '../data/regions';

type RegionData = { [key: string]: string[] };
const regionsData = REGION_DATA as RegionData;

import RegionSelector from '../components/common/RegionSelector';
import { loginWithKakao, loginWithNaver } from '../utils/snsLogin';
import type { SnsProfile } from '../utils/snsLogin';

const DEFAULT_IMAGES = [
  '/images/korean_cleaner_livingroom.webp',
  '/images/korean_cleaner_bathroom.webp',
  '/images/korean_cleaner_kitchen.webp',
  '/images/korean_cleaning_team.webp'
];

const getDeterministicDefaultImage = (docId: string | undefined) => {
  if (!docId) return DEFAULT_IMAGES[0];
  let sum = 0;
  for (let i = 0; i < docId.length; i++) {
    sum += docId.charCodeAt(i);
  }
  return DEFAULT_IMAGES[sum % DEFAULT_IMAGES.length];
};

export interface Order {
  id: string;
  type?: string;
  date?: string;
  time?: string;
  location?: string;
  address?: string;
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
  contactInfo?: string;      // ★ Quote에서 저장하는 연락처 필드
  phone?: string;            // ★ 연락처 폴백 필드
  detail?: string;
  memo?: string;             // ★ Quote에서 저장하는 메모 원본 필드
  completedAt?: string;
  completionItems?: string[];
  completionNote?: string;
  cancelPenalty?: string;
  price?: string;
  cleaningType?: string;     // ★ Quote 원본 필드
  cleaningDate?: string;     // ★ Quote 원본 필드
  cleaningTime?: string;     // ★ Quote 원본 필드
  houseType?: string;        // ★ Quote 원본 필드
  houseSubType?: string;     // ★ Quote 원본 필드
  designatedPartnerName?: string;
  totalPrice?: number;
  finalPrice?: number;
  couponApplied?: boolean;
  referralApplied?: boolean;
  createdAt?: string;
  [key: string]: unknown;    // ★ Firestore에서 오는 추가 필드 허용
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
  fcmTokens?: string[];
  notificationRegions?: string[];
  monthlyEvent?: string;
  portfolio?: any[];
  recentReviews?: { id: number, author: string, text: string, rating: number, date: string }[];
  description?: string;
  teamSize?: string;
  mainServices?: string[];
  tags?: string[];
  image?: string;
  regions?: string[];
  dailyUploadCount?: number;
  lastUploadDate?: string;
  unavailableDates?: string[];
  password?: string;
  loginPassword?: string;
  loginId?: string;
  acceptCoupons?: boolean;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  plan?: string;
  createdAt?: string;
}

export default function Partner() {
  const [activeTab, setActiveTab] = useState<'new' | 'my' | 'profile' | 'calendar'>('new');
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
  // ★ partnerId를 상태로 관리하여, 로그인 시 onSnapshot 리스너가 자동으로 재부착되도록 함
  const [partnerId, setPartnerId] = useState<string | null>(localStorage.getItem('partnerId'));
  const [showLanding, setShowLanding] = useState(!localStorage.getItem('partnerId'));
  const [notiRegions, setNotiRegions] = useState<string[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // 홍보 정보 수정 모달 상태
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editProfileForm, setEditProfileForm] = useState({
    companyName: '',
    managerName: '',
    region: '',
    regions: [] as string[],
    monthlyEvent: '',
    portfolio: [] as any[],
    description: '',
    teamSize: '',
    mainServices: [] as string[],
    tags: [] as string[],
    image: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    acceptCoupons: false
  });
  const [customService, setCustomService] = useState('');
  const serviceExamples = ['입주청소', '거주청소', '상가청소', '쓰레기집', '에어컨청소', '새집증후군', '줄눈시공'];
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(location.state?.showLogin || false);
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [guideDevice, setGuideDevice] = useState<'ios' | 'android'>('android');


  // 비밀번호 변경 모달 상태
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // PWA 설치 관련 상태
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // 소셜 로그인 관련 상태
  const [showSnsLinkModal, setShowSnsLinkModal] = useState(false);
  const [snsProfileToLink, setSnsProfileToLink] = useState<SnsProfile | null>(null);
  const [existingPartnerToLink, setExistingPartnerToLink] = useState<PartnerUser | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // 전역 변수에 이미 캡처된 이벤트가 있는지 확인
    const globalPrompt = (window as any).deferredPrompt;
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
      setIsInstallable(true);
    }

    // 커스텀 이벤트 리스너 등록 (index.html에서 발생)
    window.addEventListener('pwa-prompt-ready', () => {
      const gPrompt = (window as any).deferredPrompt;
      if (gPrompt) {
        setDeferredPrompt(gPrompt);
        setIsInstallable(true);
      }
    });

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-prompt-ready', () => {});
    };
  }, []);

  const handleInstallApp = async () => {
    // 1. 이미 앱 브라우저(카카오, 네이버)인 경우
    const isKakao = /KAKAOTALK/i.test(navigator.userAgent);
    const isNaver = /NAVER/i.test(navigator.userAgent);
    const isInAppBrowser = isKakao || isNaver;

    if (isInAppBrowser) {
      alert('카카오톡/네이버 브라우저에서는 앱 설치가 지원되지 않습니다.\n우측 하단(또는 상단)의 [점 3개] 메뉴를 눌러\n[다른 브라우저로 열기]를 선택하신 후 진행해주세요.');
      return;
    }

    // 2. 안드로이드 크롬 등에서 정상적으로 이벤트가 캡처된 경우
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
      return;
    }
    
    // 3. 이벤트가 캡처되지 않았지만 설치를 시도하는 경우 (iOS 사파리 등)
    alert('Safari: 하단 공유 버튼(네모 안 화살표) 탭 -> "홈 화면에 추가"\nChrome: 우측 상단 메뉴 버튼(점 3개) 탭 -> "홈 화면에 추가"\n(또는 이미 설치된 앱일 수 있습니다)');
  };

  const requestNotificationPermission = async () => {
    // ★ 방어 코드 1: Notification API 자체가 없는 환경 (카카오톡 인앱, 일부 모바일 웹뷰 등)
    if (typeof Notification === 'undefined') {
      alert('현재 브라우저 환경에서는 푸시 알림을 지원하지 않습니다.\n크롬(Chrome) 또는 삼성 인터넷 브라우저에서 접속해주세요.');
      return;
    }

    // ★ 방어 코드 2: 알림 권한 요청 시도
    let permission = 'default';
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.warn('Notification.requestPermission() failed:', e);
      // 일부 브라우저에서 requestPermission 자체가 에러 — 조용히 설정만 저장
      if (currentUser && db) {
        try {
          await updateDoc(doc(db, 'partners', currentUser.id), { isNotificationEnabled: true });
        } catch (_) { /* ignore */ }
      }
      alert('이 브라우저에서는 푸시 알림 권한을 요청할 수 없습니다.\n크롬(Chrome) 브라우저에서 다시 시도해주세요.');
      return;
    }

    if (permission !== 'granted') {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해주세요.');
      return;
    }

    // ★ 권한 승인됨 → FCM 토큰 발급 시도 (실패해도 알림 설정은 저장)
    let currentToken = '';
    try {
      const messaging = await getMessagingInstance();
      if (messaging && 'serviceWorker' in navigator) {
        const VAPID_KEY = 'BKbWKFBpXccjAXlskLV4VmXNG55f3fsywzuo2enZDr2huMcJmnyyvHP_0VVsEdDdH50ZuYVd2F-apJOJYpobwtQ';
        const swRegistration = await navigator.serviceWorker.ready;
        currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration
        });
      }
    } catch (e) {
      console.warn('FCM token acquisition failed (non-critical):', e);
      // FCM 토큰 발급 실패는 치명적이지 않음 — 알림 설정만 저장 진행
    }

    // ★ Firestore에 알림 설정 저장 (토큰 유무와 무관하게)
    if (currentUser && db) {
      try {
        await updateDoc(doc(db, 'partners', currentUser.id), {
          isNotificationEnabled: true,
          ...(currentToken ? { fcmTokens: [currentToken] } : {})
        });
        if (currentToken) {
          alert('알림 설정이 켜졌습니다. 백그라운드에서도 새 오더 알림을 받을 수 있습니다!');
        } else {
          alert('알림 설정이 저장되었습니다.\n(일부 브라우저에서는 백그라운드 푸시가 제한될 수 있습니다.)');
        }
      } catch (e) {
        console.error('Firestore update failed:', e);
        alert('알림 설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };


  const isInitialQuotesLoad = React.useRef(true);

  // ★ [리스너 1] Quotes(견적) 컬렉션 실시간 감지 — 페이지 최초 로드 시 1회만 부착
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(data);

      if (!isInitialQuotesLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newQuote = change.doc.data();
            const loggedInId = localStorage.getItem('partnerId');
            if (newQuote.status === '대기중' && (!newQuote.assignedTo || newQuote.assignedTo === loggedInId)) {
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                const partnerName = newQuote.designatedPartnerName ? `[지정예약] ` : '';
                const title = '새로운 청소 오더 도착!';
                const options = {
                  body: `${partnerName}새로운 오더가 접수되었습니다. 대시보드를 확인해주세요.`,
                  icon: '/logo192.png'
                };
                try {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.showNotification(title, options);
                    }).catch(() => {
                      new Notification(title, options);
                    });
                  } else {
                    new Notification(title, options);
                  }
                } catch (e) {
                  console.error('Notification failed:', e);
                }
              }
            }
          }
        });
      } else {
        isInitialQuotesLoad.current = false;
      }
    });
    return () => unsubscribe();
  }, []);

  // ★ [리스너 2] 파트너 문서 실시간 감지 — partnerId가 바뀔 때마다 리스너 재부착
  // 왜 분리했나: 로그인 전에는 partnerId가 null이라 리스너가 안 붙고,
  // 로그인 성공 시 setPartnerId()가 호출되면 이 useEffect가 다시 실행되어
  // 해당 파트너 문서의 status 변화(pending → active)를 실시간으로 감지합니다.
  useEffect(() => {
    if (!db) {
      setTimeout(() => setIsLoading(false), 0);
      return;
    }
    if (partnerId) {
      const unsubscribeUser = onSnapshot(doc(db, 'partners', partnerId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = { id: docSnapshot.id, ...docSnapshot.data() } as PartnerUser;
          setCurrentUser(userData);
          setNotiRegions(userData.notificationRegions || []);
        } else {
          // 문서가 없으면 로그아웃 처리
          localStorage.removeItem('partnerId');
          setPartnerId(null);
          setShowLanding(true);
          setShowLogin(true);
        }
        setIsLoading(false);
      });
      return () => unsubscribeUser();
    } else {
      setTimeout(() => setIsLoading(false), 0);
    }
  }, [partnerId]);



  // 내 일정: 날짜 오름차순(가까운 날짜부터), '상담완료' 상태인 오더만
  const myJobs = [...quotes]
    .filter(o => !o.isB2B && o.assignedTo === currentUser?.id && o.status === '상담완료')
    .sort((a, b) => {
      const dateA = a.date || a.cleaningDate || '';
      const dateB = b.date || b.cleaningDate || '';
      
      if (dateA !== dateB) {
        const timeA = typeof dateA === 'object' && typeof (dateA as any).toMillis === 'function' ? (dateA as any).toMillis() : new Date(dateA || 0).getTime();
        const timeB = typeof dateB === 'object' && typeof (dateB as any).toMillis === 'function' ? (dateB as any).toMillis() : new Date(dateB || 0).getTime();
        return timeA - timeB;
      }
      
      const createdA = a.createdAt;
      const createdB = b.createdAt;
      const timeA = createdA && typeof (createdA as any).toMillis === 'function' ? (createdA as any).toMillis() : new Date(createdA || 0).getTime();
      const timeB = createdB && typeof (createdB as any).toMillis === 'function' ? (createdB as any).toMillis() : new Date(createdB || 0).getTime();
      return timeB - timeA;
    });
    
  // 대기중인 오더: 긴급 오더 최우선, 그 다음 최신 생성일 순
  const remainingOrders = [...quotes]
    .filter(o => {
      if (o.isB2B || o.status !== '대기중' && o.status !== 'pending') return false;
      if (o.assignedTo && o.assignedTo !== currentUser?.id) return false;
      if (o.cleaningType === '정기' || o.cleaningType === '가전') return false;
      // 쿠폰 오더 필터링 (미동의 파트너에게는 숨김)
      if (!currentUser?.acceptCoupons && (o.couponApplied || o.referralApplied)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      const createdA = a.createdAt;
      const createdB = b.createdAt;
      const timeA = createdA && typeof (createdA as any).toMillis === 'function' ? (createdA as any).toMillis() : new Date(createdA || 0).getTime();
      const timeB = createdB && typeof (createdB as any).toMillis === 'function' ? (createdB as any).toMillis() : new Date(createdB || 0).getTime();
      return timeB - timeA;
    });

  // 페널티 정책 함수 (보증금 제도 폐지로 문구 수정)
  const getPenaltyInfo = () => {
    return { penalty: 0, penaltyText: '영구 제명 및 오더 배정 중단', title: '취소 시 계정 정지 안내' };
  };

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
      
      // 고객에게 리뷰 작성 요청 알림톡 발송 트리거 (현재는 Mock 처리)
      const reviewUrl = `${window.location.origin}/review-write/${jobToComplete.id}`;
      console.log(`[알림톡 발송 모의] 수신번호: ${jobToComplete.realPhone || '없음'}, 내용: 청소가 완료되었습니다! 리뷰를 남겨주세요. ${reviewUrl}`);
      
      alert(`작업 완료 및 정산 요청이 접수되었습니다.\n고객님께 리뷰 작성 요청 알림톡이 자동 발송되었습니다.`);
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
    
    // 신규 버전 (현장 결제 예상 잔금이 finalPrice에 저장됨)
    if (order.finalPrice !== undefined) {
      return order.finalPrice.toLocaleString();
    }

    // 구버전 호환: 견적 마법사에서 넘어온 총 결제 금액(부가세 포함)을 기반으로 계산
    if (order.price) {
      const numericPrice = parseInt(order.price.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(numericPrice)) {
        const supplyPrice = Math.round(numericPrice / 1.1);
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

  // ★ 정산 내역: 실제 완료된 오더 기반으로 계산
  // '작업완료' 상태이고, 현재 파트너에게 배정된 오더만 정산 내역으로 표시
  const settlements = quotes
    .filter(q => !q.isB2B && q.assignedTo === currentUser?.id && q.status === '작업완료')
    .map((q, idx) => ({
      id: q.id || idx,
      date: q.completedAt || q.date || q.cleaningDate || '-',
      location: q.location || q.address || '주소 미상',
      settledAmount: parseInt(String(getPartnerPrice(q)).replace(/[^0-9]/g, '')) || 0,
      status: q.settlementStatus || '정산 대기',
    }))
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

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
    const newStatus = !currentStatus;
    let updateData: any = { isNotificationEnabled: newStatus };
    
    if (newStatus) {
      // ★ 방어 코드: Notification API 미지원 브라우저 예외 처리
      if (typeof Notification === 'undefined') {
        alert('현재 브라우저 환경에서는 푸시 알림을 지원하지 않습니다.\n크롬(Chrome) 또는 삼성 인터넷 브라우저에서 접속해주세요.');
        return;
      }
      // ★ 알림을 켤 때: 브라우저 권한이 없으면 먼저 요청
      let permission = 'default';
      try {
        permission = Notification.permission;
        if (permission !== 'granted') {
          permission = await Notification.requestPermission();
        }
      } catch (e) {
        console.warn('Notification permission request failed:', e);
        // 권한 요청 실패해도 설정은 저장 진행
      }
      
      if (permission === 'granted') {
        try {
          const messaging = await getMessagingInstance();
          if (messaging && 'serviceWorker' in navigator) {
            const VAPID_KEY = 'BKbWKFBpXccjAXlskLV4VmXNG55f3fsywzuo2enZDr2huMcJmnyyvHP_0VVsEdDdH50ZuYVd2F-apJOJYpobwtQ';
            const swRegistration = await navigator.serviceWorker.ready;
            const currentToken = await getToken(messaging, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: swRegistration
            });
            if (currentToken) {
              updateData.fcmTokens = [currentToken];
            }
          }
        } catch (e) {
          console.warn('FCM token error (non-critical):', e);
        }
      } else if (permission === 'denied') {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해주세요.');
        return;
      }
    }

    try {
      await updateDoc(doc(db, 'partners', currentUser.id), updateData);
    } catch (e) {
      console.error('Firestore update failed:', e);
      alert('설정 변경 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };


  const handleSaveRegions = async (regionsArray: string[]) => {
    if (!db || !currentUser) return;
    try {
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
        // ★ 동일 loginId 중복 방지: 같은 아이디/비번으로 여러 문서가 존재할 수 있으므로
        // 가장 최근에 생성된 문서를 기준으로 로그인 처리 (createdAt 내림차순)
        const sortedDocs = [...querySnapshot.docs].sort((a, b) => {
          const createdA = a.data().createdAt;
          const createdB = b.data().createdAt;
          const timeA = createdA && typeof createdA.toMillis === 'function' ? createdA.toMillis() : new Date(createdA || 0).getTime();
          const timeB = createdB && typeof createdB.toMillis === 'function' ? createdB.toMillis() : new Date(createdB || 0).getTime();
          return timeB - timeA;
        });
        const partnerDoc = sortedDocs[0];
        localStorage.setItem('partnerId', partnerDoc.id);
        // ★ partnerId 상태를 업데이트하여 onSnapshot 리스너가 자동 부착되도록 트리거
        setPartnerId(partnerDoc.id);
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

  const handleSnsLoginSuccess = async (profile: SnsProfile) => {
    if (!db) return;
    setIsLoading(true);
    try {
      const fieldName = profile.provider === 'kakao' ? 'kakaoId' : 'naverId';
      const q = query(collection(db, 'partners'), where(fieldName, '==', profile.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 이미 연동된 계정이 있음 -> 즉시 로그인
        const partnerDoc = querySnapshot.docs[0];
        localStorage.setItem('partnerId', partnerDoc.id);
        setPartnerId(partnerDoc.id);
        setCurrentUser({ id: partnerDoc.id, ...partnerDoc.data() });
        setShowLogin(false);
        setShowLanding(false);
        alert(`${profile.name} 파트너님, 반갑습니다!`);
      } else {
        // 연동된 계정이 없음 -> 휴대폰 번호 매핑 시도
        if (profile.phone) {
          const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
          const qPhone = query(collection(db, 'partners'), where('loginId', '==', cleanPhone));
          const phoneSnapshot = await getDocs(qPhone);

          if (!phoneSnapshot.empty) {
            // 동일 번호 기존 계정 발견 -> 연동 제안 모달 노출
            const existingDoc = phoneSnapshot.docs[0];
            setExistingPartnerToLink({ id: existingDoc.id, ...existingDoc.data() });
            setSnsProfileToLink(profile);
            setShowSnsLinkModal(true);
            return;
          }
        }
        
        // 연동 가능한 기존 계정도 없음 -> 신규 회원 가입 유도
        alert('연동된 파트너 계정이 없습니다. 회원가입 페이지로 이동하여 신규 가입을 완료해주세요.');
        navigate('/partners/register', {
          state: {
            plan: 'basic',
            snsProfile: profile
          }
        });
      }
    } catch (error) {
      console.error('Sns login handling error:', error);
      alert('소셜 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkSnsAccount = async () => {
    if (!db || !snsProfileToLink || !existingPartnerToLink) return;
    setIsLoading(true);
    try {
      const fieldName = snsProfileToLink.provider === 'kakao' ? 'kakaoId' : 'naverId';
      await updateDoc(doc(db, 'partners', existingPartnerToLink.id), {
        [fieldName]: snsProfileToLink.id
      });

      // 연동 성공 후 로그인 처리
      localStorage.setItem('partnerId', existingPartnerToLink.id);
      setPartnerId(existingPartnerToLink.id);
      setCurrentUser({
        ...existingPartnerToLink,
        [fieldName]: snsProfileToLink.id
      });
      setShowSnsLinkModal(false);
      setShowLogin(false);
      setShowLanding(false);
      setSnsProfileToLink(null);
      setExistingPartnerToLink(null);
      alert('소셜 계정 연동 및 로그인이 완료되었습니다!');
    } catch (error) {
      console.error('Failed to link SNS account:', error);
      alert('계정 연동 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLoginClick = async () => {
    setIsLoading(true);
    try {
      const res = await loginWithKakao();
      if (res.success && res.profile) {
        await handleSnsLoginSuccess(res.profile);
      } else {
        alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLoginClick = async () => {
    setIsLoading(true);
    try {
      const res = await loginWithNaver();
      if (res.success && res.profile) {
        await handleSnsLoginSuccess(res.profile);
      } else {
        alert('네이버 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('partnerId');
    // ★ partnerId 상태를 null로 변경하여 기존 onSnapshot 리스너가 정리(cleanup)되도록 함
    setPartnerId(null);
    setCurrentUser(null);
    setShowLanding(true);
    setShowLogin(true); // 바로 로그인 화면을 띄워줌
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    
    setPasswordError('');
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    // 1. 현재 비밀번호 검증
    if (currentPassword !== currentUser.password) {
      setPasswordError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    // 2. 새 비밀번호 유효성 검증
    if (newPassword.length < 4) {
      setPasswordError('새 비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    // 3. 새 비밀번호 일치 검증
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    // 4. 현재 비밀번호와 동일한지 확인
    if (currentPassword === newPassword) {
      setPasswordError('새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateDoc(doc(db, 'partners', currentUser.id), {
        password: newPassword,
        loginPassword: newPassword // 어드민 대시보드 호환용
      });
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPasswordError('비밀번호 변경 처리 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 청소 가능일 달력 상태 및 로직
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const handleToggleAvailableDate = async (dateStr: string) => {
    if (!db || !currentUser) {
      console.warn('handleToggleAvailableDate: db or currentUser missing', { db: !!db, currentUser: !!currentUser });
      return;
    }
    
    const currentDates = currentUser.unavailableDates || [];
    let updatedDates: string[] = [];
    
    if (currentDates.includes(dateStr)) {
      updatedDates = currentDates.filter(d => d !== dateStr);
    } else {
      updatedDates = [...currentDates, dateStr];
    }
    
    // ★ 낙관적 업데이트: 로컬 상태를 먼저 반영하여 즉각적인 UI 피드백 제공
    setCurrentUser(prev => prev ? { ...prev, unavailableDates: updatedDates } : prev);
    
    try {
      await updateDoc(doc(db, 'partners', currentUser.id), {
        unavailableDates: updatedDates
      });
    } catch (e: any) {
      console.error("Failed to update unavailable dates:", e);
      // ★ Firestore 실패 시 로컬 상태 롤백
      setCurrentUser(prev => prev ? { ...prev, unavailableDates: currentDates } : prev);
      // 상세 에러 메시지 표시 (디버깅용)
      const errMsg = e?.message || e?.code || '알 수 없는 오류';
      alert(`일정 변경 저장에 실패했습니다.\n(${errMsg})\n\n네트워크 연결을 확인하시고 다시 시도해주세요.`);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const dayCells: React.ReactNode[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<div key={`empty-${i}`} className="h-12 w-full"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isAvailable = !currentUser?.unavailableDates?.includes(dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      dayCells.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => handleToggleAvailableDate(dateStr)}
          className={`h-12 w-full rounded-xl flex flex-col items-center justify-center relative text-sm font-bold transition-all
            ${isAvailable 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 active:bg-blue-700' 
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 active:bg-rose-200'
            }
          `}
        >
          <span>{day}</span>
          {isToday && (
            <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-white' : 'bg-rose-500'}`}></span>
          )}
          {isAvailable ? (
            <span className="text-[8px] font-semibold opacity-90 block mt-0.5 leading-none">가능</span>
          ) : (
            <span className="text-[8px] font-semibold opacity-80 block mt-0.5 leading-none text-rose-500">마감</span>
          )}
        </button>
      );
    }
    return dayCells;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!storage) {
      alert("스토리지 설정이 안 되어 있습니다.");
      return;
    }

    const storageRef = ref(storage, `partner_logos/${currentUser?.id || Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        alert("업로드 중 오류가 발생했습니다.");
        setUploadProgress(null);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setEditProfileForm(prev => ({...prev, image: downloadURL}));
          setUploadProgress(null);
        });
      }
    );
  };

  const openEditProfileModal = () => {
    setEditProfileForm({
      companyName: currentUser?.companyName || currentUser?.name || '',
      managerName: currentUser?.managerName || '',
      region: currentUser?.region || '',
      regions: currentUser?.regions || currentUser?.notificationRegions || [],
      monthlyEvent: currentUser?.monthlyEvent || '',
      portfolio: currentUser?.portfolio || [],
      description: currentUser?.description || '',
      teamSize: currentUser?.teamSize || '',
      mainServices: currentUser?.mainServices || [],
      tags: currentUser?.tags || [],
      image: currentUser?.image || getDeterministicDefaultImage(currentUser?.id),
      bankName: currentUser?.bankName || '',
      accountNumber: currentUser?.accountNumber || '',
      accountHolder: currentUser?.accountHolder || '',
      acceptCoupons: currentUser?.acceptCoupons || false
    });
    setCustomService('');
    setShowEditProfileModal(true);
  };

  const handleSaveProfileInfo = async () => {
    if (!db || !currentUser) return;
    try {
      await updateDoc(doc(db, 'partners', currentUser.id), {
        companyName: editProfileForm.companyName,
        name: editProfileForm.companyName, // 닉네임/업체명 동시 업데이트
        managerName: editProfileForm.managerName,
        region: editProfileForm.regions.join(', '),
        regions: editProfileForm.regions,
        monthlyEvent: editProfileForm.monthlyEvent,
        portfolio: editProfileForm.portfolio,
        description: editProfileForm.description,
        teamSize: editProfileForm.teamSize,
        mainServices: editProfileForm.mainServices,
        tags: editProfileForm.tags,
        image: editProfileForm.image,
        bankName: editProfileForm.bankName,
        accountNumber: editProfileForm.accountNumber,
        accountHolder: editProfileForm.accountHolder,
        acceptCoupons: editProfileForm.acceptCoupons
      });
      alert('홍보 정보가 성공적으로 저장되었습니다.');
      setShowEditProfileModal(false);
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const toggleService = (svc: string) => {
    setEditProfileForm(prev => {
      if (prev.mainServices.includes(svc)) {
        return { ...prev, mainServices: prev.mainServices.filter(s => s !== svc) };
      } else {
        return { ...prev, mainServices: [...prev.mainServices, svc] };
      }
    });
  };

  const addCustomService = () => {
    if (customService.trim() && !editProfileForm.mainServices.includes(customService.trim())) {
      setEditProfileForm(prev => ({
        ...prev,
        mainServices: [...prev.mainServices, customService.trim()]
      }));
    }
    setCustomService('');
  };

  // 신규 작업 현장 등록용 상태
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDate, setNewCaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCaseImages, setNewCaseImages] = useState<string[]>([]);
  const [caseUploadProgress, setCaseUploadProgress] = useState<number | null>(null);

  const handleCaseImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!storage) {
      alert("스토리지 설정이 안 되어 있습니다.");
      return;
    }

    // 1. 하루 업로드 제한 체크
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = currentUser?.lastUploadDate || '';
    let dailyCount = lastDate === todayStr ? (currentUser?.dailyUploadCount || 0) : 0;

    if (dailyCount + files.length > 20) {
      alert(`하루 최대 20장까지 업로드 가능합니다.\n(오늘 남은 가능 장수: ${Math.max(0, 20 - dailyCount)}장)`);
      return;
    }

    setCaseUploadProgress(0);
    let uploadedUrls: string[] = [];
    let completedCount = 0;

    files.forEach(file => {
      const storageRef = ref(storage, `partner_portfolio/${currentUser?.id || Date.now()}_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        null,
        (error) => {
          console.error(error);
          alert(`${file.name} 업로드 중 오류가 발생했습니다.`);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          uploadedUrls.push(downloadURL);
          completedCount++;
          setCaseUploadProgress(Math.round((completedCount / files.length) * 100));

          if (completedCount === files.length) {
            setNewCaseImages(prev => [...prev, ...uploadedUrls]);
            setCaseUploadProgress(null);
          }
        }
      );
    });
  };

  const handleSaveNewCase = async () => {
    if (!newCaseTitle.trim()) {
      alert("현장명을 입력해주세요.");
      return;
    }
    if (newCaseImages.length === 0) {
      alert("작업 사진을 최소 1장 이상 등록해주세요.");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = currentUser?.lastUploadDate || '';
    let dailyCount = lastDate === todayStr ? (currentUser?.dailyUploadCount || 0) : 0;
    const updatedDailyCount = dailyCount + newCaseImages.length;

    let currentPortfolio = [...(editProfileForm.portfolio || [])];

    // 만약 기존 포트폴리오가 10개 이상 등록되어 있다면 (11번째 이상이 되므로), 가장 오래된 현장 자동 삭제
    if (currentPortfolio.length >= 10) {
      let cases = currentPortfolio.map((item, idx) => {
        if (typeof item === 'string') {
          return { id: `legacy_${idx}`, title: '이전 등록 사진', date: todayStr, uploadedAt: 0, images: [item] };
        }
        return item;
      });

      cases.sort((a, b) => (a.uploadedAt || 0) - (b.uploadedAt || 0));
      const oldestCase = cases[0];

      if (oldestCase.images && oldestCase.images.length > 0) {
        for (const imgUrl of oldestCase.images) {
          try {
            if (imgUrl.includes('firebasestorage')) {
              const fileRef = ref(storage!, imgUrl);
              await deleteObject(fileRef);
            }
          } catch (err) {
            console.error("Failed to delete storage object", err);
          }
        }
      }

      currentPortfolio = currentPortfolio.filter((item, idx) => {
        if (typeof item === 'string') {
          return `legacy_${idx}` !== oldestCase.id;
        }
        return item.id !== oldestCase.id;
      });
    }

    const newCase = {
      id: `case_${Date.now()}`,
      title: newCaseTitle.trim(),
      date: newCaseDate,
      uploadedAt: Date.now(),
      images: newCaseImages
    };

    setEditProfileForm(prev => ({
      ...prev,
      portfolio: [...currentPortfolio, newCase]
    }));

    if (db && currentUser) {
      try {
        await updateDoc(doc(db, 'partners', currentUser.id), {
          dailyUploadCount: updatedDailyCount,
          lastUploadDate: todayStr
        });
      } catch (err) {
        console.error("Failed to update daily upload stats", err);
      }
    }

    setNewCaseTitle('');
    setNewCaseDate(todayStr);
    setNewCaseImages([]);
    setShowAddCaseModal(false);
    alert("작업 현장이 추가되었습니다.\n(하단 '홍보 정보 저장하기' 버튼을 눌러야 최종 저장 완료됩니다.)");
  };

  const handleDeleteCase = async (index: number) => {
    if (confirm("해당 작업 현장 데이터를 삭제하시겠습니까?\n스토리지의 사진 파일도 모두 영구 삭제됩니다.")) {
      const targetCase = editProfileForm.portfolio[index];

      if (typeof targetCase === 'object' && targetCase !== null && targetCase.images) {
        for (const imgUrl of targetCase.images) {
          try {
            if (imgUrl.includes('firebasestorage')) {
              const fileRef = ref(storage!, imgUrl);
              await deleteObject(fileRef);
            }
          } catch (err) {
            console.error("Failed to delete storage object", err);
          }
        }
      } else if (typeof targetCase === 'string') {
        try {
          if (targetCase.includes('firebasestorage')) {
            const fileRef = ref(storage!, targetCase);
            await deleteObject(fileRef);
          }
        } catch (err) {
          console.error("Failed to delete legacy storage object", err);
        }
      }

      setEditProfileForm(prev => ({
        ...prev,
        portfolio: prev.portfolio.filter((_, idx) => idx !== index)
      }));
    }
  };

  const renderSnsModals = () => {
    return (
      <>
        {/* 소셜 계정 연동 제안 모달 */}
        {showSnsLinkModal && snsProfileToLink && existingPartnerToLink && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative text-slate-800 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">기존 파트너 계정 발견</h3>
              <p className="text-sm text-slate-500 mb-6 break-keep leading-relaxed font-medium">
                대표님이 입력하신 소셜 계정의 연락처(<strong>{snsProfileToLink.phone}</strong>)와 일치하는 기존 가입 정보(<strong>{existingPartnerToLink.companyName || existingPartnerToLink.managerName || existingPartnerToLink.name}</strong>)가 이미 등록되어 있습니다.<br/><br/>
                현재 소셜 계정을 기존 계정과 연동하여 다음부터 간편하게 로그인하시겠습니까?
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleLinkSnsAccount}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
                >
                  예, 계정을 연동하고 로그인합니다
                </button>
                <button
                  onClick={() => {
                    setShowSnsLinkModal(false);
                    setSnsProfileToLink(null);
                    setExistingPartnerToLink(null);
                  }}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors"
                >
                  아니오, 취소합니다
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (showLanding) {
    if (showLogin) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans max-w-md mx-auto shadow-2xl relative">
          <div className="sm:mx-auto sm:w-full sm:max-w-md px-6 z-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              파트너스 로그인
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
            
            {/* 앱 설치 문제 안내 아코디언 카드 */}
            <div className="mt-6 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden text-left">
              <button
                type="button"
                onClick={() => setShowInstallGuide(!showInstallGuide)}
                className="w-full px-5 py-4 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">📱</span>
                  <span>휴대폰에 앱 설치가 안 되시나요?</span>
                </div>
                <span className={`transform transition-transform duration-200 text-slate-400 text-xs font-bold`}>
                  {showInstallGuide ? '닫기 ▲' : '열기 ▼'}
                </span>
              </button>

              {showInstallGuide && (
                <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* QR 코드 영역 (PC 환경용) */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/partner-dashboard')}`}
                      alt="파트너스 로그인 QR"
                      className="w-[100px] h-[100px] border border-slate-200 p-1 rounded-lg shrink-0 bg-white"
                    />
                    <div className="text-center sm:text-left space-y-1">
                      <h4 className="text-xs font-black text-slate-800">스마트폰 카메라로 스캔해보세요!</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        PC에서 보고 계신다면 스마트폰 카메라로 QR 코드를 찍어 즉시 파트너 모바일 화면으로 접속할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  {/* 기종별 가이드 탭 */}
                  <div className="space-y-3">
                    <div className="flex border-b border-slate-200">
                      <button
                        type="button"
                        onClick={() => setGuideDevice('android')}
                        className={`flex-1 py-2 font-bold text-xs text-center border-b-2 transition-all ${
                          guideDevice === 'android' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                        }`}
                      >
                        삼성/안드로이드폰
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuideDevice('ios')}
                        className={`flex-1 py-2 font-bold text-xs text-center border-b-2 transition-all ${
                          guideDevice === 'ios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
                        }`}
                      >
                        아이폰 (Apple)
                      </button>
                    </div>

                    {guideDevice === 'android' ? (
                      <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
                        <p className="font-bold text-slate-800 text-xs">🛠️ 1초 설치 방법 (Chrome / 삼성인터넷)</p>
                        <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                          <li>인터넷 브라우저 주소창 우측의 <strong className="text-blue-600">[앱 다운로드/설치]</strong> 아이콘(📥 모양)을 클릭합니다.</li>
                          <li>또는, 우측 하단 <strong className="text-slate-700">[메뉴 ☰]</strong> 버튼을 누르고 <strong className="text-blue-600">[현재 페이지 추가]</strong> ➔ <strong className="text-blue-600">[홈 화면]</strong>을 차례로 터치합니다.</li>
                          <li>바탕화면에 앱 모양의 바로가기 아이콘이 정상 생성됩니다!</li>
                        </ol>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
                        <p className="font-bold text-slate-800 text-xs">🛠️ 1초 설치 방법 (Safari 브라우저)</p>
                        <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                          <li>반드시 <strong className="text-blue-600">Safari(사파리)</strong> 브라우저로 접속해 주세요.</li>
                          <li>화면 하단 중앙의 <strong className="text-blue-600">[공유 버튼 📤 (네모 속 화살표)]</strong>을 터치합니다.</li>
                          <li>메뉴 리스트를 밑으로 내려 <strong className="text-blue-600">[홈 화면에 추가]</strong>를 누르고 등록을 완료합니다.</li>
                          <li>바탕화면에 설치된 청소타워 아이콘을 누르면 앱처럼 실행됩니다.</li>
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* 인앱 브라우저 주의 안내 */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-800 leading-normal flex gap-1.5">
                    <span className="shrink-0 text-xs">⚠️</span>
                    <p className="font-semibold">
                      카카오톡이나 네이버 앱 내부에서 접속한 경우 보안상 앱 설치가 제한됩니다. 반드시 주소창 우측 더보기 아이콘을 눌러 <strong>[다른 브라우저로 열기]</strong>(Safari 또는 Chrome)를 진행한 후 설치해주시기 바랍니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 text-center flex flex-col gap-3">

              <button
                onClick={() => setShowLogin(false)}
                className="text-sm text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                ← 이전 화면 (홈)
              </button>
            </div>
            {renderSnsModals()}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden font-sans max-w-md mx-auto shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="/cleaner-hero-korean.webp" 
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
              청소타워 파트너스는 검증된 사업자 및 프리랜서 반장님들과 함께합니다. 가입만 하시면 지역별 안정적인 오더를 즉각 배정해 드립니다.
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

  // 승인 대기중이거나 정지된 경우 락 스크린 표시
  if (currentUser && currentUser.status !== 'active') {
    const isSuspended = currentUser.status === 'suspended';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans tracking-tight max-w-md mx-auto shadow-2xl">
        {/* PWA 설치 유도 배너 */}
        {!isInstalled && !isSuspended && (
          <div className="mt-8 mb-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700/50 p-2 rounded-xl">
                <Home size={20} className="text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm mb-0.5">앱 설치하고 1초만에 접속하기</h3>
                <p className="text-[11px] text-slate-300">승인 즉시 확인하기 위해 필수!</p>
              </div>
            </div>
            <button 
              onClick={handleInstallApp}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all whitespace-nowrap"
            >
              설치하기
            </button>
          </div>
        )}
        
        {/* 푸시 알림 유도 배너 - FCM 토큰이 없거나 알림이 미설정일 때 표시 */}
        {typeof Notification !== 'undefined' && currentUser && !isSuspended && (!currentUser.isNotificationEnabled || !currentUser.fcmTokens || currentUser.fcmTokens?.length === 0) && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Bell size={20} className="text-blue-600 animate-bounce" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-slate-800 mb-0.5">실시간 오더 알림 받기</h3>
                <p className="text-[11px] text-slate-500">앱을 켜지 않아도 알림을 보내드려요.</p>
              </div>
            </div>
            <button 
              onClick={requestNotificationPermission}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all whitespace-nowrap"
            >
              알림 켜기
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
          <div className={`w-20 h-20 ${isSuspended ? 'bg-rose-100 border-rose-200' : 'bg-blue-100 border-blue-200'} rounded-full flex items-center justify-center mb-6 shadow-sm border`}>
            {isSuspended ? <AlertTriangle size={36} className="text-rose-500" /> : <Info size={36} className="text-blue-500" />}
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">
            {isSuspended ? '계정이 정지되었습니다' : '가입 심사 중입니다'}
          </h1>
          <p className="text-slate-600 mb-8 font-medium break-keep leading-relaxed text-sm">
            <span className="font-bold text-slate-800 tracking-wide text-base">
              {currentUser.businessType === 'business' ? currentUser.companyName : currentUser.name}
            </span> 파트너님,
            {isSuspended ? (
              <><br/>현재 서비스 이용이 임시 정지된 상태입니다.<br/>자세한 사유는 본사 고객센터로 문의해주세요.</>
            ) : (
              <><br/>가입 신청이 완료되었습니다.<br/>현재 관리자가 기입해주신 정보를 바탕으로 심사를 진행 중입니다.<br/>승인이 완료되면 즉시 오더 수주가 가능합니다.</>
            )}
          </p>

          {!isSuspended && (
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-left mb-8 shadow-sm border border-slate-200">
              <p className="text-xs text-slate-400 font-bold mb-2 text-center">심사 안내</p>
              <ul className="text-xs text-slate-500 space-y-2 font-medium">
                <li className="flex gap-2">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span>영업일 기준 1~2일 내로 승인이 완료됩니다.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span>정보가 부족할 경우 본사에서 해피콜을 드릴 수 있습니다.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span>승인 완료 시 카카오톡으로 알림을 보내드립니다.</span>
                </li>
              </ul>
            </div>
          )}

          <div className="w-full flex justify-center mt-4 flex-col items-center gap-6">
            <div className={`px-5 py-3 rounded-xl text-xs font-bold shadow-sm border flex items-center gap-2 ${isSuspended ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'}`}>
              {!isSuspended && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
              {isSuspended ? '본사 관리자에게 문의해주세요' : '관리자 승인을 기다리는 중입니다...'}
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm underline decoration-slate-300 underline-offset-4 transition-colors"
            >
              다른 계정으로 로그인
            </button>
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900">청소타워 파트너스</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">환영합니다, {currentUser?.businessType === 'business' ? currentUser?.managerName : currentUser?.name} 파트너님</p>
          </div>
          <div className="text-right bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-600 block mb-0.5 font-bold">파트너 등급</span>
            <span className="font-black text-emerald-700 text-lg flex items-center gap-1">
              정회원<span className="text-xs font-bold bg-white px-1 rounded ml-1">Active</span>
            </span>
          </div>
        </div>
      </header>

      {/* 내부 컨텐츠 영역 */}
      <main className="flex-1 p-5 overflow-y-auto">
        {/* PWA 설치 유도 배너 */}
        {!isInstalled && (
          <div className="mb-5 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700/50 p-2 rounded-xl">
                <Home size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-0.5">앱 설치하고 1초만에 접속하기</h3>
                <p className="text-[11px] text-slate-300">빠른 오더 수락을 위해 필수!</p>
              </div>
            </div>
            <button 
              onClick={handleInstallApp}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all whitespace-nowrap"
            >
              설치하기
            </button>
          </div>
        )}
        
        {/* 푸시 알림 유도 배너 - FCM 토큰이 없거나 알림이 미설정일 때 표시 */}
        {typeof Notification !== 'undefined' && currentUser && (!currentUser.isNotificationEnabled || !currentUser.fcmTokens || currentUser.fcmTokens?.length === 0) && (
          <div className="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Bell size={20} className="text-blue-600 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 mb-0.5">실시간 오더 알림 받기</h3>
                <p className="text-[11px] text-slate-500">앱을 켜지 않아도 알림을 보내드려요.</p>
              </div>
            </div>
            <button 
              onClick={requestNotificationPermission}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all whitespace-nowrap"
            >
              알림 켜기
            </button>
          </div>
        )}

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
                    수락된 오더는 취소가 불가능하며, 무단 불참 시 플랫폼 이용이 즉시 정지(영구 제명)됩니다.
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
                        {(order.couponApplied || order.referralApplied) && (
                          <span className="bg-amber-400 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full mb-2 ml-1 inline-flex items-center gap-1 shadow-sm border border-amber-300">
                            🎟️ 1만원 쿠폰 적용 건
                          </span>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`${order.isUrgent ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'} font-bold text-xs px-3 py-1.5 rounded-lg border`}>{order.type || order.cleaningType || '청소'}</span>
                          <span className="text-slate-900 font-black tracking-tight text-xl">{getPartnerPrice(order)}원</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                            <Calendar size={18} className="text-slate-400 shrink-0" />
                            <span className="text-slate-900">{order.date || order.cleaningDate || '일정 미정'}</span> <span className="text-blue-600 font-bold">{order.time || order.cleaningTime || ''}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                            <MapPin size={18} className="text-slate-400 shrink-0" />
                            {(order.location || order.address) ? (order.location || order.address)!.split(' ').slice(0, 3).join(' ') : '주소 미상'} <span className="text-xs text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded ml-1">상세비공개</span>
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
                        <span className="text-xs font-bold text-slate-500">{job.type || job.cleaningType || '청소'}</span>
                      </div>
                      
                      {/* 1. 시공 날짜 */}
                      <div className="mb-4">
                        <div className="text-xs text-slate-500 font-bold mb-1">시공 날짜</div>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight">{job.date || job.cleaningDate || '일정 미정'} <span className="text-emerald-600">{job.time || job.cleaningTime || ''}</span></h3>
                      </div>
                      
                      {/* 상세 정보 노출 구역 */}
                      <div className="relative p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200 mb-4">
                        
                        {/* 2. 시공 주소 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><MapPin size={14}/> 시공 주소</div>
                           <span className="text-sm font-bold text-slate-900 leading-snug">{job.location || job.address}</span>
                        </div>
                        
                        <div className="h-px w-full bg-slate-200"></div>
                        
                        {/* 2-5. 신청자 이름 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><User size={14}/> 신청자 이름</div>
                           <span className="text-sm font-bold text-slate-900 leading-snug">{job.customerName || job.businessName || job.name || '고객(이름 미상)'}</span>
                        </div>

                        <div className="h-px w-full bg-slate-200"></div>
                        
                        {/* 3. 신청자 연락처 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><Phone size={14}/> 신청자 연락처</div>
                           <span className="text-sm font-black text-blue-600">{job.contactInfo || job.phone || job.realPhone || '010-0000-0000'}</span>
                        </div>
                        
                        <div className="h-px w-full bg-slate-200"></div>

                        {/* 4. 추가 요청 및 메모 */}
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-0.5"><Info size={14}/> 추가 요청 및 메모</div>
                           <span className="text-[13px] font-medium text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm mt-0.5 whitespace-pre-wrap">
                             {job.detail || job.memo || '기재된 특이사항이 없습니다.'}
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

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📅</span>
                  <div>
                    <h3 className="font-bold text-slate-800">청소 가능일 설정</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      청소 가능한 날짜를 터치해서 켜고 꺼주세요.<br/>
                      설정한 날짜는 홈페이지에 즉시 청소 가능일로 표시됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 달력 컨트롤러 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center px-1">
                  <button 
                    type="button"
                    onClick={handlePrevMonth}
                    className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold text-xs transition-colors border border-slate-100"
                  >
                    &lt; 이전 달
                  </button>
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h4>
                  <button 
                    type="button"
                    onClick={handleNextMonth}
                    className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold text-xs transition-colors border border-slate-100"
                  >
                    다음 달 &gt;
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 py-1.5 border-y border-slate-50">
                  <div className="text-rose-500">일</div>
                  <div>월</div>
                  <div>화</div>
                  <div>수</div>
                  <div>목</div>
                  <div>금</div>
                  <div className="text-blue-500">토</div>
                </div>

                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-1.5">
                  {renderCalendarDays()}
                </div>
              </div>
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
              {/* 파트너스 매칭 가이드 배너 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm text-slate-800">
                <Sparkles size={20} className="shrink-0 text-blue-600 animate-pulse mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-slate-900">매출을 3.5배 올리는 프로필 가이드</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    상호명 기재 팁, 전후사진 갤러리 활용법, 이달의 이벤트 구성, 실시간 달력 관리법을 확인해 보세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="mt-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    가이드 안내문 확인하기
                  </button>
                </div>
              </div>

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
                    <p className="text-xs text-slate-500 font-bold mb-1">계정 상태</p>
                    <p className="text-xl font-black text-emerald-600">정상 활동</p>
                  </div>
                </div>
                {currentUser?.bankName && (
                  <div className="mt-4 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/50 text-left text-xs">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">🏦 등록된 정산 계좌</p>
                    <p className="text-slate-600 font-medium">{currentUser.bankName} {currentUser.accountNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">예금주: {currentUser.accountHolder}</p>
                  </div>
                )}
                <button 
                  onClick={openEditProfileModal}
                  className="mt-6 w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_document</span>
                  내 홍보 정보 수정 (포트폴리오/리뷰/행사)
                </button>
              </div>

              {/* 멤버십 & 결제 안내 카드 */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-700 text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20 uppercase">
                    MEMBERSHIP
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    3개월 무료 체험 중
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-1">
                  {currentUser?.plan === 'premium' ? '프리미엄 파트너' : currentUser?.plan === 'exclusive' ? '지역 독점 파트너' : '일반 파트너'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mb-4">
                  현재 신규 파트너 3개월 무료 프로모션 혜택을 받고 계십니다. 무료 혜택 기간 동안 오더 매칭을 제한 없이 이용하실 수 있습니다.
                </p>
                <div className="h-px bg-slate-700 w-full mb-4"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">체험 만료 예정일</span>
                  <span className="font-extrabold text-amber-300">
                    {currentUser?.createdAt ? (
                      (() => {
                        const date = new Date(currentUser.createdAt);
                        date.setMonth(date.getMonth() + 3);
                        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
                      })()
                    ) : '가입일로부터 3개월 후'}
                  </span>
                </div>
                <div className="mt-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-[11px] text-slate-300 leading-relaxed font-medium">
                  💡 무료 체험 기간 종료 시점에 카드를 등록하고 결제를 갱신하실 수 있도록 별도 안내해 드립니다. (토스페이먼츠 심사 완료 후 적용 예정)
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
                  <RegionSelector 
                    selectedRegions={notiRegions} 
                    onChange={setNotiRegions} 
                  />
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => handleSaveRegions(notiRegions)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl active:scale-[0.98] transition-all"
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
                  onClick={() => window.open('http://pf.kakao.com/_xnHTnX/chat', '_blank')}
                  className="w-full text-left px-5 py-4 font-bold text-slate-700 flex justify-between items-center bg-white active:bg-slate-50"
                >
                  본사 1:1 채팅 문의 <span className="text-slate-400">→</span>
                </button>
                 <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full text-left px-5 py-4 font-bold text-slate-700 flex justify-between items-center bg-white active:bg-slate-50 border-t border-slate-100"
                >
                  비밀번호 변경 <span className="text-slate-400">→</span>
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
                  <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-lg border border-blue-100 mb-3 inline-block">{selectedOrder.type || selectedOrder.cleaningType || '청소'}</span>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{(selectedOrder.location || selectedOrder.address) ? (selectedOrder.location || selectedOrder.address)!.split(' ').slice(0, 3).join(' ') : '주소 미상'}</h2>
                  <p className="text-slate-500 font-medium break-keep">상세 주소는 수락 시 1초 만에 즉시 완전 공개됩니다.</p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm">일정</span>
                    <span className="text-slate-900 font-bold">{selectedOrder.date || selectedOrder.cleaningDate || '일정 미정'} ({selectedOrder.time || selectedOrder.cleaningTime || ''})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm">주거형태</span>
                    <span className="text-slate-900 font-bold">{selectedOrder.house || (selectedOrder.houseType ? `${selectedOrder.houseType} ${selectedOrder.houseSubType || ''}` : '정보 없음')} · {selectedOrder.size}평</span>
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
                    {selectedOrder.detail || selectedOrder.memo || '기재된 특이사항이 없습니다.'}
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
                  <li>무단 취소 시 사전 예고 없이 <strong>계정 이용이 즉시 정지(영구 제명)</strong>됩니다.</li>
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
                {settlements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 p-6">
                    <Briefcase size={48} className="opacity-20" />
                    <p className="font-bold">현재 정산 가능한 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {settlements.map((item) => (
                      <div key={item.id} className="p-5 bg-white mb-2 shadow-sm border-y border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.status === '입금 완료' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {String(item.status)}
                          </span>
                          <span className="text-slate-400 text-sm font-medium">{String(item.date)}</span>
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
                  onClick={async () => {
                    if (db && currentUser) {
                      try {
                        await deleteDoc(doc(db, 'partners', currentUser.id));
                        alert('성공적으로 탈퇴되었습니다.');
                        handleLogout();
                      } catch (e) {
                        console.error(e);
                        alert('탈퇴 처리 중 오류가 발생했습니다.');
                      }
                    }
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

      {/* 비밀번호 변경 모달 */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowChangePasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10"
            >
              <div className="bg-slate-900 p-6 flex flex-col items-center text-center text-white">
                <div className="bg-white/10 p-3 rounded-full mb-3 flex items-center justify-center w-14 h-14">
                  <span className="material-symbols-outlined text-white text-3xl font-bold">lock_reset</span>
                </div>
                <h2 className="text-2xl font-black">비밀번호 변경</h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">안전한 파트너스 관리를 위해 비밀번호를 변경해 주세요.</p>
              </div>
              
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {passwordError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-600 text-xs font-bold text-center">
                    ⚠️ {passwordError}
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">현재 비밀번호</label>
                    <input 
                      type="password"
                      required
                      placeholder="현재 비밀번호를 입력하세요"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none focus:bg-white transition-all font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">새 비밀번호 (최소 4자 이상)</label>
                    <input 
                      type="password"
                      required
                      placeholder="새 비밀번호를 입력하세요"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none focus:bg-white transition-all font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">새 비밀번호 확인</label>
                    <input 
                      type="password"
                      required
                      placeholder="새 비밀번호를 다시 입력하세요"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none focus:bg-white transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isUpdatingPassword ? '변경 중...' : '비밀번호 변경하기'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl active:scale-[0.98] transition-transform"
                  >
                    취소
                  </button>
                </div>
              </form>
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
                     <span className="text-slate-900 font-black">{jobToComplete.location || jobToComplete.address}</span>
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

      {/* 홍보 정보 수정 모달 */}
      <AnimatePresence>
        {showEditProfileModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfileModal(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 overflow-hidden shadow-2xl h-[90vh] flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-black text-slate-900">홍보 정보 수정</h2>
                  <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="text-sm text-slate-500">고객에게 노출될 업체 정보를 매력적으로 꾸며보세요.</p>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
                {/* 정보 수정 팁 링크 배너 */}
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="w-full bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-2xl p-4 text-left flex items-start gap-3 transition-colors text-slate-800 shadow-sm"
                >
                  <Sparkles size={18} className="shrink-0 text-blue-600 animate-pulse mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-slate-900">어떻게 적어야 고객 매칭률이 오를까요?</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5 flex items-center gap-1">
                      상호, 전후사진, 행사 입력법 가이드 보기 <span className="text-blue-600 font-bold">→</span>
                    </p>
                  </div>
                </button>
                
                {/* 기본 정보 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                    📝 기본 정보
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">업체명 (팀명)</label>
                      <input 
                        type="text"
                        value={editProfileForm.companyName}
                        onChange={(e) => setEditProfileForm({...editProfileForm, companyName: e.target.value})}
                        placeholder="예) 퍼펙트 클린 서초점"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">담당자명</label>
                      <input 
                        type="text"
                        value={editProfileForm.managerName}
                        onChange={(e) => setEditProfileForm({...editProfileForm, managerName: e.target.value})}
                        placeholder="예) 김철수"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">주 활동 지역</label>
                      <RegionSelector 
                        selectedRegions={editProfileForm.regions} 
                        onChange={(arr) => setEditProfileForm({...editProfileForm, regions: arr})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">정산 계좌 정보 (입금 계좌)</label>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <select 
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-700 bg-white"
                            value={editProfileForm.bankName}
                            onChange={(e) => setEditProfileForm({...editProfileForm, bankName: e.target.value})}
                          >
                            <option value="">은행 선택</option>
                            <option value="국민은행">국민은행</option>
                            <option value="신한은행">신한은행</option>
                            <option value="우리은행">우리은행</option>
                            <option value="하나은행">하나은행</option>
                            <option value="기업은행">기업은행</option>
                            <option value="농협은행">농협은행</option>
                            <option value="카카오뱅크">카카오뱅크</option>
                            <option value="토스뱅크">토스뱅크</option>
                            <option value="새마을금고">새마을금고</option>
                            <option value="우체국">우체국</option>
                            <option value="신협">신협</option>
                            <option value="수협">수협</option>
                          </select>
                        </div>
                        <div>
                          <input 
                            type="text"
                            value={editProfileForm.accountHolder}
                            onChange={(e) => setEditProfileForm({...editProfileForm, accountHolder: e.target.value})}
                            placeholder="예금주명"
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <input 
                        type="text"
                        value={editProfileForm.accountNumber}
                        onChange={(e) => setEditProfileForm({...editProfileForm, accountNumber: e.target.value.replace(/[^0-9]/g, '')})}
                        placeholder="계좌번호 (- 없이 숫자만 입력)"
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    {/* 쿠폰 오더 수락 여부 */}
                    <div className="pt-2 border-t border-slate-100 mt-4">
                      <label className="flex items-start gap-3 cursor-pointer group bg-blue-50/50 p-4 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors">
                        <div className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={editProfileForm.acceptCoupons}
                            onChange={(e) => setEditProfileForm({...editProfileForm, acceptCoupons: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            할인 쿠폰 사용 오더 수락하기 <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black tracking-tighter">추천</span>
                          </span>
                          <span className="text-xs text-slate-500 mt-1 leading-relaxed break-keep">
                            체크 시 쿠폰을 쓰는 더 많은 고객과 우선 매칭됩니다. 단, 쿠폰 할인 금액(예: 1만 원)은 파트너님의 현장 결제 잔금에서 차감하여 수령하셔야 합니다.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 메인 로고 / 대표 이미지 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                      🖼️ 업체 로고 및 대표 이미지
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200 relative p-2 flex items-center justify-center shadow-sm">
                      <img src={editProfileForm.image || getDeterministicDefaultImage(currentUser?.id)} alt="대표 이미지" className="max-w-full max-h-full object-contain" />
                      {uploadProgress !== null && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm transition-all">
                          <span className="text-white text-xs font-bold">{Math.round(uploadProgress)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-2 break-keep leading-relaxed font-medium">
                        업체 목록에 노출될 로고 또는 대표 이미지를 업로드해주세요. <strong>(원본 비율을 유지하여 깔끔하게 노출됩니다.)</strong>
                      </p>
                      <div className="flex gap-2 items-center">
                        <label className="flex-1 cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold border border-blue-200 rounded-xl p-2.5 text-xs text-center transition-colors">
                          {uploadProgress !== null ? '업로드 중...' : '이미지 파일 선택'}
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadProgress !== null}
                          />
                        </label>
                        {/* 데모용 버튼 */}
                        <button 
                          onClick={() => setEditProfileForm({...editProfileForm, image: '/images/korean_cleaning_team.webp'})}
                          className="text-xs bg-slate-100 hover:bg-slate-200 font-bold px-3 py-2.5 rounded-xl text-slate-600 transition-colors whitespace-nowrap"
                          disabled={uploadProgress !== null}
                        >
                          기본 샘플
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 업체 소개 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    🏢 업체 상세 소개
                  </h3>
                  <textarea 
                    value={editProfileForm.description}
                    onChange={(e) => setEditProfileForm({...editProfileForm, description: e.target.value})}
                    placeholder="고객에게 업체의 전문성, 경력, 철학 등을 소개해주세요."
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 min-h-[80px]"
                  />
                </div>

                {/* 직원수 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    👥 직원수
                  </h3>
                  <input 
                    type="text"
                    value={editProfileForm.teamSize}
                    onChange={(e) => setEditProfileForm({...editProfileForm, teamSize: e.target.value})}
                    placeholder="예) 3명 (팀장 1, 팀원 2)"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* 우리 업체의 장점 (태그) */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    💡 우리 업체의 장점 (키워드)
                  </h3>
                  <input 
                    type="text"
                    value={editProfileForm.tags.join(', ')}
                    onChange={(e) => setEditProfileForm({...editProfileForm, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                    placeholder="예) #서초구1위, #친환경세제 (쉼표로 구분)"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">쉼표(,)로 구분하여 여러 개의 장점을 해시태그 형식으로 입력해주세요.</p>
                </div>

                {/* 가능 서비스 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    ✨ 가능 서비스
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {serviceExamples.map(svc => (
                      <button
                        key={svc}
                        onClick={() => toggleService(svc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${editProfileForm.mainServices.includes(svc) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editProfileForm.mainServices.filter(svc => !serviceExamples.includes(svc)).map(svc => (
                       <button
                        key={svc}
                        onClick={() => toggleService(svc)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-blue-600 text-white shadow-md flex items-center gap-1"
                      >
                        {svc} <span className="font-normal opacity-80">✕</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
                      placeholder="직접 입력 (예: 마루코팅)"
                      className="flex-1 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={addCustomService}
                      className="px-4 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-transform"
                    >
                      추가
                    </button>
                  </div>
                </div>

                {/* 이달의 행사 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    🎁 이달의 행사 및 혜택
                  </h3>
                  <textarea 
                    value={editProfileForm.monthlyEvent}
                    onChange={(e) => setEditProfileForm({...editProfileForm, monthlyEvent: e.target.value})}
                    placeholder="예) 피톤치드 살균 소독 무료 제공! (이번달 한정)"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 min-h-[80px]"
                  />
                </div>

                {/* 포트폴리오 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                      📸 작업 갤러리 ({editProfileForm.portfolio.length}건)
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setShowAddCaseModal(true)}
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      + 현장 추가
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 mt-3">
                    {editProfileForm.portfolio.length === 0 ? (
                      <p className="text-sm text-slate-400 w-full text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        등록된 작업 현장이 없습니다. (최대 10개 보존)
                      </p>
                    ) : (
                      editProfileForm.portfolio.map((item, i) => {
                        const isLegacy = typeof item === 'string';
                        const thumb = isLegacy ? item : (item.images?.[0] || '');
                        const title = isLegacy ? '이전 등록 사진' : item.title;
                        const date = isLegacy ? '' : item.date;
                        const imgCount = isLegacy ? 1 : (item.images?.length || 0);

                        return (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-white">
                              <img src={thumb} alt="썸네일" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {date && <span className="text-[11px] font-medium text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">{date}</span>}
                                <span className="text-[11px] font-bold text-blue-600">사진 {imgCount}장</span>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleDeleteCase(i)}
                              className="w-8 h-8 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 신규 작업 현장 등록 모달 */}
                {showAddCaseModal && (
                  <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="font-black text-slate-900 text-lg">새 작업 현장 추가</h3>
                        <button 
                          type="button"
                          onClick={() => {
                            setNewCaseTitle('');
                            setNewCaseImages([]);
                            setCaseUploadProgress(null);
                            setShowAddCaseModal(false);
                          }}
                          className="text-slate-400 hover:text-slate-600 text-lg"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">현장명 / 작업 설명</label>
                          <input 
                            type="text"
                            value={newCaseTitle}
                            onChange={e => setNewCaseTitle(e.target.value)}
                            placeholder="예: 마포구 아파트 이사청소"
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">작업 완료 날짜</label>
                          <input 
                            type="date"
                            value={newCaseDate}
                            onChange={e => setNewCaseDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-600">작업 사진 ({newCaseImages.length}장)</label>
                            <label className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100">
                              + 사진 선택
                              <input 
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleCaseImagesUpload}
                                disabled={caseUploadProgress !== null}
                              />
                            </label>
                          </div>
                          
                          {caseUploadProgress !== null && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                              <div className="bg-blue-600 h-1.5 transition-all" style={{ width: `${caseUploadProgress}%` }}></div>
                            </div>
                          )}

                          <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                            {newCaseImages.length === 0 ? (
                              <p className="text-xs text-slate-400 w-full text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                등록된 사진이 없습니다. (오늘 업로드 한도: 최대 20장)
                              </p>
                            ) : (
                              newCaseImages.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                  <img src={img} alt="선택 사진" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        if (img.includes('firebasestorage')) {
                                          const fileRef = ref(storage!, img);
                                          await deleteObject(fileRef);
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                      setNewCaseImages(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveNewCase}
                          disabled={caseUploadProgress !== null}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:bg-slate-300 text-sm"
                        >
                          현장 저장하기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCaseTitle('');
                            setNewCaseImages([]);
                            setCaseUploadProgress(null);
                            setShowAddCaseModal(false);
                          }}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex-shrink-0">
                <button 
                  onClick={handleSaveProfileInfo} 
                  className="w-full py-4 rounded-xl bg-blue-600 text-white font-black active:bg-blue-700 shadow-lg shadow-blue-600/30"
                >
                  홍보 정보 저장하기
                </button>
              </div>
            </motion.div>
          </>
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
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 flex flex-col items-center justify-center p-3 transition-colors ${activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <CalendarCheck size={22} className={activeTab === 'calendar' ? 'drop-shadow-md' : ''} />
            <span className={`text-[10px] mt-1.5 ${activeTab === 'calendar' ? 'font-bold' : 'font-medium'}`}>청소 가능일</span>
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

      {/* 파트너 안내 가이드 모달 */}
      <PartnerGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />

      {renderSnsModals()}
    </div>
  );
}
