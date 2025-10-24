/**
 * Serviço de usuários
 */
import api from './api';
import { User, CreateChildData } from '../types';

class UserService {
  /**
   * Criar perfil de criança
   */
  async createChild(data: CreateChildData): Promise<User> {
    const response = await api.post<User>('/users/children', data);
    return response.data;
  }

  /**
   * Listar crianças da família
   */
  async getChildren(): Promise<User[]> {
    const response = await api.get<User[]>('/users/children');
    return response.data;
  }

  /**
   * Obter usuário atual
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  }
}

export default new UserService();
