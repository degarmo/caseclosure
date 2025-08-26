// frontend/src/pages/SignOut.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Loader2 } from 'lucide-react';

// Main SignOut component - ONLY ONE DEFAULT EXPORT
export default function SignOut() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Get the refresh token if available
        const refreshToken = localStorage.getItem('refresh');
        
        // Call backend logout endpoint to blacklist the token
        if (refreshToken) {
          try {
            await api.post('auth/logout/', { 
              refresh: refreshToken 
            });
          } catch (error) {
            // If backend logout fails, continue with local logout
            console.error('Backend logout failed:', error);
          }
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear all auth data from localStorage
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        
        // Clear any other app-specific data
        localStorage.removeItem('selectedCase');
        localStorage.removeItem('dashboardPreferences');
        
        // Redirect to signin page with a message
        navigate('/signin', { 
          state: { 
            message: 'You have been successfully signed out.' 
          },
          replace: true // Prevent going back to signout page
        });
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700">Signing out...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we log you out securely.</p>
      </div>
    </div>
  );
}