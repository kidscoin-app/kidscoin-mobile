import { useQuery } from '@tanstack/react-query';
import rewardService from '../../services/rewardService';
import { queryKeys } from '../../lib/queryKeys';
import { Redemption, RedemptionStatus } from '../../types';

interface UseRedemptionsOptions {
  status?: RedemptionStatus;
}

/**
 * Hook para buscar lista de resgates
 * @param status - Filtrar por status (PENDING, APPROVED, REJECTED)
 *
 * Usado por: CreateRewardScreen (gerenciar resgates pendentes)
 */
export function useRedemptions(options?: UseRedemptionsOptions) {
  const { status } = options || {};

  return useQuery<Redemption[], Error>({
    queryKey: queryKeys.redemptions.list(status),
    queryFn: () => rewardService.getRedemptions(status),
    // Para resgates PENDING, atualizar a cada 30 segundos
    refetchInterval: status === 'PENDING' ? 30000 : undefined,
  });
}

/**
 * Hook para buscar resgates pendentes
 * Atalho para useRedemptions({ status: 'PENDING' })
 */
export function usePendingRedemptions() {
  return useRedemptions({ status: 'PENDING' });
}
