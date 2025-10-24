/**
 * Serviço de carteira
 */
import api from './api';
import {
  Wallet,
  Transaction,
  Savings,
  DepositSavingsData,
  WithdrawSavingsData,
} from '../types';

class WalletService {
  /**
   * Obter carteira
   * @param childId - Opcional, PARENT pode especificar qual filho
   */
  async getWallet(childId?: string): Promise<Wallet> {
    const params = childId ? { childId } : {};
    const response = await api.get<Wallet>('/wallet', { params });
    return response.data;
  }

  /**
   * Obter histórico de transações
   * @param childId - Opcional, PARENT pode especificar qual filho
   * @param limit - Limite de transações
   * @param offset - Offset para paginação
   */
  async getTransactions(
    childId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transaction[]> {
    const params: any = { limit, offset };
    if (childId) {
      params.childId = childId;
    }
    const response = await api.get<Transaction[]>('/wallet/transactions', {
      params,
    });
    return response.data;
  }

  /**
   * Obter poupança
   * @param childId - Opcional, PARENT pode especificar qual filho
   */
  async getSavings(childId?: string): Promise<Savings> {
    const params = childId ? { childId } : {};
    const response = await api.get<Savings>('/savings', { params });
    return response.data;
  }

  /**
   * Depositar na poupança
   * @param amount - Valor a depositar
   * @param childId - Opcional, PARENT pode especificar qual filho
   */
  async depositSavings(
    amount: number,
    childId?: string
  ): Promise<Savings> {
    const params = childId ? { childId } : {};
    const response = await api.post<Savings>(
      '/savings/deposit',
      { amount } as DepositSavingsData,
      { params }
    );
    return response.data;
  }

  /**
   * Sacar da poupança
   * @param amount - Valor a sacar
   * @param childId - Opcional, PARENT pode especificar qual filho
   */
  async withdrawSavings(
    amount: number,
    childId?: string
  ): Promise<Savings> {
    const params = childId ? { childId } : {};
    const response = await api.post<Savings>(
      '/savings/withdraw',
      { amount } as WithdrawSavingsData,
      { params }
    );
    return response.data;
  }
}

export default new WalletService();
