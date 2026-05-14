import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: "김*지",
    service: "입주 청소",
    title: "아기가 있어서 걱정했는데, 새집 냄새가 싹 사라졌어요!",
    content: "신축 아파트로 입주하면서 미세분진이랑 새집증후군이 제일 걱정이었어요. 갓난아기가 있어서 돈이 조금 더 들더라도 확실한 곳에서 하려고 청소타워을 선택했습니다. 팀장님이 친환경 세제 쓰시는 거 직접 보여주시고, 벽지나 수납장 안쪽까지 손으로 쓸어봐도 먼지 하나 묻어나오지 않게 완벽하게 해주셨어요. 덕분에 안심하고 바로 입주했습니다. 강력 추천해요!",
    rating: 5
  },
  {
    id: 2,
    name: "이*훈",
    service: "이사 청소",
    title: "10년 묵은 주방 기름때가 마법처럼 지워졌네요.",
    content: "구축 빌라로 이사 오게 되었는데, 전 세입자가 관리를 너무 안 해서 주방 후드랑 화장실 타일 곰팡이가 심각했습니다. 과연 이게 지워질까 반신반의했는데, 청소타워 스팀 청소 장비가 지나가니 새집처럼 변하더라고요. 화장실 하수구 악취까지 다 잡아주셔서 너무 만족스럽습니다. 돈이 전혀 아깝지 않은 퀄리티입니다.",
    rating: 5
  },
  {
    id: 3,
    name: "박*영",
    service: "거주 청소",
    title: "퇴근하고 집에 왔는데 호텔에 온 줄 알았습니다.",
    content: "맞벌이를 하다 보니 집안일에 신경 쓸 틈이 없어서 큰맘 먹고 거주 청소를 맡겼습니다. 짐이 있는 상태라 걱정했는데, 가전 가구 다 꼼꼼히 보양 처리하고 작업해 주셨더라고요. 창틀 미세먼지부터 화장실 물때까지 속 시원하게 벗겨주셔서 퇴근 후 집에 들어오자마자 힐링되는 기분이었습니다. 정기적으로 이용할 생각입니다.",
    rating: 5
  },
  {
    id: 4,
    name: "최*우",
    service: "이사 청소",
    title: "원룸인데도 대충 하지 않고 엄청 꼼꼼하게 해주십니다.",
    content: "원룸이라 다른 곳은 예약하기도 눈치 보였는데, 청소타워은 정말 친절하게 상담해 주셨어요. 평수가 작아도 에어컨 필터, 세탁기 주변, 냉장고 내부까지 풀옵션 가전 찌든 때를 전부 다 제거해 주셨습니다. 혼자 사는 직장인 분들께 정말 추천드려요. 이사 첫날부터 기분 좋게 꿀잠 잤습니다.",
    rating: 5
  },
  {
    id: 5,
    name: "정*윤",
    service: "이사 청소",
    title: "강아지가 바닥을 핥아도 안심할 수 있어서 좋아요.",
    content: "강아지를 키우다 보니 바닥에 화학 세제가 남을까 봐 항상 걱정이었어요. 청소타워은 친환경 인증 세제만 쓴다고 해서 믿고 맡겼습니다. 청소 끝나고 강아지가 집안을 막 돌아다녀도 독한 냄새 하나 없이 쾌적했어요. 펫 프렌들리한 청소 업체 찾으시면 무조건 여기입니다.",
    rating: 5
  },
  {
    id: 6,
    name: "강*진",
    service: "입주 청소",
    title: "넓은 평수도 구역별로 체계적으로 완벽하게 케어해주네요.",
    content: "집이 넓어서 청소 인원이 많이 필요했는데, 청소타워은 구역별 전문가분들이 오셔서 각자 맡은 곳을 체계적으로 진행해 주시더라고요. 특히 대리석 바닥 코팅이나 샹들리에 같은 까다로운 부분도 흠집 없이 깔끔하게 작업해 주셨습니다. 검수할 때 팀장님이 워낙 깐깐하게 체크하셔서 제가 지적할 부분이 없었네요.",
    rating: 5
  },
  {
    id: 7,
    name: "윤*석",
    service: "입주 청소",
    title: "공사 분진 지옥에서 저를 구원해 주셨습니다.",
    content: "올 리모델링 끝내고 났더니 온 집안이 하얀 시멘트 가루와 나무 톱밥 투성이였습니다. 손으로 한 번 닦고 포기했는데, 청소타워 청소팀이 다녀가니 공사 흔적이 완전히 사라졌어요. 수납장 탈거해서 안쪽 숨은 먼지까지 다 빼주시는 거 보고 감동했습니다. 인테리어 후 청소는 필수네요.",
    rating: 5
  },
  {
    id: 8,
    name: "조*현",
    service: "이사 청소",
    title: "베란다 곰팡이 때문에 계약 물릴 뻔했는데 완전 새하얗게 변했어요.",
    content: "집 보러 갈 때 가구에 가려져 있던 베란다 벽면 곰팡이를 이사 당일에 발견하고 멘붕이 왔어요. 다행히 청소타워 팀장님이 특수 약품으로 곰팡이 뿌리까지 다 제거해 주시고, 억제 코팅까지 해주셔서 완전 새하얗게 변했습니다. 추가 비용이 전혀 아깝지 않은 최고의 서비스였습니다.",
    rating: 5
  },
  {
    id: 9,
    name: "임*호",
    service: "상가 청소",
    title: "유리창이 없는 줄 알았습니다. 매장 오픈 준비 끝!",
    content: "카페 오픈 준비하면서 인테리어 폐기물이랑 먼지 때문에 막막했는데, 상가 전문팀이 오셔서 바닥 왁싱부터 전면 유리창까지 투명하게 닦아주셨습니다. 지나가던 동네 분들이 유리가 없는 줄 알고 만져보실 정도예요. 덕분에 기분 좋게 첫 영업 시작했습니다. 감사합니다!",
    rating: 5
  },
  {
    id: 10,
    name: "송*아",
    service: "입주 청소",
    title: "A/S 응대까지 완벽한 곳. 책임감에 감동했습니다.",
    content: "청소 당일에는 몰랐는데, 다음날 햇빛이 들어올 때 보니 안방 창틀 위쪽에 얼룩이 살짝 남아있더라고요. 조심스럽게 연락드렸는데 죄송하다며 그날 오후에 바로 오셔서 미흡했던 부분은 물론이고 서비스로 화장실 소독까지 한 번 더 해주셨습니다. 책임감 있는 모습에 주변에 엄청 추천하고 다닙니다.",
    rating: 5
  }
];

