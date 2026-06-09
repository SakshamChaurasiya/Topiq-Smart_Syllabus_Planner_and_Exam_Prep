import axiosInstance from './axiosInstance';

export const badgeAPI = {
  getBadges: () => axiosInstance.get('/badges'),
};
