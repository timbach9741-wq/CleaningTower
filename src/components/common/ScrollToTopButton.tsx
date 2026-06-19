import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHomeCtaVisible, setIsHomeCtaVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const location = useLocation();
  const pathname = location.pathname;

  // 카카오톡 버튼 제외 경로
  const excludedPrefixes = [
    '/admin',
    '/partner-dashboard',
    '/partner',
    '/quote',
    '/b2b',
    '/payment',
    '/review-write'
  ];
  const isKakaoExcluded = excludedPrefixes.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
      const snapContainer = document.querySelector('.snap-scroll-mobile');
      const scrollY = snapContainer ? snapContainer.scrollTop : window.scrollY;

      // 300px 이상 스크롤 시 위로가기 버튼 노출
      if (scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // 홈페이지인 경우 400px 이상 스크롤 시 CTA 노출 여부 판단
      if (pathname === '/') {
        if (scrollY > 400) {
          setIsHomeCtaVisible(true);
        } else {
          setIsHomeCtaVisible(false);
        }
      } else {
        setIsHomeCtaVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    const snapContainer = document.querySelector('.snap-scroll-mobile');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', toggleVisibility);
    }

    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (snapContainer) {
        snapContainer.removeEventListener('scroll', toggleVisibility);
      }
    };
  }, [pathname]);

  const scrollToTop = () => {
    const snapContainer = document.querySelector('.snap-scroll-mobile');
    if (snapContainer) {
      snapContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 동적 bottom 위치 계산
  const getBottomStyle = () => {
    const isLg = windowWidth >= 1024;
    
    if (pathname === '/') {
      if (isHomeCtaVisible) {
        // CTA(bottom-6) + 카카오톡(bottom-[88px]/[104px])가 둘 다 있을 때
        return isLg ? '168px' : '152px';
      }
      // 카카오톡(bottom-6)만 있을 때
      return isLg ? '112px' : '96px';
    }

    if (isKakaoExcluded) {
      // 카카오톡 버튼이 없는 페이지는 위로가기 버튼이 최하단에 위치
      return isLg ? '40px' : '24px';
    }

    // 일반 페이지: 카카오톡(bottom-6)이 최하단에 있으므로 위로가기 버튼은 그 위에 위치
    return isLg ? '112px' : '96px';
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed right-6 lg:right-10 z-[54] p-3 rounded-full bg-[#243c8b] text-white shadow-[0_4px_14px_0_rgba(36,60,139,0.39)] hover:bg-blue-800 transition-all duration-500 ease-in-out transform hover:-translate-y-1 focus:outline-none"
          style={{
            bottom: getBottomStyle()
          }}
          aria-label="최상단으로 스크롤"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 h-6" />
        </button>
      )}
    </>
  );
}
