import React from 'react';
import { Calendar, FileText, PlusCircle, HeadphonesIcon, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InteriorDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24">
      {/* Header Profile */}
      <div className="bg-slate-900 px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-500/20 text-purple-300 rounded-2xl flex items-center justify-center font-black text-2xl">
              (주)
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">현대인테리어 고객님</h1>
              <p className="text-slate-400 font-medium mt-1">인테리어 파트너 계정</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Quick Action */}
        <button 
          onClick={() => {
            sessionStorage.setItem('b2b_partner_type', 'interior');
            navigate('/b2b/quote');
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-2xl shadow-md transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-xl">새 공실 청소 의뢰하기</h3>
              <p className="text-purple-200 font-medium text-sm mt-0.5">인테리어 시공 후 준공청소를 바로 접수하세요.</p>
            </div>
          </div>
          <ChevronRight className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">청소 스케줄 현황</h3>
              <p className="text-slate-500 text-sm font-medium">의뢰한 청소의 배정 및 진행 상태 확인</p>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
          
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">세금계산서 및 명세서</h3>
              <p className="text-slate-500 text-sm font-medium">월별 정산 내역 및 증빙 서류 발급</p>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>

          <div className="p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <HeadphonesIcon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">전담 매니저 연락</h3>
              <p className="text-slate-500 text-sm font-medium">클레임 처리 및 추가 서비스 별도 문의</p>
            </div>
            <ChevronRight className="text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
