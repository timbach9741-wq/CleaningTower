import { useNavigate } from 'react-router-dom';
import Header from '../components/cleaning/Header';
import Footer from '../components/cleaning/Footer';
import SEO from '../components/common/SEO';
import { BookOpen, Calendar, Clock, ChevronRight } from 'lucide-react';

const MOCK_MAGAZINES = [
  {
    id: '1',
    title: '원룸 이사청소 비용, 덤터기 안 쓰는 핵심 체크리스트',
    summary: '원룸 이사청소 시 평균적인 견적은 얼마일까? 평당 계산법부터 부가서비스(에어컨, 냉장고 청소) 추가 시 주의할 점까지 총정리.',
    thumbnail: 'https://cheongsotower.kr/clean_kitchen.webp',
    date: '2024-03-15',
    readTime: '5분',
    category: '청소 가이드'
  },
  {
    id: '2',
    title: '입주청소, 꼭 전문 업체에 맡겨야 할까? (셀프 청소 비교)',
    summary: '새집증후군 제거, 분진 가루 청소 등 혼자서 하기 힘든 입주청소의 비밀. 전문 업체와 셀프 청소의 장단점을 명확하게 비교해 드립니다.',
    thumbnail: 'https://cheongsotower.kr/clean_window.webp',
    date: '2024-03-10',
    readTime: '4분',
    category: '청소 꿀팁'
  },
  {
    id: '3',
    title: '믿고 맡길 수 있는 청소업체 고르는 3가지 기준',
    summary: '너무 싼 곳은 피하라? 후기만 믿어도 될까? 청소업체 선정 시 반드시 확인해야 할 A/S 보장, 직영팀 여부, 결제 방식의 진실.',
    thumbnail: 'https://cheongsotower.kr/clean_bathroom.webp',
    date: '2024-03-05',
    readTime: '6분',
    category: '업체 선정'
  }
];

export default function MagazineList() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SEO 
        title="청소 꿀팁 매거진 - 청소타워" 
        description="입주청소 비용, 원룸 이사청소 꿀팁, 업체 선정 기준 등 청소타워가 알려주는 유용한 청소 가이드와 매거진 콘텐츠를 만나보세요."
        keywords="청소꿀팁, 입주청소비용, 이사청소업체선정, 원룸청소꿀팁, 새집증후군, 청소타워매거진"
      />
      <Header onOpenQuote={() => {}} />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight flex items-center justify-center gap-2">
              <BookOpen className="text-blue-600" size={32} />
              청소타워 매거진
            </h1>
            <p className="text-gray-500 text-lg">알아두면 돈이 되는 유용한 청소 가이드와 꿀팁 모음</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_MAGAZINES.map((post, idx) => (
              <article 
                key={post.id} 
                onClick={() => navigate(`/magazine/${post.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col group animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                  <img 
                    src={post.thumbnail} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full z-20 shadow-sm">
                    {post.category}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {post.summary}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime} 소요</span>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
