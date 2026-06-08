import { PrismaClient } from '@prisma/client';

type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0];

let primaryClient: PrismaClient | null = null;
let replicaClient: PrismaClient | null = null;

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || 'postgresql://localhost:5432/serviceops';
}

function getReplicaUrl(): string | undefined {
  return process.env.DATABASE_REPLICA_URL || process.env.DIRECT_URL;
}

function createClient(url?: string, options?: PrismaClientOptions): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: url || getDatabaseUrl() } },
    log: process.env.LOG_LEVEL === 'debug'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    ...options,
  });
}

export function getDb(): PrismaClient {
  if (!primaryClient) {
    primaryClient = createClient();
  }
  return primaryClient;
}

export function getReplicaDb(): PrismaClient | null {
  const replicaUrl = getReplicaUrl();
  if (!replicaUrl) return null;
  if (!replicaClient) {
    replicaClient = createClient(replicaUrl, {
      datasources: { db: { url: replicaUrl } },
    });
  }
  return replicaClient;
}

export async function disconnectDb(): Promise<void> {
  if (primaryClient) {
    await primaryClient.$disconnect();
    primaryClient = null;
  }
  if (replicaClient) {
    await replicaClient.$disconnect();
    replicaClient = null;
  }
}

export async function healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await getDb().$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options?: { maxWait?: number; timeout?: number },
): Promise<T> {
  return getDb().$transaction(fn, options);
}

export function getTenantScopedDb(tenantId: string): PrismaClient {
  const db = getDb();
  db.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
  return db;
}

export { PrismaClient };
export type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
