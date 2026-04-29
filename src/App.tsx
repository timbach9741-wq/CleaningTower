import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CleaningHome from './pages/CleaningHome';
import CleaningMoveIn from './pages/CleaningMoveIn';
import CleaningSickBuilding from './pages/CleaningSickBuilding';
import CleaningAppliance from './pages/CleaningAppliance';
import CleaningRegular from './pages/CleaningRegular';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CleaningHome />} />
        <Route path="/cleaning/move-in" element={<CleaningMoveIn />} />
        <Route path="/cleaning/sick-building" element={<CleaningSickBuilding />} />
        <Route path="/cleaning/appliance" element={<CleaningAppliance />} />
        <Route path="/cleaning/regular" element={<CleaningRegular />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
