// 알림 필터링 로직 모의 테스트 스크립트
// Firebase에 연결하지 않고 핵심 로직만 로컬에서 테스트합니다.

const mockPartners = [
  {
    name: '강남청소반장',
    isNotificationEnabled: true,
    notificationRegions: ['강남구', '서초구', '송파구'],
    fcmToken: 'token_gangnam'
  },
  {
    name: '서울전역크린',
    isNotificationEnabled: true,
    regions: ['서울 전체/경기 일부'], // 과거 데이터 형식 (regions)
    fcmToken: 'token_seoul'
  },
  {
    name: '용인수지청소',
    isNotificationEnabled: true,
    region: '용인시 수지구', // 단일 문자열 형식
    fcmToken: 'token_yongin'
  },
  {
    name: '분당마스터',
    isNotificationEnabled: true,
    notificationRegions: ['성남시 분당구', '광주시'],
    fcmToken: 'token_bundang'
  },
  {
    name: '알림끈업체',
    isNotificationEnabled: false,
    notificationRegions: ['강남구'],
    fcmToken: 'token_off'
  }
];

const mockOrders = [
  { id: 'ORDER_1', address: '서울특별시 강남구 테헤란로 123', type: '사무실 청소' },
  { id: 'ORDER_2', address: '경기도 성남시 분당구 판교역로 456', type: '준공 청소' },
  { id: 'ORDER_3', address: '경기도 용인시 수지구 성복동 789', type: '정기 청소' },
  { id: 'ORDER_4', address: '서울특별시 마포구 월드컵북로 111', type: '이사 청소' }
];

console.log("==================================================");
console.log("🚀 청소타워 알림 필터링 모의 테스트를 시작합니다.");
console.log("==================================================\n");

function simulateNotificationLogic() {
  mockOrders.forEach(order => {
    console.log(`\n[의뢰 접수] ${order.id}`);
    console.log(`- 주소: ${order.address}`);
    console.log(`- 유형: ${order.type}`);
    console.log(`--> [발송 대상 파트너 탐색 중...]`);
    
    let matchCount = 0;

    // 1. 알림 켜진 파트너 필터링
    const enabledPartners = mockPartners.filter(p => p.isNotificationEnabled);

    // 2. 지역 매칭 로직 (functions/index.js와 동일)
    for (const partner of enabledPartners) {
      const regions = partner.notificationRegions && partner.notificationRegions.length > 0
        ? partner.notificationRegions
        : (partner.regions && partner.regions.length > 0 ? partner.regions : (partner.region ? [partner.region] : []));

      // '강남구/서초구' 등 복수 지역(슬래시) 또는 다중 선택(쉼표) 분리
      const regionList = regions.flatMap(r => r.split(/[/,]/).map(x => x.trim()));
      
      // 서울 전체 예외 처리 로직 (실제 서비스에서 필요할 수 있음)
      let isMatch = regionList.some(region => order.address.includes(region));
      
      if (regionList.includes('서울 전체') && order.address.includes('서울')) {
        isMatch = true;
      }

      if (isMatch) {
        matchCount++;
        console.log(`  ✅ 매칭 성공: [${partner.name}] (설정 지역: ${regionList.join(', ')})`);
        console.log(`     -> FCM 토큰 '${partner.fcmToken}'으로 푸시 알림 발송 시뮬레이션!`);
      }
    }

    if (matchCount === 0) {
      console.log(`  ❌ 매칭된 파트너가 없습니다.`);
    }
  });
}

simulateNotificationLogic();

console.log("\n==================================================");
console.log("✅ 모의 테스트 완료!");
console.log("==================================================");
