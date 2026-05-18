const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ★ 관리자(대표) 연락처: 모든 의뢰가 이 번호로 알림 발송됩니다.
const ADMIN_PHONE = '01012345678';

// ★ 텔레그램 봇 정보
const TELEGRAM_BOT_TOKEN = '8936248195:AAElU5VfwGa3rWNFLLnknMq13ilpZ4uPMJ4';
const TELEGRAM_CHAT_ID = '5324471356';

/**
 * 텔레그램으로 관리자에게 알림을 전송하는 함수
 */
async function sendAdminNotification(message) {
  try {
    const axios = require('axios');
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });
    console.log(`[텔레그램 알림 성공] 관리자에게 전송 완료`);
    return true;
  } catch (error) {
    console.error(`[관리자 알림 발송 실패]`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 파트너 앱으로 푸시 알림(FCM)을 전송하는 함수
 */
async function sendPushNotification(tokens, title, body) {
  if (!tokens || tokens.length === 0) {
    console.log('[푸시 알림 보류] FCM 토큰이 없습니다.');
    return false;
  }
  try {
    const message = {
      notification: {
        title: title,
        body: body
      },
      tokens: Array.isArray(tokens) ? tokens : [tokens]
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[푸시 알림 발송] 성공: ${response.successCount}, 실패: ${response.failureCount}`);
    
    // 실패한 토큰 정리 등 추가 로직 구현 가능
    return true;
  } catch (error) {
    console.error(`[푸시 알림 발송 실패]`, error);
    return false;
  }
}

/**
 * ★ 핵심: 새 견적(의뢰) 접수 시 → 관리자(대표)에게 즉시 알림 발송 및 파트너에게 푸시 알림
 */
exports.notifyAdminOnNewOrder = functions.firestore
  .document('quotes/{quoteId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const quoteId = context.params.quoteId;

    try {
      // 소비자 연락처 추출 (Quote.tsx가 contactInfo 필드로 저장)
      const customerPhone = order.contactInfo || order.phone || '미입력';
      const customerName = order.businessName || order.customerName || order.name || '고객';
      
      // 선택된 업체명 (소비자가 선택한 업체 or 자동배정 업체)
      const selectedPartner = order.designatedPartnerName || '자동배정(미정)';

      // ★ Quote.tsx의 필드명과 Dashboard 호환 필드명 모두 폴백 처리
      const orderDate = order.date || order.cleaningDate || '';
      const orderTime = order.time || order.cleaningTime || '';
      const orderAddress = order.location || order.address || '';
      const orderHouse = order.house || (order.houseType ? `${order.houseType} ${order.houseSubType || ''}` : '');
      const orderType = order.type || order.cleaningType || '프리미엄';

      // ★ 관리자에게 발송할 상세 알림 구성
      const adminMsg = `🔔 [데일리하우징] 새 의뢰 접수!

📋 의뢰번호: ${quoteId.substring(0, 8)}
👤 고객: ${customerName}
📞 연락처: ${customerPhone}

🏠 유형: ${orderHouse}
📐 평수: ${order.size || ''}평
🧹 청소: ${orderType}
📅 일정: ${orderDate} ${orderTime}
📍 주소: ${orderAddress}

🏢 소비자 선택 업체: ${selectedPartner}
💰 견적가: ${order.totalPrice ? order.totalPrice.toLocaleString() + '원' : '협의'}

📝 옵션: ${order.options && order.options.length > 0 ? order.options.join(', ') : '없음'}
📝 메모: ${order.detail || order.memo || '없음'}

⚡ 바로 업체를 찾아 매칭해주세요!`;

      // 관리자(대표)에게 텔레그램 알림 발송 (문자발송 제외 요청)
      await sendAdminNotification(adminMsg);
      console.log(`[관리자 알림 발송 완료] 의뢰번호: ${quoteId}, 선택업체: ${selectedPartner}`);

      // ────────────────────────────────────────────
      // 지역 매칭된 파트너에게 푸시 알림(FCM) 발송
      // ────────────────────────────────────────────
      const partnersRef = admin.firestore().collection('partners');
      const partnerSnapshot = await partnersRef.where('isNotificationEnabled', '==', true).get();

      if (!partnerSnapshot.empty) {
        // ★ 위에서 이미 정의된 orderAddress 변수 사용
        for (const doc of partnerSnapshot.docs) {
          const partner = doc.data();
          const regions = partner.notificationRegions && partner.notificationRegions.length > 0
            ? partner.notificationRegions
            : (partner.region ? [partner.region] : []);

          const isMatch = regions.some(region => orderAddress.includes(region));

          if (isMatch) {
            const partnerName = partner.companyName || partner.name || '파트너';
            const partnerMsg = `[데일리하우징 새 오더 도착]\n${partnerName} 파트너님! 희망 지역에 새로운 청소 의뢰가 접수되었습니다.\n\n- 주소: ${orderAddress}\n- 일정: ${orderDate} ${orderTime}\n- 평수: ${order.size || ''}평\n- 유형: ${orderType}\n\n지금 바로 파트너 앱에 접속하여 오더를 확인하세요!`;
            
            // 파트너 앱 푸시 발송
            const tokens = partner.fcmTokens || (partner.fcmToken ? [partner.fcmToken] : []);
            if (tokens.length > 0) {
              await sendPushNotification(tokens, '새로운 청소 의뢰 도착!', partnerMsg);
            } else {
              console.log(`[푸시 알림 보류] ${partnerName} 파트너의 FCM 토큰이 없어 앱 푸시를 보낼 수 없습니다.`);
            }
          }
        }
      }

    } catch (error) {
      console.error("[알림 발송 실패]", error);
    }
  });

/**
 * 신규 파트너 가입 시 관리자 알림 + 파트너 앱 푸시 환영 메시지 발송
 */
exports.notifyPartnerOnSignup = functions.firestore
  .document('partners/{partnerId}')
  .onCreate(async (snap, context) => {
    const newPartner = snap.data();
    
    const partnerName = newPartner.businessType === 'business' ? newPartner.companyName : newPartner.name;
    const phone = newPartner.realPhone || newPartner.phone;

    try {
      // ★ 관리자에게 새 파트너 가입 알림
      const adminSignupMsg = `🆕 [청소타워] 파트너스 가입 요청!
업체명: ${partnerName || '미입력'}
연락처: ${phone || '미입력'}
플랜: ${newPartner.plan || 'basic'}
지역: ${newPartner.region || '미입력'}
가입일: ${new Date().toLocaleString('ko-KR')}`;

      // await sendAdminNotification(adminSignupMsg);

      // 파트너에게 환영 푸시 메시지 발송
      const msg = `${partnerName} 파트너님, 환영합니다! 🎉\n청소타워 파트너 가입이 완료되었습니다.\n승인이 완료되면 즉시 오더를 수신하실 수 있습니다.`;
      
      const tokens = newPartner.fcmTokens || (newPartner.fcmToken ? [newPartner.fcmToken] : []);
      if (tokens.length > 0) {
        await sendPushNotification(tokens, '청소타워 파트너 가입 완료', msg);
        console.log(`[Signup Notification] ${partnerName} 파트너님께 가입 환영 푸시 발송 성공`);
      } else {
        console.log(`[Signup Notification] ${partnerName} 파트너님 FCM 토큰 없어 푸시 보류`);
      }
    } catch (error) {
      console.error(`[Signup Notification] ${partnerName} 파트너 알림 발송 중 오류:`, error);
    }
  });
