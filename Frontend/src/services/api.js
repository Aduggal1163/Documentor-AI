import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth API - all endpoints under /api/auth
export const authAPI = {
  signup: (userData) => api.post('/api/auth/signup', userData),
  signin: (credentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.get('username'));
    params.append('password', credentials.get('password'));
    return api.post('/api/auth/signin', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  getCurrentUser: () => api.get('/api/auth/me'),
  getStats: () => api.get('/api/auth/stats'),
};

// Documents API
export const documentsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/api/documents'),
  getOne: (id) => api.get(`/api/documents/${id}`),
  delete: (id) => api.delete(`/api/documents/${id}`),
};

// Chat API
export const chatAPI = {
  ask: (documentId, question) => 
    api.post(`/api/chat/${documentId}`, { question }),
  getHistory: (documentId) => 
    api.get(`/api/chat/${documentId}`),
};

// Diagram API
export const diagramAPI = {
  generate: (documentId, diagramType) => 
    api.post(`/api/documents/${documentId}/generate-diagram`, { diagram_type: diagramType }),
  getAll: (documentId) => 
    api.get(`/api/documents/${documentId}/diagrams`),
};

// Admin API - uses /api prefix to avoid Vite routing conflicts
const adminApi = axios.create({
  baseURL: '/api',
});

export const adminAPI = {
  login: (credentials) => adminApi.post('/admin/login', {
    username: credentials.username,
    password: credentials.password
  }),
  getUsers: () => adminApi.get('/admin/users'),
};

export default api;

