import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hallApi } from '@/shared/api/halls';

export function useCreateHall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => hallApi.createHall(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'halls'] });
    },
  });
}
