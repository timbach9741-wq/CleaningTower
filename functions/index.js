const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ★ 관리자(대표) 연락처: 모든 의뢰가 이 번호로 알림 발송됩니다.
const ADMIN_PHONE = '01012345678';

// ★ 텔레그램 봇 정보
const TELEGRAM_BOT_TOKEN = '8936248195:AAElU5VfwGa3rWNFLLnknMq13ilpZ4uPMJ4';
const TELEGRAM_CHAT_ID = '5324471356';

/**
 * 텔레그램으로 알림을 전송하는 함수
 */
async function sendNotification(to, message) {
  try {
    // 관리자(ADMIN_PHONE)에게 보내는 메시지일 경우 텔레그램으로 전송
    if (to === ADMIN_PHONE) {
      const axios = require('axios');
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(url, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      });
      console.log(`[텔레그램 알림 성공] 관리자에게 전송 완료`);
    } else {
      // 일반 파트너에게 가는 메시지는 임시로 로그만 남김 (추후 알림톡/문자 연동)
      console.log(`📨 [알림 발송 - Mock] 수신자: ${to}`);
      console.log(`📝 내용:\n${message}`);
    }
    return true;
  } catch (error) {
    console.error(`[알림 발송 실패]`, error.response?.data || error.message);
    return false;
  }
}

/**
 * ★ 핵심: 새 견적(의뢰) 접수 시 → 관리자(대표)에게 즉시 알림 발송
 * 
 * [운영 흐름]
 * 1. 소비자가 업체를 선택하거나 자동배정으로 견적 접수
 * 2. Firestore 'quotes' 컬렉션에 문서 생성 → 이 함수가 자동 트리거
 * 3. 관리자(대표)에게 의뢰 상세정보 알림 발송
 * 4. 대표가 직접 청소업체를 찾아 소비자와 매칭
 * 
 * 소비자는 "내가 선택한 업체에 전달됨"으로 인식하지만,
 * 실제로는 대표가 중간에서 수동 중개하는 구조 (초기 운영 전략)
 */
exports.notifyAdminOnNewOrder = functions.firestore
  .document('quotes/{quoteId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const quoteId = context.params.quoteId;

    try {
      // 소비자 연락처 추출
      const customerPhone = order.contactInfo || '미입력';
      const customerName = order.customerName || order.name || '고객';
      
      // 선택된 업체명 (소비자가 선택한 업체 or 자동배정 업체)
      const selectedPartner = order.designatedPartnerName || '자동배정(미정)';

      // ★ 관리자에게 발송할 상세 알림 구성
      const adminMsg = `🔔 [데일리하우징] 새 의뢰 접수!

📋 의뢰번호: ${quoteId.substring(0, 8)}
👤 고객: ${customerName}
📞 연락처: ${customerPhone}

🏠 유형: ${order.houseType || ''} ${order.houseSubType || ''}
📐 평수: ${order.size || ''}평
🧹 청소: ${order.cleaningType || '프리미엄'}
📅 일정: ${order.cleaningDate || ''} ${order.cleaningTime || ''}
📍 주소: ${order.address || order.location || ''}

🏢 소비자 선택 업체: ${selectedPartner}
💰 견적가: ${order.totalPrice ? order.totalPrice.toLocaleString() + '원' : '협의'}

📝 옵션: ${order.options && order.options.length > 0 ? order.options.join(', ') : '없음'}
📝 메모: ${order.memo || '없음'}

⚡ 바로 업체를 찾아 매칭해주세요!`;

      // 관리자(대표)에게 알림 발송 (현재 Mock → 추후 카카오톡)
      await sendNotification(ADMIN_PHONE, adminMsg);
      console.log(`[관리자 알림 발송 완료] 의뢰번호: ${quoteId}, 선택업체: ${selectedPartner}`);

      // ────────────────────────────────────────────
      // [추후 확장] 실제 파트너가 입점하면 아래 로직 활성화
      // 지역 매칭된 파트너에게도 카카오 알림톡 발송
      // ────────────────────────────────────────────
      const partnersRef = admin.firestore().collection('partners');
      const partnerSnapshot = await partnersRef.where('isNotificationEnabled', '==', true).get();

      if (!partnerSnapshot.empty) {
        const orderLocation = order.address || order.location || '';
        
        for (const doc of partnerSnapshot.docs) {
          const partner = doc.data();
          const regions = partner.notificationRegions && partner.notificationRegions.length > 0
            ? partner.notificationRegions
            : (partner.region ? [partner.region] : []);

          const isMatch = regions.some(region => orderLocation.includes(region));

          if (isMatch && (partner.realPhone || partner.phone)) {
            const partnerName = partner.companyName || partner.name || '파트너';
            const partnerMsg = `[데일리하우징 새 오더 도착]
${partnerName} 파트너님! 희망 지역에 새로운 청소 의뢰가 접수되었습니다.

- 주소: ${orderLocation}
- 일정: ${order.cleaningDate || order.date || ''} ${order.cleaningTime || order.time || ''}
- 평수: ${order.size || ''}평
- 유형: ${order.cleaningType || order.type || ''}

지금 바로 파트너 대시보드에 접속하여 오더를 확인하세요!`;
            
            await sendNotification(partner.realPhone || partner.phone, partnerMsg);
          }
        }
      }

    } catch (error) {
      console.error("[관리자 알림 발송 실패]", error);
    }
  });

/**
 * 신규 파트너 가입 시 관리자 알림 + 파트너 환영 메시지 발송
 */
exports.notifyPartnerOnSignup = functions.firestore
  .document('partners/{partnerId}')
  .onCreate(async (snap, context) => {
    const newPartner = snap.data();
    
    const partnerName = newPartner.businessType === 'business' ? newPartner.companyName : newPartner.name;
    const phone = newPartner.realPhone || newPartner.phone;

    if (!phone) {
      console.error(`[Signup Notification] 연락처 누락으로 발송 실패 (Partner ID: ${context.params.partnerId})`);
      return;
    }

    try {
      // ★ 관리자에게 새 파트너 가입 알림
      const adminSignupMsg = `🆕 [청소타워] 파트너스 가입 요청!
업체명: ${partnerName || '미입력'}
연락처: ${phone}
플랜: ${newPartner.plan || 'basic'}
지역: ${newPartner.region || '미입력'}
가입일: ${new Date().toLocaleString('ko-KR')}`;

      await sendNotification(ADMIN_PHONE, adminSignupMsg);

      // 파트너에게 환영 메시지
      const msg = `[청소타워 파트너 가입 완료]
${partnerName} 파트너님, 환영합니다! 🎉
청소타워 파트너 가입이 완료되었습니다.

승인이 완료되면 즉시 오더를 수신하실 수 있습니다.

- 문의: 카카오톡 '청소타워' 채널
- 파트너 페이지: https://cleantower.kr/partner`;

      await sendNotification(phone, msg);
      console.log(`[Signup Notification] ${partnerName} 파트너님께 가입 안내 발송 성공`);
    } catch (error) {
      console.error(`[Signup Notification] ${partnerName} 파트너 알림 발송 중 오류:`, error);
    }
  });
