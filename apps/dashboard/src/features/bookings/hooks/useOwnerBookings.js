import { useQuery } from '@tanstack/react-query';
import { client } from '@/shared/api/client';

export function useOwnerBookings(options = {}) {
  return useQuery({
    queryKey: ['owner', 'bookings'],
    queryFn: async () => {
      return await client.get('/owner/bookings');
    },
    ...options
  });
}
