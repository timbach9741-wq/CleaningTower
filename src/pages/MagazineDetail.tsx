import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import Footer from '../components/cleaning/Footer';
import SEO from '../components/common/SEO';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';

const MOCK_MAGAZINES = {
  '1': {
    title: '원룸 이사청소 비용, 덤터기 안 쓰는 핵심 체크리스트',
    summary: '원룸 이사청소 시 평균적인 견적은 얼마일까? 평당 계산법부터 부가서비스 추가 시 주의할 점까지 총정리.',
    thumbnail: 'https://cheongsotower.kr/clean_kitchen.webp',
    date: '2024-03-15',
    readTime: '5분',
    category: '청소 가이드',
    content: `
      <h2>1. 원룸 이사청소, 평균 비용은 얼마일까?</h2>
      <p>원룸 이사청소의 평균 비용은 보통 평당 10,000원 ~ 15,000원 사이로 형성되어 있습니다. 10평 원룸이라면 10만 원 ~ 15만 원 정도를 예상하시면 됩니다. 하지만 현장 오염도나 곰팡이 상태, 그리고 에어컨이나 냉장고 내부 청소 같은 부가서비스에 따라 금액이 추가될 수 있습니다.</p>
      
      <h2>2. 부가서비스, 어디까지 기본일까?</h2>
      <p>일반적으로 빌트인 냉장고나 세탁기의 외부 청소는 기본에 포함되지만, 내부 살균 청소는 추가 비용이 발생합니다. 에어컨 필터 청소 역시 별도인 경우가 많습니다. 견적 상담 시 반드시 "어디어디가 기본 청소 범위인가요?"라고 확인하셔야 덤터기를 피할 수 있습니다.</p>
      
      <h2>3. 믿을 수 있는 업체 고르는 팁</h2>
      <ul>
        <li><strong>A/S(사후관리) 보장 여부:</strong> 청소 직후에는 몰랐던 하자가 나중에 보일 수 있습니다. 1~2일 내로 무상 A/S가 되는 곳을 고르세요.</li>
        <li><strong>외주 하청 여부:</strong> 직영팀이 아닌 알바생이나 하청을 주는 곳은 퀄리티 보장이 어렵습니다. 100% 직영팀 운영인지 확인하세요.</li>
        <li><strong>예약금과 잔금 비율:</strong> 전액 선불을 요구하는 곳은 피하는 것이 좋습니다. 청소 상태를 최종 확인한 후 잔금을 치르는 후불제 요소가 있는지 체크하세요.</li>
      </ul>
      <p>저희 <strong>청소타워</strong>는 철저한 검증을 거친 우수 파트너만을 엄선하여 연결해 드립니다. 바가지 요금 없는 투명한 견적을 원하신다면 지금 바로 무료 견적을 받아보세요!</p>
    `
  },
  '2': {
    title: '입주청소, 꼭 전문 업체에 맡겨야 할까? (셀프 청소 비교)',
    summary: '새집증후군 제거, 분진 가루 청소 등 혼자서 하기 힘든 입주청소의 비밀.',
    thumbnail: 'https://cheongsotower.kr/clean_window.webp',
    date: '2024-03-10',
    readTime: '4분',
    category: '청소 꿀팁',
    content: `
      <h2>셀프 입주청소 vs 전문 업체, 무엇이 다를까?</h2>
      <p>새 아파트나 빌라에 입주할 때 가장 골칫거리는 바로 '공사 분진'과 '새집증후군'입니다. 눈에 보이는 먼지만 닦는다고 끝나는 것이 아니기 때문에 많은 분들이 전문 업체를 찾습니다.</p>
      
      <h3>셀프 청소의 현실</h3>
      <p>비용을 아끼기 위해 가족들과 직접 청소 도구를 들고 나섰다가 골병만 들었다는 후기를 종종 보셨을 겁니다. 천장 풀딱지 제거, 싱크대 걸레받이 안쪽의 시멘트 가루, 창틀의 묵은 때 등은 일반 가정용 진공청소기와 걸레만으로는 완벽하게 제거하기 매우 어렵습니다.</p>

      <h3>전문 업체를 써야 하는 이유</h3>
      <p>청소 전문 업체는 <strong>산업용 건습식 청소기, 고압 스팀기, 친환경 전용 세제</strong> 등 일반 가정에 없는 고가의 장비를 사용합니다. 특히 싱크대 하부장이나 서랍장 탈거 청소, 전등 커버 탈거 청소 등은 전문가의 손길이 필요합니다.</p>
      <p>시간과 체력, 그리고 청소의 퀄리티를 고려한다면 입주/이사 시에는 전문 업체에 맡기시는 것이 장기적으로 훨씬 이득입니다.</p>
    `
  },
  '3': {
    title: '믿고 맡길 수 있는 청소업체 고르는 3가지 기준',
    summary: '청소업체 선정 시 반드시 확인해야 할 A/S 보장, 직영팀 여부, 결제 방식의 진실.',
    thumbnail: 'https://cheongsotower.kr/clean_bathroom.webp',
    date: '2024-03-05',
    readTime: '6분',
    category: '업체 선정',
    content: `
      <h2>너무 싼 곳만 찾다가 낭패를 본다?</h2>
      <p>여러 곳에서 견적을 받다 보면 유독 터무니없이 저렴한 가격을 제시하는 곳이 있습니다. 하지만 청소는 철저히 '인건비' 중심의 서비스입니다. 너무 저렴한 곳은 그만큼 퀄리티가 떨어지거나, 현장에서 무리한 추가금을 요구할 확률이 높습니다.</p>
      
      <h2>반드시 체크해야 할 3가지</h2>
      <ol>
        <li><strong>경험과 노하우:</strong> 하루 1팀 1집 원칙을 지키는지, 아니면 하루에 여러 집을 대충 뛰는 곳인지 확인하세요.</li>
        <li><strong>소통의 원활함:</strong> 견적 상담 시 얼마나 친절하고 상세하게 안내해 주는지 보셔야 합니다. 첫 응대가 불친절한 곳은 A/S 처리 때도 불친절할 확률이 99%입니다.</li>
        <li><strong>친환경 세제 사용 여부:</strong> 독한 공업용 세제를 남발하면 당장은 깨끗해 보여도 마루가 썩거나 호흡기에 악영향을 줍니다. 친환경 세제를 사용하는지 꼭 물어보세요.</li>
      </ol>
      <p>청소타워에서는 이런 기준들을 모두 충족하는 검증된 파트너들만 활동하고 있습니다. 실패 없는 청소를 원하신다면 청소타워를 이용해 보세요.</p>
    `
  }
};

