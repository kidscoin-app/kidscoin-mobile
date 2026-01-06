import { useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../../services/notificationService';
import { queryKeys } from '../../lib/queryKeys';

/**
 * ============================================================================
 * NOTIFICATION MUTATIONS
 * ============================================================================
 * Mutations relacionadas a notificações.
 *
 * Invalidações:
 * - markAsRead: notifications.all
 * - markAllAsRead: notifications.all
 */

// ============================================================================
// TYPES
// ============================================================================

interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface UseMarkAsReadOptions extends MutationCallbacks<void, string> {}

interface UseMarkAllAsReadOptions extends MutationCallbacks<void, void> {}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para marcar notificação como lida
 *
 * @example
 * const markAsRead = useMarkAsRead();
 *
 * // Ao clicar na notificação
 * markAsRead.mutate(notificationId);
 */
export function useMarkAsRead(options?: UseMarkAsReadOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),

    onSuccess: async (data, variables) => {
      // Invalida lista de notificações
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
 * Hook para marcar todas notificações como lidas
 *
 * @example
 * const markAllAsRead = useMarkAllAsRead({
 *   onSuccess: () => {
 *     showSnackbar('Todas notificações marcadas como lidas');
 *   }
 * });
 *
 * markAllAsRead.mutate();
 */
export function useMarkAllAsRead(options?: UseMarkAllAsReadOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),

    onSuccess: async (data, variables) => {
      // Invalida lista de notificações
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
