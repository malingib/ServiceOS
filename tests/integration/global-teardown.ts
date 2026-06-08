import { prismaTestClient } from '@mobiwave/testing';

export default async function globalTeardown(): Promise<void> {
  await prismaTestClient.$disconnect();
}
