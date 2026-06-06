import api from './api';

export const missionService = {
  getAll:        (params) => api.get('/missions', { params }),
  getToday:      ()       => api.get('/missions', { params: { filter: 'today' } }),
  updateStatus:  (id, status) => api.put(`/missions/${id}/status`, { status }),
  getStats:      ()       => api.get('/missions/stats'),
};
