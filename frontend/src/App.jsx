import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemorialPage from "./pages/MemorialPage";
import MemorialPublicPage from "./pages/MemorialPublicPage";
import MemorialSites from "./pages/MemorialSites";
import UserSettings from "./pages/UserSettings";
import MemorialSettings from "./pages/MemorialSettings";
import getSubdomain from "./utils/getSubdomain";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import "./App.css";
import "./assets/styles/tailwind.css";
import "./assets/styles/index.css";
import CaseBuilder from './pages/CaseBuilder/CaseBuilder';

// --- Dummy Auth Helper ---
function useAuth() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  return { user, isAuthenticated: !!user };
}

// RequireAuth: Protects all private routes
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const subdomain = getSubdomain();

  // Routes for which sidebar/topbar should NOT show
  const authRoutes = ["/login", "/signup"];

  // Handle public memorial page by subdomain
  if (subdomain && subdomain !== "www" && window.location.pathname === "/") {
    return <MemorialPublicPage subdomain={subdomain} />;
  }

  // Auth pages: only render auth forms (no sidebar/topbar)
  if (authRoutes.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Main layout for authenticated users
  if (isAuthenticated) {
    const handleLogout = () => {
      localStorage.removeItem("user");
      window.location.href = "/login";
    };

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col">
          <Topbar user={user} onLogout={handleLogout} />
          <main className="flex-1">
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/memorial/:id"
                element={
                  <RequireAuth>
                    <MemorialPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/memorial-sites"
                element={
                  <RequireAuth>
                    <MemorialSites />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/user"
                element={
                  <RequireAuth>
                    <UserSettings />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings/memorial"
                element={
                  <RequireAuth>
                    <MemorialSettings />
                  </RequireAuth>
                }
              />
              <Route
                path="/case-builder/*"
                element={
                  <RequireAuth>
                    <CaseBuilder />
                  </RequireAuth>
                }
              />
              {/* 404 catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  // If not authenticated and not on auth routes, force login
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
