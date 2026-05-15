import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Camera, CheckCircle, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReviewWrite() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]); // Mock URLs
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!db || !orderId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'quotes', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("오더 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 임시 목업: 이미지 선택 시 가짜 URL 추가
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, fakeUrl]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !order) return;
    setSubmitting(true);
    
    try {
      // 리뷰 저장 (reviews 컬렉션)
      await addDoc(collection(db, 'reviews'), {
        orderId: order.id,
        partnerId: order.assignedTo,
        partnerName: order.partnerName,
        customerName: order.customerName || order.name || '고객',
        rating,
        content,
        // 테스트용 고정 이미지
        images: images.length > 0 ? ['/clean1.jpg', '/clean2.jpg'].slice(0, images.length) : [], 
        createdAt: serverTimestamp(),
        serviceType: order.type,
        location: order.location
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('리뷰 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold max-w-md mx-auto shadow-2xl">로딩중...</div>;
  }

  if (!order && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans max-w-md mx-auto shadow-2xl">
        <h2 className="text-xl font-black text-slate-800 mb-3">페이지를 찾을 수 없습니다.</h2>
        <p className="text-slate-500 font-medium mb-8">잘못된 접근이거나 이미 완료된 건입니다.</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-4 rounded-xl font-black w-full active:scale-[0.98] transition-transform">홈으로 돌아가기</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans max-w-md mx-auto shadow-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
          <CheckCircle size={48} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">리뷰 작성이 완료되었습니다!</h2>
        <p className="text-slate-500 mb-10 leading-relaxed text-sm break-keep font-medium">
          소중한 후기를 남겨주셔서 감사합니다.<br/>
          고객님의 피드백은 더 나은 서비스를 제공하는 데 큰 도움이 됩니다.
        </p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white w-full max-w-sm py-4 rounded-xl font-black shadow-xl active:scale-[0.98] transition-all">확인</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col">
      <header className="bg-white px-5 py-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft size={26} />
        </button>
        <h1 className="text-xl font-black tracking-tight text-slate-900">서비스 리뷰 작성</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <div className="text-[11px] font-black text-blue-600 bg-blue-50 w-max px-2.5 py-1 rounded-md mb-3 tracking-wide">청소 서비스 완료</div>
          <h2 className="font-black text-slate-900 text-xl mb-1.5">{order?.partnerName || '담당 파트너'}</h2>
          <p className="text-sm text-slate-500 font-medium">{order?.date} • {order?.type}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block font-black text-slate-900 mb-4 text-center text-lg tracking-tight">서비스는 만족스러우셨나요?</label>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1.5 transition-transform active:scale-90 ${rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                >
                  <Star size={44} fill={rating >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <div className="text-center text-sm font-black text-blue-600 mt-3 tracking-wide">
              {rating === 5 && '최고예요! 주변에 추천할게요 😍'}
              {rating === 4 && '좋아요, 만족스럽습니다 😊'}
              {rating === 3 && '보통이에요 😐'}
              {rating === 2 && '조금 아쉬워요 🙁'}
              {rating === 1 && '실망스러워요 😠'}
            </div>
          </div>

          <div className="h-px w-full bg-slate-200"></div>

          <div>
            <label className="block font-black text-slate-900 mb-2">상세한 후기를 남겨주세요</label>
            <textarea
              required
              rows={5}
              placeholder="청소 상태, 파트너의 친절도 등 경험하신 내용을 솔직하게 적어주세요. (최소 10자 이상)"
              className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow shadow-inner placeholder:text-slate-400 leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minLength={10}
            />
            <div className="text-right mt-2 text-xs font-bold text-slate-400">
              {content.length} / 500자
            </div>
          </div>

          <div>
            <label className="block font-black text-slate-900 mb-1">사진 첨부 <span className="text-slate-400 font-medium">(선택)</span></label>
            <p className="text-xs text-slate-500 mb-4 font-medium">청소 전/후 사진이나 결과물 사진을 올려주세요. (최대 3장)</p>
            
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x">
              {images.length < 3 && (
                <label className="w-24 h-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 hover:border-slate-400 hover:text-slate-500 transition-all snap-start">
                  <Camera size={28} className="mb-1.5" />
                  <span className="text-[11px] font-black">{images.length}/3</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              {images.map((img, i) => (
                <div key={i} className="w-24 h-24 shrink-0 relative rounded-2xl border border-slate-200 overflow-hidden group shadow-sm snap-start">
                  <img src={img} alt="review" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm backdrop-blur-sm"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting || content.length < 10}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex justify-center items-center h-14"
            >
              {submitting ? '등록 중...' : '리뷰 등록하기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
