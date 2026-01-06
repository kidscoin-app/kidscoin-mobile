/**
 * Query Keys - Estrutura centralizada de chaves para React Query
 *
 * Convenção:
 * - `all`: Chave base para invalidar todo o domínio
 * - `list`: Para listagens (pode ter filtros)
 * - `detail`: Para item específico por ID
 *
 * Uso:
 * - Query: useQuery({ queryKey: queryKeys.tasks.list() })
 * - Invalidação: queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
 */

export const queryKeys = {
  // AUTH
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // USERS / CHILDREN
  users: {
    all: ['users'] as const,
    children: () => [...queryKeys.users.all, 'children'] as const,
    child: (id: string) => [...queryKeys.users.children(), id] as const,
  },

  // TASKS
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: { childId?: string; status?: string }) =>
      [...queryKeys.tasks.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
  },

  // REWARDS
  rewards: {
    all: ['rewards'] as const,
    list: (activeOnly?: boolean) =>
      [...queryKeys.rewards.all, 'list', { activeOnly }] as const,
  },

  // REDEMPTIONS
  redemptions: {
    all: ['redemptions'] as const,
    list: (status?: string) =>
      [...queryKeys.redemptions.all, 'list', { status }] as const,
  },

  // WALLET
  wallet: {
    all: ['wallet'] as const,
    balance: (childId?: string) =>
      [...queryKeys.wallet.all, 'balance', childId] as const,
    transactions: (childId?: string, limit?: number, offset?: number) =>
      [...queryKeys.wallet.all, 'transactions', { childId, limit, offset }] as const,
  },

  // SAVINGS
  savings: {
    all: ['savings'] as const,
    balance: (childId?: string) =>
      [...queryKeys.savings.all, 'balance', childId] as const,
  },

  // GAMIFICATION
  gamification: {
    all: ['gamification'] as const,
    data: (childId?: string) =>
      [...queryKeys.gamification.all, 'data', childId] as const,
  },

  // NOTIFICATIONS
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;
