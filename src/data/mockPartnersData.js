/**
 * 지역별 Mock 파트너 데이터 생성기
 * 각 지역: 독점 2곳, 프리미엄 15곳, 일반 20곳 = 37곳 × 16지역 = ~592개
 */

const IMAGES = [
  '/images/partners/team_blue_uniform.webp',
  '/images/partners/couple_team_apron.webp',
  '/images/partners/female_team_green.webp',
  '/images/partners/male_steam_expert.webp',
  '/images/partners/experienced_leader.webp',
  '/images/partners/mixed_team_white.webp',
  '/images/partners/female_eco_expert.webp',
  '/images/partners/young_duo_brothers.webp',
  '/images/partners/young_couple_team.webp',
  '/images/partners/premium_team_black.webp',
  '/images/partners/female_duo_cheerful.webp',
  '/images/partners/team_karcher_equip.webp',
  '/images/partners/large_team_photo.webp',
  '/images/partners/female_leader_pro.webp',
  '/images/partners/team_orange_vest.webp',
  '/images/partners/couple_mature_expert.webp',
  '/images/partners/young_female_solo.webp',
  '/images/partners/team_red_uniform.webp',
  '/images/partners/male_solo_trusted.webp',
  '/images/partners/team_gray_modern.webp',
  '/images/partners/couple_young_casual.webp',
  '/images/partners/team_professional_van.webp',
];

const REGIONS = [
  { key: 'gangnam', label: '서울 강남/서초/송파/강동', short: '강남' },
  { key: 'mapo', label: '서울 마포/용산/성동/광진', short: '마포' },
  { key: 'gangseo', label: '서울 강서/영등포/양천/구로', short: '강서' },
  { key: 'nowon', label: '서울 노원/도봉/강북/성북', short: '노원' },
  { key: 'eunpyeong', label: '서울 은평/서대문/종로/중구', short: '은평' },
  { key: 'gyeonggi_south', label: '경기 남부 (수원/성남/용인)', short: '수원' },
  { key: 'gyeonggi_hwaseong', label: '경기 화성/오산 (동탄신도시)', short: '화성' },
  { key: 'gyeonggi_ansan', label: '경기 안산/시흥/광명', short: '안산' },
  { key: 'gyeonggi_sw', label: '경기 서남부 (안양/과천/군포)', short: '안양' },
  { key: 'gyeonggi_west', label: '경기 서부 (부천/김포)', short: '부천' },
  { key: 'gyeonggi_north', label: '경기 북부 (고양/파주)', short: '고양' },
  { key: 'gyeonggi_east', label: '경기 동부 (구리/남양주/하남)', short: '구리' },
  { key: 'incheon', label: '인천 전지역', short: '인천' },
  { key: 'daejeon', label: '대전/세종/충청권', short: '대전' },
  { key: 'daegu', label: '대구/경북권', short: '대구' },
  { key: 'busan', label: '부산/울산/경남권', short: '부산' },
  { key: 'gwangju', label: '광주/전라권', short: '광주' },
  { key: 'gangwon', label: '강원/제주권', short: '강원' },
];

// ── 이름 풀 (15개 프리미엄 + 20개 일반 지원) ──
const EX_NAMES = [['{r} 퍼펙트 클린','{r} 마스터 홈케어'],['{r} 클린하우스','{r} 프리미엄 케어']];
const PM_NAMES = [
  '{r} 에코 클리닝','클린탑 {r}점','{r} 스마일 홈케어','{r} 화이트 클린',
  '더클린 {r}','{r} 청소의 정석','블루스카이 {r}점','{r} 홈닥터',
  '{r} 스팀마스터','골드클린 {r}점','{r} 프로케어','{r} 클린파워',
  '하이클린 {r}','{r} 원픽 홈케어','스카이블루 {r}점','{r} 럭셔리 케어',
  '{r} 하이엔드 클린','클린원 {r}점','{r} 트러스트 홈케어','{r} 다이아 클린',
];
const BA_NAMES = [
  '{r} 성실 청소반장','반짝반짝 {r}점','{r} 클린메이트','우리동네 {r} 청소',
  '{r} 프레시룸','더깔끔 {r}점','{r} 마법의 손길','청소하는 {r} 사람들',
  '{r} 맑은집','피카피카 {r}점','{r} 새하얀 홈','깔끔대장 {r}점',
  '{r} 행복한 청소','{r} 청소나라','손끝마법 {r}점','우리집 {r} 청소',
  '{r} 맑은하늘 클린','꼼꼼이 {r}점','{r} 으뜸 청소','스마일 {r} 홈케어',
  '{r} 보람 청소','{r} 참잘해요','열심히 {r}점','청소달인 {r}',
  '{r} 깨끗한 시작','두손모아 {r}점',
];

