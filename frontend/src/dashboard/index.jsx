// src/pages/Dashboard/index.jsx
// This is the wrapper that receives props from App.jsx and passes them to AdminDashboard or UserDashboard

import React, { useEffect } from 'react';
import AdminDashboard from '../dashboard/AdminDashboard';
import UserDashboard from '../dashboard/UserDashboard';

export default function Dashboard({ 
  user, 
  onLogout, 
  onOpenCaseModal, 
  onOpenProfileSettings,
  activeSection,
  showProfileSettings 
}) {
  // Debug: Log what props we're receiving
  useEffect(() => {
    console.log('=== Dashboard Wrapper Debug ===');
    console.log('Received props:', {
      hasUser: !!user,
      hasOnLogout: !!onLogout,
      hasOnOpenCaseModal: !!onOpenCaseModal,
      onOpenCaseModalType: typeof onOpenCaseModal,
      hasOnOpenProfileSettings: !!onOpenProfileSettings,
      userIsAdmin: user?.is_staff || user?.is_superuser
    });
    console.log('onOpenCaseModal function:', onOpenCaseModal);
    console.log('===============================');
  }, [user, onOpenCaseModal]);
  
  // Check if user is admin
  const isAdmin = user?.is_staff || user?.is_superuser;
  
  // If onOpenCaseModal is missing, create a fallback that shows an error
  const handleOpenCaseModal = onOpenCaseModal || (() => {
    console.error('onOpenCaseModal was not provided to Dashboard component from App.jsx');
    alert('Case creation is not available. Please refresh the page.');
  });
  
  if (isAdmin) {
    console.log('Rendering AdminDashboard with onOpenCaseModal:', !!handleOpenCaseModal);
    return (
      <AdminDashboard 
        user={user} 
        onLogout={onLogout}
        onOpenCaseModal={handleOpenCaseModal}
      />
    );
  }
  
  // For regular users
  console.log('Rendering UserDashboard with onOpenCaseModal:', !!handleOpenCaseModal);
  
  // Check if UserDashboard exists, if not show a simple fallback
  try {
    return (
      <UserDashboard 
        user={user} 
        onLogout={onLogout}
        onOpenCaseModal={handleOpenCaseModal}
      />
    );
  } catch (error) {
    console.error('UserDashboard component not found:', error);
    // Fallback UI if UserDashboard doesn't exist
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h1 className="text-2xl font-bold mb-2">Welcome {user?.first_name || 'User'}</h1>
            <p className="text-gray-600 mb-4">Your dashboard is being set up...</p>
            <button
              onClick={handleOpenCaseModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-4"
            >
              Create Case
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }
}