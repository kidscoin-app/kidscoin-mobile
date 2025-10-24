/**
 * Serviço de tarefas
 */
import api from './api';
import { TaskAssignment, CreateTaskData, RejectTaskData, Task } from '../types';

class TaskService {
  /**
   * Criar tarefa (PARENT)
   */
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post<Task>('/tasks', data);
    return response.data;
  }

  /**
   * Listar tarefas atribuídas
   * PARENT: vê todas tarefas da família
   * CHILD: vê apenas suas tarefas
   */
  async getTasks(): Promise<TaskAssignment[]> {
    const response = await api.get<TaskAssignment[]>('/tasks');
    return response.data;
  }

  /**
   * Marcar tarefa como concluída (CHILD)
   */
  async completeTask(assignmentId: string): Promise<TaskAssignment> {
    const response = await api.post<TaskAssignment>(
      `/tasks/${assignmentId}/complete`
    );
    return response.data;
  }

  /**
   * Aprovar tarefa (PARENT)
   */
  async approveTask(assignmentId: string): Promise<TaskAssignment> {
    const response = await api.post<TaskAssignment>(
      `/tasks/${assignmentId}/approve`
    );
    return response.data;
  }

  /**
   * Rejeitar tarefa (PARENT)
   */
  async rejectTask(
    assignmentId: string,
    data: RejectTaskData
  ): Promise<TaskAssignment> {
    const response = await api.post<TaskAssignment>(
      `/tasks/${assignmentId}/reject`,
      data
    );
    return response.data;
  }
}

export default new TaskService();
