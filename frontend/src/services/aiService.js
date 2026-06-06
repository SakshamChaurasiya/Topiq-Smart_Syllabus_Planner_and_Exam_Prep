import api from './api';

/**
 * aiService — AI recommendations and cheat code generation.
 * Routes to existing syllabus/cheatcode backend endpoints.
 */
export const aiService = {
  /** Get AI cheat codes for a subject */
  getCheatCodes:  (subjectId) => api.get(`/syllabus/${subjectId}/cheatcode`),

  /** Generate cheat codes (AI analysis) */
  generateCheatCode: (subjectId) => api.post(`/syllabus/${subjectId}/cheatcode`),

  /** Get recommendations from dashboard */
  getRecommendations: () => api.get('/dashboard'),

  /** Generate study plan via planner */
  generatePlan: (subjectId, data) => api.post(`/planner/${subjectId}/generate`, data),

  /** Analyze uploaded syllabus */
  analyzeSyllabus: (subjectId) => api.post(`/syllabus/${subjectId}/analyze`),
};
