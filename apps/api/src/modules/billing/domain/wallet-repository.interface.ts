import type { Transaction, TransactionType, Wallet } from "@arcana/database";

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");

export interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet | null>;
  /** Atomically adjusts the balance and records the transaction. Rejects if the resulting balance would go negative. */
  applyTransaction(params: {
    userId: string;
    amount: number;
    type: TransactionType;
    stripePaymentIntentId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ wallet: Wallet; transaction: Transaction }>;
}
