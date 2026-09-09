import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hallApi } from '@/shared/api/halls';

export function useDeleteHall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => hallApi.deleteHall(id),
    onSuccess: () => {
      // Invalidate owner list
      queryClient.invalidateQueries({ queryKey: ['owner', 'halls'] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      const errorCode = error?.code || error?.data?.error?.code;
      if (errorCode === 'HALL_HAS_UPCOMING_BOOKINGS') {
        const details = error?.details || error?.data?.error?.details || {};
        const bookingInfo = details.bookingId
          ? ` (Booking ${details.bookingId}${details.date ? ` on ${details.date}` : ''}${details.daytime ? ` - ${details.daytime}` : ''})`
          : '';
        alert(`Cannot delete venue: it has upcoming bookings${bookingInfo}.`);
        return;
      }
      alert(error.message || 'Failed to delete venue');
    }
  });
}
