import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CleaningHome from './pages/CleaningHome';
import CleaningMoveIn from './pages/CleaningMoveIn';
import CleaningSickBuilding from './pages/CleaningSickBuilding';
import CleaningAppliance from './pages/CleaningAppliance';
import CleaningRegular from './pages/CleaningRegular';
import PartnerList from './pages/PartnerList';
import PartnerLanding from './pages/PartnerLanding';
import PartnerRegister from './pages/PartnerRegister';
import Quote from './pages/Quote';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CleaningHome />} />
        <Route path="/partners" element={<PartnerList />} />
        <Route path="/partners/join" element={<PartnerLanding />} />
        <Route path="/partners/register" element={<PartnerRegister />} />
        <Route path="/cleaning/move-in" element={<CleaningMoveIn />} />
        <Route path="/cleaning/sick-building" element={<CleaningSickBuilding />} />
        <Route path="/cleaning/appliance" element={<CleaningAppliance />} />
        <Route path="/cleaning/regular" element={<CleaningRegular />} />
        <Route path="/quote/:type" element={<Quote />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
