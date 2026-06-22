import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Building, Home, ArrowRight, Lock, Mail } from 'lucide-react';
import { saveSocialUser } from '../lib/authHelpers';

type TabType = 'consumer' | 'interior' | 'realestate' | 'cleaner';

export default function Login() {
  const [activeTab, setActiveTab] = useState<TabType>('consumer');
  const navigate = useNavigate();

  useEffect(() => {
    const naver = (window as any).naver;
    if (naver && !(window as any).naverLoginInitialized) {
      const naverLogin = new naver.LoginWithNaverId({
        clientId: 'gFD6VZbXXIFFXTy81OB0',
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
  }, [navigate]);

  const handlePartnerLogin = (e: React.FormEvent, type: TabType) => {
    e.preventDefault();
    // 로그인 모의 로직
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
  };

  const handleKakaoLogin = () => {
    const kakao = (window as any).Kakao;
    if (!kakao || !kakao.isInitialized()) {
      alert('카카오 SDK가 아직 로드되지 않았습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }
    
    kakao.Auth.login({
      success: function (authObj: any) {
        // 프로필 정보 요청
        kakao.API.request({
          url: '/v2/user/me',
          success: async function (res: any) {
            const user = {
              id: `kakao_${res.id}`,
              name: res.kakao_account?.profile?.nickname || '카카오 유저',
              email: res.kakao_account?.email || '',
              provider: 'kakao' as const,
              profileImage: res.kakao_account?.profile?.profile_image_url || '',
            };
            
            const success = await saveSocialUser(user);
            if (success) {
              navigate('/consumer-dashboard');
            } else {
              alert('회원가입/로그인 처리 중 오류가 발생했습니다.');
            }
          },
          fail: function (error: any) {
            console.error('Kakao profile request failed:', error);
            alert('카카오 프로필 정보를 가져오는데 실패했습니다.');
          },
        });
      },
      fail: function (err: any) {
        console.error('Kakao login failed:', err);
        // 사용자가 취소한 경우 등
      },
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
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl">
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
                  
                  {/* Naver SDK renders its button here, but we hide it */}
                  <div id="naverIdLogin" style={{ display: 'none' }}></div>

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
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-4 transition-colors flex items-center justify-center gap-2 mt-6"
                    >
                      로그인
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 font-medium mb-3">
                      아직 파트너 회원이 아니신가요?
                    </p>
                    <button 
                      onClick={() => navigate('/partners/register')}
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
