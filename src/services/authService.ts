/**
 * Serviço de autenticação
 */
import api from './api';
import { AuthResponse, LoginData, RegisterData, User } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import * as storage from '../utils/storage';

class AuthService {
  /**
   * Registrar novo pai
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    await this.saveAuthData(response.data);
    return response.data;
  }

  /**
   * Fazer login
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    await this.saveAuthData(response.data);
    return response.data;
  }

  /**
   * Renovar token
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    await this.saveAuthData(response.data);
    return response.data;
  }

  /**
   * Obter usuário atual
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  }

  /**
   * Fazer logout
   */
  async logout(): Promise<void> {
    await storage.removeMultiple([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  }

  /**
   * Salvar dados de autenticação no storage
   */
  private async saveAuthData(data: AuthResponse): Promise<void> {
    await storage.setMultiple([
      [STORAGE_KEYS.TOKEN, data.accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken],
    ]);
    await storage.setObject(STORAGE_KEYS.USER, data.user);
  }

  /**
   * Obter usuário do storage
   */
  async getStoredUser(): Promise<User | null> {
    return await storage.getObject<User>(STORAGE_KEYS.USER);
  }

  /**
   * Obter token do storage
   */
  async getStoredToken(): Promise<string | null> {
    return await storage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Verificar se está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }
}

export default new AuthService();
