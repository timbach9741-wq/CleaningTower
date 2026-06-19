import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function KakaoFloatingButton() {
  const location = useLocation();
  const pathname = location.pathname;

  // 제외 경로 리스트 (어드민, 파트너 대시보드, 견적 작성, B2B, 결제 성공/실패, 리뷰 작성)
  const excludedPrefixes = [
    '/admin',
    '/partner-dashboard',
    '/partner',
    '/quote',
    '/b2b',
    '/payment',
    '/review-write'
  ];

  const isExcluded = excludedPrefixes.some((prefix) => pathname.startsWith(prefix));

  const [isHomeCtaVisible, setIsHomeCtaVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isExcluded) return;

    if (pathname !== '/') {
      setIsHomeCtaVisible(false);
      return;
    }

    const handleScroll = () => {
      const snapContainer = document.querySelector('.snap-scroll-mobile');
      const scrollY = snapContainer ? snapContainer.scrollTop : window.scrollY;

      // Hero Section을 지나는 400px 시점에 FloatingCTA가 뜨므로 동일하게 맞춤
      if (scrollY > 400) {
        setIsHomeCtaVisible(true);
      } else {
        setIsHomeCtaVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    const snapContainer = document.querySelector('.snap-scroll-mobile');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll);
    }

    // 초기 마운트 시 체크
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (snapContainer) {
        snapContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [pathname, isExcluded]);

  if (isExcluded) return null;

  // 동적 bottom 위치 계산
  const getBottomStyle = () => {
    const isLg = windowWidth >= 1024;
    if (isHomeCtaVisible) {
      return isLg ? '104px' : '88px';
    }
    return isLg ? '40px' : '24px';
  };

  return (
    <a
      href="http://pf.kakao.com/_xnHTnX/chat"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 lg:right-10 z-[55] flex items-center gap-1.5 px-4 py-3 bg-[#FEE500] hover:bg-[#FDD800] text-black font-extrabold rounded-full shadow-[0_4px_16px_rgba(254,229,0,0.35)] transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer select-none border border-[#E9D100]/25"
      style={{
        bottom: getBottomStyle()
      }}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.24 4.6 6.55-.26.96-.94 3.44-.97 3.56-.03.11.02.22.11.27.09.05.21.05.3 0 .12-.06 3.65-2.48 4.2-2.87.56.09 1.15.13 1.76.13 5.52 0 10-3.51 10-7.84S17.52 3 12 3z" />
      </svg>
      <span className="text-[13px] sm:text-sm font-black tracking-tight select-none">
        카카오톡 상담
      </span>
    </a>
  );
}
