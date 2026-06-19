import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTopButton from './components/common/ScrollToTopButton';
import KakaoFloatingButton from './components/common/KakaoFloatingButton';
import ScrollToAnchor from './components/common/ScrollToAnchor';

import ErrorBoundary from './components/common/ErrorBoundary';

// 코드 스플리팅: 각 페이지를 별도 청크로 분리하여 초기 로딩 속도 개선
// 사용자가 해당 페이지에 접근할 때만 JS를 다운로드함
const CleaningHome = lazy(() => import('./pages/CleaningHome'));
const CleaningMoveIn = lazy(() => import('./pages/CleaningMoveIn'));
const CleaningSickBuilding = lazy(() => import('./pages/CleaningSickBuilding'));
const CleaningAppliance = lazy(() => import('./pages/CleaningAppliance'));
const CleaningRegular = lazy(() => import('./pages/CleaningRegular'));
const PartnerList = lazy(() => import('./pages/PartnerList'));
const PartnerLanding = lazy(() => import('./pages/PartnerLanding'));
const PartnerSignup = lazy(() => import('./pages/PartnerSignup'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Quote = lazy(() => import('./pages/Quote'));
const ServiceGuide = lazy(() => import('./pages/ServiceGuide'));
const B2BQuote = lazy(() => import('./pages/B2BQuote'));
const B2BSignup = lazy(() => import('./pages/B2BSignup'));
const ReviewWrite = lazy(() => import('./pages/ReviewWrite'));
const LocalSEO = lazy(() => import('./pages/LocalSEO'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFail = lazy(() => import('./pages/PaymentFail'));

// 페이지 전환 시 보여줄 로딩 스피너 (최소한의 인라인 스타일로 별도 CSS 없이 동작)
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTopButton />
        <KakaoFloatingButton />
        <ScrollToAnchor />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<CleaningHome />} />
          <Route path="/service" element={<ServiceGuide />} />
          <Route path="/partners" element={<PartnerList />} />
          <Route path="/partners/join" element={<PartnerLanding />} />
          <Route path="/partners/register" element={<PartnerSignup />} />
          <Route path="/partner-dashboard" element={<PartnerDashboard />} />
          <Route path="/partner" element={<Navigate to="/partner-dashboard" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/cleaning/move-in" element={<CleaningMoveIn />} />
          <Route path="/cleaning/sick-building" element={<CleaningSickBuilding />} />
          <Route path="/cleaning/appliance" element={<CleaningAppliance />} />
          <Route path="/cleaning/regular" element={<CleaningRegular />} />
          <Route path="/quote/:type" element={<Quote />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/fail" element={<PaymentFail />} />
          
          {/* 숨겨진 B2B (사업자 전용) 라우트 - 헤더/푸터 메뉴에 노출되지 않음 */}
          <Route path="/b2b/quote" element={<B2BQuote />} />
          <Route path="/b2b/signup" element={<B2BSignup />} />

          {/* 고객용 알림톡 전용 라우트 - 헤더/푸터 메뉴 노출 안됨 */}
          <Route path="/review-write/:orderId" element={<ReviewWrite />} />

          {/* Programmatic SEO 지역별 랜딩 페이지 (모든 고정 라우트 매칭 실패 시 최종 매칭) */}
          <Route path="/:regionKey" element={<LocalSEO />} />
        </Routes>
      </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
