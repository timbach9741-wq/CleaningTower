import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // 화면 스크롤 시 버튼 표시 여부 결정
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // 클릭 시 최상단으로 부드럽게 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-[#243c8b] text-white shadow-[0_4px_14px_0_rgba(36,60,139,0.39)] hover:bg-blue-800 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none"
          aria-label="최상단으로 스크롤"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
