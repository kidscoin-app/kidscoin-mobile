import { useMutation, useQueryClient } from '@tanstack/react-query';
import taskService from '../../services/taskService';
import { queryKeys } from '../../lib/queryKeys';
import { Task, TaskAssignment, CreateTaskData, RejectTaskData } from '../../types';

/**
 * ============================================================================
 * TASK MUTATIONS
 * ============================================================================
 * Mutations relacionadas a tarefas.
 *
 * Fluxo de uma tarefa:
 * 1. Parent cria tarefa → createTask
 * 2. Child completa tarefa → completeTask
 * 3. Parent aprova → approveTask (credita coins + XP)
 *    OU Parent rejeita → rejectTask (child pode refazer)
 * 4. Child refaz se rejeitada → retryTask
 *
 * Invalidações:
 * - createTask: tasks.all
 * - completeTask: tasks.all, gamification.all
 * - approveTask: tasks.all, wallet.all, gamification.all (credita coins/XP)
 * - rejectTask: tasks.all
 * - deleteTask: tasks.all
 * - retryTask: tasks.all
 */

// ============================================================================
// TYPES
// ============================================================================

interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface UseCreateTaskOptions extends MutationCallbacks<Task, CreateTaskData> {}

interface UseCompleteTaskOptions extends MutationCallbacks<TaskAssignment, string> {}

interface UseApproveTaskOptions extends MutationCallbacks<TaskAssignment, string> {}

interface RejectTaskVariables {
  assignmentId: string;
  data: RejectTaskData;
}
interface UseRejectTaskOptions extends MutationCallbacks<TaskAssignment, RejectTaskVariables> {}

interface UseDeleteTaskOptions extends MutationCallbacks<void, string> {}

interface UseRetryTaskOptions extends MutationCallbacks<TaskAssignment, string> {}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para criar tarefa (PARENT)
 *
 * @example
 * const createTask = useCreateTask({
 *   onSuccess: (task) => {
 *     showSnackbar(`Tarefa "${task.title}" criada!`);
 *     navigation.goBack();
 *   }
 * });
 *
 * createTask.mutate({
 *   title: 'Arrumar o quarto',
 *   coinValue: 10,
 *   xpValue: 15,
 *   category: 'LIMPEZA',
 *   childrenIds: ['child-1', 'child-2']
 * });
 */
export function useCreateTask(options?: UseCreateTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => taskService.createTask(data),

    onSuccess: async (data, variables) => {
      // Invalida lista de tasks
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
 * Hook para marcar tarefa como concluída (CHILD)
 *
 * Após completar, a tarefa vai para aprovação do parent.
 *
 * @example
 * const completeTask = useCompleteTask({
 *   onSuccess: () => {
 *     showSnackbar('Tarefa enviada para aprovação!');
 *   }
 * });
 *
 * completeTask.mutate(assignmentId);
 */
export function useCompleteTask(options?: UseCompleteTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => taskService.completeTask(assignmentId),

    onSuccess: async (data, variables) => {
      // Invalida lista de tasks (status mudou para COMPLETED)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
      });

      // Completar tarefa pode dar XP (depende do backend)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.all,
      });

      // Invalida notificações (pai recebe notificação TASK_COMPLETED)
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
 * Hook para aprovar tarefa (PARENT)
 *
 * Ao aprovar, coins e XP são creditados para a criança.
 *
 * @example
 * const approveTask = useApproveTask({
 *   onSuccess: (assignment) => {
 *     showSnackbar(`Tarefa aprovada! ${assignment.task.coinValue} coins creditados.`);
 *   }
 * });
 *
 * approveTask.mutate(assignmentId);
 */
export function useApproveTask(options?: UseApproveTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => taskService.approveTask(assignmentId),

    onSuccess: async (data, variables) => {
      // Aprovar tarefa afeta múltiplos domínios:

      // 1. Lista de tasks (status muda para APPROVED)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
      });

      // 2. Wallet (coins são creditados)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.all,
      });

      // 3. Gamification (XP é adicionado, pode subir de nível/ganhar badge)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gamification.all,
      });

      // 4. Notificações (criança recebe TASK_APPROVED, pode receber LEVEL_UP, BADGE_UNLOCKED)
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
 * Hook para rejeitar tarefa (PARENT)
 *
 * Ao rejeitar, a criança pode refazer a tarefa.
 *
 * @example
 * const rejectTask = useRejectTask({
 *   onSuccess: () => {
 *     showSnackbar('Tarefa rejeitada. A criança pode refazer.');
 *   }
 * });
 *
 * rejectTask.mutate({
 *   assignmentId: 'assignment-123',
 *   data: { rejectionReason: 'Não está completo' }
 * });
 */
export function useRejectTask(options?: UseRejectTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, data }: RejectTaskVariables) =>
      taskService.rejectTask(assignmentId, data),

    onSuccess: async (data, variables) => {
      // Invalida lista de tasks (status muda para REJECTED)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
      });

      // Invalida notificações (criança recebe TASK_REJECTED)
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
 * Hook para deletar tarefa (PARENT)
 *
 * @example
 * const deleteTask = useDeleteTask({
 *   onSuccess: () => {
 *     showSnackbar('Tarefa removida');
 *   }
 * });
 *
 * deleteTask.mutate(assignmentId);
 */
export function useDeleteTask(options?: UseDeleteTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => taskService.deleteTask(assignmentId),

    onSuccess: async (data, variables) => {
      // Invalida lista de tasks
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
 * Hook para refazer tarefa rejeitada (CHILD)
 *
 * Permite que a criança tente novamente uma tarefa que foi rejeitada.
 *
 * @example
 * const retryTask = useRetryTask({
 *   onSuccess: () => {
 *     showSnackbar('Tarefa reaberta para conclusão');
 *   }
 * });
 *
 * retryTask.mutate(assignmentId);
 */
export function useRetryTask(options?: UseRetryTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => taskService.retryTask(assignmentId),

    onSuccess: async (data, variables) => {
      // Invalida lista de tasks (status volta para PENDING)
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
