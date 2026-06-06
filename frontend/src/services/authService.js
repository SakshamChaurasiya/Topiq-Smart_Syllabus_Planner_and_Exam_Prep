import api from './api';

export const authService = {
  login:         (data) => api.post('/auth/login', data),
  register:      (data) => api.post('/auth/register', data),
  getProfile:    ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  logout:        ()     => api.post('/auth/logout').catch(() => {}),
};
