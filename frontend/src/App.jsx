import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemorialPublicPage from "./pages/MemorialPublicPage";
import UserSettings from "./pages/UserSettings";
import getSubdomain from "./utils/getSubdomain";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import "./App.css";
import "./assets/styles/tailwind.css";
import "./assets/styles/index.css";
import CaseBuilder from './pages/CaseBuilder/CaseBuilder';
import PageBuilder from "./pages/PageBuilder";
import CasesList from "./components/CaseList";

function useAuth() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  return { user, isAuthenticated: !!user };
}

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

  // Auth-only pages (no sidebar/topbar)
  const authRoutes = ["/login", "/signup"];

  // "Immersive" builder/editor pages (no sidebar/topbar)
  const isImmersive =
    location.pathname === "/page-builder" ||
    location.pathname.startsWith("/case-builder");

  // Handle public memorial page by subdomain
  if (subdomain && subdomain !== "www" && window.location.pathname === "/") {
    return <MemorialPublicPage subdomain={subdomain} />;
  }

  // Show ONLY login/signup (no dashboard chrome)
  if (authRoutes.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Show immersive builder/editor (no sidebar/topbar)
  if (isImmersive) {
    return (
      <RequireAuth>
        <Routes>
          <Route path="/page-builder" element={<PageBuilder />} />
          <Route path="/case-builder/*" element={<CaseBuilder />} />
        </Routes>
      </RequireAuth>
    );
  }

  // Main layout for authenticated users (sidebar/topbar always present)
  if (isAuthenticated) {
    const handleLogout = () => {
      localStorage.removeItem("user");
      window.location.href = "/login";
    };

    // Determine admin status using Django conventions
    const isAdmin = user?.is_staff || user?.is_superuser;

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col">
          <Topbar user={user} onLogout={handleLogout} />
          <main className="flex-1 p-8">
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              {/* Restrict Case List route to admin users only */}
              {isAdmin && (
                <Route
                  path="/cases/list"
                  element={
                    <RequireAuth>
                      <CasesList />
                    </RequireAuth>
                  }
                />
              )}
              <Route
                path="/settings/user"
                element={
                  <RequireAuth>
                    <UserSettings />
                  </RequireAuth>
                }
              />
              {/* Add other non-builder/settings/dashboard routes here */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  // Not authenticated and not on /login or /signup
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
