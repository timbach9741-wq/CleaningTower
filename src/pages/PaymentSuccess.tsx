import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [quoteDetails, setQuoteDetails] = useState<any>(null);

  useEffect(() => {
    const confirmPaymentAndFetchDetails = async () => {
      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setErrorMessage('필수 결제 정보가 누락되었습니다.');
        return;
      }

      try {
        // 1. 백엔드 Firebase Function 호출하여 결제 최종 승인 처리
        const response = await fetch('https://us-central1-house-clean-hub.cloudfunctions.net/confirmPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount, 10),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setStatus('error');
          setErrorMessage(data.message || '결제 승인 처리 중 에러가 발생했습니다.');
          return;
        }

        // 2. 승인 완료 후 Firestore에서 해당 견적서 정보 조회하여 UI에 표시
        if (db) {
          const docRef = doc(db, 'quotes', orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setQuoteDetails(docSnap.data());
          }
        }

        setStatus('success');
      } catch (err: any) {
        console.error('결제 승인 요청 실패:', err);
        setStatus('error');
        setErrorMessage(err.message || '결제 승인 요청 중 네트워크 오류가 발생했습니다.');
      }
    };

    confirmPaymentAndFetchDetails();
  }, [paymentKey, orderId, amount]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans max-w-md mx-auto shadow-2xl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="text-blue-600 mb-4"
        >
          <Loader2 size={48} />
        </motion.div>
        <h2 className="text-xl font-black text-slate-800 mb-2">결제 승인 중...</h2>
        <p className="text-slate-500 font-medium text-sm">
          결제 완료를 위해 서버에서 최종 승인 단계를 거치고 있습니다.<br />
          잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans max-w-md mx-auto shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-500 shadow-inner"
        >
          <AlertTriangle size={40} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">결제 승인 실패</h2>
        <p className="text-slate-500 mb-6 leading-relaxed text-sm break-keep font-medium">
          {errorMessage || '결제는 정상 처리되었으나, 승인 과정에서 오류가 발생했습니다.'}
        </p>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 w-full text-left text-xs text-rose-800 mb-8 space-y-1">
          <p>• 결제 금액이 맞지 않거나 결제 번호가 올바르지 않을 수 있습니다.</p>
          <p>• 이미 취소된 결제 건이거나 중복 승인 시도일 수 있습니다.</p>
          <p>• 지속적으로 문제 발생 시 고객센터(031-499-9509)로 문의 바랍니다.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-black w-full active:scale-[0.98] transition-transform shadow-lg"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans max-w-md mx-auto shadow-2xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-inner"
      >
        <CheckCircle size={52} />
      </motion.div>

      <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
        예약 확정 완료!
      </h2>
      <p className="text-slate-500 mb-6 text-sm font-medium">
        예약금 {parseInt(amount || '0', 10).toLocaleString()}원이 정상 결제되어<br />
        청소타워 예약이 최종 확정되었습니다.
      </p>

      {quoteDetails && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 text-left w-full shadow-sm mb-8 space-y-3"
        >
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-2 flex items-center gap-1.5 text-sm">
            <span className="material-symbols-outlined text-emerald-600 text-lg">assignment_turned_in</span>
            예약 상세 정보
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <span className="text-slate-400 font-medium">고객명/업체명</span>
            <span className="col-span-2 text-slate-700 font-semibold">{quoteDetails.customerName || quoteDetails.name || '고객'}</span>

            <span className="text-slate-400 font-medium">청소 종류</span>
            <span className="col-span-2 text-slate-700 font-semibold">{quoteDetails.type || '입주/이사 청소'}</span>

            <span className="text-slate-400 font-medium">시공 일정</span>
            <span className="col-span-2 text-slate-700 font-semibold">
              {quoteDetails.date || quoteDetails.cleaningDate} {quoteDetails.time || quoteDetails.cleaningTime}
            </span>

            <span className="text-slate-400 font-medium">시공 주소</span>
            <span className="col-span-2 text-slate-700 font-semibold leading-relaxed">
              {quoteDetails.location || quoteDetails.address}
            </span>

            {quoteDetails.designatedPartnerName && (
              <>
                <span className="text-slate-400 font-medium">배정 업체</span>
                <span className="col-span-2 text-slate-800 font-bold text-blue-600">
                  {quoteDetails.designatedPartnerName}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}

      <button
        onClick={() => navigate('/')}
        className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black w-full active:scale-[0.98] transition-transform shadow-lg"
      >
        확인 및 홈으로 이동
      </button>
    </div>
  );
}
