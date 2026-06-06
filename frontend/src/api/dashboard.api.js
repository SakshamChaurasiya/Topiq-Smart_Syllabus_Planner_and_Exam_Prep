import axiosInstance from './axiosInstance';

export const dashboardAPI = {
  get: () => axiosInstance.get('/dashboard'),
};
