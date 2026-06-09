import api from './axiosInstance';

export const weekReportAPI = {
  get: () => api.get('/week-report'),
};
