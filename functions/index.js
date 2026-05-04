const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// 임시: 알리고/솔라피 등 실제 사용하실 알림톡 API의 정보를 여기에 입력합니다.
// (보안을 위해 환경 변수나 Secret Manager를 사용하는 것이 좋습니다.)
const API_KEY = 'YOUR_API_KEY';
const API_SECRET = 'YOUR_API_SECRET';
const SENDER_PHONE = '01012345678';

/**
 * 카카오 알림톡/문자 발송 가상 함수 (실제 API 연동 필요)
 */
async function sendNotification(to, message) {
  // TODO: 여기에 실제 솔라피(Solapi) 또는 알리고(Aligo) API 호출 로직을 구현하세요.
  // axios.post('https://api.solapi.com/messages/v4/send', { ... })
  
  console.log(`[Notification Mock] To: ${to}`);
  console.log(`[Notification Mock] Message: ${message}`);
  return true;
}

exports.notifyPartnersOnNewOrder = functions.firestore
  .document('quotes/{quoteId}')
  .onCreate(async (snap, context) => {
    const newOrder = snap.data();
    const orderLocation = newOrder.location || ''; // 예: "서울 강남구 역삼동"

    try {
      // 1. 알림 수신을 켜둔 파트너 목록 조회 (isNotificationEnabled == true)
      // 프론트엔드에서 체크박스 on/off를 저장하는 필드입니다.
      const partnersRef = admin.firestore().collection('partners');
      const snapshot = await partnersRef.where('isNotificationEnabled', '==', true).get();

      const targetPartners = [];

      // 2. 지역 매칭 검사
      snapshot.forEach(doc => {
        const partner = doc.data();
        // 파트너가 설정한 여러 희망 지역들 (예: ["강남구", "서초구"])
        // 만약 설정이 없다면 partner.region (주활동지역)을 기준으로 삼습니다.
        const regions = partner.notificationRegions && partner.notificationRegions.length > 0 
          ? partner.notificationRegions 
          : (partner.region ? [partner.region] : []);
        
        // 파트너의 희망 지역 중 하나라도 오더 주소에 포함되면 발송 대상
        const isMatch = regions.some(region => orderLocation.includes(region));
        
        // 연락처가 있는 경우에만 타겟팅
        if (isMatch && partner.realPhone) {
          targetPartners.push(partner);
        }
      });

      console.log(`발송 대상 파트너 수: ${targetPartners.length}명`);

      // 3. 발송 대상 파트너들에게 알림 발송 API 호출
      for (const partner of targetPartners) {
        const partnerName = partner.businessType === 'business' ? partner.companyName : partner.name;
        const msg = `[클린파트너스 새로운 오더 도착]
${partnerName} 파트너님! 희망하신 지역에 새로운 청소 의뢰가 들어왔습니다.

- 주소: ${orderLocation}
- 일정: ${newOrder.date} ${newOrder.time}
- 평수: ${newOrder.size}평
- 형태: ${newOrder.type}

지금 바로 파트너스 앱에 접속하여 오더를 선점하세요!`;

        await sendNotification(partner.realPhone, msg);
      }

    } catch (error) {
      console.error("파트너 알림 발송 중 치명적 오류:", error);
    }
});
