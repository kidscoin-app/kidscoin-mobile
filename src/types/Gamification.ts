/**
 * Types relacionados à gamificação
 */

export type BadgeCriteriaType =
  | 'TASK_COUNT'
  | 'CURRENT_BALANCE'
  | 'TOTAL_COINS_EARNED'
  | 'REDEMPTION_COUNT'
  | 'SAVINGS_AMOUNT'
  | 'TASKS_IN_ONE_DAY'
  | 'STREAK_DAYS'
  | 'DAYS_SAVED';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  criteriaType: BadgeCriteriaType;
  criteriaValue: number;
  xpBonus: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface Gamification {
  currentLevel: number;
  currentXp: number;
  totalXp: number;
  xpForNextLevel: number;
  xpNeededForNextLevel: number;
  badges: Badge[];
}
