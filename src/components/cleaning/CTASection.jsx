import React from 'react';

export default function CTASection({ onOpenQuote }) {
  return (
    <section className="py-20 bg-blue-600 text-white text-center">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-black mb-6">신청서 제출 후 카톡으로 결과를 보내드립니다.</h2>
        <p className="text-xl text-blue-100 font-light mb-10">오실 필요 없이 편안하게 일상에 집중하세요. 저희가 완벽한 결과를 보여드립니다.</p>
        <button 
          onClick={onOpenQuote}
          className="bg-white text-blue-600 font-bold text-lg px-10 py-5 rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300">
          무료 견적 받기
        </button>
      </div>
    </section>
  );
}