// ── 설명 풀 (프리미엄 20개, 일반 24개) ──
const PM_DESCS = [
  '100% 직영팀 운영으로 책임감 있는 홈케어 서비스를 제공합니다.',
  '독일제 친환경 세제만 고집합니다. 아이와 반려동물 안심!',
  '사장님이 직접 뛰어 하루 한 집만 완벽하게 작업합니다.',
  '화이트톤 인테리어 전문! 스크래치 없이 오염만 제거합니다.',
  '보이지 않는 구석의 먼지까지 확실하게 책임집니다.',
  '고온 스팀 살균 전문! 새집증후군 걱정 없는 깨끗한 공간.',
  '꼼꼼함이 자랑인 여성 전문 팀! 디테일이 다릅니다.',
  '베란다, 새시, 하수구까지 완벽 분해 청소를 약속합니다.',
  '호텔급 프리미엄 청소 서비스. VIP 고객 전담팀 운영.',
  '10년 경력 마스터급 팀장이 직접 현장을 책임집니다.',
  '독일 카처 장비와 친환경 세제로 안전한 홈케어.',
  '에어컨, 세탁기 분해청소까지 원스톱 서비스 제공.',
  '야간/주말 청소 가능! 바쁜 고객을 위한 맞춤 스케줄.',
  '재이용률 90%! 한 번 맡기면 다시 찾는 서비스.',
  '신축 아파트 입주청소 전문. 5000건 이상 시공 경험.',
  '실리콘 코팅, 발수 코팅까지 풀패키지 서비스 제공.',
  '살균+탈취+코팅 3단계 프리미엄 케어 시스템 운영.',
  '당일 예약, 당일 시공 가능! 긴급 출동 서비스.',
  '부부 동반 작업으로 꼼꼼함과 속도를 동시에 잡습니다.',
  '시공 후 48시간 내 무료 AS 보장. 고객만족도 1위.',
];
const BA_DESCS = [
  '10년 차 부부가 직접 방문합니다. 틈새까지 완벽하게.',
  '합리적인 가격, 하루 한 집만 꼼꼼히 작업합니다.',
  '친절한 젊은 팀! 내 집처럼 소중히 다룹니다.',
  '찌든 때, 묵은 때 완벽 제거! 합리적인 가격.',
  '새집증후군 타파! 피톤치드 무료 서비스 포함.',
  '직장인 맞춤 홈케어! 믿고 맡기실 수 있습니다.',
  '마법처럼 깨끗해지는 공간을 경험해보세요.',
  '형제가 직접 운영! 책임시공, 합리적 가격.',
  '꼼꼼한 여성팀이 섬세하게 케어합니다.',
  '15년 베테랑이 직접 팀을 이끕니다.',
  '에어컨 분해청소까지 한 번에 해결합니다.',
  '새시 분해청소 전문! 레일 먼지 완벽 제거.',
  '하수구 냄새 완벽 차단! 배수구 특화 청소.',
  '아이가 있는 집 전문! 무독성 세제만 사용.',
  '베란다 특화 청소! 방충망, 새시 완벽 케어.',
  '이사 당일 청소도 OK! 빠르고 정확합니다.',
  '화장실 물때, 곰팡이 완벽 제거 전문팀.',
  '주방 후드, 가스레인지 분해 세척 전문.',
  '거실, 방, 화장실 구석구석 꼼꼼하게.',
  '착한 가격에 정직한 서비스를 약속합니다.',
  '깨끗한 새 출발을 도와드리는 전문 청소팀.',
  '엄마 손처럼 정성 가득한 청소를 해드립니다.',
  '빠르고 확실한 청소! 시간 약속 100% 준수.',
  '고객 후기 별점 4.8! 검증된 실력파 팀.',
];

