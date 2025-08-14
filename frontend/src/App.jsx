/**
 * App.jsx with Public Website, Dashboard, and Tracking Integration
 * Location: frontend/src/App.jsx
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import "./App.css";
import "./assets/styles/tailwind.css";
import "./assets/styles/index.css";

// Public Website Pages
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Spotlight from "./pages/Spotlight";
import Contact from "./pages/Contact";
import Discover from "./pages/Discover";
import RequestAccount from "./pages/RequestAccount";

// Auth Pages
import Signup from "./pages/Signup";
import SignIn from "./pages/SignIn";  // Use SignIn instead of Login
import Login from "./pages/Login";    // Keep for backward compatibility

// Dashboard & Protected Pages
import Dashboard from "./pages/Dashboard";
import CaseBuilder from './pages/CaseBuilder/CaseBuilder';
import PageBuilder from "./pages/PageBuilder";
import CasesList from "./components/CaseList";
import UserSettings from "./pages/UserSettings";
import MemorialPublicPage from "./pages/MemorialPublicPage";

// Utils
import getSubdomain from "./utils/getSubdomain";

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
    return <Navigate to="/signin" state={{ from: location }} replace />;  // Changed to /signin
  }
  return children;
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const subdomain = getSubdomain();
  const { trackEvent, trackPageView } = useTracker();

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

  // Check if current route is public page
  const publicRoutes = [
    '/', '/home', '/about', '/pricing', '/services', 
    '/spotlight', '/contact', '/discover', '/request-account'
  ];
  const isPublicRoute = publicRoutes.includes(location.pathname.toLowerCase());

  // Auth-only pages (no layout)
  const authRoutes = ["/login", "/signin", "/signup"];  // Added /signin
  const isAuthRoute = authRoutes.includes(location.pathname);

  // Immersive builder/editor pages (no layout)
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

  // Logout handler
  const handleLogout = () => {
    // Track logout
    trackEvent('user_logout', {
      userId: user?.id,
      sessionDuration: Date.now() - (user?.loginTime || Date.now())
    });
    
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/signin";  // Changed to /signin
  };

  const handleOpenCaseModal = () => {
    trackEvent('case_modal_opened', {
      trigger: 'user_action'
    });
    // You can add modal logic here if needed
  };

  // Determine admin status
  const isAdmin = user?.is_staff || user?.is_superuser;

  return (
    <Routes>
      {/* ============ PUBLIC WEBSITE ROUTES ============ */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
      <Route path="/services" element={<Layout><Pricing /></Layout>} />
      <Route path="/spotlight" element={<Layout><Spotlight /></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/discover" element={<Layout><Discover /></Layout>} />
      <Route path="/request-account" element={<Layout><RequestAccount /></Layout>} />

      {/* ============ AUTH ROUTES (No Layout) ============ */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/login" element={<SignIn />} />  {/* Redirect /login to SignIn */}

      {/* ============ IMMERSIVE BUILDER ROUTES (No Layout) ============ */}
      <Route 
        path="/page-builder" 
        element={
          <RequireAuth>
            <PageBuilder />
          </RequireAuth>
        } 
      />
      <Route 
        path="/case-builder/:id" 
        element={
          <RequireAuth>
            <CaseBuilder />
          </RequireAuth>
        } 
      />
      <Route 
        path="/builder/:id" 
        element={
          <RequireAuth>
            <PageBuilder />
          </RequireAuth>
        } 
      />

      {/* ============ DASHBOARD ROUTES (Protected) ============ */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              onOpenCaseModal={handleOpenCaseModal}
            />
          </RequireAuth>
        }
      />
      
      {/* User Settings */}
      <Route
        path="/settings/user"
        element={
          <RequireAuth>
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              onOpenCaseModal={handleOpenCaseModal}
              activeSection="settings"
            >
              <UserSettings />
            </Dashboard>
          </RequireAuth>
        }
      />
      
      {/* Analytics Route */}
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              onOpenCaseModal={handleOpenCaseModal}
              activeSection="analytics"
            />
          </RequireAuth>
        }
      />
      
      {/* Messages Route */}
      <Route
        path="/messages"
        element={
          <RequireAuth>
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              onOpenCaseModal={handleOpenCaseModal}
              activeSection="messages"
            />
          </RequireAuth>
        }
      />
      
      {/* Reports Route */}
      <Route
        path="/reports"
        element={
          <RequireAuth>
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              onOpenCaseModal={handleOpenCaseModal}
              activeSection="reports"
            />
          </RequireAuth>
        }
      />
      
      {/* Maps Route */}
      <Route
        path="/maps"
        element={
          <RequireAuth>
            <Dashboard 
              user={user} 
              onLogout={handleLogout}
              onOpenCaseModal={handleOpenCaseModal}
              activeSection="maps"
            />
          </RequireAuth>
        }
      />
      
      {/* ============ ADMIN ONLY ROUTES ============ */}
      {isAdmin && (
        <>
          <Route
            path="/cases/list"
            element={
              <RequireAuth>
                <Dashboard 
                  user={user} 
                  onLogout={handleLogout}
                  onOpenCaseModal={handleOpenCaseModal}
                  activeSection="cases"
                >
                  <CasesList />
                </Dashboard>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Dashboard 
                  user={user} 
                  onLogout={handleLogout}
                  onOpenCaseModal={handleOpenCaseModal}
                  activeSection="admin"
                />
              </RequireAuth>
            }
          />
        </>
      )}
      
      {/* ============ DEFAULT REDIRECTS ============ */}
      {/* If authenticated, unknown routes go to dashboard */}
      {/* If not authenticated, unknown routes go to home */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/" replace />
        } 
      />
    </Routes>
  );
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
    enableLogging: import.meta.env.DEV, // Use Vite's DEV mode check
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