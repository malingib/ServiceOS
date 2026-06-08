import type { ISODateTime, UUID } from "./shared";

export type OutboxStatus = "PENDING" | "DISPATCHING" | "SENT" | "FAILED" | "DEAD";

export interface DomainEventEnvelope<TType extends string = string, TPayload = Record<string, unknown>> {
  eventId: UUID;
  tenantId: UUID;
  topic: string;
  type: TType;
  key?: string;
  aggregateType: string;
  aggregateId: UUID;
  aggregateVersion?: number;
  schemaVersion: number;
  occurredAt: ISODateTime;
  emittedAt?: ISODateTime;
  traceId?: string;
  correlationId?: string;
  causationId?: string;
  payload: TPayload;
  headers?: Record<string, string>;
}

export interface OutboxRecord<TPayload = Record<string, unknown>>
  extends DomainEventEnvelope<string, TPayload> {
  outboxId: UUID;
  status: OutboxStatus;
  retryCount: number;
  lastError?: string;
  createdAt: ISODateTime;
  sentAt?: ISODateTime;
}

export interface OutboxInsertInput<TPayload = Record<string, unknown>> {
  tenantId: UUID;
  topic: string;
  key?: string;
  aggregateType: string;
  aggregateId: UUID;
  payload: TPayload;
  headers?: Record<string, string>;
  schemaVersion?: number;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
}

export interface OutboxPollRequest {
  tenantId?: UUID;
  topic?: string;
  limit?: number;
}

export interface OutboxDispatchClaim {
  outboxId: UUID;
  nextAttemptAt: ISODateTime;
}
