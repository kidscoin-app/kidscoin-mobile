import { useMutation, useQueryClient } from '@tanstack/react-query';
import rewardService from '../../services/rewardService';
import { queryKeys } from '../../lib/queryKeys';
import { Redemption, CreateRedemptionData, RejectRedemptionData } from '../../types';

/**
 * ============================================================================
 * REDEMPTION MUTATIONS
 * ============================================================================
 * Mutations relacionadas a resgates de recompensas.
 *
 * Fluxo:
 * 1. Child solicita resgate → requestRedemption (debita coins)
 * 2. Parent aprova → approveRedemption
 *    OU Parent rejeita → rejectRedemption (reembolsa coins)
 *
 * Invalidações:
 * - requestRedemption: redemptions.all, wallet.all (debita coins)
 * - approveRedemption: redemptions.all
 * - rejectRedemption: redemptions.all, wallet.all (reembolsa coins)
 */

// ============================================================================
// TYPES
// ============================================================================

interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface UseRequestRedemptionOptions extends MutationCallbacks<Redemption, CreateRedemptionData> {}

interface UseApproveRedemptionOptions extends MutationCallbacks<Redemption, string> {}

interface RejectRedemptionVariables {
  redemptionId: string;
  data: RejectRedemptionData;
}
interface UseRejectRedemptionOptions extends MutationCallbacks<Redemption, RejectRedemptionVariables> {}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para solicitar resgate de recompensa (CHILD)
 *
 * Os coins são debitados imediatamente ao solicitar.
 * Se o parent rejeitar, os coins são reembolsados.
 *
 * @example
 * const requestRedemption = useRequestRedemption({
 *   onSuccess: () => {
 *     showSnackbar('Resgate solicitado! Aguarde aprovação.');
 *   },
 *   onError: (error) => {
 *     showSnackbar(error.message); // Ex: "Saldo insuficiente"
 *   }
 * });
 *
 * requestRedemption.mutate({ rewardId: 'reward-123' });
 */
export function useRequestRedemption(options?: UseRequestRedemptionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRedemptionData) => rewardService.requestRedemption(data),

    onSuccess: async (data, variables) => {
      // Invalida lista de redemptions
      await queryClient.invalidateQueries({
        queryKey: queryKeys.redemptions.all,
      });

      // Invalida wallet (coins foram debitados)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.all,
      });

      // Invalida notificações (pai recebe notificação REDEMPTION_REQUESTED)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
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
 * Hook para aprovar resgate (PARENT)
 *
 * @example
 * const approveRedemption = useApproveRedemption({
 *   onSuccess: (redemption) => {
 *     showSnackbar(`Resgate de "${redemption.reward.name}" aprovado!`);
 *   }
 * });
 *
 * approveRedemption.mutate(redemptionId);
 */
export function useApproveRedemption(options?: UseApproveRedemptionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (redemptionId: string) => rewardService.approveRedemption(redemptionId),

    onSuccess: async (data, variables) => {
      // Invalida lista de redemptions
      await queryClient.invalidateQueries({
        queryKey: queryKeys.redemptions.all,
      });

      // Invalida notificações (criança recebe notificação REDEMPTION_APPROVED)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
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
 * Hook para rejeitar resgate (PARENT)
 *
 * Ao rejeitar, os coins são reembolsados para a criança.
 *
 * @example
 * const rejectRedemption = useRejectRedemption({
 *   onSuccess: () => {
 *     showSnackbar('Resgate rejeitado. Coins reembolsados.');
 *   }
 * });
 *
 * rejectRedemption.mutate({
 *   redemptionId: 'redemption-123',
 *   data: { rejectionReason: 'Não terminou as tarefas da semana' }
 * });
 */
export function useRejectRedemption(options?: UseRejectRedemptionOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ redemptionId, data }: RejectRedemptionVariables) =>
      rewardService.rejectRedemption(redemptionId, data),

    onSuccess: async (data, variables) => {
      // Invalida lista de redemptions
      await queryClient.invalidateQueries({
        queryKey: queryKeys.redemptions.all,
      });

      // Invalida wallet (coins foram reembolsados)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.all,
      });

      // Invalida notificações (criança recebe notificação REDEMPTION_REJECTED)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
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
