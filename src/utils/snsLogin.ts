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
    await loadScript('https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js');
    
    return new Promise((resolve) => {
      const naver = (window as any).naver;
      if (!naver) {
        resolve({ success: false });
        return;
      }

      // 네이버 로그인 버튼을 임시 생성하여 클릭시키는 방식으로 팝업 트리거
      const divId = 'naver_id_login_temp';
      let tempDiv = document.getElementById(divId);
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = divId;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }

      const naverLogin = new naver.LoginWithNaverId({
        clientId: finalClientId,
        callbackUrl: window.location.origin + '/partner-dashboard',
        isPopup: true,
        loginButton: { color: 'green', type: 3, height: 60 }
      });
      naverLogin.init();

      // 로그인 처리
      naverLogin.getLoginStatus(async (status: boolean) => {
        if (status) {
          resolve({
            success: true,
            profile: {
              id: String(naverLogin.user.id),
              provider: 'naver',
              name: naverLogin.user.name || naverLogin.user.nickname || '네이버 사용자',
              email: naverLogin.user.email,
              phone: naverLogin.user.mobile || undefined,
              image: naverLogin.user.profile_image
            }
          });
        } else {
          resolve({ success: false });
        }
      });
    });
  } catch (error) {
    console.error('Naver 로그인 오류:', error);
    throw error;
  }
}
