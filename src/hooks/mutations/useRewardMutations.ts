import { useMutation, useQueryClient } from '@tanstack/react-query';
import rewardService from '../../services/rewardService';
import { queryKeys } from '../../lib/queryKeys';
import { Reward, CreateRewardData } from '../../types';

/**
 * ============================================================================
 * REWARD MUTATIONS
 * ============================================================================
 * Mutations relacionadas a recompensas.
 *
 * Fluxo:
 * 1. Parent cria recompensa → createReward
 * 2. Parent pode ativar/desativar → toggleReward
 * 3. Parent pode deletar → deleteReward
 *
 * Invalidações:
 * - createReward: rewards.all
 * - toggleReward: rewards.all
 * - deleteReward: rewards.all
 */

// ============================================================================
// TYPES
// ============================================================================

interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface UseCreateRewardOptions extends MutationCallbacks<Reward, CreateRewardData> {}

interface UseToggleRewardOptions extends MutationCallbacks<Reward, string> {}

interface UseDeleteRewardOptions extends MutationCallbacks<void, string> {}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para criar recompensa (PARENT)
 *
 * @example
 * const createReward = useCreateReward({
 *   onSuccess: (reward) => {
 *     showSnackbar(`Recompensa "${reward.name}" criada!`);
 *     resetForm();
 *   }
 * });
 *
 * createReward.mutate({
 *   name: 'Sorvete',
 *   coinCost: 50,
 *   description: 'Um sorvete de sua escolha'
 * });
 */
export function useCreateReward(options?: UseCreateRewardOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRewardData) => rewardService.createReward(data),

    onSuccess: async (data, variables) => {
      // Invalida lista de rewards
      await queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.all,
      });

      await options?.onSuccess?.(data, variables);
    },

    onError: (error: Error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

/**
 * Hook para ativar/desativar recompensa (PARENT)
 *
 * Recompensas inativas não aparecem para as crianças.
 *
 * @example
 * const toggleReward = useToggleReward({
 *   onSuccess: (reward) => {
 *     const status = reward.isActive ? 'ativada' : 'desativada';
 *     showSnackbar(`Recompensa ${status}`);
 *   }
 * });
 *
 * toggleReward.mutate(rewardId);
 */
export function useToggleReward(options?: UseToggleRewardOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => rewardService.toggleReward(rewardId),

    onSuccess: async (data, variables) => {
      // Invalida lista de rewards
      await queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.all,
      });

      await options?.onSuccess?.(data, variables);
    },

    onError: (error: Error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

/**
 * Hook para deletar recompensa (PARENT)
 *
 * @example
 * const deleteReward = useDeleteReward({
 *   onSuccess: () => {
 *     showSnackbar('Recompensa removida');
 *   }
 * });
 *
 * deleteReward.mutate(rewardId);
 */
export function useDeleteReward(options?: UseDeleteRewardOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => rewardService.deleteReward(rewardId),

    onSuccess: async (data, variables) => {
      // Invalida lista de rewards
      await queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.all,
      });

      await options?.onSuccess?.(data, variables);
    },

    onError: (error: Error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}
