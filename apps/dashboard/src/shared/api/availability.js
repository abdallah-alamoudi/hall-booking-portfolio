import { client } from './client';

export const availabilityApi = {
  getBusyPeriods: (hallId) => client.get(`/owner/halls/${hallId}/availability`),
  createBlock: (hallId, data) => client.post(`/owner/halls/${hallId}/availability`, data),
  deleteBlock: (blockId) => client.delete(`/owner/availability/${blockId}`),
};