// ── 태그 풀 (30개) ──
const TAGS = [
  ['#직영팀운영','#새집증후군','#살균소독'],['#친환경세제','#펫프렌들리','#아토피예방'],
  ['#하루한집','#사장님직접','#AS확실'],['#인테리어청소','#섬세한케어','#스팀소독'],
  ['#고객만족1위','#스팀살균','#꼼꼼한청소'],['#부부청소단','#AS보장','#베란다특화'],
  ['#가성비','#하루한집','#피톤치드'],['#젊은팀','#친절상담','#꼼꼼함'],
  ['#묵은때제거','#합리적가격','#경력자'],['#피톤치드무료','#새집증후군','#살균케어'],
  ['#직장인맞춤','#신속정확','#안심케어'],['#세밀한청소','#먼지제거','#광택작업'],
  ['#형제운영','#정직한가격','#책임시공'],['#여성전문팀','#디테일케어','#친환경'],
  ['#고온스팀','#카처장비','#프리미엄'],['#10년경력','#베테랑','#완벽마감'],
  ['#호텔식청소','#VIP케어','#럭셔리'],['#분해청소','#하수구','#새시전문'],
  ['#당일가능','#긴급출동','#빠른예약'],['#엄마손청소','#정성가득','#깨끗한집'],
  ['#에어컨청소','#분해세척','#곰팡이제거'],['#신축전문','#대단지','#아파트특화'],
  ['#주방특화','#후드분해','#기름때제거'],['#야간청소','#주말가능','#스케줄유연'],
  ['#코팅서비스','#발수코팅','#실리콘'],['#원스톱','#풀패키지','#올인원'],
  ['#재이용90%','#단골고객','#입소문'],['#부부팀','#협동작업','#효율적'],
  ['#무독성세제','#아이안심','#건강'],['#배수구전문','#냄새차단','#하수구'],
];

const EVENTS = [
  '🎉 5월 한정! 입주+새집증후군 동시 예약 15% 할인',
  '✨ 30평 이상 예약 시 에어컨 분해청소 무료',
  '🌿 친환경 세제 업그레이드 무료 이벤트',
  '🔥 첫 예약 고객 10% 할인 + 피톤치드 무료',
  '💎 풀패키지 예약 시 베란다 청소 무료',
  '🏠 신축 아파트 입주 시즌 특별 할인',
  '⭐ 리뷰 작성 시 5% 할인 쿠폰 증정',
  '🎁 재이용 고객 VIP 할인 적용',
  '🧹 정기 3개월 계약 시 1회 무료',
  '💐 봄맞이 대청소 전 서비스 10% 할인',
  '🎊 오픈 1주년 감사 이벤트 20% 할인',
  '🌟 커플 할인! 부부 동반 예약 시 혜택',
  '', '', '',
];

