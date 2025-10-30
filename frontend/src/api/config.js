// api/config.js
import axios from "axios";

/**
 * Check if current route is a preview route that shouldn't trigger auth redirects
 */
export const isPreviewRoute = () => {
  return window.location.pathname.startsWith('/preview/');
};

/**
 * Determine the correct API URL based on environment and hostname
 */
export const getAPIBaseURL = () => {
  // Development - uses Vite proxy to /api/
  if (import.meta.env.DEV) {
    return "/api/";
  }
  
  // Production - check hostname
  const hostname = window.location.hostname;
  
  // Production domains
  if (hostname === 'caseclosure-frontend.onrender.com' || 
      hostname === 'caseclosure.org' ||
      hostname === 'www.caseclosure.org') {
    return "https://caseclosure-backend.onrender.com/api/";
  }
  
  // Any non-localhost domain should use production backend
  if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    return "https://caseclosure-backend.onrender.com/api/";
  }
  
  return "/api/";
};

/**
 * Get access token from localStorage
 */
export const getStoredToken = () => {
  return localStorage.getItem("access") || 
         localStorage.getItem("authToken") || 
         localStorage.getItem("access_token") ||
         localStorage.getItem("token");
};

/**
 * Get refresh token from localStorage
 */
export const getStoredRefreshToken = () => {
  return localStorage.getItem("refresh") || 
         localStorage.getItem("refreshToken") || 
         localStorage.getItem("refresh_token");
};

/**
 * Store tokens in localStorage
 */
export const storeTokens = (accessToken, refreshToken = null) => {
  if (accessToken) {
    localStorage.setItem("access", accessToken);
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("token", accessToken);
  }
  
  if (refreshToken) {
    localStorage.setItem("refresh", refreshToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
};

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Create the main axios instance
 */
const api = axios.create({
  baseURL: getAPIBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - add auth token to every request
 */
api.interceptors.request.use(
  (config) => {
    if (!isPreviewRoute()) {
      const token = getStoredToken();
      
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle 401 and refresh token
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't redirect preview routes to login
    if (isPreviewRoute()) {
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getStoredRefreshToken();
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const refreshResponse = await api.post(
          '/auth/token/refresh/',
          { refresh: refreshToken }
        );
        
        const newAccessToken = refreshResponse.data.access;
        storeTokens(newAccessToken);
        
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (!isPreviewRoute()) {
          clearAuthData();
          window.location.href = "/";
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;