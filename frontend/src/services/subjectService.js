import api from './api';

export const subjectService = {
  getAll:   ()         => api.get('/subjects'),
  create:   (data)     => api.post('/subjects', data),
  update:   (id, data) => api.put(`/subjects/${id}`, data),
  delete:   (id)       => api.delete(`/subjects/${id}`),
  getById:  (id)       => api.get(`/subjects/${id}`),
};
