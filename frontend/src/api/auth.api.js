import axiosInstance from './axiosInstance';

export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login:    (data) => axiosInstance.post('/auth/login', data),
  getMe:    ()     => axiosInstance.get('/auth/me'),
  updateProfile: (data) => axiosInstance.put('/auth/update-profile', data),
};
