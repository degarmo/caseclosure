// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemorialPage from "./pages/MemorialPage";
import MemorialPublicPage from "./pages/MemorialPublicPage";
import getSubdomain from "./utils/getSubdomain"; // Correct path!
import "./App.css";
import "./assets/styles/tailwind.css";
import "./assets/styles/index.css";
import MemorialSites from "./pages/MemorialSites";

// Sidebar navigation items
const sidebarLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/memorial-sites", label: "Memorial Sites" },
  // Add more links as needed
];

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

  // Otherwise, show normal app with sidebar
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-56 bg-white shadow-lg p-4 flex flex-col">
          <div className="mb-8 font-bold text-lg tracking-wide">CaseClosure.org</div>
          {sidebarLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-4 py-2 mb-1 rounded hover:bg-blue-100 text-gray-700"
              activeclassname="bg-blue-200 font-bold"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex-1" />
          <div className="text-xs text-gray-400 mt-8">Building justice, one story at a time.</div>
        </aside>

        {/* Main content area */}
        <main className="flex-1">
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/memorial/:id" element={<MemorialPage />} />
            <Route path="/memorial-sites" element={<MemorialSites />} />
            {/* Add other routes here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
