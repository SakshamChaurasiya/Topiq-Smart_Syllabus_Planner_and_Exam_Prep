import axiosInstance from './axiosInstance';

export const subjectAPI = {
  getAll:    ()       => axiosInstance.get('/subjects'),
  getById:   (id)     => axiosInstance.get(`/subjects/${id}`),
  create:    (data)   => axiosInstance.post('/subjects', data),
  update:    (id, data) => axiosInstance.put(`/subjects/${id}`, data),
  delete:    (id)     => axiosInstance.delete(`/subjects/${id}`),
};
