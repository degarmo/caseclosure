// api/messagesAPI.js
import api from './config';

/**
 * Messages API methods
 */
export const messagesAPI = {
  unreadCount: () => api.get('/messages/unread-count/'),
  list: (params) => api.get('/messages/', { params }),
  get: (id) => api.get(`/messages/${id}/`),
  markAsRead: (id) => api.patch(`/messages/${id}/mark-read/`),
};

/**
 * Notifications API methods
 */
export const notificationsAPI = {
  list: (params) => api.get('/notifications/', { params }),
  unreadCount: () => api.get('/notifications/unread-count/'),
  markAsRead: (id) => api.patch(`/notifications/${id}/mark-read/`),
};

export default { messagesAPI, notificationsAPI };