/**
 * Types relacionados a notificações
 */

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'LEVEL_UP'
  | 'BADGE_UNLOCKED'
  | 'REDEMPTION_REQUESTED'
  | 'REDEMPTION_APPROVED'
  | 'REDEMPTION_REJECTED'
  | 'SAVINGS_DEPOSIT'
  | 'SAVINGS_WITHDRAWAL'
  | 'SAVINGS_INTEREST';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: 'TASK' | 'REWARD' | 'SAVINGS' | null;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
