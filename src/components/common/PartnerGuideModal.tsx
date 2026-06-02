import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, Camera, Gift, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

interface PartnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerGuideModal({ isOpen, onClose }: PartnerGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'name' | 'photo' | 'event' | 'calendar'>('name');

  if (!isOpen) return null;

  const tabs = [
    { id: 'name', label: '상호명', icon: Building2 },
    { id: 'photo', label: '전후사진', icon: Camera },
    { id: 'event', label: '이달의 행사', icon: Gift },
    { id: 'calendar', label: '청소가능일', icon: Calendar },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh] border border-slate-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-amber-300 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-blue-100">Partner Guide</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">파트너 정보 등록 안내</h2>
          <p className="text-blue-100/90 text-xs font-medium mt-1">
            프로필 정보가 알찰수록 고객 신뢰도 및 매칭률이 <strong>평균 3.5배 상승</strong>합니다!
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex bg-slate-50 border-b border-slate-100 p-1.5 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-200 gap-1
                  ${isActive 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-150 font-black' 
                    : 'text-slate-400 hover:text-slate-600 font-bold hover:bg-slate-100/50'
                  }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-5">
          {activeTab === 'name' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏢</span>
                <h3 className="text-lg font-black text-slate-800">상호명 (업체명) 등록 가이드</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                소비자가 내 업체를 검색하거나 견적 리스트에서 확인하는 공식 브랜딩 명칭입니다.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">사업자 등록 명칭과 통일</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">사업자등록증상 명칭과 동일하게 입력하시면 고객 검증 시 대단히 높은 신뢰감을 줍니다.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">개인 팀 반장님의 작명 팁</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">단순 본인 이름(예: `김*수 팀장`)보다는 전문성과 지점 신뢰감을 주는 상호(예: `다온클린 경기남부점`)를 설정하시는 것을 강력 추천합니다.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">지역명 추가 표기</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">상호명 끝에 `안산점`, `강남점`과 같이 지점명을 붙여주시면 지역 고객들이 한층 친숙하게 느낍니다.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'photo' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📸</span>
                <h3 className="text-lg font-black text-slate-800">작업 전후 사진 등록 가이드</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                청소 품질과 기술력을 시각적으로 입증하는 가장 확실하고 강력한 마케팅 수단입니다.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">확실한 대비 사진 업로드</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">싱크대 기름때, 욕실 배수구 오염, 문틀 먼지 등 청소 **전(Before) / 후(After)**가 한 눈에 대조되는 구도를 권장합니다.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">고화질과 밝은 조명 확보</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">흔들림이 없고 밝은 조명 아래 촬영된 깨끗한 사진이 신뢰도를 줍니다. 흐리거나 어두운 사진은 지양해 주세요.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">최소 3개 현장 이상 추천</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">시공사례 포트폴리오를 3개 이상 성실히 입력해 둔 업체는 신규 오더 수주 성공률이 비약적으로 향상됩니다.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'event' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎁</span>
                <h3 className="text-lg font-black text-slate-800">이달의 행사 및 혜택 가이드</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                견적서 목록에서 경쟁 업체보다 고객의 눈길을 먼저 사로잡고 선택률을 증폭시킵니다.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-black text-slate-800">💡 즉시 매출을 올리는 실전 문구 예시</p>
                <div className="space-y-2">
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-[11px] font-bold text-slate-700">
                    🌿 <span className="text-blue-600">친환경 피톤치드</span> 살균 소독 무료 전면 시공 서비스 제공! (이번달 계약 한정)
                  </div>
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-[11px] font-bold text-slate-700">
                    ✨ 30평형 이상 예약 파트너사 특전: <span className="text-blue-600">주방 레인지 후드 철저 분해</span> 세척 케어 서비스
                  </div>
                  <div className="bg-white border border-slate-150 p-2.5 rounded-xl text-[11px] font-bold text-slate-700">
                    🔥 청소타워 오픈기념: 선착순 계약 시 <span className="text-blue-600">추가 10% 다이렉트 할인</span> 적용
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                  특별한 이벤트가 진행 중이지 않더라도, `"시공 후 3일간 철저한 무상 안심 A/S 약속"` 같은 신뢰 서약을 적어주시면 좋습니다.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📅</span>
                <h3 className="text-lg font-black text-slate-800">청소 가능일(달력) 관리 가이드</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                실시간 오더 우선 배정과 중복 예약 및 일정 충돌을 방지하기 위한 필수 시스템입니다.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">자유로운 가능/마감 지정</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">달력의 각 날짜를 터치하여 시공이 가능한 날은 **[가능(파란색)]**, 예약 마감/휴무일은 **[마감(빨간색)]**으로 간편히 전환합니다.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">‘가능일’ 기준의 실시간 매칭</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">**[가능]**으로 표시된 날짜에 대해서만 고객의 지정 예약 견적 요청이나 실시간 추천 배정이 진행됩니다.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800">취소 페널티 유의 사항</p>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">매칭 완료 후 파트너사의 스케줄 미업데이트로 인해 일정을 취소하게 되면 계정 일시 정지 등의 페널티가 발생하오니 매일 체크를 권장합니다.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl active:scale-[0.98] transition-all text-sm shadow-md"
          >
            안내 확인 및 가이드 닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
