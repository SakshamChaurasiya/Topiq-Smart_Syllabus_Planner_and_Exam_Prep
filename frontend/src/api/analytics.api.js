/**
 * analytics.api.js
 * API utility to query study analytics.
 */

import api from './axiosInstance';

export const analyticsAPI = {
  get: () => api.get('/analytics'),
};
