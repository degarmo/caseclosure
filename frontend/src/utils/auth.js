// frontend/src/utils/auth.js
import api from '@/api/axios';

// Logout function - can be used anywhere in your app
export const logout = async (navigate, showMessage = true) => {
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
    
    // Redirect to signin page
    if (navigate) {
      navigate('/signin', { 
        state: showMessage ? { 
          message: 'You have been successfully signed out.' 
        } : undefined,
        replace: true
      });
    } else {
      // Fallback to window.location if navigate not available
      window.location.href = '/signin';
    }
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('access');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

// Get access token
export const getAccessToken = () => {
  return localStorage.getItem('access');
};

// Get refresh token
export const getRefreshToken = () => {
  return localStorage.getItem('refresh');
};

// Save auth data after login
export const saveAuthData = (access, refresh, user) => {
  if (access) localStorage.setItem('access', access);
  if (refresh) localStorage.setItem('refresh', refresh);
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

// Update access token (used after refresh)
export const updateAccessToken = (newAccessToken) => {
  if (newAccessToken) {
    localStorage.setItem('access', newAccessToken);
  }
};