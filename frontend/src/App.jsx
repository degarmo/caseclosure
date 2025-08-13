/**
 * App.jsx with Tracking Integration
 * Location: frontend/src/App.jsx
 */

import React, { useState, useEffect } from "react";
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

// Import tracking components
import { TrackingProvider } from './components/tracking/TrackingProvider';
import { useTracker } from './hooks/useTracker';

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
  const { trackEvent } = useTracker();
  
  useEffect(() => {
    if (!isAuthenticated) {
      // Track authentication redirect
      trackEvent('auth_redirect', {
        from: location.pathname,
        reason: 'not_authenticated'
      });
    }
  }, [isAuthenticated, location.pathname, trackEvent]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const subdomain = getSubdomain();
  const { trackEvent, trackPageView } = useTracker();

  // Modal state management
  const [showCaseModal, setShowCaseModal] = useState(false);

  // Track user session
  useEffect(() => {
    if (isAuthenticated && user) {
      trackEvent('session_start', {
        userId: user.id,
        userRole: user.is_staff ? 'admin' : 'user',
        subdomain: subdomain
      });
    }
  }, [isAuthenticated, user, subdomain, trackEvent]);

  // Track page views
  useEffect(() => {
    trackPageView({
      path: location.pathname,
      authenticated: isAuthenticated,
      subdomain: subdomain
    });
  }, [location.pathname, isAuthenticated, subdomain, trackPageView]);

  // Auth-only pages (no sidebar/topbar)
  const authRoutes = ["/login", "/signup"];

  // --- IMMERSIVE BUILDER/EDITOR LOGIC ---
  // Also match /builder/:id for canvas builder
  const isImmersive =
    location.pathname === "/page-builder" ||
    location.pathname.startsWith("/case-builder") ||
    /^\/builder\/\d+/.test(location.pathname);

  // Track immersive mode usage
  useEffect(() => {
    if (isImmersive) {
      trackEvent('immersive_mode_entered', {
        path: location.pathname,
        type: location.pathname.includes('case-builder') ? 'case_builder' : 'page_builder'
      });
    }
  }, [isImmersive, location.pathname, trackEvent]);

  // Track memorial page view
  useEffect(() => {
    if (subdomain && subdomain !== "www" && window.location.pathname === "/") {
      trackEvent('memorial_page_view', {
        subdomain: subdomain,
        referrer: document.referrer
      });
    }
  }, [subdomain, trackEvent]);

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
          <Route path="/case-builder/:id" element={<CaseBuilder />} />
          <Route path="/builder/:id" element={<PageBuilder />} />
        </Routes>
      </RequireAuth>
    );
  }

  // Main layout for authenticated users (sidebar/topbar always present)
  if (isAuthenticated) {
    const handleLogout = () => {
      // Track logout
      trackEvent('user_logout', {
        userId: user?.id,
        sessionDuration: Date.now() - (user?.loginTime || Date.now())
      });
      
      localStorage.removeItem("user");
      window.location.href = "/login";
    };

    const handleOpenCaseModal = () => {
      trackEvent('case_modal_opened', {
        trigger: 'user_action'
      });
      setShowCaseModal(true);
    };

    const handleCloseCaseModal = () => {
      trackEvent('case_modal_closed');
      setShowCaseModal(false);
    };

    // Determine admin status using Django conventions
    const isAdmin = user?.is_staff || user?.is_superuser;

    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar 
          user={user} 
          showCaseModal={showCaseModal}
          onOpenCaseModal={handleOpenCaseModal}
          onCloseCaseModal={handleCloseCaseModal}
        />
        <div className="flex-1 flex flex-col">
          <Topbar 
            user={user} 
            onLogout={handleLogout}
            onOpenCaseModal={handleOpenCaseModal}
          />
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

/**
 * ErrorBoundary for tracking JavaScript errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to tracking system
    if (window.tracker) {
      window.tracker.trackEvent({
        eventType: 'javascript_error',
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      });
    }
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We've encountered an unexpected error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Tracking configuration
  const trackingConfig = {
    apiEndpoint: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    trackingEndpoint: '/track',
    batchEndpoint: '/track/batch',
    enableLogging: process.env.NODE_ENV === 'development',
    batchSize: 20,
    batchInterval: 10000, // 10 seconds
    enableFingerprinting: true,
    enableScrollTracking: true,
    enableClickTracking: true,
    enableFormTracking: true,
    enableErrorTracking: true,
  };

  return (
    <ErrorBoundary>
      <Router>
        <TrackingProvider config={trackingConfig}>
          <AppContent />
        </TrackingProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;