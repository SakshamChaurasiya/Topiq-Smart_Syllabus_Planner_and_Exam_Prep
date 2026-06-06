import api from './api';

/**
 * revisionService — Spaced repetition & revision alert management.
 * Note: Backend doesn't have dedicated revision endpoints.
 * These use missions + subjects data to compute revision health.
 */
export const revisionService = {
  /** Get all revision alerts (computed from mission/subject data) */
  getAlerts: () => api.get('/missions', { params: { type: 'revision' } }),

  /** Mark a revision as done */
  markDone: (missionId) => api.put(`/missions/${missionId}/status`, { status: 'completed' }),

  /** Get dashboard data (includes weak subjects) */
  getDashboard: () => api.get('/dashboard'),
};
