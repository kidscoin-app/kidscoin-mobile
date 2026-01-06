import { useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../services/userService';
import { queryKeys } from '../../lib/queryKeys';
import { User, CreateChildData } from '../../types';

/**
 * ============================================================================
 * USER MUTATIONS
 * ============================================================================
 * Mutations relacionadas a usuários e crianças.
 *
 * Invalidações:
 * - createChild: invalida lista de children
 * - deleteChild: invalida lista de children
 * - updateAvatar: invalida dados do usuário atual
 */

// ============================================================================
// TYPES
// ============================================================================

interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface UseCreateChildOptions extends MutationCallbacks<User, CreateChildData> {}

interface UseDeleteChildOptions extends MutationCallbacks<void, string> {}

interface UseUpdateAvatarOptions extends MutationCallbacks<User, string> {}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para criar perfil de criança
 *
 * @example
 * const createChild = useCreateChild({
 *   onSuccess: (child) => {
 *     showSnackbar(`${child.fullName} criado com sucesso!`);
 *     navigation.goBack();
 *   },
 *   onError: (error) => {
 *     showSnackbar(error.message);
 *   }
 * });
 *
 * // Uso
 * createChild.mutate({ fullName: 'João', username: 'joao', age: 8, pin: '1234' });
 *
 * // Ou com async/await
 * const child = await createChild.mutateAsync(data);
 */
export function useCreateChild(options?: UseCreateChildOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChildData) => userService.createChild(data),

    onSuccess: async (data, variables) => {
      // Invalida a lista de children - força refetch automático
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.children(),
      });

      // Callback do usuário
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
 * Hook para deletar criança
 *
 * ATENÇÃO: Ação irreversível! Deleta todos os dados da criança.
 *
 * @example
 * const deleteChild = useDeleteChild({
 *   onSuccess: () => {
 *     showSnackbar('Criança removida');
 *   }
 * });
 *
 * // Confirmar antes de deletar!
 * if (confirmed) {
 *   deleteChild.mutate(childId);
 * }
 */
export function useDeleteChild(options?: UseDeleteChildOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => userService.deleteChild(childId),

    onSuccess: async (data, variables) => {
      // Invalida a lista de children
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.children(),
      });

      // Também invalida tasks e wallet pois podem ter dados da criança deletada
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
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
 * Hook para atualizar avatar do usuário
 *
 * @example
 * const updateAvatar = useUpdateAvatar({
 *   onSuccess: (user) => {
 *     showSnackbar('Avatar atualizado!');
 *   }
 * });
 *
 * updateAvatar.mutate('🦁'); // ou ID do avatar
 */
export function useUpdateAvatar(options?: UseUpdateAvatarOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarUrl: string) => userService.updateAvatar(avatarUrl),

    onSuccess: async (data, variables) => {
      // Invalida dados do usuário atual
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
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
