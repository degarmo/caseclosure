// api/authAPI.js
import api from './config';

/**
 * Authentication API methods
 */
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  register: (data) => api.post('/auth/register/', data),
  getUser: () => api.get('/auth/user/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
};

export default authAPI;