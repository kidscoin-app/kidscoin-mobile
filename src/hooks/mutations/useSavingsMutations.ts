import { useMutation, useQueryClient } from '@tanstack/react-query';
import walletService from '../../services/walletService';
import { queryKeys } from '../../lib/queryKeys';
import { Savings } from '../../types';

/**
 * ============================================================================
 * SAVINGS MUTATIONS
 * ============================================================================
 * Mutations relacionadas à poupança.
 *
 * Fluxo:
 * 1. Child deposita na poupança → depositSavings (move coins da wallet)
 * 2. Child saca da poupança → withdrawSavings (move coins para wallet)
 *
 * A poupança rende juros semanais (2%).
 *
 * Invalidações:
 * - depositSavings: savings.all, wallet.all
 * - withdrawSavings: savings.all, wallet.all
 */

// ============================================================================
// TYPES
// ============================================================================

interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

interface DepositSavingsVariables {
  amount: number;
  childId?: string; // Parent pode especificar qual filho
}

interface WithdrawSavingsVariables {
  amount: number;
  childId?: string; // Parent pode especificar qual filho
}

interface UseDepositSavingsOptions extends MutationCallbacks<Savings, DepositSavingsVariables> {}

interface UseWithdrawSavingsOptions extends MutationCallbacks<Savings, WithdrawSavingsVariables> {}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para depositar na poupança (CHILD ou PARENT)
 *
 * Move coins da carteira para a poupança.
 * A poupança rende 2% de juros semanais.
 *
 * @example
 * const depositSavings = useDepositSavings({
 *   onSuccess: (savings) => {
 *     showSnackbar(`Depositado! Saldo na poupança: ${savings.balance} coins`);
 *   },
 *   onError: (error) => {
 *     showSnackbar(error.message); // Ex: "Saldo insuficiente"
 *   }
 * });
 *
 * // Child depositando
 * depositSavings.mutate({ amount: 100 });
 *
 * // Parent depositando para um filho específico
 * depositSavings.mutate({ amount: 100, childId: 'child-123' });
 */
export function useDepositSavings(options?: UseDepositSavingsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, childId }: DepositSavingsVariables) =>
      walletService.depositSavings(amount, childId),

    onSuccess: async (data, variables) => {
      // Invalida saldo da poupança
      await queryClient.invalidateQueries({
        queryKey: queryKeys.savings.all,
      });

      // Invalida wallet (coins foram movidos)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.all,
      });

      await options?.onSuccess?.(data, variables);
    },

    onError: (error: Error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

/**
 * Hook para sacar da poupança (CHILD ou PARENT)
 *
 * Move coins da poupança para a carteira.
 * Bônus de tempo: +2% após 7 dias, +10% após 30 dias.
 *
 * @example
 * const withdrawSavings = useWithdrawSavings({
 *   onSuccess: (savings) => {
 *     showSnackbar(`Sacado! Saldo restante: ${savings.balance} coins`);
 *   },
 *   onError: (error) => {
 *     showSnackbar(error.message);
 *   }
 * });
 *
 * // Child sacando
 * withdrawSavings.mutate({ amount: 50 });
 *
 * // Parent sacando de um filho específico
 * withdrawSavings.mutate({ amount: 50, childId: 'child-123' });
 */
export function useWithdrawSavings(options?: UseWithdrawSavingsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, childId }: WithdrawSavingsVariables) =>
      walletService.withdrawSavings(amount, childId),

    onSuccess: async (data, variables) => {
      // Invalida saldo da poupança
      await queryClient.invalidateQueries({
        queryKey: queryKeys.savings.all,
      });

      // Invalida wallet (coins foram movidos)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.all,
      });

      await options?.onSuccess?.(data, variables);
    },

    onError: (error: Error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}
