import type { ISODateTime, UUID } from "./shared";

export type OutboxStatus = "PENDING" | "IN_FLIGHT" | "DELIVERED" | "FAILED_RETRY" | "DEAD";

export interface DomainEventEnvelope<TType extends string = string, TPayload = Record<string, unknown>> {
  eventId: UUID;
  tenantId: UUID;
  channel: string;
  eventType: TType;
  eventKey: string;
  type: TType;
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
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: ISODateTime;
  lastError?: string;
  createdAt: ISODateTime;
  deliveredAt?: ISODateTime;
}

export interface OutboxInsertInput<TPayload = Record<string, unknown>> {
  tenantId: UUID;
  channel: string;
  eventType: string;
  eventKey: string;
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
  channel?: string;
  limit?: number;
}

export interface OutboxDispatchClaim {
  outboxId: UUID;
  nextAttemptAt: ISODateTime;
}
