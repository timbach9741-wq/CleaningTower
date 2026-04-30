import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ onOpenQuote }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '홈', href: '/' },
    { name: '서비스 안내', href: '#' },
    { name: '전문가 찾기', href: '/partners' },
    { name: '실제 후기', href: '#' },
    { name: '부가서비스', href: '#' },
    { name: '파트너 가입', href: '/partners/join' },
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
        <Link to="/" className="flex items-center gap-2 cursor-pointer z-50">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className={`font-black text-xl tracking-tight ${isScrolled || isMobileMenuOpen ? 'text-slate-900' : 'text-slate-900'}`}>
            싹클<span className="text-blue-600">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href}
              className={`font-medium transition-colors hover:text-blue-600 ${
                isScrolled ? 'text-slate-700' : 'text-slate-800'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-4 z-50">
          <button 
            onClick={onOpenQuote}
            className={`hidden sm:flex px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-md items-center gap-2 hover:-translate-y-0.5 ${
              isScrolled 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' 
                : 'bg-white text-blue-600 hover:bg-blue-50 shadow-black/10'
            }`}
          >
            간편 견적 받기
          </button>
          
          <button 
            className="md:hidden p-2 text-slate-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        className={`md:hidden absolute top-full left-0 w-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-64 border-t border-slate-100' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col px-4 py-4 gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href}
              className="font-medium text-slate-800 hover:text-blue-600 px-2 py-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenQuote();
            }}
            className="mt-2 w-full px-5 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-md flex justify-center items-center"
          >
            간편 견적 받기
          </button>
        </nav>
      </div>
    </header>
  );
}
