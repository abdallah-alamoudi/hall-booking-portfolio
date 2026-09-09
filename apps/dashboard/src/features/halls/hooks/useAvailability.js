import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '@/shared/api/availability';

export function useAvailability(hallId) {
  const queryClient = useQueryClient();

  // Fetch busy periods
  const { data: availability = { busySlots: [], busySlotsMap: {} }, isLoading } = useQuery({
    queryKey: ['halls', hallId, 'availability'],
    queryFn: async () => {
      return availabilityApi.getBusyPeriods(hallId);
    },
    enabled: !!hallId,
  });

  // Create block
  const createBlock = useMutation({
    mutationFn: async (payload) => {
      return availabilityApi.createBlock(hallId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['halls', hallId, 'availability'] });
    },
  });

  // Delete block (Note: The API endpoint uses the block ID directly)
  const deleteBlock = useMutation({
    mutationFn: async (blockId) => {
      await availabilityApi.deleteBlock(blockId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['halls', hallId, 'availability'] });
    },
  });

  return {
    busyPeriods: availability.busySlots || [],
    busySlotsMap: availability.busySlotsMap || {},
    isLoading,
    createBlock,
    deleteBlock,
  };
}
