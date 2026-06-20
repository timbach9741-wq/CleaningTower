import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function PartnerCheckoutFail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const message = searchParams.get('message') || '결제 처리에 실패했습니다.';
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-500 shadow-inner">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">카드 등록 실패</h2>
      <p className="text-slate-500 mb-2 leading-relaxed text-sm break-keep font-medium">
        {message}
      </p>
      {code && <p className="text-slate-400 text-xs mb-8">에러 코드: {code}</p>}
      
      <div className="flex gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold transition-colors"
        >
          다시 시도
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
