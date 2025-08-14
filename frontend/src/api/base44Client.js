/**
 * API Client for Base44/CaseClosure
 * This replaces the @base44/sdk dependency with a custom implementation
 * Location: src/api/base44Client.js
 */

import axios from 'axios';

// Get API URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE44_API_URL = import.meta.env.VITE_BASE44_API_URL || API_BASE_URL;

/**
 * Create a client instance for API communication
 */
export function createClient(config = {}) {
  const client = axios.create({
    baseURL: config.baseURL || BASE44_API_URL,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            // Try to refresh the token
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken
            });
            
            const newToken = refreshResponse.data.access;
            localStorage.setItem('authToken', newToken);
            
            // Retry original request with new token
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios(error.config);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        } else {
          // No refresh token, redirect to login
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Default client instance
 */
const client = createClient();

/**
 * Base44 API methods
 */
const base44API = {
  // Cases
  cases: {
    list: (params) => client.get('/cases/', { params }),
    get: (id) => client.get(`/cases/${id}/`),
    create: (data) => client.post('/cases/', data),
    update: (id, data) => client.put(`/cases/${id}/`, data),
    delete: (id) => client.delete(`/cases/${id}/`),
  },

  // Posts
  posts: {
    list: (params) => client.get('/posts/', { params }),
    get: (id) => client.get(`/posts/${id}/`),
    create: (data) => client.post('/posts/', data),
    update: (id, data) => client.put(`/posts/${id}/`, data),
    delete: (id) => client.delete(`/posts/${id}/`),
  },

  // Contact Inquiries
  contactInquiries: {
    create: (data) => client.post('/contact/', data),
  },

  // Account Requests
  accountRequests: {
    create: (data) => client.post('/account-requests/', data),
  },

  // Auth
  auth: {
    login: (credentials) => client.post('/auth/login/', credentials),
    logout: () => client.post('/auth/logout/'),
    register: (data) => client.post('/auth/register/', data),
    getUser: () => client.get('/auth/user/'),
    updateProfile: (data) => client.put('/auth/profile/', data),
  },

  // Analytics
  analytics: {
    getDashboard: (caseId) => client.get(`/analytics/dashboard/${caseId}/`),
    getVisitors: (caseId, params) => client.get(`/analytics/visitors/${caseId}/`, { params }),
    getEvents: (caseId, params) => client.get(`/analytics/events/${caseId}/`, { params }),
  },

  // Tracking
  tracking: {
    sendEvent: (data) => client.post('/track/event/', data),
    sendBatch: (events) => client.post('/track/batch/', { events }),
  },
};

/**
 * Utility function to get access token
 */
export function getAccessToken() {
  return localStorage.getItem('authToken');
}

/**
 * Utility function to set access token
 */
export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

/**
 * Utility function to check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

// Export the default client and base44API
export default client;
export { base44API };