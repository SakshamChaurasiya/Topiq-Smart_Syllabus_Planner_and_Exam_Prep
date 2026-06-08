import axiosInstance from './axiosInstance';

export const streakFreezeAPI = {
  getTokens: () => axiosInstance.get('/streak-freeze'),
  awardToken: () => axiosInstance.post('/streak-freeze/award'),
};
