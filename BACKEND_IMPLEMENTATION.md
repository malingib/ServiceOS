# MobiWave Core — Backend Platform Implementation Plan
## Senior Backend Engineer / Platform Engineer View

**Version:** 1.0
**Date:** June 2026
**Status:** Approved for Implementation
**Constraint:** Strictly implements architecture from IMPLEMENTATION.md

---

## 1. System Overview (Implementation View)

### 1.1 Backend Services

| Service | Responsibility | Communication | Phase |
|---------|---------------|---------------|-------|
| `identity-service` | Wrap Keycloak, custom claims, tenant resolution | Sync (REST), Async (events) | 1 |
| `messaging-service` | Novu integration, SMS (AT), WhatsApp (WABA) | Async (events) | 1 |
| `payments-service` | M-Pesa STK/B2C, reconciliation, ledger | Sync (REST), Async (events) | 1 |
| `booking-service` | Scheduling, availability, conflict detection | Sync (REST), Async (events) | 1 |
| `crm-service` | Customers, workers, addresses, KYC | Sync (REST) | 1 |
| `dispatch-service` | Worker assignment, state machine, no-show | Async (events) | 1 |
| `workflow-service` | State machine engine, rule evaluation | Async (events) | 1 |
| `rewards-service` | Referrals, loyalty, promotions | Sync (REST), Async (events) | 2 |
| `documents-service` | Presigned URLs, validation, thumbnails | Sync (REST) | 1 |
| `ai-orchestrator-service` | Model routing, prompt templates, RAG | Sync (REST) | 3 |
| `analytics-service` | Event aggregation, ClickHouse, dashboards | Async (events) | 3 |
| `event-ingestion-service` | Outbox relay, Kafka producer, DLQ | Async (internal) | 2 |
| `api-gateway` | Kong (Phase 3) / Express proxy (Phase 1) | Sync (REST) | 1 |

### 1.2 Communication Style

Synchronous (REST/gRPC):
- Client → API Gateway → Service (read operations)
- Inter-service for hot paths (booking availability check)

Asynchronous (Events):
- Booking state changes → Dispatch, Notifications, Analytics
- Payment status → Booking, Messaging, Rewards
- Worker location updates → Dispatch, Analytics

### 1.3 Service Dependencies

```
api-gateway
├── identity-service (Keycloak)
├── booking-service
│   └── depends on: crm-service, payments-service (for pricing)
├── payments-service
│   └── depends on: messaging-service (receipts)
├── dispatch-service
│   └── depends on: booking-service, crm-service
├── crm-service
├── messaging-service
│   └── depends on: Novu, AT, WABA
├── workflow-service
│   └── depends on: booking-service, payments-service, messaging-service
├── rewards-service
│   └── depends on: booking-service, payments-service
├── documents-service
│   └── depends on: MinIO
├── ai-orchestrator-service
│   └── depends on: external LLM APIs
├── analytics-service
│   └── depends on: ClickHouse, Postgres read replica
└── event-ingestion-service
    └── depends on: Kafka, Postgres (outbox table)
```

---

## 2. Monorepo / Repository Structure

```
mobiwave-core/
├── apps/
│   ├── api-gateway/              # Kong config + Express fallback (Phase 1)
│   ├── identity-service/         # Keycloak wrapper + tenant middleware
│   ├── messaging-service/        # Novu, AT, WABA adapters
│   ├── payments-service/         # M-Pesa, ledger, reconciliation
│   ├── booking-service/          # Scheduling, availability
│   ├── crm-service/              # Customers, workers, KYC
│   ├── dispatch-service/         # Worker assignment, state machine
│   ├── workflow-service/         # Rules engine, state transitions
│   ├── rewards-service/          # Referrals, loyalty
│   ├── documents-service/        # MinIO presigned URLs
│   ├── ai-orchestrator-service/  # LLM routing, prompts
│   ├── analytics-service/        # ClickHouse, reporting
│   └── event-ingestion-service/  # Outbox → Kafka relay
├── packages/
│   ├── @mobiwave/shared/         # Common types, utils, middleware
│   ├── @mobiwave/prisma/         # Generated Prisma client
│   ├── @mobiwave/kafka/          # Kafka producer/consumer wrappers
│   ├── @mobiwave/redis/          # Redis connection, caching utils
│   ├── @mobiwave/keycloak/       # Keycloak admin client wrapper
│   ├── @mobiwave/mpesa/          # M-Pesa API client
│   ├── @mobiwave/novu/           # Novu API wrapper
│   ├── @mobiwave/logging/        # Structured logging (Pino)
│   └── @mobiwave/audit/          # Audit log helpers
├── infra/
│   ├── postgres/                 # Migrations, seeders
│   ├── redis/                    # Redis config, key patterns
│   ├── kafka/                    # Topic definitions, consumer groups
│   ├── minio/                    # Bucket policies, lifecycle rules
│   └── clickhouse/               # Schema, materialized views
├── scripts/
│   ├── start-services.sh         # PM2 ecosystem file
│   ├── db-migrate.sh
│   └── seed-data.sh
├── docker-compose.yml            # DEVELOPMENT ONLY (Postgres, Redis, MinIO, Keycloak)
├── turbo.json
├── package.json
└── README.md
```

