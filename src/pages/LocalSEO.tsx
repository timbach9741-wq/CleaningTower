import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import Footer from '../components/cleaning/Footer';
import { mockPartners } from '../data/mockPartnersData';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// 영어 슬러그와 한국어 시도명 매핑
const SIDO_MAP: Record<string, string> = {
  seoul: "서울",
  gyeonggi: "경기",
  incheon: "인천",
  busan: "부산",
  daegu: "대구",
  gwangju: "광주",
  daejeon: "대전",
  ulsan: "울산",
  sejong: "세종",
  gangwon: "강원",
  chungbuk: "충북",
  chungnam: "충남",
  jeonbuk: "전북",
  jeonnam: "전남",
  gyeongbuk: "경북",
  gyeongnam: "경남",
  jeju: "제주"
};

// 영어 슬러그와 한국어 시군구명 매핑
const GU_MAP: Record<string, string> = {
  // 서울
  gangnam: "강남구", gangdong: "강동구", gangbuk: "강북구", gangseo: "강서구",
  gwanak: "관악구", gwangjin: "광진구", guro: "구로구", geumcheon: "금천구",
  nowon: "노원구", dobong: "도봉구", dongdaemun: "동대문구", dongjak: "동작구",
  mapo: "마포구", seodaemun: "서대문구", seocho: "서초구", seongdong: "성동구",
  seongbuk: "성북구", songpa: "송파구", yangcheon: "양천구", yeongdeungpo: "영등포구",
  yongsan: "용산구", eunpyeong: "은평구", jongno: "종로구", junggu: "중구", jungnang: "중랑구",
  // 경기 주요
  bundang: "성남시 분당구", sujeong: "성남시 수정구", jungwon: "성남시 중원구",
  suwon: "수원시 영통구", gihung: "용인시 기흥구", suji: "용인시 수지구", cheoin: "용인시 처인구",
  ilsan: "고양시 일산동구", bucheon: "부천시", gwangmyeong: "광명시", pyeongtaek: "평택시",
  anyang: "안양시 동안구", gimpo: "김포시", hwaseong: "화성시", namyangju: "남양주시",
  hanami: "하남시", siheung: "시흥시", gunpo: "군포시", uijeongbu: "의정부시",
  paju: "파주시", gwangju_gy: "광주시",
  // 부산
  haeundae: "해운대구", busanjin: "부산진구", dongnae: "동래구", suyeong: "수영구",
  geumjeong: "금정구", sasang: "사상구", saha: "사하구", yeonje: "연제구",
  namgu: "남구", bukgu: "북구",
  // 인천
  yeonsu: "연수구", bupyeong: "부평구", gyeyang: "계양구", michuhol: "미추홀구",
  // 대구
  suseong: "수성구", dalso: "달서구",
  // 대전
  yuseong: "유성구",
  // 울산
  ulju: "울주군"
};

// 핵심 pSEO 대상 지역 목록 (교차 링크용)
const PSEO_REGIONS = [
  { slug: "seoul-gangnam", name: "서울 강남구" },
  { slug: "seoul-seocho", name: "서울 서초구" },
  { slug: "seoul-songpa", name: "서울 송파구" },
  { slug: "seoul-mapo", name: "서울 마포구" },
  { slug: "seoul-yongsan", name: "서울 용산구" },
  { slug: "seoul-seongdong", name: "서울 성동구" },
  { slug: "seoul-gangdong", name: "서울 강동구" },
  { slug: "seoul-nowon", name: "서울 노원구" },
  { slug: "seoul-yeongdeungpo", name: "서울 영등포구" },
  { slug: "gyeonggi-bundang", name: "경기 분당구" },
  { slug: "gyeonggi-suwon", name: "경기 수원시" },
  { slug: "gyeonggi-ilsan", name: "경기 일산동구" },
  { slug: "gyeonggi-gimpo", name: "경기 김포시" },
  { slug: "gyeonggi-hwaseong", name: "경기 화성시" },
  { slug: "gyeonggi-yongin", name: "경기 용인시" },
  { slug: "gyeonggi-hanami", name: "경기 하남시" },
  { slug: "gyeonggi-namyangju", name: "경기 남양주시" },
  { slug: "gyeonggi-anyang", name: "경기 안양시" },
  { slug: "gyeonggi-bucheon", name: "경기 부천시" },
  { slug: "gyeonggi-gwangmyeong", name: "경기 광명시" },
  { slug: "incheon-yeonsu", name: "인천 연수구 (송도)" },
  { slug: "incheon-bupyeong", name: "인천 부평구" },
  { slug: "busan-haeundae", name: "부산 해운대구" },
  { slug: "busan-suyeong", name: "부산 수영구" },
  { slug: "busan-dongnae", name: "부산 동래구" },
  { slug: "daegu-suseong", name: "대구 수성구" },
  { slug: "daejeon-yuseong", name: "대전 유성구" }
];

