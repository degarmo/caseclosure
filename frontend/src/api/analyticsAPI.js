// api/analyticsAPI.js
import api from './config';

/**
 * Analytics API methods
 */
export const analyticsAPI = {
  getDashboard: (caseId) => api.get(`/analytics/dashboard/${caseId}/`),
  getVisitors: (caseId, params) => api.get(`/analytics/visitors/${caseId}/`, { params }),
  getEvents: (caseId, params) => api.get(`/analytics/events/${caseId}/`, { params }),
  getLocations: () => api.get('/analytics/locations/'),
};

/**
 * Tracking API methods
 */
export const trackingAPI = {
  sendEvent: (data) => api.post('/track/event/', data),
  sendBatch: (events) => api.post('/track/batch/', { events }),
};

/**
 * Activity API methods
 */
export const activityAPI = {
  last: () => api.get('/activity/last/'),
  feed: (params) => api.get('/activity/feed/', { params }),
  realtime: (params) => api.get('/activity/realtime/', { params }),
};

/**
 * Metrics API methods
 */
export const metricsAPI = {
  realtime: (params) => api.get('/metrics/realtime/', { params }),
};

export default { analyticsAPI, trackingAPI, activityAPI, metricsAPI };