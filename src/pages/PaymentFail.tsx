import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get('code');
  const message = searchParams.get('message') || '결제 중 에러가 발생했거나 결제가 취소되었습니다.';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans max-w-md mx-auto shadow-2xl">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-500 shadow-inner"
      >
        <XCircle size={52} />
      </motion.div>

      <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
        결제에 실패하였습니다
      </h2>
      <p className="text-slate-500 mb-6 text-sm font-medium">
        결제 처리 과정에서 에러가 발생하였습니다.<br />
        아래 오류 메시지를 확인하신 후 다시 시도해 주세요.
      </p>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 text-left w-full shadow-sm mb-8 space-y-3">
        <h4 className="font-bold text-slate-800 border-b pb-2 mb-2 flex items-center gap-1.5 text-sm">
          <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
          오류 정보
        </h4>
        <div className="space-y-2 text-xs">
          {code && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">에러 코드</span>
              <span className="text-slate-700 font-semibold">{code}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 font-medium">상세 메시지</span>
            <span className="text-slate-700 font-semibold leading-relaxed break-all bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {message}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2">
        <button
          onClick={() => navigate('/')}
          className="bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black w-full active:scale-[0.98] transition-transform shadow-lg"
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
}
