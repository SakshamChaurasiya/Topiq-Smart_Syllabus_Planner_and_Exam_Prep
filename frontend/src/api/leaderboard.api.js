import axiosInstance from './axiosInstance';

export const leaderboardAPI = {
  getGlobal:  ()           => axiosInstance.get('/leaderboard/global'),
  getCollege: (institution) => axiosInstance.get(`/leaderboard/college?institution=${encodeURIComponent(institution)}`),
  getWeekly:  ()           => axiosInstance.get('/leaderboard/weekly'),
  getPublicProfile: (username) => axiosInstance.get(`/profile/${username}`),
  updateSettings: (data)   => axiosInstance.put('/profile/settings', data),
};
