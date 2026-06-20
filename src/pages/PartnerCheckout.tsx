import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { ShieldCheck, CreditCard, ArrowRight, Loader2 } from 'lucide-react';

// 토스페이먼츠 테스트 클라이언트 키
const clientKey = 'test_ck_0RnYX2w5327mYLLNkgpRVNeyqApQ';

export default function PartnerCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // PartnerSignup에서 넘겨받은 데이터
  const partnerId = location.state?.partnerId;
  const plan = location.state?.plan || 'basic';
  const cycle = location.state?.cycle || '1month';
  const phone = location.state?.phone || '';
  const name = location.state?.name || '파트너님';

  useEffect(() => {
    if (!partnerId) {
      alert('비정상적인 접근입니다.');
      navigate('/');
    }
  }, [partnerId, navigate]);

  const planLabels: Record<string, string> = {
    basic: '일반 파트너',
    premium: '프리미엄 파트너',
    exclusive: '지역 독점 파트너',
  };

  const planPrices: Record<string, Record<string, string>> = {
    basic: { '1month': '50,000', '3month': '45,000', '6month': '40,000' },
    premium: { '1month': '150,000', '3month': '130,000', '6month': '120,000' },
    exclusive: { '1month': '300,000', '3month': '270,000', '6month': '240,000' },
  };

  const cycleLabels: Record<string, string> = {
    '1month': '매월 결제',
    '3month': '3개월 단위 자동결제',
    '6month': '6개월 단위 자동결제',
  };

  const handleRegisterCard = async () => {
    setIsLoading(true);
    try {
      const customerKey = partnerId || 'anonymous_customer';
      const tossPayments = await loadTossPayments(clientKey);
      
      await tossPayments.requestBillingAuth('카드', {
        customerKey,
        customerEmail: 'test@cheongsotower.com', // 필요시 실제 데이터로 대체
        customerName: name,
        successUrl: `${window.location.origin}/partners/checkout/success?partnerId=${partnerId}&plan=${plan}`,
        failUrl: `${window.location.origin}/partners/checkout/fail`,
      });
    } catch (error) {
      console.error('결제 위젯 로드 중 오류:', error);
      alert('결제 모듈을 불러오는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  if (!partnerId) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">
          결제 수단 등록
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          카드 등록 후 <strong>3개월 무료 체험</strong>이 바로 시작됩니다.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-2xl border border-slate-100">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm font-medium flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <p>
              등록하시는 카드로는 <strong>오늘 0원</strong>이 결제(승인)되며, 무료 혜택 기간(3개월) 종료 시점부터 요금이 자동 청구됩니다.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6 mb-8">
            <h3 className="font-bold text-slate-900 mb-4">선택한 요금제 요약</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">선택 플랜</span>
                <span className="font-bold text-slate-800">{planLabels[plan]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">정기 결제 주기</span>
                <span className="font-medium text-slate-800">{cycleLabels[cycle]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">3개월 후 갱신 금액</span>
                <span className="font-black text-lg text-rose-600">
                  ₩{planPrices[plan][cycle]} <span className="text-sm font-normal text-slate-500">/ 월</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRegisterCard}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>카드 등록하고 3개월 무료 시작하기</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="mt-4 text-center text-xs text-slate-400">
            * 언제든지 결제 갱신을 해지할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