**Service Grouping Strategy:**
- **Phase 1 Core**: `identity-service`, `payments-service`, `booking-service`, `crm-service`, `messaging-service`, `dispatch-service`
- **Phase 2 Automation**: `workflow-service`, `rewards-service`, `event-ingestion-service`
- **Phase 3 Intelligence**: `ai-orchestrator-service`, `analytics-service`

---

## 3. Service Implementation Plan

### 3.1 identity-service

**Purpose:** Wrap Keycloak, handle tenant resolution, custom claims.

Responsibilities:
- User registration (phone OTP)
- Login (phone + OTP or password)
- Token refresh
- Logout (token blacklist in Redis)
- Role/permission resolution from Keycloak
- Tenant context injection

Tech Stack: Express.js, Keycloak admin client, Redis, BullMQ (OTP queue)
Database: Keycloak internal PostgreSQL + application PostgreSQL (users table)
External: Keycloak, Africa's Talking (SMS), Redis

APIs Exposed:
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/otp/request`
- `POST /v1/auth/otp/verify`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`
- `GET /v1/auth/tenants` (list user's tenants)

Events Emitted:
- `identity.user.registered`
- `identity.user.verified`
- `identity.user.logged_in`
- `identity.user.logged_out`

### 3.2 messaging-service

**Purpose:** Abstract all communication channels.

Responsibilities:
- Send SMS (Africa's Talking)
- Send WhatsApp (WABA via Novu or direct)
- Send Email (SMTP/Resend)
- Push notifications (Firebase/Expo)
- Template management
- Delivery tracking

Tech Stack: Express.js, Novu SDK, AT SDK, Redis
Database: PostgreSQL (`notification_templates`, `notification_logs`)
External: Novu, Africa's Talking, WhatsApp Business API, Firebase/Expo

APIs Exposed:
- `POST /v1/messages/send` (send to single user)
- `POST /v1/messages/bulk` (send to many)
- `GET /v1/messages/:id/status`
- `POST /v1/templates` (admin)

Events Consumed:
- `*.send_notification` (generic event from any service)

Events Emitted:
- `messaging.message.delivered`
- `messaging.message.failed`

### 3.3 payments-service

**Purpose:** M-Pesa integration, payment lifecycle, ledger.

Responsibilities:
- STK Push initiation
- Callback handling (idempotent)
- B2C payouts (refunds, worker payouts)
- Transaction status polling
- Nightly reconciliation
- Double-entry ledger

Tech Stack: Express.js, M-Pesa Daraja SDK, Redis, BullMQ
Database: PostgreSQL (`payments`, `ledger_entries`)
External: M-Pesa Daraja 2.0

APIs Exposed:
- `POST /v1/payments/mpesa/stkpush`
- `POST /v1/payments/mpesa/b2c`
- `GET /v1/payments/:id`
- `GET /v1/payments/:id/status`
- `POST /v1/webhooks/mpesa/callback` (IP whitelisted)
- `POST /v1/webhooks/mpesa/b2c-callback`

Events Emitted:
- `payment.initiated`
- `payment.completed`
- `payment.failed`
- `payment.refunded`

Events Consumed:
- `booking.payment_required` (to trigger STK)

### 3.4 booking-service

**Purpose:** Scheduling, availability, conflict detection.

Responsibilities:
- Create booking
- Check worker availability (exclusion constraint)
- Time slot management
- Rescheduling
- Cancellation (with policy enforcement)
- Recurring bookings

Tech Stack: Express.js, PostgreSQL, Redis (caching slots)
Database: PostgreSQL (`bookings`, `recurring_rules`)
External: None directly (consumes events from payments)

APIs Exposed:
- `POST /v1/bookings`
- `GET /v1/bookings/:id`
- `GET /v1/bookings` (list, filter by status, date)
- `POST /v1/bookings/:id/cancel`
- `POST /v1/bookings/:id/reschedule`
- `GET /v1/availability` (query param: service_id, date, worker_id)

Events Emitted:
- `booking.created`
- `booking.confirmed`
- `booking.assigned`
- `booking.cancelled`
- `booking.rescheduled`

### 3.5 crm-service

**Purpose:** Customer, worker, address, KYC data management.

Responsibilities:
- Customer CRUD
- Worker CRUD + KYC tracking
- Address management
- Service catalog
- Tenant configuration

Tech Stack: Express.js, Prisma, PostgreSQL
Database: PostgreSQL (`users`, `customer_profiles`, `worker_profiles`, `addresses`, `services`, `tenants`)

APIs Exposed:
- `POST /v1/customers`
- `GET /v1/customers/:id`
- `PUT /v1/customers/:id`
- `POST /v1/workers`
- `GET /v1/workers/:id`
- `PUT /v1/workers/:id`
- `POST /v1/workers/:id/kyc`
- `GET /v1/services`
- `GET /v1/services/:slug`

Events Emitted:
- `crm.customer.created`
- `crm.worker.verified`
- `crm.service.updated`

### 3.6 dispatch-service

**Purpose:** Worker assignment, state machine, heartbeat monitoring.

Responsibilities:
- Assign worker to booking (manual + auto)
- Track job state transitions
- Monitor worker heartbeats
- Handle no-show/decline/reassignment
- Update worker availability

Tech Stack: Express.js, PostgreSQL, Redis (geospatial), BullMQ
Database: PostgreSQL (`jobs`, `worker_states`)
External: OSRM (Phase 3) for routing

APIs Exposed:
- `POST /v1/dispatch/assign` (admin)
- `POST /v1/dispatch/auto-assign` (internal)
- `POST /v1/dispatch/jobs/:id/state` (worker)
- `POST /v1/dispatch/workers/:id/heartbeat`

Events Consumed:
- `booking.confirmed` (trigger assignment)
- `worker.location_updated` (for proximity)

Events Emitted:
- `dispatch.worker.assigned`
- `dispatch.worker.accepted`
- `dispatch.worker.declined`
- `dispatch.worker.no_show`
- `dispatch.job.completed`

### 3.7 workflow-service

**Purpose:** Simple rules engine for state transitions and automation.

Responsibilities:
- Evaluate rules on events (e.g., booking created → assign worker)
- Trigger notifications, payments, other services
- Support configurable workflows per tenant
- Replace n8n for core business logic (Phase 1)

Tech Stack: Express.js, PostgreSQL
Database: PostgreSQL (`workflows`, `rules`, `workflow_executions`)

Workflow Example (JSON stored in DB):
```json
{
  "trigger": "booking.confirmed",
  "conditions": [
    { "field": "service.category", "op": "eq", "value": "CLEANING" }
  ],
  "actions": [
    { "type": "dispatch.auto_assign", "params": {} },
    { "type": "notification.send", "params": { "template": "worker_alert" } }
  ]
}
```

APIs Exposed:
- `POST /v1/workflows` (admin)
- `GET /v1/workflows/:id`
- `POST /v1/workflows/:id/execute` (internal)

Events Consumed: All (selective based on trigger)
Events Emitted: `workflow.executed`

### 3.8 rewards-service

**Purpose:** Referral tracking, loyalty points, promotions.

Responsibilities:
- Track referral codes
- Calculate rewards on booking completion
- Manage loyalty points
- Apply discounts/promotions

Tech Stack: Express.js, PostgreSQL, Redis
Database: PostgreSQL (`referrals`, `loyalty_points`, `promotions`)

APIs Exposed:
- `POST /v1/rewards/referrals` (create referral)
- `GET /v1/rewards/:user_id/points`
- `POST /v1/rewards/:user_id/redeem`
- `GET /v1/promotions` (list active)

Events Consumed:
- `payment.completed` → trigger referral reward
- `booking.completed` → add loyalty points

Events Emitted:
- `reward.referral_earned`
- `reward.points_earned`
- `reward.redeemed`

### 3.9 documents-service

**Purpose:** File upload, storage, retrieval.

Responsibilities:
- Generate presigned PUT/GET URLs (MinIO)
- Validate file type/size
- Trigger thumbnail generation (BullMQ)
- Track uploads per user
- Virus scan (ClamAV or Cloudmersive)

Tech Stack: Express.js, MinIO SDK, BullMQ
Database: PostgreSQL (`documents`, `upload_logs`)
External: MinIO

APIs Exposed:
- `POST /v1/documents/upload-url` (presigned PUT)
- `GET /v1/documents/:id/download-url` (presigned GET)
- `DELETE /v1/documents/:id`
- `GET /v1/documents` (list user docs)

Events Emitted:
- `document.uploaded`
- `document.deleted`

### 3.10 ai-orchestrator-service

**Purpose:** Thin abstraction over LLMs for customer support, content generation.

Responsibilities:
- Route requests to OpenAI / Gemini / Local models
- Manage prompt templates per use case
- Track usage/costs per tenant
- Handle rate limits
- (Phase 3) RAG integration with documents

Tech Stack: Express.js, OpenAI SDK, Gemini SDK, Redis
Database: PostgreSQL (`prompts`, `ai_usage`)
External: OpenAI API, Gemini API

APIs Exposed:
- `POST /v1/ai/chat` (generic chat)
- `POST /v1/ai/summarize` (content summarization)
- `POST /v1/ai/classify` (intent classification for WhatsApp)
- `GET /v1/ai/usage` (admin)

Events Emitted:
- `ai.request.processed`

### 3.11 analytics-service

**Purpose:** Aggregate events, build dashboards, reporting.

Responsibilities:
- Consume events from Kafka
- Write to ClickHouse (Phase 3) / Postgres (Phase 1-2)
- Build materialized views
- Serve aggregated data via API
- Export reports (CSV, PDF)

Tech Stack: Express.js, ClickHouse, PostgreSQL
Database: ClickHouse (events), PostgreSQL (reports config)
External: None

APIs Exposed:
- `GET /v1/analytics/dashboard` (summary metrics)
- `GET /v1/analytics/bookings` (booking trends)
- `GET /v1/analytics/revenue` (revenue breakdown)
- `GET /v1/analytics/workers` (worker performance)
- `POST /v1/analytics/reports` (generate custom report)

Events Consumed: All (selective based on schema)

### 3.12 event-ingestion-service

**Purpose:** Outbox relay to Kafka.

Responsibilities:
- Poll `outbox` table in PostgreSQL
- Publish to Kafka topics
- Handle DLQ (dead letter queue) for failed publishes
- Retry with exponential backoff
- Maintain exactly-once semantics (idempotency on message ID)

Tech Stack: Node.js (standalone process), KafkaJS, PostgreSQL
Database: PostgreSQL (`outbox`)
External: Kafka

No external APIs. Internal only.

Events Emitted: Kafka messages (no domain events)

---

## 4. Database Design (Implementation Level)

### 4.1 Ownership

| Service | Primary Tables | Access |
|---------|---------------|--------|
| crm-service | tenants, users, customer_profiles, worker_profiles, addresses, services | Read/Write |
| booking-service | bookings, recurring_rules | Read/Write |
| payments-service | payments, ledger_entries | Read/Write |
| dispatch-service | jobs, worker_states | Read/Write |
| rewards-service | referrals, loyalty_points, promotions | Read/Write |
| documents-service | documents, upload_logs | Read/Write |
| analytics-service | ClickHouse tables, report_configs | Read/Write |
| workflow-service | workflows, rules, workflow_executions | Read/Write |
| event-ingestion | outbox | Read/Write |

### 4.2 Shared Tables (All services read)

- `tenants` (via RLS)
- `users` (via RLS, read-only for non-CRM services)
- `services` (read-only)
- `audit_log` (append-only, all services write)

### 4.3 Event Storage Strategy

Phase 1-2: Outbox pattern in PostgreSQL
```sql
CREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    topic VARCHAR(255) NOT NULL,
    key VARCHAR(255), -- Kafka partition key
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    UNIQUE NULLS NOT DISTINCT (tenant_id, topic, key, created_at) -- idempotent
);

CREATE INDEX idx_outbox_poll ON outbox(status, created_at) WHERE status = 'PENDING';
```

Phase 3+: Kafka as primary event log. Outbox remains for transactional guarantees.

### 4.4 Multi-Tenancy

All tables have `tenant_id UUID NOT NULL`.
RLS enabled on all tables from Day 1.
```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bookings
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

Connection middleware:
```javascript
prisma.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
```

### 4.5 Partitioning

| Table | Partition Key | Strategy |
|-------|--------------|----------|
| payments | created_at (monthly) | Range |
| bookings | scheduled_date (monthly) | Range |
| jobs | created_at (monthly) | Range |
| audit_log | created_at (daily) | Range |
| outbox | created_at (daily) | Range |

---

## 5. API Design (Concrete)

### 5.1 Authentication

All APIs (except public) require:
- Header: `Authorization: Bearer <JWT>`
- Header: `X-Tenant-ID: <tenant_uuid>` (extracted from JWT if not provided)

### 5.2 Identity API

```
POST /v1/auth/register
Body: { phone, first_name, last_name, role, otp }
Response: { access_token, refresh_token, user }

POST /v1/auth/otp/request
Body: { phone }
Response: { expires_in: 300 }

POST /v1/auth/login
Body: { phone, otp }
Response: { access_token, refresh_token, user }
```

### 5.3 Payments API

```
POST /v1/payments/mpesa/stkpush
Body: { booking_id, phone_number, amount }
Response: { payment_id, checkout_request_id, status: "PENDING", expires_at }

POST /v1/webhooks/mpesa/callback
Body: <M-Pesa callback JSON>
Response: 200 OK (always, to prevent retries on processing errors)

GET /v1/payments/:id
Response: { id, status, amount, method, receipt_number, created_at }
```

### 5.4 Rewards API

```
POST /v1/rewards/referrals
Body: { referral_code }
Auth: Required
Response: { id, referrer_id, status, reward_amount }

GET /v1/rewards/:user_id/points
Auth: Required (self or admin)
Response: { total_points, available_points, pending_points, history }

POST /v1/rewards/:user_id/redeem
Body: { points_amount, booking_id? }
Auth: Required (self or admin)
Response: { transaction_id, new_balance }
```

### 5.5 Common Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-06-07T12:00:00Z",
    "pagination": { "page": 1, "limit": 20, "total": 100 }
  }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "M-Pesa transaction failed",
    "details": { "result_code": 1, "result_desc": "..." }
  },
  "meta": { "request_id": "uuid" }
}
```

---

## 6. Event-Driven Architecture

### 6.1 Event Bus: Apache Kafka (Phase 2) + PostgreSQL Outbox (Phase 1)

Phase 1: Services write to `outbox` table. Event-ingestion-service polls and publishes.
Phase 2+: Direct Kafka publish from services (with outbox as fallback).

### 6.2 Naming Conventions

`{domain}.{entity}.{action}`

Examples:
- `identity.user.registered`
- `crm.customer.updated`
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `payment.initiated`
- `payment.completed`
- `payment.failed`
- `dispatch.worker.assigned`
- `dispatch.job.completed`
- `reward.referral_earned`
- `reward.points_earned`
- `messaging.message.delivered`
- `ai.request.processed`

### 6.3 Event Schema (CloudEvents 1.0)

```json
{
  "specversion": "1.0",
  "type": "booking.confirmed",
  "source": "booking-service",
  "id": "uuid",
  "time": "2026-06-07T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "tenant_id": "uuid",
    "booking_id": "uuid",
    "customer_id": "uuid",
    "service_id": "uuid",
    "worker_id": "uuid",
    "scheduled_date": "2026-06-15",
    "total_amount": 2500,
    "currency": "KES"
  }
}
```

### 6.4 Topics & Consumers

| Topic | Producer | Consumers | Phase |
|-------|----------|-----------|-------|
| `events.bookings` | booking-service | dispatch, payments, messaging, analytics | 1 |
| `events.payments` | payments-service | booking, messaging, rewards, analytics | 1 |
| `events.dispatch` | dispatch-service | messaging, analytics | 1 |
| `events.identity` | identity-service | analytics, messaging | 1 |
| `events.messaging` | messaging-service | analytics | 1 |
| `events.rewards` | rewards-service | messaging, analytics | 2 |
| `events.ai` | ai-orchestrator | analytics | 3 |

---

## 7. Infrastructure Design

### 7.1 No Docker/Kubernetes

User is not familiar with Docker/K8s. Deployment uses:
- **PM2** for process management (`pm2 start ecosystem.config.js`)
- **Nginx** as reverse proxy and load balancer
- **systemd** services for long-running processes
- **Cron** for scheduled jobs (reconciliation, recurring bookings)

### 7.2 PM2 Ecosystem

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    { name: 'api-gateway', script: './apps/api-gateway/dist/main.js', instances: 2, exec_mode: 'cluster' },
    { name: 'identity-service', script: './apps/identity-service/dist/main.js', instances: 2 },
    { name: 'booking-service', script: './apps/booking-service/dist/main.js', instances: 2 },
    { name: 'payments-service', script: './apps/payments-service/dist/main.js', instances: 2 },
    // ... etc
    { name: 'event-ingestion-service', script: './apps/event-ingestion-service/dist/main.js', instances: 1 },
  ]
};
```

### 7.3 Service Discovery

Static configuration via environment variables + Redis for dynamic worker discovery.
No Consul/Etcd needed at this scale.

### 7.4 Secrets Management

Phase 1: `.env` files (restricted permissions) + manual sync
Phase 2: HashiCorp Vault or cloud provider secret manager (AWS Secrets Manager, GCP Secret Manager)

### 7.5 CI/CD

GitHub Actions:
- Lint + Test on PR
- Build + Deploy to Staging on merge to `develop`
- Build + Deploy to Production on merge to `main`
- Rollback via `git revert` + redeploy

---

## 8. Security Implementation

### 8.1 Authentication Flow

1. User enters phone number
2. Backend generates OTP, sends via AT
3. User enters OTP
4. Backend verifies OTP, creates/updates user in Keycloak
5. Keycloak issues JWT (access + refresh)
6. Client sends JWT in `Authorization` header
7. Gateway validates JWT with Keycloak
8. Extract tenant_id from JWT claim
9. Inject into request context

### 8.2 Authorization (RBAC)

Roles: `SUPER_ADMIN`, `ADMIN`, `SUPERVISOR`, `WORKER`, `CUSTOMER`
Permissions stored in Keycloak realm roles + custom claims.

Middleware:
```javascript
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

