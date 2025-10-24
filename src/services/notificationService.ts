/**
 * Serviço de notificações
 */
import api from './api';
import { Notification } from '../types';

class NotificationService {
  /**
   * Listar notificações
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  }

  /**
   * Marcar todas notificações como lidas
   */
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  }

  /**
   * Obter contagem de notificações não lidas
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<number>('/notifications/unread-count');
    return response.data;
  }
}

export default new NotificationService();