const REVIEWS = [
  { author: '김○희', rating: 5, text: '새 아파트처럼 반짝반짝! 꼭 다시 부탁드릴게요.' },
  { author: '박○준', rating: 5, text: '베란다 구석구석까지 완벽 처리해주셨어요.' },
  { author: '이○영', rating: 5, text: '부부가 오셔서 정말 열심히 해주셨어요!' },
  { author: '최○현', rating: 4, text: '화장실 청소가 특히 인상적이었어요.' },
  { author: '정○수', rating: 5, text: '친환경 세제라 아이 있는 집에 안심!' },
  { author: '강○미', rating: 5, text: '급하게 예약했는데 바로 와주셔서 감사!' },
  { author: '윤○진', rating: 5, text: '세 번째인데 매번 퀄리티 일정해요.' },
  { author: '한○석', rating: 4, text: '가성비 좋습니다. 정기 청소도 부탁드려요.' },
  { author: '조○은', rating: 5, text: '스팀 청소기 효과 대박! 강력 추천.' },
  { author: '서○호', rating: 5, text: '시간 약속 정확하고 결과도 최고!' },
  { author: '송○아', rating: 5, text: '새시 분해 청소 처음 봤어요. 프로!' },
  { author: '임○태', rating: 4, text: '꼼꼼하게 잘 해주셨어요. 재이용 예정.' },
  { author: '오○나', rating: 5, text: '팀장님 직접 체크해주셔서 안심됩니다.' },
  { author: '황○민', rating: 5, text: '반려동물 있어도 친환경이라 안심.' },
  { author: '배○라', rating: 5, text: '역대 최고! 지인들에게도 추천했어요.' },
  { author: '신○우', rating: 4, text: '시간은 좀 걸렸지만 결과 만족.' },
  { author: '류○정', rating: 5, text: '에어컨 곰팡이 완벽 제거 감사!' },
  { author: '문○혁', rating: 5, text: '30평 4시간 만에 완벽! 프로네요.' },
  { author: '장○빈', rating: 5, text: '피톤치드까지 해주시니 숲속 느낌!' },
  { author: '권○서', rating: 4, text: '물때 제거 완벽. 합리적 가격 추천.' },
  { author: '남○연', rating: 5, text: '처음부터 끝까지 친절하고 프로!' },
  { author: '유○찬', rating: 5, text: '카처 장비라 때가 싹! 장비가 다르네요.' },
  { author: '전○경', rating: 5, text: '신혼집 입주청소 대만족입니다!' },
  { author: '안○돈', rating: 4, text: '새시 청소 특히 신경 써주셔서 감사.' },
  { author: '홍○빈', rating: 5, text: '하수구 냄새까지 잡아주셔서 놀랐어요!' },
  { author: '노○진', rating: 5, text: '주말에도 와주셔서 너무 감사합니다.' },
  { author: '허○경', rating: 5, text: '이사 스트레스가 싹 풀렸어요!' },
  { author: '고○현', rating: 4, text: '합리적 가격에 깔끔한 마무리.' },
  { author: '백○아', rating: 5, text: '코팅까지 해주시니 유지가 잘 돼요!' },
  { author: '심○우', rating: 5, text: '후드 분해 세척 결과에 감탄!' },
];

const PORTFOLIO = [
  { title: '거실 바닥 청소', before: '/images/portfolio/before_living.webp', after: '/images/portfolio/after_living.webp' },
  { title: '욕실 곰팡이 제거', before: '/images/portfolio/before_bathroom.webp', after: '/images/portfolio/after_bathroom.webp' },
  { title: '주방 후드 분해세척', before: '/images/portfolio/before_kitchen.webp', after: '/images/portfolio/after_kitchen.webp' },
  { title: '새시 레일 청소', before: '/images/portfolio/before_window.webp', after: '/images/portfolio/after_window.webp' },
  { title: '화장실 유리 코팅', before: '/images/portfolio/before_glass.webp', after: '/images/portfolio/after_glass.webp' },
  { title: '베란다 바닥 세척', before: '/images/portfolio/before_balcony.webp', after: '/images/portfolio/after_balcony.webp' },
];

// ── 가능한 서비스 종류 풀 ──
const SERVICES_POOL = [
  ['입주청소', '이사청소', '거주청소', '프리미엄청소'],
  ['입주청소', '이사청소', '에어컨분해청소'],
  ['입주청소', '거주청소', '새시분해청소', '베란다청소'],
  ['입주청소', '이사청소', '프리미엄청소', '코팅서비스'],
  ['입주청소', '거주청소', '주방후드청소'],
  ['입주청소', '이사청소', '거주청소'],
];

const TEAM_SIZES = ['2~3명', '3~4명', '4~5명', '2~4명', '3~5명', '5명 이상'];

/**
 * 핵심 생성 함수
 * 각 지역: 독점 2 + 프리미엄 15 + 일반 20 = 37개
 * 16지역 × 37 = 592개
 */
