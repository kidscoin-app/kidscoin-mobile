/**
 * ============================================================================
 * MUTATIONS INDEX
 * ============================================================================
 * Exporta todos os hooks de mutations.
 *
 * Mutations são operações que modificam dados no servidor (POST, PUT, PATCH, DELETE).
 * Cada mutation invalida automaticamente as queries relacionadas para manter
 * os dados sincronizados.
 *
 * Uso:
 * import { useCreateChild, useApproveTask } from '../hooks';
 */

// Users / Children
export {
  useCreateChild,
  useDeleteChild,
  useUpdateAvatar,
} from './useUserMutations';

// Tasks
export {
  useCreateTask,
  useCompleteTask,
  useApproveTask,
  useRejectTask,
  useDeleteTask,
  useRetryTask,
} from './useTaskMutations';

// Rewards
export {
  useCreateReward,
  useToggleReward,
  useDeleteReward,
} from './useRewardMutations';

// Redemptions
export {
  useRequestRedemption,
  useApproveRedemption,
  useRejectRedemption,
} from './useRedemptionMutations';

// Savings
export {
  useDepositSavings,
  useWithdrawSavings,
} from './useSavingsMutations';

// Notifications
export {
  useMarkAsRead,
  useMarkAllAsRead,
} from './useNotificationMutations';
