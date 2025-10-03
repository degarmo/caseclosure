// src/api/spotlight.js
import axios from 'axios';
import api from '../utils/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const spotlightAPI = {
  // Posts
  getPosts: (params = {}) => api.get('/spotlight/', { params }),
  getPost: (id) => api.get(`/spotlight/${id}/`),
  createPost: (data) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/spotlight/', data, config);
  },
  updatePost: (id, data) => api.patch(`/spotlight/${id}/`, data),
  deletePost: (id) => api.delete(`/spotlight/${id}/`),
  
  // Interactions
  likePost: (id) => api.post(`/spotlight/${id}/like/`),
  commentPost: (id, data) => api.post(`/spotlight/${id}/comment/`, data),
  viewPost: (id) => api.post(`/spotlight/${id}/view/`),
  
  // Scheduled posts
  getScheduledPosts: () => api.get('/spotlight/scheduled/'),
};