/**
 * App.jsx - Updated with Spotlight and SpotlightAdmin integration
 * Location: frontend/src/App.jsx
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import "./assets/styles/tailwind.css";
import "./assets/styles/index.css";

// Public Website Pages
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Spotlight from "./pages/Spotlight";  // Keep existing public Spotlight page
import Contact from "./pages/Contact";
import Discover from "./pages/Discover";
import RequestAccount from "./pages/RequestAccount";
import CaseDetails from './dashboard/components/CaseDetails';
// Auth Pages
import Signup from "./pages/Signup";
import SignIn from "./pages/SignIn";

// NEW: Import unified Dashboard from the new location
import Dashboard from "./dashboard";


// Case Creator Components
import CaseCreator from "./components/CaseCreator";
import ProfileSettings from "./pages/ProfileSettings";
import EditorWrapper from "./components/CaseCreator/EditorWrapper";

// Template System Components
import TemplatePreviewWrapper from './components/CaseCreator/views/TemplatePreviewWrapper';
import TemplateRenderer from "./templates/TemplateRenderer";
import CustomizationView from './components/CaseCreator/views/CustomizationView/CustomizationView';

// Utils
import getSubdomain from "./utils/getSubdomain";

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
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return children;
}

// Admin auth wrapper (checks for staff/admin status)
function RequireAdmin({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  
  // Check if user is staff or admin
  if (!user?.is_staff && !user?.is_admin && !user?.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const subdomain = getSubdomain();
  
  // State for modals
  const [showCaseCreator, setShowCaseCreator] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [currentCase, setCurrentCase] = useState(null);

  // Determine if this is a memorial site
  const hostname = window.location.hostname;
  const isMemorialSite = React.useMemo(() => {
    if (location.pathname.startsWith('/preview/')) {
      return false;
    }
    
    if (hostname.includes('.caseclosure.org') || hostname.includes('.caseclosure.com')) {
      const sub = hostname.split('.')[0];
      return sub && sub !== 'www' && sub !== 'app' && sub !== 'caseclosure';
    }
    
    if (hostname.includes('.localhost')) {
      const sub = hostname.split('.')[0];
      return sub && sub !== 'www' && sub !== 'app';
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return location.pathname.startsWith('/memorial/');
    }
    
    return !hostname.includes('caseclosure');
  }, [hostname, location.pathname]);

  // Debug logging (moved outside JSX)
  useEffect(() => {

  }, [user]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/signin";
  };

  // Modal handlers
  const handleOpenCaseModal = () => {
    setShowCaseCreator(true);
  };

  const handleCloseCaseModal = () => {
    setShowCaseCreator(false);
  };

  const handleCaseComplete = (caseData) => {
    setCurrentCase(caseData);
    setShowCaseCreator(false);
    
    if (caseData.id) {
      // Navigate to editor after case creation
      navigate(`/editor/${caseData.id}`);
    }
  };

  // Navigation function for CaseCreator to use
  const handleNavigateFromModal = (path) => {
    // Close the modal first
    setShowCaseCreator(false);
    // Then navigate
    setTimeout(() => {
      navigate(path);
    }, 100);
  };

  const handleOpenProfileSettings = () => {
    setShowProfileSettings(true);
  };

  const handleCloseProfileSettings = () => {
    setShowProfileSettings(false);
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const updatedUser = JSON.parse(userData);
        window.location.reload();
      } catch (e) {
        console.error('Failed to update user data:', e);
      }
    }
  };

  // If this is a memorial site, render the template
  if (isMemorialSite) {
    return <TemplateRenderer />;
  }

  // Regular CaseClosure app routes
  return (
    <>
      <Routes>
        {/* Template Preview Routes (for iframe in editor) */}
        <Route path="/preview/:caseId/:page" element={<TemplatePreviewWrapper />} />
        <Route path="/preview/:caseId" element={<TemplatePreviewWrapper />} />

        {/* Editor/Customization Routes */}
        <Route 
          path="/editor/:caseId" 
          element={
            <RequireAuth>
              <EditorWrapper />
            </RequireAuth>
          } 
        />
        <Route 
          path="/editor/new" 
          element={
            <RequireAuth>
              <EditorWrapper />
            </RequireAuth>
          } 
        />
        <Route 
          path="/cases/:caseId/editor" 
          element={
            <RequireAuth>
              <EditorWrapper />
            </RequireAuth>
          } 
        />
        <Route path="cases/:caseId" element={<CaseDetails />} />

        {/* Public Website Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/services" element={<Layout><Pricing /></Layout>} />
        <Route path="/spotlight" element={<Layout><Spotlight /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/discover" element={<Layout><Discover /></Layout>} />
        <Route path="/request-account" element={<Layout><RequestAccount /></Layout>} />

        
        {/* Auth Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />

        {/* Protected Dashboard Routes - Now Unified */}
        <Route
          path="/dashboard/*"
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
        
        {/* Spotlight Dashboard Routes (handled by Dashboard component) */}
        {/* These will be child routes inside the Dashboard component:
            - /dashboard/spotlight - User feed
            - /dashboard/spotlight/admin - Admin moderation
        */}
        
        {/* Settings - redirects to dashboard */}
        <Route
          path="/settings/user"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Admin - redirects to dashboard (role-based access is handled inside Dashboard) */}
        <Route
          path="/admin"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Cases list - redirects to dashboard */}
        <Route
          path="/cases/list"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Memorial Preview */}
        <Route
          path="/memorial/:caseId/*"
          element={<TemplateRenderer />}
        />
        
        {/* Default Redirects */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/" replace />
          } 
        />
      </Routes>

      {/* Modals - Outside Router context */}
      {showCaseCreator && (
        <div className="fixed inset-0 z-[60]">
          <CaseCreator
            onClose={handleCloseCaseModal}
            onComplete={handleCaseComplete}
            onNavigate={handleNavigateFromModal}
          />
        </div>
      )}

      {showProfileSettings && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseProfileSettings}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ProfileSettings
              user={user}
              currentCase={currentCase}
              onClose={handleCloseProfileSettings}
            />
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <>
        <title>Case Closure - Crowdsourcing Closure. One Case at a Time.</title>
      </>
      <AppContent />
    </Router>
  );
}

export default App;