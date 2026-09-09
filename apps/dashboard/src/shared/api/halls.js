import { client } from './client';

export const hallApi = {
  createHall: (data) => client.post('/owner/halls', data),
  updateHall: (id, data) => client.patch(`/owner/halls/${id}`, data),
  getMyHalls: () => client.get('/owner/halls'),
  getHallById: (id) => client.get(`/owner/halls/${id}`),
  deleteHall: (id) => client.delete(`/owner/halls/${id}`),
  uploadPhoto: (file) => client.upload('/uploads', file),
  getHalls: (params) => client.get('/halls', { params }), // For discovery
  getPublicHallById: (id) => client.get(`/halls/${id}`),
  getServices: () => client.get('/services'),
};
