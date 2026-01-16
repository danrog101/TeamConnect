import axios from 'axios';
import { supabase, supabaseHelpers } from '../lib/supabase';

const API_URL = 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dodaj token u svaki request (ako postoji)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verify: (data) => api.post('/auth/verifyCode', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// Teams API
export const teamsAPI = {
  getAll: (params) => api.get('/teams', { params }),
  getOne: (id) => api.get(`/teams/${id}`),
  getMy: () => api.get('/teams/my'),
  create: (data) => api.post('/teams', data),
  join: (id) => api.post(`/teams/${id}/join`),
  leave: (id) => api.post(`/teams/${id}/leave`),
  delete: (id) => api.delete(`/teams/${id}`)
};

// Tournaments API
export const tournamentsAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getOne: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  register: (id) => api.post(`/tournaments/${id}/register`)
};

// Fields API
export const fieldsAPI = {
  getAll: (params) => api.get('/fields', { params }),
  getOne: (id) => api.get(`/fields/${id}`),
  create: (data) => api.post('/fields', data)
};

// Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  uploadPicture: (data) => api.post('/profile/picture', data)
};

// Friends API
export const friendsAPI = {
  getAll: () => api.get('/friends'),
  add: (data) => api.post('/friends', data),
  remove: (id) => api.delete(`/friends/${id}`)
};

// Stats API
export const statsAPI = {
  get: () => api.get('/stats'),
  add: (data) => api.post('/stats', data),
  update: (id, data) => api.put(`/stats/${id}`, data),
  delete: (id) => api.delete(`/stats/${id}`)
};

// Videos API
export const videosAPI = {
  getAll: () => api.get('/videos'),
  add: (data) => api.post('/videos', data),
  update: (id, data) => api.put(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`)
};

// Ratings API
export const ratingsAPI = {
  getAll: () => api.get('/ratings'),
  add: (data) => api.post('/ratings', data),
  update: (id, data) => api.put(`/ratings/${id}`, data),
  delete: (id) => api.delete(`/ratings/${id}`)
};

// Activities API
export const activitiesAPI = {
  getAll: () => api.get('/activities'),
  add: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`)
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  add: (data) => api.post('/notifications', data),
  update: (id, data) => api.put(`/notifications/${id}`, data),
  delete: (id) => api.delete(`/notifications/${id}`)
};

// Chat API
export const chatAPI = {
  get: () => api.get('/chat'),
  add: (data) => api.post('/chat', data),
  update: (id, data) => api.put(`/chat/${id}`, data),
  delete: (id) => api.delete(`/chat/${id}`)
};

// Admin API
export const adminAPI = {
  get: () => api.get('/admin'),
  add: (data) => api.post('/admin', data),
  update: (id, data) => api.put(`/admin/${id}`, data),
  delete: (id) => api.delete(`/admin/${id}`)
};

export default api;
