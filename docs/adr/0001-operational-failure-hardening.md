# ADR 0001: Operational Failure Hardening

Status: Proposed
Date: 2026-06-08

## Context

ServiceOps depends on external systems and mobile workers: M-Pesa callbacks, B2C refunds, WhatsApp sessions, file uploads, and worker job transitions. These systems are not reliable synchronous dependencies. They can retry, time out, arrive late, arrive twice, or never arrive.

The existing codebase already has the right building blocks: `tenant_id` columns, payments, ledger entries, audit logs, outbox events, worker heartbeats, and reconciliation services. The first production hardening pass must turn those building blocks into database-enforced guarantees.

## Decision

ServiceOps will treat every external call as an eventually delivered message. Business state must be committed internally first, and external delivery, callback processing, and reconciliation must be idempotent.

This ADR makes the following guarantees mandatory before production payment and dispatch traffic:

1. Payment callbacks are hints, not the source of truth.
2. Duplicate callbacks and duplicate mutation requests must return a stable successful response without applying side effects twice.
3. Worker availability conflicts must be rejected by PostgreSQL, not only application prechecks.
4. Worker job state must tolerate offline clients, stale heartbeats, and admin repair.
5. Tenant and soft-delete isolation must be enforced consistently at database and Prisma boundaries.
6. External delivery must use transactional outbox rows and atomic worker claims.

## Required Design

### M-Pesa STK State Machine

Payment statuses:

- `PENDING`: internal payment row created before Daraja request.
- `PROCESSING`: STK request accepted by Daraja and `CheckoutRequestID` stored.
- `COMPLETED`: confirmed by callback or status query, ledger posted exactly once.
- `FAILED`: confirmed failed by Daraja status or callback.
- `RECONCILIATION_REQUIRED`: callback/status query ambiguous after retry window.
- `REFUND_PENDING`: B2C request accepted, awaiting B2C callback.
- `REFUNDED`: B2C callback confirms payout.
- `REVERSED`: M-Pesa reversal or manual finance correction.

Callback handling rules:

- Lookup by `checkout_request_id` in Postgres first. Redis may be used as a cache only.
- Acquire `pg_advisory_xact_lock(hashtext(checkout_request_id))` or use `SERIALIZABLE` isolation before reading and mutating payment state.
- Store the raw callback payload in a durable table or `payment.metadata.callbacks[]`.
- If the payment is already terminal, return `200` with `already_processed`.
- If success, update payment and insert ledger entries in the same transaction.
- Ledger writes must be idempotent using a stable external reference, for example `MPESA_STK:<checkout_request_id>:CUSTOMER_PAYMENT`.
- Never create a second ledger credit for the same checkout request.
- Webhook route must not return `500` for duplicates or unknown late callbacks. Unknown callbacks should be persisted for manual reconciliation and return `200`.

Status query and reconciliation:

- If no callback is processed 60 seconds after STK initiation, enqueue a status-query job.
- Poll `/mpesa/transactionstatus/v1/query` up to 3 times with exponential backoff.
- Ambiguous responses stay `PROCESSING` or move to `RECONCILIATION_REQUIRED`; do not auto-cancel bookings.
- Nightly reconciliation scans all unresolved payments for the day, queries Daraja, and applies the same idempotent callback processor path.
- Reconciliation completion must post the same ledger entries as callback completion.

### Booking Concurrency

Availability checks are advisory. PostgreSQL owns the final guarantee.

Bookings must store an actual service window as `timestamptz`:

- `scheduled_start TIMESTAMPTZ NOT NULL`
- `scheduled_end TIMESTAMPTZ NOT NULL`
- `home_timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi'`

The schema must enforce:

```sql
EXCLUDE USING gist (
  tenant_id WITH =,
  worker_id WITH =,
  tstzrange(scheduled_start, scheduled_end, '[)') WITH &&
)
WHERE (
  worker_id IS NOT NULL
  AND status IN ('CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS')
);
```

The API must convert exclusion violations to `409 Conflict` with a user-safe message: `Someone just grabbed that slot. Try another time.`

Recurring bookings store wall-clock intent separately:

- `rrule TEXT`
- `home_timezone TEXT`
- generated booking instances use UTC `scheduled_start` and `scheduled_end`

### Worker Offline and State Repair

Worker job transitions are forward-only:

`ASSIGNED -> ACCEPTED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED`

Terminal failure states:

- `DECLINED`
- `NO_SHOW`
- `CANCELLED`
- `DISPUTED`

Operational state:

- `STALLED` is admin/ops-facing, not a worker-facing state.

Worker mobile clients must send queued transitions with:

- `idempotency_key`
- `last_known_state_version`
- client timestamp
- optional location snapshot

