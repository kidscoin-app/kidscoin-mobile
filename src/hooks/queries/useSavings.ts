import { useQuery } from '@tanstack/react-query';
import walletService from '../../services/walletService';
import { queryKeys } from '../../lib/queryKeys';
import { Savings } from '../../types';

interface UseSavingsOptions {
  childId?: string;
}

/**
 * Hook para buscar saldo da poupança
 * @param childId - Opcional, PARENT pode especificar qual filho
 *
 * Usado por: SavingsScreen
 */
export function useSavings(options?: UseSavingsOptions) {
  const { childId } = options || {};

  return useQuery<Savings, Error>({
    queryKey: queryKeys.savings.balance(childId),
    queryFn: () => walletService.getSavings(childId),
  });
}
