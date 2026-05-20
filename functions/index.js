const functions = require('firebase-functions');
const admin = require('firebase-admin');
// 왜: 함수 실행마다 require하면 cold start가 느려지므로 최상단에서 한 번만 로딩
const axios = require('axios');

admin.initializeApp();

// ★ 관리자(대표) 연락처: 모든 의뢰가 이 번호로 알림 발송됩니다.
const ADMIN_PHONE = '01012345678';

// ★ 텔레그램 봇 정보
const TELEGRAM_BOT_TOKEN = '8936248195:AAElU5VfwGa3rWNFLLnknMq13ilpZ4uPMJ4';
const TELEGRAM_CHAT_ID = '5324471356';

/**
 * 텔레그램으로 관리자에게 알림을 전송하는 함수
 * 왜 텔레그램인가: SMS보다 무료이고, 실시간 수신이 가능하며, 봇 API가 안정적
 */
async function sendAdminNotification(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      // 왜: parse_mode를 설정하지 않으면 이모지와 특수문자가 안전하게 전송됨
    });
    console.log(`[텔레그램 알림 성공] 관리자에게 전송 완료`);
    return true;
  } catch (error) {
    console.error(`[관리자 알림 발송 실패]`, error.response?.data || error.message);
    return false;
  }
}

/**
 * 🟡 추후 구현 예정: 카카오 알림톡(비즈메시지) API 연동 플레이스홀더
 * 고객에게 배정 완료, 예약 확정 등의 안내 메시지를 카카오톡으로 발송합니다.
 * (사업자 등록 이후 알리고(Aligo) 또는 솔라피(Solapi) API 연동 시 실제 코드로 대체)
 */
async function sendCustomerKakaoNotification(phone, templateCode, templateData) {
  if (!phone || phone === '미입력') return false;
  
  // TODO: 실제 API 발송 로직 추가 (axios.post)
  console.log(`[카카오 알림톡 발송 대기] 수신처: ${phone}, 템플릿: ${templateCode}`);
  console.log(`[메시지 내용 시뮬레이션]\n${templateData}`);
  
  return true;
}

/**
 * 파트너 앱으로 푸시 알림(FCM)을 전송하는 함수
 * 왜 sendEachForMulticast: 여러 토큰에 한번에 발송하고, 개별 성공/실패를 추적할 수 있음
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
    
    // 왜: 만료되거나 잘못된 토큰은 Firestore에서 정리하여 다음 발송 시 불필요한 실패 방지
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.warn(`[토큰 실패] ${tokens[idx]}: ${resp.error?.message}`);
        }
      });
      // TODO: 실패한 토큰을 Firestore에서 제거하는 로직 추가 가능
    }
    
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

      // 관리자(대표)에게 텔레그램 알림 발송
      await sendAdminNotification(adminMsg);
      console.log(`[관리자 알림 발송 완료] 의뢰번호: ${quoteId}, 선택업체: ${selectedPartner}`);

      // ────────────────────────────────────────────
      // 파트너에게 푸시 알림(FCM) 발송 (지정 배정 vs 일반 지역 매칭)
      // ────────────────────────────────────────────
      const partnersRef = admin.firestore().collection('partners');

      if (order.assignedTo) {
        // [케이스 1] 고객이 특정 파트너를 콕 집어 의뢰한 경우 (지정 오더)
        const assignedPartnerDoc = await partnersRef.doc(order.assignedTo).get();
        if (assignedPartnerDoc.exists) {
          const partner = assignedPartnerDoc.data();
          const partnerName = partner.companyName || partner.name || '파트너';
          const partnerMsg = `[⭐️지정 의뢰 도착]\n${partnerName} 파트너님을 지정하여 들어온 새로운 의뢰입니다!\n\n- 고객: ${customerName}\n- 주소: ${orderAddress}\n- 일정: ${orderDate} ${orderTime}\n- 유형: ${orderType}\n\n고객님이 대표님의 연락을 기다리고 있습니다! 앱에서 확인해주세요.`;
          
          const tokens = partner.fcmTokens || (partner.fcmToken ? [partner.fcmToken] : []);
          if (tokens.length > 0) {
            await sendPushNotification(tokens, '⭐️ 단독 지정 의뢰가 도착했습니다!', partnerMsg);
            console.log(`[지정 푸시 알림 발송 완료] 파트너: ${partnerName}`);
          } else {
            console.log(`[푸시 알림 보류] ${partnerName} 파트너의 FCM 토큰이 없습니다.`);
          }
        }
      } else {
        // [케이스 2] 특정 파트너가 지정되지 않은 경우 -> 조건(지역)에 맞는 파트너들에게 발송
        const partnerSnapshot = await partnersRef.where('isNotificationEnabled', '==', true).get();

        if (!partnerSnapshot.empty) {
          for (const doc of partnerSnapshot.docs) {
            const partner = doc.data();
            const regions = partner.notificationRegions && partner.notificationRegions.length > 0
              ? partner.notificationRegions
              : (partner.regions && partner.regions.length > 0 ? partner.regions : (partner.region ? [partner.region] : []));

            // '강남구/서초구' 등 복수 지역(슬래시) 또는 다중 선택(쉼표) 분리
            const regionList = regions.flatMap(r => r.split(/[/,]/).map(x => x.trim()));
            const isMatch = regionList.some(region => orderAddress.includes(region));

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
      }

    } catch (error) {
      console.error("[알림 발송 실패]", error);
    }
  });

/**
 * ★ 새로 추가: 의뢰(quote) 상태 변경 시 관련 당사자에게 알림 발송
 * 왜 필요한가: 파트너가 오더를 수락/취소하면 관리자와 고객이 알아야 함
 */
