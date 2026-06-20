import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getDb } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function PartnerCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const partnerId = searchParams.get('partnerId');
  const plan = searchParams.get('plan');
  const authKey = searchParams.get('authKey'); // 토스페이먼츠 빌링키 발급 인증키
  const customerKey = searchParams.get('customerKey');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const processBillingAuth = async () => {
      if (!partnerId || !authKey || !customerKey) {
        setStatus('error');
        return;
      }

      try {
        const dbInstance = getDb();
        if (dbInstance) {
          // 원래는 서버(Cloud Function)에서 authKey를 이용해 빌링키를 발급받아야 하지만,
          // 여기서는 테스트 모드(1안) 연동의 UI/DB 상태 변경만 처리합니다.
          const docRef = doc(dbInstance, 'partners', partnerId);
          await updateDoc(docRef, {
            paymentStatus: 'billing_key_issued',
            billingCustomerKey: customerKey,
            billingAuthKey: authKey, // 테스트용 저장
            subscriptionStartDate: new Date().toISOString(),
            status: plan === 'exclusive' ? 'pending' : 'active'
          });
        }
        
        setStatus('success');
      } catch (err) {
        console.error('빌링키 처리 오류:', err);
        setStatus('error');
      }
    };

    processBillingAuth();
  }, [partnerId, authKey, customerKey, plan]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={48} className="text-blue-600 mb-4 animate-spin" />
        <h2 className="text-xl font-black text-slate-800 mb-2">카드 등록 승인 중...</h2>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-rose-600 mb-3">등록 실패</h2>
        <p className="text-slate-500 mb-6">카드 등록 처리 중 오류가 발생했습니다.</p>
        <button onClick={() => navigate('/partners')} className="px-6 py-3 bg-slate-200 rounded-xl font-bold">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md pt-10 flex flex-col items-center text-center pb-6">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-3">가입 및 카드 등록이 완료되었습니다!</h3>
        <p className="text-slate-500 mb-6 break-keep leading-relaxed font-medium">
          환영합니다!<br/>
          <strong>3개월 무료 혜택</strong>이 지금부터 바로 적용됩니다.<br/>
          무료 기간 이후부터 선택하신 요금제로 청구됩니다.
        </p>

        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-sm text-slate-600 leading-relaxed text-left">
          <p className="mb-2 font-bold text-slate-800">📌 로그인 안내</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 font-medium">
            ⚠️ 파트너스 전용 페이지에서 가입하신 휴대폰 번호로 로그인 해주세요.<br/>
            비밀번호는 휴대폰 뒷 4자리로 설정되어 있습니다. (로그인 후 반드시 변경해 주세요)
          </div>
        </div>

        <button 
          onClick={() => navigate('/partners')}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors"
        >
          파트너스 페이지로 이동
        </button>
      </div>
    </div>
  );
}