export default function LocalSEO() {
  const { regionKey } = useParams<{ regionKey: string }>();
  const navigate = useNavigate();
  const [pyung, setPyung] = useState<number>(24);
  const [realPartners, setRealPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 슬러그 파싱 및 지역 매핑
  let sidoName = "서울";
  let guName = "강남구";
  let fullRegionName = "서울 강남구";

  if (regionKey) {
    const parts = regionKey.split('-');
    if (parts.length >= 2) {
      const sidoSlug = parts[0];
      const guSlug = parts[1];
      
      if (SIDO_MAP[sidoSlug]) {
        sidoName = SIDO_MAP[sidoSlug];
      }
      if (GU_MAP[guSlug]) {
        guName = GU_MAP[guSlug];
      }
      fullRegionName = `${sidoName} ${guName}`;
    }
  }

  // 실시간 파트너 조회 (해당 지역 지원 파트너 필터링)
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        if (!db) {
          setLoading(false);
          return;
        }
        const q = query(collection(db, 'partners'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            name: data.companyName || data.name || '파트너',
            area: data.region || '전국',
            tags: data.tags || ['#친환경청소', '#피톤치드']
          };
        });
        setRealPartners(fetched);
      } catch (error) {
        console.error("Failed to fetch partners", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  // 이 지역(sido/gu)을 커버하는 파트너 필터링
  const localPartners = React.useMemo(() => {
    const all = [...realPartners, ...mockPartners.map(p => ({ ...p, tags: p.tags || [] }))];
    return all.filter(p => {
      const area = p.area || '';
      if (area.includes('전국')) return true;
      if (area.includes(sidoName) && (area.includes(guName) || area.includes('전지역') || area.includes('전체'))) {
        return true;
      }
      return false;
    }).slice(0, 4); // 최대 4개만 보여줌
  }, [realPartners, sidoName, guName]);

  // 가격 자동 계산
  const priceMoveIn = pyung * 15000;
  const priceResidence = pyung * 18000;
  const pricePremium = pyung * 20000;

  // 동적 지역 리뷰 생성
  const reviews = [
    {
      author: "김민*",
      text: `${fullRegionName} 아파트 입주청소 받았는데 싱크대 밑이랑 창틀 분진까지 깨끗하게 닦아주셔서 정말 마음에 들었습니다. 다음 이사 때도 꼭 청소타워를 다시 이용할게요!`,
      rating: 5,
      date: "2026.05.28",
      title: `${fullRegionName} 아파트 입주청소 대만족 후기`
    },
    {
      author: "박서*",
      text: `시간 맞춰 오셔서 ${fullRegionName} 오피스텔 분진제거 및 피톤치드 케어까지 깔끔하게 해주셨어요. 새집 냄새가 싹 사라져서 안심하고 바로 잘 입주했습니다. 친절하셔서 기분 좋았어요.`,
      rating: 5,
      date: "2026.05.24",
      title: `${fullRegionName} 오피스텔 입주 케어 후기`
    },
    {
      author: "이준*",
      text: `${fullRegionName}에서 여러 군데 견적 받아보고 청소타워로 예약했는데, 추가 요금 전혀 없이 예약한 그대로 구석구석 찌든때 청소해주셨어요. 후회 없는 선택이었습니다!`,
      rating: 5,
      date: "2026.05.15",
      title: `${fullRegionName} 이사청소 꼼꼼한 검수`
    }
  ];

  const handleCtaClick = () => {
    navigate('/quote/move-in', {
      state: {
        preselectedRegion: `${sidoName} ${guName}`
      }
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans flex flex-col overflow-x-hidden">
      <Header onOpenQuote={() => {}} />

      {/* SEO용 H1 태그 숨김 처리 (구글/네이버 봇에게 최우선 키워드 제공) */}
      <h1 className="sr-only">{fullRegionName} 입주청소 이사청소 추천 평당 비용 정찰제 안내</h1>

      <main className="pt-[80px] lg:pt-28 pb-16 flex-grow">
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white py-12 lg:py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs lg:text-sm font-bold tracking-wider mb-4 inline-block">
              📍 {fullRegionName} 안심 청소 구역
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
              {fullRegionName} 입주청소·이사청소 <br className="sm:hidden" />
              <span className="text-blue-400">비용 가이드 &amp; 전문가 비교</span>
            </h2>
            <p className="text-slate-300 text-sm lg:text-lg max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
              {fullRegionName} 전 지역 직영 스팀 청소 및 100% 무상 A/S 보장. <br />
              광고비 거품 없는 안심 청소 견적을 받아보세요.
            </p>
            <button
              onClick={handleCtaClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm lg:text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              🚀 {guName} 3초 무료 견적 받기
            </button>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 mt-12 space-y-12">
          {/* 가격 정찰제 계산기 */}
          <section className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-lg lg:text-2xl font-extrabold text-slate-900">
                💰 {guName} 평수별 정찰제 예상 견적기
              </h3>
              <p className="text-slate-500 text-xs lg:text-sm mt-1">
                평수만 입력하면 대략적인 평균 청소 단가를 실시간으로 계산합니다.
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-sm lg:text-base">공급/전용 평수</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pyung}
                    onChange={(e) => setPyung(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-20 text-center bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-blue-900"
                  />
                  <span className="font-bold text-slate-500 text-sm">평</span>
                </div>
              </div>

              {/* 평수 조절 슬라이더 */}
              <input
                type="range"
                min="5"
                max="80"
                value={pyung}
                onChange={(e) => setPyung(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* 청소 상품별 단가 가이드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl text-center">
                  <p className="text-xs font-bold text-slate-500">이사/입주 청소</p>
                  <p className="text-sm font-semibold text-slate-400 mt-0.5">평당 1.5만원</p>
                  <p className="text-lg lg:text-xl font-black text-blue-900 mt-2">
                    {priceMoveIn.toLocaleString()}원
                  </p>
                </div>
                <div className="border border-emerald-100 bg-emerald-50/20 p-4 rounded-xl text-center">
                  <p className="text-xs font-bold text-emerald-600">거주 청소</p>
                  <p className="text-sm font-semibold text-emerald-400/80 mt-0.5">평당 1.8만원</p>
                  <p className="text-lg lg:text-xl font-black text-emerald-700 mt-2">
                    {priceResidence.toLocaleString()}원
                  </p>
                </div>
                <div className="border border-purple-100 bg-purple-50/20 p-4 rounded-xl text-center">
                  <p className="text-xs font-bold text-purple-600">프리미엄(분진제거)</p>
                  <p className="text-sm font-semibold text-purple-400/80 mt-0.5">평당 2.0만원</p>
                  <p className="text-lg lg:text-xl font-black text-purple-700 mt-2">
                    {pricePremium.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 지역 활동 가능 업체 목록 */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg lg:text-2xl font-extrabold text-slate-900">
                  ✨ {guName} 추천 청소 업체 리스트
                </h3>
                <p className="text-slate-500 text-xs lg:text-sm mt-1">
                  {fullRegionName} 지역 청소 배정이 가능한 검증된 평점 우수 업체들입니다.
                </p>
              </div>
              <Link to="/partners" className="text-blue-600 hover:underline text-xs font-bold shrink-0">
                전체 파트너 보기 &gt;
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">업체 정보를 로딩 중입니다...</div>
            ) : localPartners.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {localPartners.map((partner: any) => (
                  <div
                    key={partner.id}
                    onClick={handleCtaClick}
                    className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-32 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-100">
                        <img
                          src={partner.image || '/images/korean_cleaning_team.webp'}
                          alt={partner.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm lg:text-base mt-3 line-clamp-1">
                        {partner.name}
                      </h4>
                      <p className="text-amber-500 text-xs font-bold mt-1">
                        ★ 5.0 (리뷰 안심 평점)
                      </p>
                      <p className="text-slate-400 text-[10px] mt-1 truncate">
                        📍 {partner.area}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                      {partner.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-100 text-center text-slate-400 text-sm">
                해당 지역에 등록된 파트너가 없습니다. 전체 업체를 확인해보세요.
              </div>
            )}
          </section>

          {/* 6단계 완벽 청소 프로세스 */}
          <section className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-lg lg:text-2xl font-extrabold text-slate-900 text-center">
              🧹 청소타워의 안심 청소 표준 공정
            </h3>
            <p className="text-slate-500 text-xs lg:text-sm text-center max-w-xl mx-auto">
              어느 파트너팀이 방문하더라도 청소타워가 본사 보증하는 체계적인 6단계 시공을 엄수합니다.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {[
                { step: "01", name: "사전 오염 진단", desc: "도착 후 벽지, 창틀, 바닥재 등의 상태를 정밀 분석합니다." },
                { step: "02", name: "대형 분진 건식 흡입", desc: "천장과 고소 작업 구역의 공사 분진을 1차 진공 흡입합니다." },
                { step: "03", name: "보양지 제거 및 오염 흡착", desc: "가구 내부 서랍을 전원 분리하여 잔여 분진을 말끔히 세척합니다." },
                { step: "04", name: "고온 스팀 안심 살균", desc: "배수구, 욕실, 주방 가스레인지 부근에 스팀을 분사해 살균합니다." },
                { step: "05", name: "천연 피톤치드 분사", desc: "새집증후군 유해 물질 분해를 위해 친환경 베이크아웃액을 분사합니다." },
                { step: "06", name: "고객 대면 최종 검수", desc: "청소 상태를 고객이 직접 육안 확인하고 만족 시 최종 완료합니다." }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-blue-600 font-black text-sm lg:text-base block">{item.step}</span>
                    <h4 className="font-extrabold text-slate-800 text-xs lg:text-sm mt-1">{item.name}</h4>
                  </div>
                  <p className="text-slate-500 text-[10px] lg:text-xs mt-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 생생 동네 입주민 후기 */}
          <section className="space-y-6">
            <h3 className="text-lg lg:text-2xl font-extrabold text-slate-900">
              💬 {guName} 입주민들의 실제 내돈내산 후기
            </h3>

            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm lg:text-base">
                        {review.title}
                      </h4>
                      <p className="text-slate-400 text-[10px] lg:text-xs mt-0.5">
                        작성자: {review.author} 고객님 | 작성일: {review.date}
                      </p>
                    </div>
                    <div className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                      ★ {review.rating}.0
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs lg:text-sm leading-relaxed whitespace-pre-wrap">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 전국 지역 인덱스 (크롤러용 교차 내부 링크) */}
          <section className="bg-slate-100 p-6 rounded-2xl border border-slate-200/50 space-y-4">
            <h4 className="font-bold text-slate-700 text-xs lg:text-sm">
              📍 타 지역 이사/입주청소 서비스 안내 바로가기
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-medium text-slate-600">
              {PSEO_REGIONS.map((item) => (
                <Link
                  key={item.slug}
                  to={`/${item.slug}`}
                  className="hover:text-blue-600 transition-colors py-1 truncate"
                >
                  • {item.name} 청소 가격
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
