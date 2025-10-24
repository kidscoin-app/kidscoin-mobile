/**
 * Serviço de gamificação
 */
import api from './api';
import { Gamification } from '../types';

class GamificationService {
  /**
   * Obter dados de gamificação (níveis, XP e badges)
   * @param childId - Opcional, PARENT pode especificar qual filho
   */
  async getGamification(childId?: string): Promise<Gamification> {
    const params = childId ? { childId } : {};
    const response = await api.get<Gamification>('/gamification', { params });
    return response.data;
  }
}

export default new GamificationService();
