import { useQuery } from '@tanstack/react-query';
import { hallApi } from '@/shared/api/halls';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: hallApi.getServices,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
