import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civiclens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API Helper Methods
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  getDemoUsers: () => api.get('/auth/demo-users'),
};

export const complaintsApi = {
  submit: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
};

export const aiApi = {
  analyze: (payload) => api.post('/ai/analyze', payload),
};

export const issuesApi = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  update: (id, data) => api.patch(`/issues/${id}`, data),
  addAction: (id, data) => api.post(`/issues/${id}/actions`, data),
  uploadEvidence: (id, formData) => api.post(`/issues/${id}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submitVerification: (id, data) => api.post(`/issues/${id}/verification`, data),
};

export const dashboardApi = {
  getMetrics: (params) => api.get('/dashboard', { params }),
};

export const publicApi = {
  getIssues: (params) => api.get('/public/issues', { params }),
  getStats: () => api.get('/public/stats'),
};

export default api;
