// caseclosure-frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Tracker } from './components/Tracker';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import TipPage from './pages/TipPage';
// …other imports

function App() {
  // Pull the subdomain from the host, e.g. "4joshua" from "4joshua.localhost:3000"
  const host = window.location.host;            
  const subdomain = host.split('.')[0];         

  return (
    <Router>
      {/* Mount the tracker so it’s active on every route */}
      <Tracker victimSubdomain={subdomain} />

      {/* Your app’s routing */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/tip" element={<TipPage />} />
        {/* …other routes */}
      </Routes>
    </Router>
  );
}

export default App;
