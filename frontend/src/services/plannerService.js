import api from './api';

export const plannerService = {
  getBySubject:    (subjectId)       => api.get(`/planner/${subjectId}`),
  generate:        (subjectId, data) => api.post(`/planner/${subjectId}/generate`, data),
  updateSession:   (subjectId, sessionId, data) =>
    api.put(`/planner/${subjectId}/session/${sessionId}`, data),
  getWeeklyPlan:   (subjectId)       => api.get(`/planner/${subjectId}/weekly`),
  deletePlan:      (subjectId)       => api.delete(`/planner/${subjectId}`),
};
