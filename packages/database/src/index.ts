import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __arcanaPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__arcanaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__arcanaPrisma = prisma;
}

export * from "@prisma/client";
