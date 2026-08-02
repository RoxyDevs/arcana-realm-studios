import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PrismaClient, Transaction, TransactionType, Wallet } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IWalletRepository } from "../domain/wallet-repository.interface";

@Injectable()
export class PrismaWalletRepository implements IWalletRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findByUserId(userId: string): Promise<Wallet | null> {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  async applyTransaction(params: {
    userId: string;
    amount: number;
    type: TransactionType;
    stripePaymentIntentId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ wallet: Wallet; transaction: Transaction }> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: params.userId } });
      if (!wallet) {
        throw new NotFoundException("Wallet not found for user");
      }

      const nextBalance = wallet.creditBalance + params.amount;
      if (nextBalance < 0) {
        throw new BadRequestException("Insufficient credit balance");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { creditBalance: nextBalance },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: params.type,
          amount: params.amount,
          stripePaymentIntentId: params.stripePaymentIntentId,
          metadata: params.metadata as never,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }
}
