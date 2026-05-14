import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CleaningHome from './pages/CleaningHome';
import CleaningMoveIn from './pages/CleaningMoveIn';
import CleaningSickBuilding from './pages/CleaningSickBuilding';
import CleaningAppliance from './pages/CleaningAppliance';
import CleaningRegular from './pages/CleaningRegular';
import PartnerList from './pages/PartnerList';
import PartnerLanding from './pages/PartnerLanding';
import PartnerSignup from './pages/PartnerSignup';
import PartnerDashboard from './pages/PartnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Quote from './pages/Quote';
import ServiceGuide from './pages/ServiceGuide';
import B2BQuote from './pages/B2BQuote';
import B2BSignup from './pages/B2BSignup';
import ScrollToTopButton from './components/common/ScrollToTopButton';
import ScrollToAnchor from './components/common/ScrollToAnchor';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTopButton />
      <ScrollToAnchor />
      <Routes>
        <Route path="/" element={<CleaningHome />} />
        <Route path="/service" element={<ServiceGuide />} />
        <Route path="/partners" element={<PartnerList />} />
        <Route path="/partners/join" element={<PartnerLanding />} />
        <Route path="/partners/register" element={<PartnerSignup />} />
        <Route path="/partner-dashboard" element={<PartnerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cleaning/move-in" element={<CleaningMoveIn />} />
        <Route path="/cleaning/sick-building" element={<CleaningSickBuilding />} />
        <Route path="/cleaning/appliance" element={<CleaningAppliance />} />
        <Route path="/cleaning/regular" element={<CleaningRegular />} />
        <Route path="/quote/:type" element={<Quote />} />
        
        {/* 숨겨진 B2B (사업자 전용) 라우트 - 헤더/푸터 메뉴에 노출되지 않음 */}
        <Route path="/b2b/quote" element={<B2BQuote />} />
        <Route path="/b2b/signup" element={<B2BSignup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
