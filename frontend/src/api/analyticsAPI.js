// api/analyticsAPI.js
import api from './config';

/**
 * Analytics/Dashboard API methods
 * Maps to backend: /api/tracker/dashboard/<case_slug>/...
 */
export const analyticsAPI = {
  getDashboard: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/`),
  getFamilyAnalytics: (caseSlug, days = 30) =>
    api.get(`/tracker/family-analytics/${caseSlug}/`, { params: { days } }),
  getVisitors: (caseSlug, params) => api.get(`/tracker/dashboard/${caseSlug}/suspicious/`, { params }),
  getPatterns: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/patterns/`),
  getRealtime: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/realtime/`),
  exportData: (caseSlug, params) => api.post(`/tracker/dashboard/${caseSlug}/export/`, params),

  // Widget endpoints
  getVisitorMetrics: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/widgets/visitor-metrics/`),
  getSuspiciousActivity: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/widgets/suspicious-activity/`),
  getGeographicMap: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/widgets/geographic-map/`),
  getActivityTimeline: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/widgets/activity-timeline/`),
  getEngagementMetrics: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/widgets/engagement-metrics/`),
  getAlerts: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/widgets/alerts/`),

  // Realtime stream endpoints
  getRealtimeActivity: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/realtime/activity/`),
  getRealtimeMetrics: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/realtime/metrics/`),

  // Identity anomaly detection
  getIdentityAnomalies: (caseSlug) => api.get(`/tracker/dashboard/${caseSlug}/identity-anomalies/`),
};

/**
 * Tracking API methods
 * Maps to backend: /api/tracker/track/...
 */
export const trackingAPI = {
  sendEvent: (data) => api.post('/tracker/track/', data),
  sendBatch: (events) => api.post('/tracker/track/batch/', { events }),
  reportSuspicious: (data) => api.post('/tracker/suspicious/report/', data),
};

/**
 * Activity API methods
 * Maps to backend: /api/tracker/activity/...
 */
export const activityAPI = {
  last: () => api.get('/tracker/activity/last/'),
};

/**
 * Admin tracking endpoints
 * Maps to backend: /api/tracker/admin/...
 */
export const adminTrackingAPI = {
  getAlerts: () => api.get('/tracker/admin/alerts/'),
  flagUser: (fingerprint) => api.post(`/tracker/admin/flag/${fingerprint}/`),
};

export default { analyticsAPI, trackingAPI, activityAPI, adminTrackingAPI };