### 8.3 API Security

- Rate limiting: Redis-based (100 RPM IP, 1000 RPM user)
- Input validation: Zod schemas
- CORS: Whitelist only
- SQL injection: Prisma ORM
- XSS: Sanitize input, CSP headers
- HSTS: Enforce HTTPS

### 8.4 Encryption

- TLS 1.3 in transit (Nginx)
- AES-256 at rest (AWS EBS encryption or LUKS on-prem)
- Database field-level encryption for: `users.phone`, `payments.checkout_request_id`

### 8.5 Audit Logging

Every state change on `bookings`, `jobs`, `payments` is logged to `audit_log` table.
```sql
INSERT INTO audit_log (tenant_id, entity_type, entity_id, actor_id, action, from_state, to_state, metadata)
VALUES (...);
```

### 8.6 Tenant Isolation

- RLS on all tables
- `tenant_id` in every query (via Prisma middleware)
- Cross-tenant access returns 403
- Automated tests verify isolation

---

## 9. Integration Layer Design

### 9.1 Adapter Pattern

All external integrations wrapped in adapters in `/packages`:

```
packages/
  @mobiwave/mpesa/
    src/
      mpesa.client.ts        # Daraja API calls
      mpesa.mapper.ts         # Map responses to internal types
      mpesa.error.ts          # Error handling
      mpesa.types.ts          # DTOs
  @mobiwave/at/               # Africa's Talking
  @mobiwave/novu/             # Novu
  @mobiwave/minio/            # MinIO
```

