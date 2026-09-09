import { useQuery } from '@tanstack/react-query';
import { hallApi } from '@/shared/api/halls';

export function useOwnerHalls(options = {}) {
  return useQuery({
    queryKey: ['owner', 'halls'],
    queryFn: () => hallApi.getMyHalls(),
    select: (data) => data.data || [],
    ...options
  });
}
