import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Building, Home, ArrowRight, Lock, Mail } from 'lucide-react';
import { saveSocialUser } from '../lib/authHelpers';
import { getDb } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

type TabType = 'consumer' | 'interior' | 'realestate' | 'cleaner';

export default function Login() {
  const [activeTab, setActiveTab] = useState<TabType>('consumer');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const naver = (window as any).naver;
    if (naver && !(window as any).naverLoginInitialized) {
      const naverLogin = new naver.LoginWithNaverId({
        clientId: 'gFD6VZbxXIFFXTy81OB0',
        callbackUrl: window.location.origin + '/login',
        isPopup: false,
        loginButton: { color: "green", type: 3, height: 60 }
      });
      naverLogin.init();
      (window as any).naverLoginInitialized = true;

      naverLogin.getLoginStatus(async function (status: boolean) {
        if (status) {
          const email = naverLogin.user.getEmail();
          const name = naverLogin.user.getName() || naverLogin.user.getNickname();
          const profileImage = naverLogin.user.getProfileImage();
          const id = naverLogin.user.getId();
          
          if (id) {
            const user = {
              id: `naver_${id}`,
              name: name || '네이버 유저',
              email: email || '',
              provider: 'naver' as const,
              profileImage: profileImage || '',
            };
            const success = await saveSocialUser(user);
            if (success) {
              navigate('/consumer-dashboard');
            } else {
              alert('회원가입/로그인 처리 중 오류가 발생했습니다.');
            }
          }
        }
      });
    }

    // Kakao SDK Init fallback
    const loadKakao = () => {
      const kakao = (window as any).Kakao;
      if (kakao && !kakao.isInitialized()) {
        kakao.init('2917cea7b9da592c919c09e14da2277b');
      }
    };
    
    if (!(window as any).Kakao) {
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.onload = loadKakao;
      document.head.appendChild(script);
    } else {
      loadKakao();
    }

    // Kakao OAuth Callback Handler
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state === 'kakao_login') {
      const handleKakaoCallback = async () => {
        try {
          const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: 'db7b104910102aaf2650f235e0ff2f19',
              redirect_uri: window.location.origin + '/login',
              code: code,
            }),
          });

          const tokenData = await tokenResponse.json();
          if (!tokenData.access_token) {
            throw new Error('토큰 발급 실패');
          }

          const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
          });

          const userData = await userResponse.json();
          const user = {
            id: `kakao_${userData.id}`,
            name: userData.kakao_account?.profile?.nickname || '카카오 유저',
            email: userData.kakao_account?.email || '',
            provider: 'kakao' as const,
            profileImage: userData.kakao_account?.profile?.profile_image_url || '',
          };
          
          const success = await saveSocialUser(user);
          if (success) {
            navigate('/consumer-dashboard', { replace: true });
          } else {
            alert('회원가입/로그인 처리 중 오류가 발생했습니다.');
          }
        } catch (error) {
          console.error('Kakao callback error:', error);
          alert('카카오 로그인 중 오류가 발생했습니다.');
        }
      };
      
      handleKakaoCallback();
    }
  }, [navigate]);

  const handlePartnerLogin = async (e: React.FormEvent, type: TabType) => {
    e.preventDefault();

    if (!loginId || !password) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const db = getDb();
      if (!db) {
        alert('데이터베이스 연결에 실패했습니다.');
        setIsLoggingIn(false);
        return;
      }

      let usersRef;
      let q;

      const numericLoginId = loginId.replace(/[^0-9]/g, '');

      if (type === 'cleaner') {
        usersRef = collection(db, 'partners');
        // 파트너스는 loginId가 숫자만 있는 연락처일 수도 있고 phone 필드일 수도 있음
        q = query(usersRef, where('loginId', '==', numericLoginId), where('password', '==', password));
      } else {
        usersRef = collection(db, 'b2b_partners');
        q = query(usersRef, where('loginId', '==', loginId), where('password', '==', password), where('b2bPartnerType', '==', type));
      }

      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 대체 검색 로직
        if (type === 'cleaner') {
          const fallbackQ = query(usersRef, where('phone', '==', loginId), where('password', '==', password));
          querySnapshot = await getDocs(fallbackQ);
        } else {
          const fallbackQ = query(usersRef, where('loginId', '==', numericLoginId), where('password', '==', password), where('b2bPartnerType', '==', type));
          querySnapshot = await getDocs(fallbackQ);
        }

        if (querySnapshot.empty) {
          alert('아이디 또는 비밀번호가 일치하지 않습니다.');
          setIsLoggingIn(false);
          return;
        }
      }

      // 승인 상태 확인 (가장 최근 가입 정보 기준)
      const userDoc = querySnapshot.docs[0].data();
      if (userDoc.status === 'pending') {
        alert('가입 승인이 대기 중입니다. 승인 완료 후 로그인할 수 있습니다.');
        setIsLoggingIn(false);
        return;
      }

      sessionStorage.setItem('b2b_partner_type', type);
      sessionStorage.setItem('partner_id', querySnapshot.docs[0].id);

      switch (type) {
        case 'interior':
          navigate('/interior-dashboard');
          break;
        case 'realestate':
          navigate('/realestate-dashboard');
          break;
        case 'cleaner':
          navigate('/partner-dashboard');
          break;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKakaoLogin = () => {
    const kakao = (window as any).Kakao;
    if (!kakao) {
      alert('카카오 로그인 도구를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!kakao.isInitialized()) {
      kakao.init('2917cea7b9da592c919c09e14da2277b');
    }
    kakao.Auth.authorize({
      redirectUri: window.location.origin + '/login',
      state: 'kakao_login',
    });
  };

  const handleNaverLoginClick = () => {
    const naverLoginBtn = document.getElementById('naverIdLogin')?.firstChild as HTMLElement;
    if (naverLoginBtn) {
      naverLoginBtn.click();
    } else {
      alert('네이버 로그인 SDK 로딩 중입니다. 새로고침 후 다시 시도해주세요.');
    }
  };

  const tabs = [
    { id: 'consumer', label: '일반 고객', icon: User, color: 'bg-blue-600' },
    { id: 'interior', label: '인테리어 파트너', icon: Building, color: 'bg-purple-600' },
    { id: 'realestate', label: '부동산 파트너', icon: Home, color: 'bg-emerald-600' },
    { id: 'cleaner', label: '청소 파트너스', icon: Briefcase, color: 'bg-amber-600' },
  ] as const;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Naver SDK renders its button here, but we hide it globally so it's not destroyed by tab switches */}
      <div id="naverIdLogin" style={{ display: 'none' }}></div>

      <div className="w-full max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
            환영합니다
          </h1>
          <p className="text-slate-500 font-medium">청소타워 통합 로그인 서비스입니다.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100 bg-slate-50/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 py-4 px-2 relative transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-600' : ''} />
                  <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${isActive ? '' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="login-active-tab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'consumer' ? (
                <motion.div
                  key="consumer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <p className="text-slate-600 font-medium text-sm">
                      1초 만에 간편하게 로그인하고<br />
                      내 청소 예약 현황을 확인하세요.
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleKakaoLogin}
                    className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#E6CF00] text-[#000000] font-bold rounded-xl py-4 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.369 5.969-.214.788-.775 2.842-.8 2.96-.032.146.05.143.11.104.048-.03 1.954-1.284 2.766-1.815.823.238 1.684.365 2.555.365 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
                    </svg>
                    카카오 로그인
                  </button>
                  
                  {/* Naver Login UI is rendered globally now to prevent React re-render issues */}

                  <button 
                    onClick={handleNaverLoginClick}
                    className="w-full flex items-center justify-center gap-3 bg-[#03C75A] hover:bg-[#02B351] text-white font-bold rounded-xl py-4 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                    </svg>
                    네이버 로그인
                  </button>

                  <p className="text-center text-xs text-slate-400 mt-6">
                    로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <form onSubmit={(e) => handlePartnerLogin(e, activeTab)} className="space-y-4">
                    <div className="text-center mb-6">
                      <p className="text-slate-600 font-medium text-sm">
                        {activeTab === 'interior' && '인테리어 업체 전용 계정으로 로그인해주세요.'}
                        {activeTab === 'realestate' && '부동산 파트너 계정으로 로그인해주세요.'}
                        {activeTab === 'cleaner' && '청소 현장 파트너스 계정으로 로그인해주세요.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">아이디</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="아이디를 입력해주세요"
                            required
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">비밀번호</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="password" 
                            placeholder="비밀번호를 입력해주세요"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                        <span className="text-sm font-medium text-slate-600">자동 로그인</span>
                      </label>
                      <button type="button" className="text-sm font-medium text-slate-400 hover:text-slate-600">
                        비밀번호 찾기
                      </button>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold rounded-xl py-4 transition-colors flex items-center justify-center gap-2 mt-6"
                    >
                      {isLoggingIn ? '로그인 중...' : '로그인'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 font-medium mb-3">
                      아직 파트너 회원이 아니신가요?
                    </p>
                    <button 
                      onClick={() => {
                        if (activeTab === 'interior' || activeTab === 'realestate') {
                          navigate('/b2b/signup');
                        } else {
                          navigate('/partners/register');
                        }
                      }}
                      className="text-blue-600 font-bold hover:text-blue-700 hover:underline underline-offset-4"
                    >
                      무료로 가입하고 혜택 받기
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
