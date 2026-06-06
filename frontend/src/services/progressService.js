import api from './api';

/**
 * progressService — Pulls readiness & analytics from existing endpoints.
 * Readiness is computed from subjects + missions data.
 */
export const progressService = {
  /** Full dashboard overview (subjects, missions stats, etc.) */
  getDashboard: () => api.get('/dashboard'),

  /** All subjects with progress */
  getSubjects: () => api.get('/subjects'),

  /** Mission stats */
  getMissionStats: () => api.get('/missions/stats'),
};