exports.notifyOnOrderStatusChange = functions.firestore
  .document('quotes/{quoteId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const quoteId = context.params.quoteId;

    // 상태가 변경되지 않았으면 무시
    if (before.status === after.status) return null;

    const customerName = after.name || after.customerName || after.businessName || '고객';
    const orderAddress = after.location || after.address || '';
    const orderDate = after.date || after.cleaningDate || '';
    const partnerName = after.partnerName || '파트너';

    try {
      // ★ 케이스별 알림 분기
      switch (after.status) {
        case '상담완료': {
          // 왜: 파트너가 오더를 수락했을 때 관리자에게 즉시 알림
          const msg = `✅ [오더 수락됨]
📋 의뢰번호: ${quoteId.substring(0, 8)}
👤 고객: ${customerName}
📍 주소: ${orderAddress}
📅 일정: ${orderDate}
🏢 수락 파트너: ${partnerName}

✔️ 파트너가 오더를 수락했습니다. 고객에게 안내해주세요.`;
          await sendAdminNotification(msg);
          
          // 🟡 고객에게 '파트너 배정 완료' 카카오톡 발송 (추후 실제 API 연동 시 활성화)
          const customerPhone = after.contactInfo || after.phone || after.realPhone || '미입력';
          const kakaoMessage = `[청소타워 - 배정 완료 안내]\n\n${customerName} 고객님, 요청하신 청소 의뢰에 파트너가 배정되었습니다!\n\n▶ 배정된 파트너: ${partnerName}\n▶ 서비스 일정: ${orderDate}\n\n곧 담당 파트너가 고객님께 직접 연락을 드릴 예정입니다. 감사합니다.`;
          
          await sendCustomerKakaoNotification(customerPhone, 'ASSIGN_COMPLETE', kakaoMessage);
          
          break;
        }
        
        case '취소': {
          // 왜: 취소는 운영에 중대한 영향을 미치므로 즉시 알림 필요
          const cancelReason = after.cancelReason || '사유 미입력';
          const msg = `❌ [오더 취소됨]
📋 의뢰번호: ${quoteId.substring(0, 8)}
👤 고객: ${customerName}
📍 주소: ${orderAddress}
📅 일정: ${orderDate}
🏢 취소 파트너: ${partnerName}
💬 취소 사유: ${cancelReason}

⚠️ 긴급 대타를 구해주세요!`;
          await sendAdminNotification(msg);
          break;
        }

        case '정산대기': {
          // 왜: 작업 완료는 정산 프로세스 시작 신호이므로 관리자가 알아야 함
          const msg = `🎉 [작업 완료 - 정산 대기]
📋 의뢰번호: ${quoteId.substring(0, 8)}
👤 고객: ${customerName}
📍 주소: ${orderAddress}
🏢 시공 파트너: ${partnerName}
⏰ 완료 시각: ${after.completedAt || new Date().toISOString()}

💰 정산을 진행해주세요.`;
          await sendAdminNotification(msg);
          break;
        }

        case '청소완료': {
          // 왜: 정산까지 완료된 최종 상태 — 파트너에게 정산 완료 푸시 발송
          if (after.assignedTo) {
            const partnerDoc = await admin.firestore().collection('partners').doc(after.assignedTo).get();
            if (partnerDoc.exists) {
              const partnerData = partnerDoc.data();
              const tokens = partnerData.fcmTokens || (partnerData.fcmToken ? [partnerData.fcmToken] : []);
              if (tokens.length > 0) {
                await sendPushNotification(
                  tokens, 
                  '정산 완료! 💰', 
                  `${customerName} 고객님 건의 정산이 완료되었습니다. 파트너 대시보드에서 확인하세요.`
                );
              }
            }
          }
          break;
        }

        default:
          // 기타 상태 변경은 로그만 기록
          console.log(`[상태 변경] ${quoteId}: ${before.status} → ${after.status}`);
      }

    } catch (error) {
      console.error(`[상태 변경 알림 실패] ${quoteId}:`, error);
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
      // ★ 관리자에게 새 파트너 가입 알림 (주석 해제 — 이전에 비활성화되어 있어 알림이 안 왔음)
      const adminSignupMsg = `🆕 [청소타워] 파트너스 가입 요청!
업체명: ${partnerName || '미입력'}
연락처: ${phone || '미입력'}
플랜: ${newPartner.plan || 'basic'}
지역: ${newPartner.regions ? newPartner.regions.join(', ') : (newPartner.region || '미입력')}
가입일: ${new Date().toLocaleString('ko-KR')}`;

      await sendAdminNotification(adminSignupMsg);

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

