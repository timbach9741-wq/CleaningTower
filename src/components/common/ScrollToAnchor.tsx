import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToAnchor() {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // pathname 변경 또는 hash 변경 시 동작
    if (hash) {
      let attempts = 0;
      const isPathChanged = prevPathnameRef.current !== pathname;
      
      const checkAndScroll = () => {
        const element = document.querySelector(hash);
        if (element) {
          const headerOffset = 80; // 고정 헤더 높이 여백
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: isPathChanged ? 'instant' : 'smooth'
          });
          return true;
        }
        return false;
      };

      // 요소가 바로 존재하면 스크롤
      if (!checkAndScroll()) {
        // 요소가 아직 렌더링되지 않았다면 폴링 (최대 2초)
        const intervalId = setInterval(() => {
          attempts++;
          if (checkAndScroll() || attempts >= 20) {
            clearInterval(intervalId);
          }
        }, 100);
        
        return () => clearInterval(intervalId);
      }
    } else {
      // hash가 없다면 페이지 상단으로 이동
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname, hash]);

  return null;
}
