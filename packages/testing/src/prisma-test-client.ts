import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export const prismaTestClient = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/serviceops_test' } },
});

export async function cleanDatabase(): Promise<void> {
  const tablenames = await prismaTestClient.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prismaTestClient.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch {
      }
    }
  }
}

export async function createTestTenant(overrides?: DeepPartial<{ name: string; slug: string; country: string; currency: string }>) {
  return prismaTestClient.tenant.create({
    data: {
      id: uuidv4(),
      name: overrides?.name || 'Test Tenant',
      slug: overrides?.slug || `test-${uuidv4().slice(0, 8)}`,
      country: overrides?.country || 'KE',
      currency: overrides?.currency || 'KES',
    },
  });
}
