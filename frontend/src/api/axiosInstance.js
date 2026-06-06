// axiosInstance.js — Centralized Axios config for all API calls
import axios from 'axios';

const axiosInstance = axios.create({
  // Use relative URL — Vite proxy forwards /api/* → http://localhost:5000/api/*
  // In production, set VITE_API_URL in your .env file
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — auto logout
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ssp_token');
      localStorage.removeItem('ssp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
