import api from './axiosInstance';

export const feedAPI = {

  // GET /api/feed?scope=college|worldwide&page=1&limit=10&subject=tag
  getFeed: (params = {}) =>
    api.get('/feed', { params }),

  // POST /api/feed — supports both JSON and multipart/form-data
  // caller passes FormData if file attached, plain object if not
  createPost: (data, hasFile = false) =>
    api.post('/feed', data, hasFile ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : {}),

  // PUT /api/feed/:id/upvote
  toggleUpvote: (postId) =>
    api.put(`/feed/${postId}/upvote`),

  // PUT /api/feed/:id/report
  reportPost: (postId) =>
    api.put(`/feed/${postId}/report`),

  // DELETE /api/feed/:id
  deletePost: (postId) =>
    api.delete(`/feed/${postId}`),

  // GET /api/feed/user/:userId?page=1&limit=10
  getUserPosts: (userId, params = {}) =>
    api.get(`/feed/user/${userId}`, { params }),
};