### 9.2 M-Pesa Integration

Adapter: `@mobiwave/mpesa`
- `initiateStkPush(dto: StkPushDto)`
- `handleCallback(payload: CallbackPayload)`
- `queryTransaction(checkoutRequestId: string)`
- `initiateB2C(dto: B2CDto)`

Circuit breaker: If M-Pesa API fails 5 times in 60s, switch to degraded mode (queue for retry).

### 9.3 SMS (Africa's Talking)

Adapter: `@mobiwave/at`
- `sendSms(phone: string, message: string)`
- `sendBulkSms(phones: string[], message: string)`

Fallback: If AT fails, retry via Twilio (if configured).

### 9.4 WhatsApp (WABA)

Adapter: `@mobiwave/whatsapp`
- `sendMessage(phone: string, template: string, vars: object)`
- `parseWebhook(body: object)` (for two-way)

### 9.5 Email

Via Novu (SMTP fallback).

---

## 10. Data Pipeline & Analytics

### 10.1 Event Ingestion Service

```
Postgres outbox table
  → Event Ingestion Service (polls every 5s)
  → Kafka (Phase 2) or direct processing (Phase 1)
  → Analytics Service
  → ClickHouse (Phase 3) or Postgres (Phase 1-2)
```

### 10.2 ELT Strategy

