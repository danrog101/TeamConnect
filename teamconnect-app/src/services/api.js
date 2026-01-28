import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  verify: (data) => api.post('/auth/verify', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh-token', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  // Profile methods (using /profile routes)
  getProfile: (userId) => api.get(`/profile/${userId}`),
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (data) => api.post('/profile/password', data),
  uploadAvatar: (data) => api.post('/profile/avatar', data),
  // Friends methods (using /friends routes)
  getFriends: async () => {
    const response = await api.get('/friends');
    return response.data;
  },
  // Stats methods (using /stats routes)
  getUserStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};

// Teams API
export const teamsAPI = {
  getAll: (params) => api.get('/teams', { params }),
  getOne: (id) => api.get(`/teams/${id}`),
  getMy: () => api.get('/teams/my'),
  create: (data) => api.post('/teams', data),
  join: (id) => api.post(`/teams/${id}/join`),
  leave: (id) => api.post(`/teams/${id}/leave`),
  delete: (id) => api.delete(`/teams/${id}`),
  
  // Aliases for backward compatibility
  getMyTeams: () => api.get('/teams/my'),
  getAllTeams: (params) => api.get('/teams', { params }),
  getOneTeam: (id) => api.get(`/teams/${id}`)
};

// Tournaments API
export const tournamentsAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getOne: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  register: (id, data) => api.post(`/tournaments/${id}/register`, data),
  
  // ✅ Aliases for backward compatibility
  getAllTournaments: (params) => api.get('/tournaments', { params }),
  getOneTournament: (id) => api.get(`/tournaments/${id}`),
  createTournament: (data) => api.post('/tournaments', data),
  registerTeam: (id, data) => api.post(`/tournaments/${id}/register`, data),
  updateTournament: (id, data) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id) => api.delete(`/tournaments/${id}`)
};

// Fields API
export const fieldsAPI = {
  getAll: (params) => api.get('/fields', { params }),
  getOne: (id) => api.get(`/fields/${id}`),
  create: (data) => api.post('/fields', data),
  
  // Aliases
  getAllFields: (params) => api.get('/fields', { params }),
  getOneField: (id) => api.get(`/fields/${id}`)
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
  delete: (id) => api.delete(`/ratings/${id}`),

  // Self-rating
  getSelfRatingStatus: () => api.get('/ratings/self-rating/status'),
  submitSelfRating: (data) => api.post('/ratings/self-rating', data),

  // Rate another player
  ratePlayer: (data) => api.post('/ratings/rate-player', data),

  // Leaderboard
  getLeaderboard: (params) => api.get('/ratings/leaderboard', { params }),
  getUserRating: (userId) => api.get(`/ratings/user/${userId}`),
  recalculateRating: () => api.post('/ratings/recalculate'),
  getAchievements: () => api.get('/ratings/achievements')
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