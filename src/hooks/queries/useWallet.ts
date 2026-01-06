import { useQuery } from '@tanstack/react-query';
import walletService from '../../services/walletService';
import { queryKeys } from '../../lib/queryKeys';
import { Wallet, Transaction } from '../../types';

interface UseWalletOptions {
  childId?: string;
}

/**
 * Hook para buscar saldo da carteira
 * @param childId - Opcional, PARENT pode especificar qual filho
 *
 * Usado por: ChildDashboardScreen, RewardsShopScreen, SavingsScreen
 */
export function useWallet(options?: UseWalletOptions) {
  const { childId } = options || {};

  return useQuery<Wallet, Error>({
    queryKey: queryKeys.wallet.balance(childId),
    queryFn: () => walletService.getWallet(childId),
  });
}

interface UseTransactionsOptions {
  childId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook para buscar histórico de transações
 * @param childId - Opcional, PARENT pode especificar qual filho
 * @param limit - Limite de transações (default: 20)
 * @param offset - Offset para paginação (default: 0)
 *
 * Usado por: Histórico de transações
 */
export function useTransactions(options?: UseTransactionsOptions) {
  const { childId, limit = 20, offset = 0 } = options || {};

  return useQuery<Transaction[], Error>({
    queryKey: queryKeys.wallet.transactions(childId, limit, offset),
    queryFn: () => walletService.getTransactions(childId, limit, offset),
  });
}
