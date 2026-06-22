import React from 'react';
import { Users, Coins, Share2, Link as LinkIcon, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RealEstateDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24">
      {/* Header Profile */}
      <div className="bg-[#00B48D] px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center font-black text-2xl">
              부
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">우리동네 공인중개사님</h1>
              <p className="text-white/80 font-medium mt-1">부동산 파트너 계정</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-800 hover:text-white bg-white/30 hover:bg-white/40 rounded-full transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 font-medium mb-2">누적 소개 고객</div>
            <div className="text-3xl font-black text-slate-900">12<span className="text-lg text-slate-400 ml-1">명</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 font-medium mb-2">이달의 예상 리워드</div>
            <div className="text-3xl font-black text-[#00B48D]">150,000<span className="text-lg text-slate-400 ml-1">원</span></div>
          </div>
        </div>

        {/* Affiliate Link Share */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-2">내 부동산 전용 할인 링크</h3>
          <p className="text-slate-500 text-sm mb-4">세입자에게 이 링크를 공유하세요. 이 링크로 예약시 수수료가 적립됩니다.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 text-slate-600 font-medium">
              <LinkIcon size={18} className="text-slate-400" />
              <span className="truncate">https://cheongsotower.kr/ref/re-8921a</span>
            </div>
            <button className="px-6 py-3 bg-[#00B48D] hover:bg-[#009E7B] text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
              <Share2 size={18} />
              공유
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">소개 고객 진행 현황</h3>
              <p className="text-slate-500 text-sm font-medium">내 링크로 유입된 고객의 예약/완료 상태 확인</p>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
          
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <Coins size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">리워드 정산 및 입금 내역</h3>
              <p className="text-slate-500 text-sm font-medium">수수료 정산 신청 및 내역 조회</p>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