Raw events → Kafka → ClickHouse (raw table)
→ Materialized Views (hourly aggregates)
→ API serves from materialized views

### 10.3 Data Lake (MinIO)

- Raw event dumps (daily Parquet files)
- Document storage (presigned URLs)
- Backup archives

### 10.4 Real-time vs Batch

Real-time: Kafka streams for live dashboard metrics.
Batch: Nightly jobs for reconciliation, report generation, data pruning.

---

## 11. AI Orchestration Layer

### 11.1 Abstraction

```typescript
interface AIProvider {
  chat(messages: Message[]): Promise<string>;
  embed(text: string): Promise<number[]>;
}

class OpenAIProvider implements AIProvider { ... }
class GeminiProvider implements AIProvider { ... }

class AIOrchestrator {
  route(request: AIRequest gamble): AIProvider {
    if (request.tenant.config.ai_provider === 'gemini') return new GeminiProvider();
    return new OpenAIProvider();
  }
}
```

### 11.2 Prompt Templates

Stored in PostgreSQL:
```sql
CREATE TABLE prompts (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    name VARCHAR(100), -- 'whatsapp_classifier', 'support_response'
    template TEXT,
    variables JSONB, -- ['customer_name', 'issue_type']
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(50) DEFAULT 'gpt-4',
    max_tokens INTEGER DEFAULT 500
);
```

