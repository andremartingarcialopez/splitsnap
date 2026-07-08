import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client — consultas parametrizadas por defecto (MDD §6).
 * Evitar `$queryRawUnsafe` salvo casos auditados; preferir `$queryRaw` con tagged templates.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