export default function MagazineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = MOCK_MAGAZINES[id as keyof typeof MOCK_MAGAZINES];

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <SEO title="페이지를 찾을 수 없습니다 - 청소타워" description="존재하지 않는 매거진 게시물입니다." />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">게시물을 찾을 수 없습니다.</h1>
        <button onClick={() => navigate('/magazine')} className="text-blue-600 hover:underline">목록으로 돌아가기</button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO 
        title={`${post.title} - 청소타워 매거진`}
        description={post.summary}
        image={post.thumbnail}
        keywords={`${post.category}, 청소타워, 청소꿀팁, 이사청소`}
      />
      <Header onOpenQuote={() => {}} />
      
      <main className="flex-grow pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4">
          <button 
            onClick={() => navigate('/magazine')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium mb-8"
          >
            <ArrowLeft size={18} />
            목록으로
          </button>

          <header className="mb-10 animate-in fade-in slide-in-from-bottom-4">
            <span className="inline-block bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1 rounded-full mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex items-center justify-between border-y border-gray-100 py-4">
              <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><Calendar size={16} /> {post.date}</span>
                <span className="flex items-center gap-1.5"><Clock size={16} /> {post.readTime} 소요</span>
              </div>
              <button onClick={handleShare} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100">
                <Share2 size={20} />
              </button>
            </div>
          </header>

          <div className="rounded-2xl overflow-hidden mb-10 shadow-sm border border-gray-100 h-[300px] md:h-[450px] animate-in fade-in zoom-in-95 duration-500 delay-100">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>

          <div 
            className="prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 animate-in fade-in slide-in-from-bottom-4 delay-200"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-1"
            >
              청소타워에서 1분 만에 견적 받기
            </button>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
