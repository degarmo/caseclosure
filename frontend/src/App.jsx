// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemorialPage from "./pages/MemorialPage";
import MemorialPublicPage from "./pages/MemorialPublicPage";
import getSubdomain from "./utils/getSubdomain"; // Correct path!
import "./App.css";
import "./assets/styles/tailwind.css";
import "./assets/styles/index.css";

// You can remove MainAppRoutes if not using it!

function App() {
  const subdomain = getSubdomain();

  // If on subdomain root, show public memorial page
  if (
    subdomain &&
    subdomain !== "www" &&
    window.location.pathname === "/"
  ) {
    return <MemorialPublicPage subdomain={subdomain} />;
  }

  // Otherwise, show normal app
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/memorial/:id" element={<MemorialPage />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;
