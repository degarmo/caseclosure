// utils/axios.js
import axios from "axios";

/**
 * Check if current route is a preview route that shouldn't trigger auth redirects
 */
const isPreviewRoute = () => {
  return window.location.pathname.startsWith('/preview/');
};

/**
 * Determine the correct API URL based on environment and hostname
 */
const getAPIBaseURL = () => {
  // Development - uses Vite proxy
  if (import.meta.env.DEV) {
    return "/api/";  // This will use Vite's proxy from vite.config.js
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
  
  // Default fallback for local development
  return "/api/";
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
 * Helper function to get token from any possible storage key
 */
const getStoredToken = () => {
  return localStorage.getItem("access") || 
         localStorage.getItem("authToken") || 
         localStorage.getItem("access_token");
};

/**
 * Helper function to get refresh token from any possible storage key
 */
const getStoredRefreshToken = () => {
  return localStorage.getItem("refresh") || 
         localStorage.getItem("refreshToken") || 
         localStorage.getItem("refresh_token");
};

/**
 * Helper function to store tokens in all possible keys for compatibility
 */
const storeTokens = (accessToken, refreshToken = null) => {
  if (accessToken) {
    localStorage.setItem("access", accessToken);
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("access_token", accessToken);
  }
  
  if (refreshToken) {
    localStorage.setItem("refresh", refreshToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refresh_token", refreshToken);
  }
};

/**
 * Helper function to clear all auth data
 */
const clearAuthData = () => {
  // Clear all possible token keys
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

/**
 * Request interceptor to add auth token to every request
 */
api.interceptors.request.use(
  (config) => {
    // Skip auth for preview routes
    if (!isPreviewRoute()) {
      const token = getStoredToken();
      
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    
    // Log the request in development
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for handling 401 errors and token refresh
 */
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', error.response?.status, error.config?.url);
    }
    
    // IMPORTANT: Don't redirect preview routes to login
    if (isPreviewRoute()) {
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getStoredRefreshToken();
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        // Try to refresh the token
        const baseURL = getAPIBaseURL();
        const refreshResponse = await axios.post(
          `${baseURL}auth/token/refresh/`,
          { refresh: refreshToken }
        );
        
        const newAccessToken = refreshResponse.data.access;
        
        // Store the new token in all possible keys
        storeTokens(newAccessToken);
        
        // Update the authorization header and retry the original request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // IMPORTANT: Only redirect to login if NOT on a preview route
        if (!isPreviewRoute()) {
          // Clear all auth data and redirect to login
          clearAuthData();
          window.location.href = "/";  // Go to home page, not /login or /signin
        } else {
          console.log('🛡️ Preview route - auth failed but not redirecting');
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * API methods organized by resource
 */
export const apiMethods = {
  // Spotlight
  spotlight: {
    list: (params) => api.get('/spotlight/', { params }),
    get: (id) => api.get(`/spotlight/${id}/`),
    create: (data) => {
      const config = data instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      return api.post('/spotlight/', data, config);
    },
    update: (id, data) => api.patch(`/spotlight/${id}/`, data),
    delete: (id) => api.delete(`/spotlight/${id}/`),
    like: (id) => api.post(`/spotlight/${id}/like/`),
    comment: (id, data) => api.post(`/spotlight/${id}/comment/`, data),
    view: (id) => api.post(`/spotlight/${id}/view/`),
    scheduled: () => api.get('/spotlight/scheduled/'),
  },

  // Cases
  cases: {
    list: (params) => api.get('/cases/', { params }),
    get: (id) => api.get(`/cases/${id}/`),
    create: (data) => api.post('/cases/', data),
    update: (id, data) => api.put(`/cases/${id}/`, data),
    patch: (id, data) => api.patch(`/cases/${id}/`, data),
    delete: (id) => api.delete(`/cases/${id}/`),
  },

  // Posts
  posts: {
    list: (params) => api.get('/posts/', { params }),
    get: (id) => api.get(`/posts/${id}/`),
    create: (data) => api.post('/posts/', data),
    update: (id, data) => api.put(`/posts/${id}/`, data),
    delete: (id) => api.delete(`/posts/${id}/`),
  },

  // Contact Inquiries
  contactInquiries: {
    create: (data) => api.post('/contact/', data),
  },

  // Account Requests
  accountRequests: {
    create: (data) => api.post('/account-requests/', data),
  },

  // Auth
  auth: {
    login: (credentials) => api.post('/auth/login/', credentials),
    logout: () => api.post('/auth/logout/'),
    register: (data) => api.post('/auth/register/', data),
    getUser: () => api.get('/auth/user/'),
    updateProfile: (data) => api.put('/auth/profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
    refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  },

  // Messages
  messages: {
    unreadCount: () => api.get('/messages/unread-count/'),
    list: (params) => api.get('/messages/', { params }),
    get: (id) => api.get(`/messages/${id}/`),
    markAsRead: (id) => api.patch(`/messages/${id}/mark-read/`),
  },

  // Notifications
  notifications: {
    list: (params) => api.get('/notifications/', { params }),
    unreadCount: () => api.get('/notifications/unread-count/'),
    markAsRead: (id) => api.patch(`/notifications/${id}/mark-read/`),
  },

  // Analytics
  analytics: {
    getDashboard: (caseId) => api.get(`/analytics/dashboard/${caseId}/`),
    getVisitors: (caseId, params) => api.get(`/analytics/visitors/${caseId}/`, { params }),
    getEvents: (caseId, params) => api.get(`/analytics/events/${caseId}/`, { params }),
    getLocations: () => api.get('/analytics/locations/'),
  },

  // Tracking
  tracking: {
    sendEvent: (data) => api.post('/track/event/', data),
    sendBatch: (events) => api.post('/track/batch/', { events }),
  },

  // Activity
  activity: {
    last: () => api.get('/activity/last/'),
    feed: (params) => api.get('/activity/feed/', { params }),
    realtime: (params) => api.get('/activity/realtime/', { params }),
  },

  // Dashboard
  dashboard: {
    stats: () => api.get('/dashboard/stats/'),
    widgets: (params) => api.get('/dashboard/widgets/', { params }),
  },

  // Admin
  admin: {
    alertsCount: () => api.get('/admin/alerts-count/'),
    users: (params) => api.get('/admin/users/', { params }),
    security: () => api.get('/admin/security/'),
    accountRequests: (params) => api.get('/admin/account-requests/', { params }),
  },

  // Metrics
  metrics: {
    realtime: (params) => api.get('/metrics/realtime/', { params }),
  },
};

/**
 * Utility functions for auth management
 */
export const authUtils = {
  getAccessToken: () => getStoredToken(),
  getRefreshToken: () => getStoredRefreshToken(),
  setAccessToken: (token) => {
    if (token) {
      storeTokens(token);
    } else {
      clearAuthData();
    }
  },
  setTokens: (accessToken, refreshToken) => {
    storeTokens(accessToken, refreshToken);
  },
  isAuthenticated: () => !!getStoredToken(),
  clearAuth: () => clearAuthData(),
  getBaseURL: () => getAPIBaseURL(),
  isPreviewRoute: isPreviewRoute,
};

/**
 * Backward compatibility exports
 */
export const base44API = apiMethods;
export const getAccessToken = authUtils.getAccessToken;
export const setAccessToken = authUtils.setAccessToken;
export const isAuthenticated = authUtils.isAuthenticated;

// Default export is the axios instance
export default api;