import axios from 'axios';

// Determine API Base URL automatically.
// Normalizes the result so it always ends in exactly one "/api" — this guards
// against a misconfigured VITE_API_URL (e.g. the backend root without /api),
// which otherwise makes the app hit the SPA fallback (HTML) instead of the API.
const getBaseUrl = () => {
  let base = import.meta.env.VITE_API_URL;
  if (!base) {
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      base = 'https://civiclens-1mi1.onrender.com/api';
    } else {
      return '/api';
    }
  }
  base = base.replace(/\/+$/, '');          // drop trailing slashes
  if (!/\/api$/i.test(base)) base += '/api'; // ensure the /api prefix
  return base;
};

const api = axios.create({
  baseURL: getBaseUrl(),
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
  submitJustification: (id, formData) => api.post(`/issues/${id}/justification`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const dashboardApi = {
  getMetrics: (params) => api.get('/dashboard', { params }),
};

export const publicApi = {
  getIssues: (params) => api.get('/public/issues', { params }),
  getStats: () => api.get('/public/stats'),
  getHeadlines: () => api.get('/public/headlines'),
};

export default api;
