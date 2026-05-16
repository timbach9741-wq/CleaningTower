import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header({ onOpenQuote, theme = 'light', hideQuoteButton = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll(); // Check immediately on mount

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '홈', href: '/' },
    { name: '전문가 찾기', href: '/partners' },
    { name: '파트너스 지원하기', href: '/partners/join' },
    { name: '서비스 안내', href: '/service' },
    { name: '실제 후기', href: '#reviews' },
    { name: '부가서비스 안내', href: '#services' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 cursor-pointer z-50 transition-transform hover:scale-105 duration-300"
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img 
            src="/logo_cropped.webp" 
            alt="청소타워 로고 아이콘" 
            className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply" 
          />
          <span className={`text-xl sm:text-2xl font-black tracking-tight ${isScrolled || isMobileMenuOpen ? 'text-blue-900' : (theme === 'dark' ? 'text-white' : 'text-blue-900')}`}>
            청소타워
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isAnchor = link.href.startsWith('#');
            const commonClasses = `font-medium transition-colors hover:text-blue-600 ${
              isScrolled || isMobileMenuOpen ? 'text-slate-700' : (theme === 'dark' ? 'text-white/90' : 'text-slate-800')
            }`;
            
            return isAnchor ? (
              <a 
                key={link.name} 
                href={link.href}
                className={commonClasses}
                onClick={(e) => {
                  e.preventDefault();
                  if (location.pathname !== '/') {
                    navigate('/' + link.href);
                  } else {
                    if (location.hash === link.href) {
                      const element = document.querySelector(link.href);
                      if (element) {
                        const headerOffset = 80;
                        const elementPosition = element.getBoundingClientRect().top;
                        window.scrollTo({
                          top: elementPosition + window.scrollY - headerOffset,
                          behavior: 'smooth'
                        });
                      }
                    } else {
                      navigate(link.href);
                    }
                  }
                }}
              >
                {link.name}
              </a>
            ) : (
              <Link 
                key={link.name} 
                to={link.href}
                className={commonClasses}
                onClick={() => {
                  if (location.pathname === link.href) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-4 z-50">
          {!hideQuoteButton && (
            <button 
              onClick={() => navigate('/partners')}
              className={`hidden sm:flex px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-md items-center gap-2 hover:-translate-y-0.5 ${
                isScrolled || isMobileMenuOpen
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' 
                  : (theme === 'dark'
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md shadow-none'
                      : 'bg-white text-blue-600 hover:bg-blue-50 shadow-black/10')
              }`}
            >
              바로 전문가 찾기
            </button>
          )}
          
          <button 
            className={`lg:hidden p-2 ${isScrolled || isMobileMenuOpen ? 'text-slate-800' : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        className={`lg:hidden absolute top-full left-0 w-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[500px] border-t border-slate-100' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col px-4 py-4 gap-4">
          {navLinks.map((link) => {
            const isAnchor = link.href.startsWith('#');
            const commonClasses = "font-medium text-slate-800 hover:text-blue-600 px-2 py-1";
            
            return isAnchor ? (
              <a 
                key={link.name} 
                href={link.href}
                className={commonClasses}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  if (location.pathname !== '/') {
                    navigate('/' + link.href);
                  } else {
                    if (location.hash === link.href) {
                      const element = document.querySelector(link.href);
                      if (element) {
                        const headerOffset = 80;
                        const elementPosition = element.getBoundingClientRect().top;
                        window.scrollTo({
                          top: elementPosition + window.scrollY - headerOffset,
                          behavior: 'smooth'
                        });
                      }
                    } else {
                      navigate(link.href);
                    }
                  }
                }}
              >
                {link.name}
              </a>
            ) : (
              <Link 
                key={link.name} 
                to={link.href}
                className={commonClasses}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (location.pathname === link.href) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                {link.name}
              </Link>
            );
          })}
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/partners');
            }}
            className="mt-2 w-full px-5 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-md flex justify-center items-center"
          >
            바로 전문가 찾기
          </button>
        </nav>
      </div>
    </header>
  );
}
