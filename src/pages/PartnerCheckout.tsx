import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, Landmark, Copy, CheckCircle2 } from 'lucide-react';
import { getDb } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PartnerCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // PartnerSignup이나 Landing에서 넘겨받은 데이터
  const partnerId = location.state?.partnerId;
  const plan = location.state?.plan || 'basic';
  const cycle = location.state?.cycle || '1month';
  const phone = location.state?.phone || '';
  const initialName = location.state?.name || '파트너님';
  
  const [depositorName, setDepositorName] = useState(initialName);

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
    premium: { '1month': '150,000', '3month': '135,000', '6month': '120,000' },
    exclusive: { '1month': '300,000', '3month': '270,000', '6month': '240,000' },
  };

  // 총 입금액 계산 로직 (월요금 * 개월수)
  const calculateTotal = (monthlyPriceStr: string, cycleStr: string) => {
    const monthlyNum = parseInt(monthlyPriceStr.replace(/,/g, ''), 10);
    const months = cycleStr === '1month' ? 1 : cycleStr === '3month' ? 3 : 6;
    const total = monthlyNum * months;
    return total.toLocaleString();
  };

  const cycleLabels: Record<string, string> = {
    '1month': '1개월 결제',
    '3month': '3개월 결제',
    '6month': '6개월 결제',
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('131-022-991902');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!depositorName.trim()) {
      alert('입금자명을 입력해 주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      const db = getDb();
      const monthlyAmount = parseInt(planPrices[plan][cycle].replace(/,/g, ''), 10);
      const months = cycle === '1month' ? 1 : cycle === '3month' ? 3 : 6;
      const totalAmount = monthlyAmount * months;

      await addDoc(collection(db, 'partner_payments'), {
        partnerId,
        plan,
        cycle,
        monthlyAmount,
        totalAmount,
        depositorName,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      navigate(`/partners/checkout/success?partnerId=${partnerId}&plan=${plan}`);
    } catch (error) {
      console.error('결제 요청 중 오류:', error);
      alert('요청 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setIsLoading(false);
    }
  };

  if (!partnerId) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">
          무통장 입금 안내
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          안내된 계좌로 입금해 주시면 확인 후 플랜이 활성화됩니다.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-2xl border border-slate-100">
          
          {/* 계좌 안내 카드 */}
          <div className="mb-8 p-5 bg-blue-950 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-800 rounded-full opacity-50 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-blue-200 text-sm font-bold">
                <Landmark size={18} />
                <span>입금 계좌</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-black tracking-wider text-amber-400">
                  신협 131-022-991902
                </div>
                <button 
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
                >
                  {isCopied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{isCopied ? '복사됨' : '복사'}</span>
                </button>
              </div>
              <div className="text-sm font-medium text-blue-100">
                예금주 : <span className="font-bold text-white">주식회사 청소타워</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mb-8">
            <h3 className="font-bold text-slate-900 mb-4">입금하실 금액 요약</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">선택 플랜</span>
                <span className="font-bold text-slate-800">{planLabels[plan]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">이용 기간</span>
                <span className="font-medium text-slate-800">{cycleLabels[cycle]}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-slate-500">총 입금액</span>
                <span className="font-black text-xl text-rose-600">
                  {calculateTotal(planPrices[plan][cycle], cycle)}원
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              입금자명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="실제 입금하시는 분의 이름을 입력해주세요"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              * 실제 입금자명과 다를 경우 확인이 지연될 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !depositorName.trim()}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>입금 확인 요청하기</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
