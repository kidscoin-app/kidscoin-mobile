import { useQuery } from '@tanstack/react-query';
import notificationService from '../../services/notificationService';
import { queryKeys } from '../../lib/queryKeys';
import { Notification } from '../../types';

/**
 * Hook para buscar lista de notificações
 *
 * Usado por: Tela de notificações (futuro)
 */
export function useNotifications() {
  return useQuery<Notification[], Error>({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationService.getNotifications(),
  });
}

/**
 * Hook para buscar contagem de notificações não lidas
 *
 * Usado por: Badge de notificações no header
 */
export function useUnreadNotificationsCount() {
  return useQuery<number, Error>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 1000 * 30, // 30 segundos - atualizar frequentemente
  });
}