### 11.3 Tool Calling

Structured output for function calls:
```json
{
  "tool": "check_booking_status",
  "parameters": { "booking_id": "uuid" }
}
```

---

## 12. Deployment Strategy

### 12.1 Local Development

```bash
# Single command
pm run dev:services  # Starts all services with PM2 in watch mode

# Or individually
pm2 start pm2.dev.config.js
```

### 12.2 Staging

- Single VPS (4 vCPU, 16GB RAM)
- All services on one machine (PM2)
- PostgreSQL + Redis + MinIO local
- Separate Keycloak instance

### 12.3 Production

- Multiple VPS (separate DB, App, Redis)
- Nginx load balancer (round-robin)
- PostgreSQL primary + read replica
- Redis cluster (3 nodes)
- MinIO distributed (4 nodes)

### 12.4 Horizontal Scaling

Stateless services: Scale via PM2 cluster mode or multiple VMs behind Nginx.
Stateful: PostgreSQL (read replicas), Redis (cluster mode), Kafka (partitioning).

### 12.5 Failover

- DB: Automatic failover to read replica (manual promotion)
- Redis: Sentinel for auto-failover
- App: Nginx health checks remove unhealthy nodes

### 12.6 Disaster Recovery

- RPO: < 1 hour (WAL archiving to S3)
- RTO: < 4 hours (restore from backup + replay WAL)
- Backups: Daily full + continuous WAL to S3
- Testing: Quarterly DR drill

