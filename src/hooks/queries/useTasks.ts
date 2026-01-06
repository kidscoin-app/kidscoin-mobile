import { useQuery } from '@tanstack/react-query';
import taskService from '../../services/taskService';
import { queryKeys } from '../../lib/queryKeys';
import { TaskAssignment } from '../../types';

interface UseTasksOptions {
  childId?: string;
  status?: string;
}

/**
 * Hook para buscar lista de tarefas
 * - PARENT: retorna todas tarefas da família
 * - CHILD: retorna apenas suas tarefas
 *
 * Usado por: ManageTasksScreen, ChildTasksScreen, ParentDashboardScreen, ChildDashboardScreen
 */
export function useTasks(options?: UseTasksOptions) {
  const { childId, status } = options || {};

  return useQuery<TaskAssignment[], Error>({
    queryKey: queryKeys.tasks.list({ childId, status }),
    queryFn: () => taskService.getTasks(),
    // Atualizar a cada 30 segundos para ver tarefas completadas
    refetchInterval: 30000,
  });
}
