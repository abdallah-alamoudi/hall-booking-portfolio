import { useQuery } from '@tanstack/react-query';
import { client } from '@/shared/api/client';

export function useOwnerBooking(bookingId) {
  return useQuery({
    queryKey: ['owner', 'booking', bookingId],
    queryFn: async () => {
      return await client.get(`/owner/bookings/${bookingId}`);
    },
    enabled: !!bookingId,
  });
}
