import { useQuery } from '@tanstack/react-query';
import rewardService from '../../services/rewardService';
import { queryKeys } from '../../lib/queryKeys';
import { Reward } from '../../types';

interface UseRewardsOptions {
  activeOnly?: boolean;
}

/**
 * Hook para buscar lista de recompensas
 * @param activeOnly - Se true, retorna apenas recompensas ativas (recomendado para CHILD)
 *
 * Usado por: CreateRewardScreen, RewardsShopScreen, ParentDashboardScreen
 */
export function useRewards(options?: UseRewardsOptions) {
  const { activeOnly } = options || {};

  return useQuery<Reward[], Error>({
    queryKey: queryKeys.rewards.list(activeOnly),
    queryFn: () => rewardService.getRewards(activeOnly),
  });
}
