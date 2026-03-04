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

// Auth API
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (credentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.get('username'));
    params.append('password', credentials.get('password'));
    return api.post('/auth/signin', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  getCurrentUser: () => api.get('/auth/me'),
};

// Documents API
export const documentsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/documents'),
  getOne: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Chat API
export const chatAPI = {
  ask: (documentId, question) => 
    api.post(`/chat/${documentId}`, { question }),
  getHistory: (documentId) => 
    api.get(`/chat/${documentId}`),
};

// Diagram API
export const diagramAPI = {
  generate: (documentId, diagramType) => 
    api.post(`/documents/${documentId}/generate-diagram`, { diagram_type: diagramType }),
  getAll: (documentId) => 
    api.get(`/documents/${documentId}/diagrams`),
};

export default api;

