// api/adminAPI.js
import api from './config';

/**
 * Admin API methods
 */
export const adminAPI = {
  alertsCount: () => api.get('/admin/alerts-count/'),
  users: (params) => api.get('/admin/users/', { params }),
  security: () => api.get('/admin/security/'),
  accountRequests: (params) => api.get('/admin/account-requests/', { params }),
};

/**
 * Dashboard API methods
 */
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats/'),
  widgets: (params) => api.get('/dashboard/widgets/', { params }),
};

export default { adminAPI, dashboardAPI };