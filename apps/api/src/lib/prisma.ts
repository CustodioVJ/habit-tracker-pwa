import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client. In development, a global is used to avoid
 * exhausting database connections during hot reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