---

## 13. Performance & Scalability Design

### 13.1 Caching

| Layer | Tech | Use Case | TTL |
|-------|------|----------|-----|
| API Response | Redis | Service catalog, static configs | 5 min |
| Session | Redis | JWT refresh tokens, OTP codes | 15 min |
| Availability | Redis | Worker slot cache | 1 min |
| Rate Limit | Redis | IP/User buckets | 1 min |
| Idempotency | Redis | M-Pesa CheckoutRequestID | 24h |

### 13.2 Async Processing

BullMQ queues:
- `mpesa-status-check`: Poll M-Pesa for pending transactions
- `notification-delivery`: Send SMS/WhatsApp/Email
- `worker-reminders`: Send 24h pre-job reminders
- `nightly-reconciliation`: Reconcile payments
- `report-generation`: Generate daily/weekly reports

### 13.3 Database Scaling

Phase 1: Single PostgreSQL instance
Phase 2: Read replica for analytics/queries
Phase 3: Partitioning (bookings, payments by month)
Phase 4: Sharding by tenant_id (if needed)

### 13.4 Bottleneck Mitigation

| Bottleneck | Mitigation |
|------------|-----------|
| M-Pesa API latency | Async processing, outbox pattern |
| Booking conflict check | Exclusion constraint (DB level) + advisory locks |
| Worker assignment | Redis sorted sets (by score), background pre-computation |
| File uploads | Presigned URLs (direct to MinIO), async thumbnail generation |
| Notification bursts | BullMQ rate limiting, Novu queue management |

