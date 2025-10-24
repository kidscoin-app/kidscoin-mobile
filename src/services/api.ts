/**
 * Configuração do cliente HTTP com Axios
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, STORAGE_KEYS } from '../utils/constants';
import * as storage from '../utils/storage';

// Criar instância do Axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request - adiciona token JWT automaticamente
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItem(STORAGE_KEYS.TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response - trata erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Se erro 401 (não autorizado) e ainda não tentou refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // Não tem refresh token, fazer logout
          await storage.removeMultiple([
            STORAGE_KEYS.TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER,
          ]);
          return Promise.reject(error);
        }

        // Tentar renovar o token
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        // Salvar novos tokens
        await storage.setMultiple([
          [STORAGE_KEYS.TOKEN, data.accessToken],
          [STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken],
        ]);

        // Atualizar header da requisição original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }

        // Tentar novamente a requisição original
        return api(originalRequest);
      } catch (refreshError) {
        // Falha ao renovar token, fazer logout
        await storage.removeMultiple([
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Trata erros da API e retorna mensagem amigável
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message === 'Network Error') {
    return 'Sem conexão com a internet';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Tempo de conexão esgotado';
  }

  return 'Erro desconhecido. Tente novamente.';
};

export default api;
