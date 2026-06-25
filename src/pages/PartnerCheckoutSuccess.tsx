import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PartnerCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const partnerId = searchParams.get('partnerId');
  const plan = searchParams.get('plan');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
        <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={50} className="text-emerald-500" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          입금 확인 요청 완료
        </h2>
        
        <div className="mt-4 text-slate-600 font-medium leading-relaxed break-keep">
          <p className="mb-2">
            요청이 정상적으로 접수되었습니다.
          </p>
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-200 my-6">
            안내해 드린 계좌로 입금해 주시면, <strong>관리자가 확인 후 플랜을 즉시 활성화</strong>해 드립니다. 입금 확인에는 평일 기준 최대 1~2시간이 소요될 수 있습니다.
          </div>
          <p className="text-sm text-slate-500">
            {plan === 'exclusive' 
              ? '* 지역 독점 플랜은 상담을 거쳐 최종 승인됩니다.' 
              : '* 3개월 무료 체험 기간 후 결제가 진행됩니다.'}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => navigate('/partner-dashboard', { state: { showLogin: true } })}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            파트너스 대시보드로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
