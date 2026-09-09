import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hallApi } from '@/shared/api/halls';

export function useUpdateHall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => hallApi.updateHall(id, data),
    onSuccess: (data, variables) => {
      // Invalidate specific hall query
      queryClient.invalidateQueries({ queryKey: ['halls', variables.id] });
      // Invalidate owner list
      queryClient.invalidateQueries({ queryKey: ['owner', 'halls'] });
    },
  });
}
