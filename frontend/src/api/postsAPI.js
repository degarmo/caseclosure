// api/postsAPI.js
import api from './config';

/**
 * Posts API methods
 */
const postsAPI = {
  list: (params) => api.get('/posts/', { params }),
  get: (id) => api.get(`/posts/${id}/`),
  create: (data) => api.post('/posts/', data),
  update: (id, data) => api.put(`/posts/${id}/`, data),
  delete: (id) => api.delete(`/posts/${id}/`),
};

/**
 * Contact inquiries API methods
 */
const contactInquiriesAPI = {
  create: (data) => api.post('/contact/', data),
};

/**
 * Account requests API methods
 */
const accountRequestsAPI = {
  create: (data) => api.post('/account-requests/', data),
};

// Named exports
export { postsAPI, contactInquiriesAPI, accountRequestsAPI };

// Default export
export default { postsAPI, contactInquiriesAPI, accountRequestsAPI };