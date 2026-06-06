import axiosInstance from './axiosInstance';

export const plannerAPI = {
  generate:       (data) => axiosInstance.post('/planner/generate', data),
  cheatCode:      (data) => axiosInstance.post('/planner/cheatcode', data),
  getPlan:        (subjectId) => axiosInstance.get(`/planner/${subjectId}`),
  markDayComplete:(planId, dayIndex) =>
    axiosInstance.put(`/planner/day/${planId}/${dayIndex}/complete`),
  exportICS:      (planId) =>
    axiosInstance.get(`/study-plan/${planId}/export/ics`, { responseType: 'blob' }),
  reschedule:     (planId) =>
    axiosInstance.post(`/study-plan/${planId}/reschedule`),
};
