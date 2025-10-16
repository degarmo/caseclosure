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
  // Development - uses Vite proxy to /api/
  if (import.meta.env.DEV) {
    return "/api/";  // Vite proxy forwards /api/* to http://127.0.0.1:8000
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
  
  // Default fallback
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
 * Get access token from localStorage
 */
const getStoredToken = () => {
  return localStorage.getItem("access") || 
         localStorage.getItem("authToken") || 
         localStorage.getItem("access_token") ||
         localStorage.getItem("token");
};

/**
 * Get refresh token from localStorage
 */
const getStoredRefreshToken = () => {
  return localStorage.getItem("refresh") || 
         localStorage.getItem("refreshToken") || 
         localStorage.getItem("refresh_token");
};

/**
 * Store tokens in localStorage
 */
const storeTokens = (accessToken, refreshToken = null) => {
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
const clearAuthData = () => {
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
 * Request interceptor - add auth token to every request
 */
api.interceptors.request.use(
  (config) => {
    if (!isPreviewRoute()) {
      const token = getStoredToken();
      
      if (token) {
        // Use Bearer format for JWT tokens
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
  (response) => {
    return response;
  },
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
        
        const baseURL = getAPIBaseURL();
        const refreshResponse = await axios.post(
          `${baseURL}auth/token/refresh/`,
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

/**
 * API methods organized by resource
 */
export const apiMethods = {
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

  cases: {
    list: (params) => api.get('/cases/', { params }),
    get: (id) => api.get(`/cases/${id}/`),
    create: (data) => api.post('/cases/', data),
    update: (id, data) => api.put(`/cases/${id}/`, data),
    patch: (id, data) => api.patch(`/cases/${id}/`, data),
    delete: (id) => api.delete(`/cases/${id}/`),
  },

  posts: {
    list: (params) => api.get('/posts/', { params }),
    get: (id) => api.get(`/posts/${id}/`),
    create: (data) => api.post('/posts/', data),
    update: (id, data) => api.put(`/posts/${id}/`, data),
    delete: (id) => api.delete(`/posts/${id}/`),
  },

  contactInquiries: {
    create: (data) => api.post('/contact/', data),
  },

  accountRequests: {
    create: (data) => api.post('/account-requests/', data),
  },

  auth: {
    login: (credentials) => api.post('/auth/login/', credentials),
    logout: () => api.post('/auth/logout/'),
    register: (data) => api.post('/auth/register/', data),
    getUser: () => api.get('/auth/user/'),
    updateProfile: (data) => api.put('/auth/profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
    refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  },

  messages: {
    unreadCount: () => api.get('/messages/unread-count/'),
    list: (params) => api.get('/messages/', { params }),
    get: (id) => api.get(`/messages/${id}/`),
    markAsRead: (id) => api.patch(`/messages/${id}/mark-read/`),
  },

  notifications: {
    list: (params) => api.get('/notifications/', { params }),
    unreadCount: () => api.get('/notifications/unread-count/'),
    markAsRead: (id) => api.patch(`/notifications/${id}/mark-read/`),
  },

  analytics: {
    getDashboard: (caseId) => api.get(`/analytics/dashboard/${caseId}/`),
    getVisitors: (caseId, params) => api.get(`/analytics/visitors/${caseId}/`, { params }),
    getEvents: (caseId, params) => api.get(`/analytics/events/${caseId}/`, { params }),
    getLocations: () => api.get('/analytics/locations/'),
  },

  tracking: {
    sendEvent: (data) => api.post('/track/event/', data),
    sendBatch: (events) => api.post('/track/batch/', { events }),
  },

  activity: {
    last: () => api.get('/activity/last/'),
    feed: (params) => api.get('/activity/feed/', { params }),
    realtime: (params) => api.get('/activity/realtime/', { params }),
  },

  dashboard: {
    stats: () => api.get('/dashboard/stats/'),
    widgets: (params) => api.get('/dashboard/widgets/', { params }),
  },

  admin: {
    alertsCount: () => api.get('/admin/alerts-count/'),
    users: (params) => api.get('/admin/users/', { params }),
    security: () => api.get('/admin/security/'),
    accountRequests: (params) => api.get('/admin/account-requests/', { params }),
  },

  metrics: {
    realtime: (params) => api.get('/metrics/realtime/', { params }),
  },
};

/**
 * Auth utility functions
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

// Default export
export default api;