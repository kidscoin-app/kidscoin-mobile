/**
 * Types relacionados à carteira
 */

export type TransactionType = 'CREDIT' | 'DEBIT';

export type ReferenceType = 'TASK' | 'REWARD' | 'SAVINGS' | 'ADJUSTMENT';

export interface Wallet {
  id: string;
  childId: string;
  childName: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  createdAt: string;
}

export interface Savings {
  id: string;
  childId: string;
  childName: string;
  balance: number;
  totalDeposited: number;
  totalEarned: number;
  lastDepositAt: string | null;
}

export interface DepositSavingsData {
  amount: number;
}

export interface WithdrawSavingsData {
  amount: number;
}
