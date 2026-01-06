import { useQuery } from '@tanstack/react-query';
import gamificationService from '../../services/gamificationService';
import { queryKeys } from '../../lib/queryKeys';
import { Gamification } from '../../types';

interface UseGamificationOptions {
  childId?: string;
}

/**
 * Hook para buscar dados de gamificação (níveis, XP, badges)
 * @param childId - Opcional, PARENT pode especificar qual filho
 *
 * Usado por: ChildDashboardScreen
 */
export function useGamification(options?: UseGamificationOptions) {
  const { childId } = options || {};

  return useQuery<Gamification, Error>({
    queryKey: queryKeys.gamification.data(childId),
    queryFn: () => gamificationService.getGamification(childId),
  });
}
