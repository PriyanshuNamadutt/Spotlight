import axios from 'axios';

// Local development: Vite proxies /api -> http://localhost:5000 (see vite.config.js),
// so no env var is needed and this falls back to '/api'.
//
// Production (e.g. deployed on Vercel): set VITE_API_URL to your deployed backend's
// URL including the /api prefix, e.g. https://your-backend.onrender.com/api
// See README.md "Deployment" section for full instructions.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
