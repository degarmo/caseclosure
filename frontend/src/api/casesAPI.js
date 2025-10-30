
// api/casesAPI.js
import api from './config';

/**
 * Cases API methods
 */
export const casesAPI = {
  list: (params) => api.get('/cases/', { params }),
  get: (id) => api.get(`/cases/${id}/`),
  create: (data) => api.post('/cases/', data),
  update: (id, data) => api.put(`/cases/${id}/`, data),
  patch: (id, data) => api.patch(`/cases/${id}/`, data),
  delete: (id) => api.delete(`/cases/${id}/`),
};

export default casesAPI;