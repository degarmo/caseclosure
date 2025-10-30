// utils/axios.js
/**
 * BACKWARD COMPATIBILITY LAYER
 * 
 * This file maintains backward compatibility with existing imports.
 * All API methods are now organized in the /api directory:
 * 
 * - api/config.js       - Base axios instance & interceptors
 * - api/authAPI.js      - Authentication methods
 * - api/casesAPI.js     - Case management
 * - api/spotlightAPI.js - Spotlight posts
 * - api/analyticsAPI.js - Analytics & tracking
 * - api/messagesAPI.js  - Messages & notifications
 * - api/adminAPI.js     - Admin & dashboard
 * - api/postsAPI.js     - Posts & misc
 * 
 * Existing imports will continue to work:
 *   import api from '@/utils/axios'
 *   import { apiMethods, authUtils } from '@/utils/axios'
 * 
 * New code should import directly from api modules:
 *   import { authAPI } from '@/api'
 *   import { casesAPI } from '@/api'
 */

// Re-export everything from the new api directory
export { 
  default,
  api,
  apiMethods,
  authUtils,
  authAPI,
  casesAPI,
  spotlightAPI,
  analyticsAPI,
  trackingAPI,
  activityAPI,
  metricsAPI,
  messagesAPI,
  notificationsAPI,
  adminAPI,
  dashboardAPI,
  postsAPI,
  contactInquiriesAPI,
  accountRequestsAPI,
  integrationsAPI,
  memorialSitesAPI,
  getAPIBaseURL,
  isPreviewRoute,
  getStoredToken,
  getStoredRefreshToken,
  storeTokens,
  clearAuthData
} from '../api';

// Backward compatibility exports
export { default as base44API } from '../api';
export { getStoredToken as getAccessToken } from '../api';
export { storeTokens as setAccessToken } from '../api';
export { getStoredToken as isAuthenticated } from '../api';