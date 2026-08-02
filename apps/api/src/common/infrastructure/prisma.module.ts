import { Global, Module } from "@nestjs/common";
import { prisma } from "@arcana/database";

export const PRISMA_CLIENT = Symbol("PRISMA_CLIENT");

@Global()
@Module({
  providers: [{ provide: PRISMA_CLIENT, useValue: prisma }],
  exports: [PRISMA_CLIENT],
})
export class PrismaModule {}
