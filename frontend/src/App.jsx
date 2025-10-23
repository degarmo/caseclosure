/**
 * App.jsx - Consolidated with single unified dashboard
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
import Spotlight from "./pages/Spotlight";
import Contact from "./pages/Contact";
import Discover from "./pages/Discover";
import RequestAccount from "./pages/RequestAccount";
//import CaseDetails from './dashboard/components/CaseDetails';

// Auth Pages
import Signup from "./pages/Signup";
import SignIn from "./pages/SignIn";

// Dashboard Component
import Dashboard from "@/components/dashboard/Dashboard";

// Case Creator Components
import CaseCreator from "./components/CaseCreator";
import CaseDetails from "./components/dashboard/sections/Cases/CaseDetails"
import ProfileSettings from "./pages/ProfileSettings";
import EditorWrapper from "./components/CaseCreator/EditorWrapper";

// Template System Components
import TemplatePreviewWrapper from './components/CaseCreator/views/TemplatePreviewWrapper';
import TemplateRenderer from "./templates/TemplateRenderer";

// Utils
import getSubdomain from "./utils/getSubdomain";
import api from "./utils/axios";

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

// Admin auth wrapper
function RequireAdmin({ children }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  if (!user?.is_staff && !user?.is_admin && !user?.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Beta mode route protection
function BetaProtectedRoute({ children }) {
  const [betaMode, setBetaMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBetaMode();
  }, []);

  const checkBetaMode = async () => {
    try {
      const response = await api.get('/auth/settings/public/invite-status/');
      setBetaMode(response.data.is_invite_only === true);
    } catch (error) {
      // If endpoint fails, assume beta is enabled
      setBetaMode(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If beta mode is disabled, redirect to signup
  if (!betaMode) {
    return <Navigate to="/signup" replace />;
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
  const [editingCaseId, setEditingCaseId] = useState(null);

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
  const handleOpenCaseModal = (caseId = null) => {
    setEditingCaseId(caseId);
    setShowCaseCreator(true);
  };

  const handleCloseCaseModal = () => {
    setShowCaseCreator(false);
    setEditingCaseId(null);
  };

  const handleCaseComplete = (caseData) => {
    setCurrentCase(caseData);
    setShowCaseCreator(false);
    setEditingCaseId(null);
    
    if (caseData.id && !editingCaseId) {
      navigate(`/editor/${caseData.id}`);
    } else if (editingCaseId) {
      window.location.reload();
    }
  };

  const handleNavigateFromModal = (path) => {
    setShowCaseCreator(false);
    setEditingCaseId(null);
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
        // Handle error silently
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
        {/* Template Preview Routes */}
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

        {/* Edit Case Route */}
        <Route 
          path="/dashboard/cases/edit/:id" 
          element={
            <RequireAuth>
              <CaseCreator 
                mode="edit"
                onClose={() => navigate('/dashboard')}
                onComplete={(caseData) => {
                  // Case edit completed
                }}
                onNavigate={(path) => {
                  if (path !== 'template') {
                    navigate(path);
                  }
                }}
              />
            </RequireAuth>
          } 
        />

        {/* Create Case Route */}
        <Route 
          path="/dashboard/cases/new" 
          element={
            <RequireAuth>
              <CaseCreator 
                mode="create"
                onClose={() => navigate('/dashboard')}
                onComplete={(caseData) => {
                  if (caseData.id) {
                    navigate(`/editor/${caseData.id}`);
                  }
                }}
                onNavigate={(path) => navigate(path)}
              />
            </RequireAuth>
          } 
        />

        {/* Public Website Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
        <Route path="/services" element={<Layout><Pricing /></Layout>} />
        <Route path="/spotlight" element={<Layout><Spotlight /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/discover" element={<Layout><Discover /></Layout>} />
        
        {/* Request Account - Only available if beta mode is enabled */}
        <Route 
          path="/request-account" 
          element={
            <BetaProtectedRoute>
              <Layout><RequestAccount /></Layout>
            </BetaProtectedRoute>
          } 
        />

        {/* Auth Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />

        {/* Dashboard */}
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
        
        {/* Settings redirect */}
        <Route
          path="/settings/user"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Admin redirect */}
        <Route
          path="/admin"
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Cases list redirect */}
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

      {/* Modals */}
      {showCaseCreator && (
        <div className="fixed inset-0 z-[60]">
          <CaseCreator
            mode={editingCaseId ? 'edit' : 'create'}
            caseId={editingCaseId}
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
      <AppContent />
    </Router>
  );
}

export default App;