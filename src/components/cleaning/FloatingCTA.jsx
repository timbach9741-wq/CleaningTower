import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FloatingCTA({ onOpenQuote }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // snap-scroll-mobile 컨테이너 또는 window에서 스크롤 위치 확인
      const snapContainer = document.querySelector('.snap-scroll-mobile');
      const scrollY = snapContainer ? snapContainer.scrollTop : window.scrollY;
      
      // 히어로 섹션(약 400px)을 지나면 플로팅 버튼이 나타나도록 설정
      if (scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // window 스크롤 감지 (데스크톱)
    window.addEventListener('scroll', handleScroll);
    
    // snap-scroll-mobile 컨테이너 스크롤 감지 (모바일)
    const snapContainer = document.querySelector('.snap-scroll-mobile');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll);
    }
    
    // 초기 마운트 시에도 한 번 체크
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (snapContainer) {
        snapContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div 
      className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <button 
        onClick={() => navigate('/partners')}
        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base lg:text-lg font-bold rounded-full shadow-2xl shadow-blue-600/40 transition-transform hover:-translate-y-1 flex items-center justify-center"
      >
        <span>바로 전문가 찾기</span>
      </button>
    </div>
  );
}