---

## 14. Build Plan (Step-by-Step Execution)

### Phase 1 — Core Foundation (Weeks 1-4)

Deliverables:
- Monorepo scaffold (Turborepo, Prisma, biome/eslint)
- Docker Compose (dev only: Postgres, Redis, MinIO, Keycloak)
- identity-service (Keycloak wrapper, OTP)
- crm-service (Customers, workers, services)
- booking-service (Create, availability)
- payments-service (M-Pesa STK, callbacks)
- documents-service (Presigned URLs)

Dependencies:
- Keycloak realm configuration
- M-Pesa sandbox credentials
- Africa's Talking account
- MinIO bucket setup

Risks:
- M-Pesa sandbox vs production differences
- Keycloak learning curve for team
- Timezone handling (Africa/Nairobi)

### Phase 2 — Core Services (Weeks 5-8)

Deliverables:
- dispatch-service (Assignment, state machine)
- messaging-service (Novu, AT, WABA integration)
- workflow-service (Rules engine)
- event-ingestion-service (Outbox → Kafka)
- rewards-service (Referrals, loyalty)
- Admin dashboard (Budibase or custom Next.js)

Dependencies:
- Kafka cluster (self-hosted or Confluent Cloud)
- Novu account + templates configured
- WABA business verification

Risks:
- Kafka operational complexity
- WhatsApp Business API approval delays
- Novu template migration

### Phase 3 — Integrations (Weeks 9-12)

Deliverables:
- ai-orchestrator-service (LLM routing)
- analytics-service (ClickHouse, dashboards)
- api-gateway (Kong or Nginx + custom middleware)
- Advanced dispatch (OSRM proximity)
- Multi-tenancy (RLS enforcement)
- Worker mobile app (React Native)

Dependencies:
- ClickHouse cluster
- Kong installation
- OSRM server (Mombasa/Nairobi coverage)
- Google Play / Apple Developer accounts

Risks:
- React Native build pipeline
- OSRM data size for Kenya
- ClickHouse operational overhead

### Phase 4 — Intelligence Layer (Months 4-5)

Deliverables:
- AI-powered WhatsApp chatbot (intent classification, FAQ)
- Predictive analytics (demand forecasting, churn)
- Automated marketing (abandoned booking recovery)
- Advanced loyalty (tiered rewards, gamification)

Dependencies:
- OpenAI/Gemini production access
- Marketing automation platform (Customer.io/Mailchimp)

Risks:
- AI hallucination in customer-facing flows
- Data privacy (Kenya DPA 2019) for AI training

### Phase 5 — Scale & Optimization (Month 6)

Deliverables:
- Performance optimization (query tuning, caching)
- Load testing (100k bookings/day simulation)
- Security audit (penetration testing)
- Disaster recovery testing
- Documentation (API reference, runbooks)
- Team handover + training

Dependencies:
- Load testing tools (k6/Locust)
- Security firm (pen test)
- SRE time for DR drill

Risks:
- Performance issues only visible at scale
- Security vulnerabilities requiring architecture changes