The server applies a transition only if the submitted version matches the current aggregate version. Duplicate idempotency keys return the original response.

Heartbeat behavior:

- Worker app sends heartbeat every 60 seconds while `IN_PROGRESS`.
- Five missed heartbeats marks the job `STALLED`, writes audit log, and notifies supervisor.
- Admin repair actions must be explicit state transitions with `actor_id`, reason, and metadata.

### Cancellation and Refunds

Cancellation policy is service-level config and must be snapshotted into each booking before payment.

Refund calculation is separate from worker compensation:

- customer refund amount is derived from the booking snapshot and cancellation time.
- worker compensation is derived from operational policy and job preparation state.

M-Pesa B2C is asynchronous:

- set payment or refund record to `REFUND_PENDING` after B2C request acceptance.
- move to `REFUNDED` only on B2C callback or reconciliation confirmation.
- failed B2C callback returns booking/payment to a review queue, not silent failure.

### Money and Ledger

All money remains `BIGINT` minor units in code and database. Reporting must read from ledger entries, not `payments.amount_*` summaries.

The ledger must be double-entry capable:

- stable idempotency key per entry
- account/source fields for customer liability, platform cash, fee income, worker payable, refund payable
- `payment_id` optional where the ledger entry is not tied to one payment
- all rows tenant-scoped

`payments` remains the gateway record. `ledger_entries` is the authoritative accounting record.

### Tenant Isolation and Soft Delete

Every domain table must keep `tenant_id UUID NOT NULL` from day one.

Postgres RLS must use one setting name consistently:

```sql
tenant_id = current_setting('app.tenant_id')::uuid
```

Prisma tenant scoping must not use a long-lived pooled `SET` on a shared client. It must run inside a transaction with `SET LOCAL app.tenant_id = ...` before queries or use explicit tenant filters everywhere until RLS middleware is complete.

Soft-delete rules:

- no production hard deletes for domain data.
- Prisma query middleware excludes `deleted_at IS NULL` by default for soft-deletable models.
- PII redaction scrubs user fields but keeps accounting rows.

### Outbox

External calls and notifications must be represented as outbox rows written in the same transaction as the business state change.

Outbox workers must claim rows atomically:

```sql
UPDATE outbox
SET status = 'DISPATCHING'
WHERE id IN (
  SELECT id
  FROM outbox
  WHERE status = 'PENDING'
    AND next_attempt_at <= now()
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 50
)
RETURNING *;
```

Failures update `retry_count`, `last_error`, and `next_attempt_at`. Exhausted rows move to `DEAD`, not silently ignored.

## Current Repo Gaps

- `packages/prisma/schema.prisma` stores booking `scheduled_start` and `scheduled_end` as `TIME`, so database-level interval exclusion cannot correctly protect cross-date or timezone-aware bookings.
- `apps/payments-service/src/services/payment.service.ts` depends on Redis to find callbacks and does not use a transaction or advisory lock around payment and ledger updates.
- Reconciliation marks payments `COMPLETED` without writing the same ledger entries as callback success.
- `checkout_request_id` is unique, but there is no composite uniqueness for `(merchant_request_id, checkout_request_id)` and no callback/raw-event record.
- `apps/event-ingestion-service/src/services/outbox-poller.ts` reads pending rows without `FOR UPDATE SKIP LOCKED`, so multiple pollers can publish the same event.
- `packages/db/src/index.ts` sets tenant context with `SET app.current_tenant` on a pooled Prisma client, while architecture docs refer to `app.tenant_id`.
- Soft-delete columns exist on some models, but there is no global Prisma middleware enforcing `deleted_at IS NULL`.
- Job transitions write no audit log and do not include state versions or idempotency keys.

## Implementation Order

1. Add database migrations for booking `timestamptz` windows, exclusion constraints, payment idempotency constraints, outbox `next_attempt_at`, and ledger idempotency keys.
2. Refactor payment callback and reconciliation into a single transactional `applyMpesaResult` function.
3. Add mutation idempotency middleware and a persisted `idempotency_keys` table.
4. Update outbox poller to atomically claim rows with `SKIP LOCKED`.
5. Add audit-log writes to booking, job, payment, and refund state transitions.
6. Add tenant RLS migrations and replace unsafe pooled `SET` usage.
7. Add worker state versioning and offline transition replay endpoint.
8. Add focused tests for duplicate callbacks, missing callbacks, cross-tenant reads, double booking, outbox double-poller behavior, and stalled job repair.

## Consequences

This adds upfront schema and transaction complexity, but it keeps the MVP from relying on synchronous success of external systems. The result is a system that can recover from duplicate callbacks, dead workers, offline clients, stale deployments, and reconciliation gaps without manual database surgery for normal incidents.
