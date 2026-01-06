import { useQuery } from '@tanstack/react-query';
import userService from '../../services/userService';
import { queryKeys } from '../../lib/queryKeys';
import { User } from '../../types';

/**
 * Hook para buscar lista de crianças da família
 * Usado por: ManageChildrenScreen, ManageTasksScreen, ParentDashboardScreen
 */
export function useChildren() {
  return useQuery<User[], Error>({
    queryKey: queryKeys.users.children(),
    queryFn: () => userService.getChildren(),
  });
}

/**
 * Hook para buscar usuário atual
 * Usado por: AuthContext, ProfileScreen
 */
export function useCurrentUser() {
  return useQuery<User, Error>({
    queryKey: queryKeys.auth.me(),
    queryFn: () => userService.getMe(),
    staleTime: 1000 * 60 * 10, // 10 minutos - usuário muda pouco
  });
}