export default function ReviewSection() {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If we've reached the end, scroll back to the start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRight();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section id="reviews" className="py-24 bg-neutral-50 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-2 block">
              Real Customer Reviews
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              청소타워을 경험한 고객님들의<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                100% 리얼 후기
              </span>
            </h2>
            <p className="text-lg text-gray-600">
              보이지 않는 곳까지 완벽하게. 청소타워의 프리미엄 서비스를 경험하신 분들의 이야기입니다.
            </p>
          </motion.div>
        </div>

        {/* Carousel Navigation */}
        <div className="flex justify-end gap-3 mb-6 pr-4 lg:pr-0">
          <button 
            onClick={scrollLeft}
            className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
            aria-label="이전 후기 보기"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={scrollRight}
            className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
            aria-label="다음 후기 보기"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Reviews Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          {/* Left/Right Fade Gradients for visual polish */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none hidden md:block" />

          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 -mx-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="min-w-[320px] md:min-w-[400px] bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 snap-center flex flex-col relative"
              >
                <div className="absolute -top-4 -left-2 text-blue-100 opacity-50">
                  <Quote size={60} fill="currentColor" />
                </div>
                
                <div className="flex items-center gap-1 mb-4 relative z-10">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight relative z-10">
                  "{review.title}"
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow relative z-10">
                  {review.content}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                      <div className="text-xs text-gray-500">인증된 고객</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-100">
                    {review.service}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
