// api/index.js
// Export the base api instance and config utilities
import api from './config';
export { default as api } from './config';
export { 
  getAPIBaseURL, 
  isPreviewRoute,
  getStoredToken,
  getStoredRefreshToken,
  storeTokens,
  clearAuthData
} from './config';

// Import all API modules
import { authAPI } from './authAPI';
import { casesAPI } from './casesAPI';
import { spotlightAPI } from './spotlightAPI';
import { analyticsAPI, trackingAPI, activityAPI, metricsAPI } from './analyticsAPI';
import { messagesAPI, notificationsAPI } from './messagesAPI';
import { adminAPI, dashboardAPI } from './adminAPI';
import { postsAPI, contactInquiriesAPI, accountRequestsAPI } from './postsAPI';
import { integrationsAPI } from './integrationsAPI';
import { memorialSitesAPI } from './memorialSitesAPI';

// Re-export all API modules
export { authAPI, casesAPI, spotlightAPI, analyticsAPI, trackingAPI, activityAPI, metricsAPI, messagesAPI, notificationsAPI, adminAPI, dashboardAPI, postsAPI, contactInquiriesAPI, accountRequestsAPI, integrationsAPI, memorialSitesAPI };

// Export convenience object with all APIs
export const apiMethods = {
  auth: authAPI,
  cases: casesAPI,
  spotlight: spotlightAPI,
  analytics: analyticsAPI,
  tracking: trackingAPI,
  activity: activityAPI,
  metrics: metricsAPI,
  messages: messagesAPI,
  notifications: notificationsAPI,
  admin: adminAPI,
  dashboard: dashboardAPI,
  posts: postsAPI,
  contactInquiries: contactInquiriesAPI,
  accountRequests: accountRequestsAPI,
  integrations: integrationsAPI,
  memorialSites: memorialSitesAPI,
};

// Auth utility functions
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
  isPreviewRoute: () => isPreviewRoute(),
};

export default api;