export interface SnsProfile {
  id: string; // SNS 고유 ID
  provider: 'kakao' | 'naver';
  name: string; // 이름 (닉네임)
  phone?: string; // 연락처
  email?: string; // 이메일
  image?: string; // 프로필 이미지 URL
}

// SDK 스크립트 동적 로드 헬퍼
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
    document.head.appendChild(script);
  });
}

// 카카오 SDK 초기화 상태 추적
let isKakaoInitialized = false;

export async function initKakao(jsKey: string): Promise<boolean> {
  if (isKakaoInitialized) return true;
  try {
    await loadScript('https://developers.kakao.com/sdk/js/kakao.js');
    const Kakao = (window as any).Kakao;
    if (Kakao && !Kakao.isInitialized()) {
      Kakao.init(jsKey);
      isKakaoInitialized = true;
      console.log('Kakao SDK 초기화 성공');
    }
    return true;
  } catch (error) {
    console.error('Kakao SDK 초기화 실패:', error);
    return false;
  }
}

export async function loginWithKakao(jsKey?: string): Promise<{ success: boolean; profile?: SnsProfile }> {
  const finalKey = jsKey || (import.meta as any).env?.VITE_KAKAO_JS_KEY;
  if (!finalKey || finalKey.includes('YOUR_')) {
    throw new Error('카카오 API Key(VITE_KAKAO_JS_KEY)가 설정되지 않았습니다.');
  }

  try {
    const initialized = await initKakao(finalKey);
    if (!initialized) throw new Error('Kakao SDK 초기화 불가');

    const Kakao = (window as any).Kakao;
    return new Promise((resolve) => {
      Kakao.Auth.login({
        success: function(authObj: any) {
          console.log('Kakao 로그인 성공:', authObj);
          Kakao.API.request({
            url: '/v2/user/me',
            success: function(res: any) {
              console.log('Kakao 프로필 조회 성공:', res);
              const kakaoAccount = res.kakao_account || {};
              // 전화번호 포맷팅 (예: +82 10-1234-5678 -> 010-1234-5678)
              let phone = kakaoAccount.phone_number || '';
              if (phone.includes('+82')) {
                phone = '0' + phone.replace('+82', '').replace(/[- ]/g, '').trim();
                // 01012345678 -> 010-1234-5678 포맷팅
                if (phone.length === 11) {
                  phone = phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
                }
              }
              
              resolve({
                success: true,
                profile: {
                  id: String(res.id),
                  provider: 'kakao',
                  name: res.properties?.nickname || kakaoAccount.profile?.nickname || '카카오 사용자',
                  email: kakaoAccount.email,
                  phone: phone || undefined,
                  image: res.properties?.profile_image || kakaoAccount.profile?.profile_image_url
                }
              });
            },
            fail: function(error: any) {
              console.error('Kakao 프로필 조회 실패:', error);
              resolve({ success: false });
            }
          });
        },
        fail: function(err: any) {
          console.error('Kakao 로그인 창 열기 실패:', err);
          resolve({ success: false });
        }
      });
    });
  } catch (error) {
    console.error('Kakao 로그인 오류:', error);
    throw error;
  }
}

export async function loginWithNaver(clientId?: string): Promise<{ success: boolean; profile?: SnsProfile }> {
  const finalClientId = clientId || (import.meta as any).env?.VITE_NAVER_CLIENT_ID;
  if (!finalClientId || finalClientId.includes('YOUR_')) {
    throw new Error('네이버 Client ID(VITE_NAVER_CLIENT_ID)가 설정되지 않았습니다.');
  }

  try {
    const callbackUrl = window.location.origin + '/partner-dashboard';
    const state = Math.random().toString(36).substring(2, 15);
    
    // state를 localStorage에 저장 (콜백에서 검증용)
    localStorage.setItem('naver_oauth_state', state);
    
    // 네이버 OAuth 인증 페이지로 직접 이동
    const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${finalClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;
    
    // 팝업으로 열기 시도
    const popup = window.open(authUrl, 'naverLogin', 'width=500,height=700,scrollbars=yes,resizable=yes');
    
    if (!popup || popup.closed) {
      // 팝업 차단시 현재 페이지에서 리다이렉트
      window.location.href = authUrl;
    }
    
    // 팝업 방식은 콜백 페이지에서 처리하므로 여기서는 대기
    return { success: false };
  } catch (error) {
    console.error('Naver 로그인 오류:', error);
    throw error;
  }
}

// 네이버 로그인 콜백 처리 (partner-dashboard 페이지에서 호출)
export function handleNaverCallback(): { code: string; state: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const savedState = localStorage.getItem('naver_oauth_state');
  
  if (code && state && state === savedState) {
    localStorage.removeItem('naver_oauth_state');
    return { code, state };
  }
  return null;
}

