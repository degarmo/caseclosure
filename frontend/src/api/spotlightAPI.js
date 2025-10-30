// api/spotlightAPI.js
import api from './config';

/**
 * Spotlight API methods
 */
export const spotlightAPI = {
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
};

export default spotlightAPI;