export function generateMockPartners() {
  const all = [];
  let id = 1000;

  // 시드 기반 난수 (새로고침마다 동일한 값 유지)
  const seed = (s) => {
    let h = s;
    return () => { h = (h * 16807 + 0) % 2147483647; return (h - 1) / 2147483646; };
  };

  REGIONS.forEach((reg, ri) => {
    const rng = seed(ri * 1000 + 42);
    const imgOff = (ri * 7) % IMAGES.length;
    const img = (i) => IMAGES[(imgOff + i) % IMAGES.length];
    const n = (t) => t.replace(/{r}/g, reg.short);

    // ── 독점 2곳 ──
    for (let i = 0; i < 2; i++) {
      all.push({
        id: id++, tier: 'EXCLUSIVE',
        name: n(EX_NAMES[ri % 2][i]),
        rating: parseFloat((4.8 + Math.floor(rng() * 3) / 10).toFixed(1)),
        reviews: 1200 + Math.floor(rng() * 900),
        desc: `${reg.short} ${['압도적 1위! 호텔식 프리미엄 홈케어.','No.1 입주청소 전문! 100% 본사 직영팀.'][i]} 하루 딱 한 집만 완벽하게 작업합니다.`,
        tags: [`#${reg.short}1위`, ...TAGS[(ri*2+i)%TAGS.length].slice(1)],
        image: img(i), area: reg.label,
        mainServices: SERVICES_POOL[(ri+i) % SERVICES_POOL.length],
        teamSize: TEAM_SIZES[(ri+i) % TEAM_SIZES.length],
        monthlyEvent: EVENTS[(ri+i)%EVENTS.length],
        portfolio: [PORTFOLIO[(ri*2+i)%6], PORTFOLIO[(ri*2+i+1)%6]],
        recentReviews: [REVIEWS[(ri*3+i)%30], REVIEWS[(ri*3+i+1)%30], REVIEWS[(ri*3+i+2)%30]],
      });
    }

    // ── 프리미엄 15곳 ──
    for (let i = 0; i < 15; i++) {
      all.push({
        id: id++, tier: 'PREMIUM',
        name: n(PM_NAMES[(ri*4+i) % PM_NAMES.length]),
        rating: parseFloat((4.6 + Math.floor(rng() * 4) / 10).toFixed(1)),
        reviews: 300 + Math.floor(rng() * 700),
        desc: PM_DESCS[(ri*3+i) % PM_DESCS.length],
        tags: TAGS[(ri*3+i+4) % TAGS.length],
        image: img(2 + i), area: reg.label,
        mainServices: SERVICES_POOL[(ri+i+2) % SERVICES_POOL.length],
        teamSize: TEAM_SIZES[(ri+i+1) % TEAM_SIZES.length],
        monthlyEvent: EVENTS[(ri+i+3) % EVENTS.length],
        portfolio: [PORTFOLIO[(ri+i+2)%6], PORTFOLIO[(ri+i+3)%6]],
        recentReviews: [REVIEWS[(ri*4+i+5)%30], REVIEWS[(ri*4+i+6)%30], REVIEWS[(ri*4+i+7)%30]],
      });
    }

    // ── 일반 20곳 ──
    for (let i = 0; i < 20; i++) {
      all.push({
        id: id++, tier: 'BASIC',
        name: n(BA_NAMES[(ri*5+i) % BA_NAMES.length]),
        rating: parseFloat((4.4 + Math.floor(rng() * 6) / 10).toFixed(1)),
        reviews: 50 + Math.floor(rng() * 300),
        desc: BA_DESCS[(ri*4+i) % BA_DESCS.length],
        tags: TAGS[(ri*5+i+8) % TAGS.length],
        image: img(6 + i), area: reg.label,
        mainServices: SERVICES_POOL[(ri+i+3) % SERVICES_POOL.length],
        teamSize: TEAM_SIZES[(ri+i+2) % TEAM_SIZES.length],
        monthlyEvent: i < 5 ? EVENTS[(ri+i+6) % EVENTS.length] : '',
        portfolio: i < 8 ? [PORTFOLIO[(ri+i+4)%6]] : [],
        recentReviews: [REVIEWS[(ri*5+i+10)%30], REVIEWS[(ri*5+i+11)%30]],
      });
    }
  });

  return all;
}

// 한 번만 생성하여 export (렌더링마다 재생성 방지)
export const mockPartners = generateMockPartners();
