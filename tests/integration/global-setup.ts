import { prismaTestClient, cleanDatabase } from '@mobiwave/testing';

export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/serviceops_test';
  process.env.JWT_SECRET = 'test-jwt-secret';

  await prismaTestClient.$connect();
  await cleanDatabase();

  await prismaTestClient.$disconnect();
}
