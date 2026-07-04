import axios from 'axios';

// Vite dev server proxies /api -> http://localhost:5000 (see vite.config.js)
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
