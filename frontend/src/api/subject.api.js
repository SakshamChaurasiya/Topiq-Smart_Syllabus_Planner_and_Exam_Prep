import axiosInstance from './axiosInstance';

export const subjectAPI = {
  getAll:    ()       => axiosInstance.get('/subjects'),
  getById:   (id)     => axiosInstance.get(`/subjects/${id}`),
  create:    (data)   => axiosInstance.post('/subjects', data),
  update:    (id, data) => axiosInstance.put(`/subjects/${id}`, data),
  delete:    (id)     => axiosInstance.delete(`/subjects/${id}`),
  submitExamReview: (id, data) => axiosInstance.put(`/subjects/${id}/exam-review`, data),
  dismissReview:    (id)       => axiosInstance.put(`/subjects/${id}/dismiss-review`),
  unarchive:        (id)       => axiosInstance.put(`/subjects/${id}/unarchive`),
};
