import axiosInstance from './axiosInstance';

export const notificationAPI = {
  getAll:  ()    => axiosInstance.get('/notifications'),
  markRead:(id)  => axiosInstance.put(`/notifications/${id}/read`),
  markAllRead:() => axiosInstance.put('/notifications/read-all'),
  delete:  (id)  => axiosInstance.delete(`/notifications/${id}`),
};
