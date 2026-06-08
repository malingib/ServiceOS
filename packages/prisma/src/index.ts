import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type TenantTransaction = Prisma.TransactionClient;

export async function withTenantContext<T>(
  tenantId: string,
  fn: (tx: TenantTransaction) => Promise<T>,
  actor?: { userId?: string; role?: string }
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    if (actor?.userId) {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${actor.userId}, true)`;
    }

    if (actor?.role) {
      await tx.$executeRaw`SELECT set_config('app.role', ${actor.role}, true)`;
    }

    return fn(tx);
  });
}

export * from '@prisma/client';
export default prisma;
