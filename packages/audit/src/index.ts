import { v4 as uuidv4 } from 'uuid';

export interface AuditEntry {
  tenantId: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  action: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord extends AuditEntry {
  id: string;
  createdAt: string;
}

export const EntityType = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  JOB: 'job',
  USER: 'user',
  SERVICE: 'service',
  DOCUMENT: 'document',
  REFERRAL: 'referral',
  WORKFLOW: 'workflow',
  TENANT: 'tenant',
} as const;

export const AuditAction = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGE: 'status_change',
  PAYMENT_RECEIVED: 'payment_received',
  ASSIGNED: 'assigned',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  LOGIN: 'login',
  LOGOUT: 'logout',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPORTED: 'exported',
} as const;

export interface AuditWriterAdapter {
  create(data: AuditEntry): Promise<AuditLogRecord>;
  createMany(data: AuditEntry[]): Promise<number>;
}

export class AuditWriter {
  private adapter: AuditWriterAdapter;
  private buffer: AuditEntry[] = [];
  private bufferFlushInterval: ReturnType<typeof setInterval> | null = null;
  private bufferSize: number;

  constructor(adapter: AuditWriterAdapter, bufferSize = 50, flushIntervalMs = 5000) {
    this.adapter = adapter;
    this.bufferSize = bufferSize;
    if (flushIntervalMs > 0) {
      this.bufferFlushInterval = setInterval(() => this.flush(), flushIntervalMs);
    }
  }

  async write(params: {
    tenantId: string;
    entityType: string;
    entityId: string;
    action: string;
    actorId?: string;
    fromState?: string;
    toState?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogRecord> {
    const entry: AuditEntry = {
      tenantId: params.tenantId,
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId,
      action: params.action,
      fromState: params.fromState,
      toState: params.toState,
      reason: params.reason,
      metadata: params.metadata,
    };

    if (this.bufferFlushInterval) {
      this.buffer.push(entry);
      if (this.buffer.length >= this.bufferSize) {
        await this.flush();
      }
      return this.toRecord(entry);
    }

    return this.adapter.create(entry);
  }

  async writeMany(entries: AuditEntry[]): Promise<number> {
    if (this.bufferFlushInterval) {
      this.buffer.push(...entries);
      if (this.buffer.length >= this.bufferSize) {
        await this.flush();
      }
      return entries.length;
    }
    return this.adapter.createMany(entries);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    await this.adapter.createMany(batch);
  }

  destroy(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
  }

  private toRecord(entry: AuditEntry): AuditLogRecord {
    return {
      id: uuidv4(),
      ...entry,
      createdAt: new Date().toISOString(),
    };
  }
}

export function createBookingAuditEntry(params: {
  tenantId: string;
  bookingId: string;
  action: string;
  actorId?: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): AuditEntry {
  return {
    tenantId: params.tenantId,
    entityType: EntityType.BOOKING,
    entityId: params.bookingId,
    actorId: params.actorId,
    action: params.action,
    fromState: params.fromState,
    toState: params.toState,
    reason: params.reason,
    metadata: params.metadata,
  };
}

export function createPaymentAuditEntry(params: {
  tenantId: string;
  paymentId: string;
  action: string;
  actorId?: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): AuditEntry {
  return {
    tenantId: params.tenantId,
    entityType: EntityType.PAYMENT,
    entityId: params.paymentId,
    actorId: params.actorId,
    action: params.action,
    fromState: params.fromState,
    toState: params.toState,
    reason: params.reason,
    metadata: params.metadata,
  };
}

export function createJobAuditEntry(params: {
  tenantId: string;
  jobId: string;
  action: string;
  actorId?: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): AuditEntry {
  return {
    tenantId: params.tenantId,
    entityType: EntityType.JOB,
    entityId: params.jobId,
    actorId: params.actorId,
    action: params.action,
    fromState: params.fromState,
    toState: params.toState,
    reason: params.reason,
    metadata: params.metadata,
  };
}

export function createUserAuditEntry(params: {
  tenantId: string;
  userId: string;
  action: string;
  actorId?: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): AuditEntry {
  return {
    tenantId: params.tenantId,
    entityType: EntityType.USER,
    entityId: params.userId,
    actorId: params.actorId,
    action: params.action,
    fromState: params.fromState,
    toState: params.toState,
    reason: params.reason,
    metadata: params.metadata,
  };
}

export class PrismaAuditAdapter implements AuditWriterAdapter {
  constructor(private prisma: { auditLog: { create: (args: { data: Record<string, unknown> }) => Promise<unknown>; createMany: (args: { data: Record<string, unknown>[] }) => Promise<{ count: number }> } }) {}

  async create(data: AuditEntry): Promise<AuditLogRecord> {
    const record = await this.prisma.auditLog.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    }) as Record<string, unknown>;
    return record as unknown as AuditLogRecord;
  }

  async createMany(data: AuditEntry[]): Promise<number> {
    const result = await this.prisma.auditLog.createMany({
      data: data.map((d) => ({
        id: uuidv4(),
        ...d,
      })),
    });
    return result.count;
  }
}
