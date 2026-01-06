/**
 * Hooks de Queries - React Query
 *
 * Exporta todos os hooks de queries para busca de dados.
 * Cada hook encapsula a lógica de fetching e caching do React Query.
 */

// Users / Children
export { useChildren, useCurrentUser } from './useChildren';

// Tasks
export { useTasks } from './useTasks';

// Rewards
export { useRewards } from './useRewards';

// Redemptions
export { useRedemptions, usePendingRedemptions } from './useRedemptions';

// Wallet
export { useWallet, useTransactions } from './useWallet';

// Savings
export { useSavings } from './useSavings';

// Gamification
export { useGamification } from './useGamification';

// Notifications
export { useNotifications, useUnreadNotificationsCount } from './useNotifications';
