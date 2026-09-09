import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../../shared/api/client';

export function useBankAccounts(hallId) {
  return useQuery({
    queryKey: ['hall', hallId, 'bank-accounts'],
    queryFn: async () => {
      return await client.get(`/owner/halls/${hallId}/bank-accounts`);
    },
    enabled: !!hallId,
  });
}

export function useAddBankAccount(hallId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      return await client.post(`/owner/halls/${hallId}/bank-accounts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hall', hallId, 'bank-accounts'] });
    },
  });
}

export function useUpdateBankAccount(hallId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, data }) => {
      return await client.patch(`/owner/halls/${hallId}/bank-accounts/${accountId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hall', hallId, 'bank-accounts'] });
    },
  });
}

export function useDeleteBankAccount(hallId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId) => {
      return await client.delete(`/owner/halls/${hallId}/bank-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hall', hallId, 'bank-accounts'] });
    },
  });
}
