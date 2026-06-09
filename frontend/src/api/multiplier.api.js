import axiosInstance from './axiosInstance';

export const multiplierAPI = {
  getToday: () => axiosInstance.get('/multiplier/today'),
  getTomorrow: () => axiosInstance.get('/multiplier/tomorrow'),
};
