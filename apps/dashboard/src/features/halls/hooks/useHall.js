import { useQuery } from '@tanstack/react-query';
import { hallApi } from '@/shared/api/halls';

export function useHall(id) {
  return useQuery({
    queryKey: ['halls', id],
    queryFn: () => hallApi.getHallById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
