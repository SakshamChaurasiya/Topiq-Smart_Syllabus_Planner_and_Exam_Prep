import axiosInstance from './axiosInstance';

export const missionAPI = {
  getAll:      (params) => axiosInstance.get('/missions', { params }),
  getToday:    ()       => axiosInstance.get('/missions/today'),
  getStats:    ()       => axiosInstance.get('/missions/stats'),
  updateStatus:(id, status, extraBody = {}) => axiosInstance.put(`/missions/${id}/status`, { status, ...extraBody }),
};
