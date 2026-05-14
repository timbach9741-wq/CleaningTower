import React from 'react';
import { Globe, Shield, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fc] pt-16 pb-8 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* 청소타워 Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/logo_cropped.png" 
                alt="청소타워 로고 아이콘" 
                className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply grayscale opacity-80" 
              />
              <span className="text-xl font-black text-slate-700 tracking-tight">청소타워</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              청결의 깊이, 청소타워. 일상의 모든 공간에 프리미엄 입주 청소의 기준을 전합니다.
            </p>
            <div className="flex items-center gap-3 text-slate-400 mt-2">
              <Globe className="w-5 h-5 hover:text-blue-600 cursor-pointer transition-colors" />
              <Shield className="w-5 h-5 hover:text-blue-600 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* 회사 소개 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-blue-900">회사 소개</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-500">
              <li><Link to="/partners/join" className="hover:text-blue-600 cursor-pointer transition-colors block">파트너스 지원하기</Link></li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">서비스 지역</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">문의하기</li>
            </ul>
          </div>

          {/* 고객 지원 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-blue-900">고객 지원</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-500">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">이용 약관</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">개인정보 처리방침</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">품질 보증 안내</li>
            </ul>
          </div>

          {/* 뉴스레터 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-blue-900">뉴스레터</h4>
            <p className="text-sm text-slate-500">
              청소 팁과 특별 할인 혜택 정보를 받아보세요.
            </p>
            <div className="flex mt-2">
              <input 
                type="email" 
                placeholder="이메일 주소" 
                className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-l-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button className="bg-[#243c8b] text-white px-4 py-2 rounded-r-lg hover:bg-blue-800 transition-colors flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            © 2024 청소타워 Marketplace. 청결의 깊이가 다른 선택.
          </p>
        </div>
      </div>
    </footer>
  );
}
