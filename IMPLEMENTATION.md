# ServiceOps - Complete Implementation Document
## All Phases (MVP through MobiWave Core)

**Version:** 1.0
**Date:** June 2026
**Status:** Ready for Implementation

---

## Table of Contents

1. Phase 1: MVP Foundation (Weeks 1-4)
2. Phase 2: Scale and Automation (Weeks 5-8)
3. Phase 3: Multi-Product Expansion (Weeks 9-12)
4. Phase 4: MobiWave Core Integration (Months 4-6)
5. Cross-Cutting Concerns
6. Appendices

---

## Phase 1: MVP Foundation (Weeks 1-4)

### 1.1 Architecture Overview

Clients:
- Next.js Web App
- WhatsApp Bot

API: Monolithic Express API
- Auth Endpoints
- Booking Endpoints
- Payment Endpoints
- Worker Endpoints
- Webhook Endpoints

Data Layer:
- PostgreSQL 15
- Redis

External:
- M-Pesa Daraja 2.0
- Novu Notifications
- WhatsApp Business API

### 1.2 Tech Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|--------------|
| Web Frontend | Next.js | 14+ | SSR, API routes, React Server Components |
| Mobile (Worker) | React Native | 0.73+ | Single codebase for iOS/Android |
| API | Express.js | 4.x | Proven, lightweight, middleware ecosystem |
| Database | PostgreSQL | 15+ | RLS, JSONB, exclusion constraints |
| Cache/Queue | Redis | 7+ | Sessions, BullMQ, rate limiting |
| Auth | Keycloak | 23+ | OAuth2, RBAC |
| Payment | M-Pesa Daraja | 2.0 | Kenya market requirement |
| Notifications | Novu | Latest | Multi-channel (SMS, Email, Push, WhatsApp) |
| File Storage | MinIO | Latest | S3-compatible, self-hosted |
| Containerization | Docker | 24+ | Dev/prod parity |
| Orchestration | Docker Compose | Dev | Simple local development |
| Cloud (Prod) | AWS/GCP/Azure | Any | Managed K8s (EKS/GKE/AKS) |

### 1.3 Database Schema (Phase 1)

Tenants Table:
- id: UUID PRIMARY KEY
- name: VARCHAR(255)
- slug: VARCHAR(255) UNIQUE
- settings: JSONB
- created_at: TIMESTAMPTZ
- deleted_at: TIMESTAMPTZ

Users Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID NOT NULL (FK)
- phone: VARCHAR(20) UNIQUE
- email: VARCHAR(255)
- first_name: VARCHAR(100)
- last_name: VARCHAR(100)
- password_hash: VARCHAR(255)
- avatar_url: VARCHAR(500)
- role: VARCHAR(50) - CUSTOMER, WORKER, ADMIN, SUPERVISOR
- status: VARCHAR(20) - ACTIVE, INACTIVE, SUSPENDED, DELETED
- verified_at: TIMESTAMPTZ
- last_login_at: TIMESTAMPTZ
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- deleted_at: TIMESTAMPTZ

Customer Profiles Table:
- id: UUID PRIMARY KEY
- user_id: UUID (FK)
- tenant_id: UUID (FK)
- home_address: JSONB
- work_address: JSONB
- preferred_payment_method: VARCHAR(50)
- loyalty_points: INTEGER DEFAULT 0
- referral_code: VARCHAR(20) UNIQUE
- referred_by: UUID (FK)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Worker Profiles Table:
- id: UUID PRIMARY KEY
- user_id: UUID (FK)
- tenant_id: UUID (FK)
- id_number: VARCHAR(50)
- kyc_status: VARCHAR(20) - PENDING, IN_REVIEW, VERIFIED, REJECTED
- kyc_data: JSONB
- skills: TEXT[]
- hourly_rate: DECIMAL(10,2)
- reliability_score: DECIMAL(3,2) DEFAULT 5.00
- is_available: BOOLEAN DEFAULT TRUE
- current_location: JSONB
- working_hours: JSONB
- documents: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Services Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID (FK)
- name: VARCHAR(255)
- slug: VARCHAR(255)
- description: TEXT
- category: VARCHAR(50) - CLEANING, LAUNDRY, CAREGIVER, PEST_CONTROL, SECURITY, MAINTENANCE, PLUMBING, ELECTRICAL
- base_price: DECIMAL(10,2)
- duration_minutes: INTEGER
- requirements: TEXT[]
- is_active: BOOLEAN DEFAULT TRUE
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- deleted_at: TIMESTAMPTZ

Addresses Table:
- id: UUID PRIMARY KEY
- user_id: UUID (FK)
- tenant_id: UUID (FK)
- label: VARCHAR(50)
- street_address: TEXT
- apartment_suite: VARCHAR(100)
- city: VARCHAR(100)
- county: VARCHAR(100)
- postal_code: VARCHAR(20)
- country: VARCHAR(100) DEFAULT 'Kenya'
- location: JSONB
- is_default: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Bookings Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID (FK)
- customer_id: UUID (FK)
- service_id: UUID (FK)
- address_id: UUID (FK)
- worker_id: UUID (FK) - Assigned later
- scheduled_date: DATE
- scheduled_start: TIME
- scheduled_end: TIME
- timezone: VARCHAR(50) DEFAULT 'Africa/Nairobi'
- status: VARCHAR(20) - PENDING, CONFIRMED, ASSIGNED, ACCEPTED, EN_ROUTE, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, STALLED
- cancellation_reason: TEXT
- cancelled_by: UUID (FK)
- cancelled_at: TIMESTAMPTZ
- cancellation_policy_snapshot: JSONB
- base_amount: DECIMAL(10,2)
- discount_amount: DECIMAL(10,2) DEFAULT 0
- total_amount: DECIMAL(10,2)
- currency: VARCHAR(3) DEFAULT 'KES'
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ

Jobs Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID (FK)
- booking_id: UUID (FK)
- worker_id: UUID (FK)
- status: VARCHAR(20) - ASSIGNED, ACCEPTED, DECLINED, EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED, NO_SHOW, DISPUTED
- started_location: JSONB
- completed_location: JSONB
- accepted_at: TIMESTAMPTZ
- en_route_at: TIMESTAMPTZ
- arrived_at: TIMESTAMPTZ
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- customer_rating: INTEGER (1-5)
- customer_review: TEXT
- worker_rating: INTEGER (1-5)
- worker_review: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Payments Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID (FK)
- booking_id: UUID (FK)
- customer_id: UUID (FK)
- amount_gross: BIGINT (minor units)
- amount_fee: BIGINT DEFAULT 0
- amount_net: BIGINT
- currency: VARCHAR(3) DEFAULT 'KES'
- merchant_request_id: VARCHAR(255)
- checkout_request_id: VARCHAR(255) UNIQUE
- mpesa_receipt_number: VARCHAR(255)
- mpesa_transaction_date: TIMESTAMPTZ
- status: VARCHAR(20) - PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, REFUND_PENDING
- payment_method: VARCHAR(50) - MPESA_STK, MPESA_B2C, CASH, BANK_TRANSFER
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Audit Log Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID (FK)
- entity_type: VARCHAR(50) - booking, job, payment
- entity_id: UUID
- actor_id: UUID (FK)
- action: VARCHAR(50) - status_change, payment_received, etc.
- from_state: VARCHAR(50)
- to_state: VARCHAR(50)
- reason: TEXT
- metadata: JSONB
- created_at: TIMESTAMPTZ

### 1.4 Constraints and Indexes

Prevent double-booking:
- EXCLUDE USING gist on worker_id and time range
- WHERE status IN ('CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS')

Idempotency for M-Pesa:
- UNIQUE constraint on checkout_request_id

Performance indexes:
- idx_bookings_customer: (customer_id, created_at DESC)
- idx_bookings_worker: (worker_id, scheduled_date)
- idx_bookings_status: (status) WHERE status IN ('PENDING', 'CONFIRMED', 'ASSIGNED')
- idx_jobs_worker: (worker_id, created_at DESC)
- idx_payments_booking: (booking_id)
- idx_payments_status: (status)
- idx_audit_entity: (entity_type, entity_id, created_at DESC)
- idx_users_phone: (phone) WHERE deleted_at IS NULL
- idx_users_tenant: (tenant_id, role) WHERE deleted_at IS NULL

### 1.5 API Design (Phase 1)

#### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/auth/register | Register new user | Public |
| POST | /api/v1/auth/login | Login with phone/OTP | Public |
| POST | /api/v1/auth/otp/request | Request OTP | Public |
| POST | /api/v1/auth/otp/verify | Verify OTP | Public |
| POST | /api/v1/auth/refresh | Refresh access token | JWT |
| POST | /api/v1/auth/logout | Logout | JWT |
| GET | /api/v1/auth/me | Get current user | JWT |

Register Request:
- phone: string
- first_name: string
- last_name: string
- role: string (CUSTOMER, WORKER)
- otp: string

Login Response:
- access_token: string
- refresh_token: string
- expires_in: number
- user: { id, phone, first_name, last_name, role }

#### Service Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/services | List available services | Public |
| GET | /api/v1/services/:slug | Get service details | Public |

#### Booking Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/bookings | Create booking | Customer |
| GET | /api/v1/bookings | List my bookings | Customer |
| GET | /api/v1/bookings/:id | Get booking details | Customer |
| POST | /api/v1/bookings/:id/cancel | Cancel booking | Customer |
| POST | /api/v1/bookings/:id/confirm | Confirm booking (admin) | Admin |

Booking Request:
- service_id: UUID
- address_id: UUID
- scheduled_date: date
- scheduled_start: time
- notes: string (optional)

Booking Response:
- id: UUID
- status: string
- service: { name, base_price }
- scheduled_date: date
- scheduled_start: time
- scheduled_end: time
- total_amount: number
- currency: string
- address: { street_address, city }

#### Payment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/payments/mpesa/stkpush | Initiate M-Pesa STK | Customer |
| POST | /api/v1/webhooks/mpesa/callback | M-Pesa callback | Public (IP whitelisted) |
| GET | /api/v1/payments/:id/status | Check payment status | Customer |

STK Push Request:
- booking_id: UUID
- phone_number: string
- amount: number

M-Pesa Callback Payload (simplified):
- MerchantRequestID: string
- CheckoutRequestID: string
- ResultCode: number
- ResultDesc: string
- CallbackMetadata: { Item: [ {Name: "Amount", Value: number}, {Name: "MpesaReceiptNumber", Value: string}, {Name: "TransactionDate", Value: number}, {Name: "PhoneNumber", Value: string} ] }

#### Worker Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/worker/jobs | List available/assigned jobs | Worker |
| POST | /api/v1/worker/jobs/:id/accept | Accept job | Worker |
| POST | /api/v1/worker/jobs/:id/decline | Decline job | Worker |
| POST | /api/v1/worker/jobs/:id/en-route | Mark en route | Worker |
| POST | /api/v1/worker/jobs/:id/arrived | Mark arrived | Worker |
| POST | /api/v1/worker/jobs/:id/start | Start job | Worker |
| POST | /api/v1/worker/jobs/:id/complete | Complete job | Worker |
| GET | /api/v1/worker/earnings | View earnings | Worker |
| POST | /api/v1/worker/location | Update location | Worker |

#### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/admin/dashboard | Dashboard stats | Admin |
| GET | /api/v1/admin/bookings | List all bookings | Admin |
| GET | /api/v1/admin/workers | List all workers | Admin |
| POST | /api/v1/admin/workers/:id/verify | Verify worker KYC | Admin |
| POST | /api/v1/admin/bookings/:id/assign | Assign worker to booking | Admin |
| POST | /api/v1/admin/bookings/:id/reassign | Reassign worker | Admin |

### 1.6 M-Pesa Integration

State Machine:
- PENDING: Customer initiates
- PROCESSING: STK Push sent
- COMPLETED: Callback received (ResultCode: 0)
- FAILED: Callback received (ResultCode != 0) or Timeout
- REFUND_PENDING: Refund requested
- REFUNDED: B2C callback

STK Push Flow:
1. Customer clicks Pay Now
2. Backend generates unique CheckoutRequestID
3. Call M-Pesa /stkpush/v1/processrequest
4. Store in payments table with status PENDING
5. Return 202 Accepted to customer
6. Wait for callback

On Callback:
- ResultCode == 0: Update to COMPLETED, trigger booking confirmation
- ResultCode != 0: Update to FAILED, offer retry
- No callback after 60s: Poll /transactionstatus/v1/query up to 3 times

Nightly Cron:
- Pull all PENDING payments from last 24h
- Query transaction status for each
- Reconcile with M-Pesa records

Idempotency:
- Key: CheckoutRequestID
- Storage: Redis with 24h TTL
- Logic:
  1. Check if CheckoutRequestID exists in Redis
  2. If yes: Return cached response (200 OK)
  3. If no: Process, store in Redis, return 200
  4. Database enforces UNIQUE constraint as backup

### 1.7 WhatsApp Bot (Phase 1)

Scope: Booking, status checks, basic support

Conversation Flow:
Customer: "Hi"
Bot: "Welcome to ServiceOps! Reply with: 1. Book Cleaning, 2. My Bookings, 3. Track Job, 4. Support"

Customer: "1"
Bot: "Great! What service do you need? 1. Regular Cleaning (KES 2,000), 2. Deep Cleaning (KES 3,500)"

Customer: "2"
Bot: "When would you like this? Please send date in format DD-MM-YYYY"

Customer: "15-06-2026"
Bot: "Available slots on 15 June 2026: 1. 09:00 AM, 2. 12:00 PM, 3. 03:00 PM"
... Continue until payment link is sent

Technical Implementation:
- Webhook receives all incoming messages
- State machine per phone number (stored in Redis with 5-min expiry)
- Each state expects specific input; invalid input reprompts
- Booking creation calls same API as web app
- Payment link is a shortened URL to the payment page

### 1.8 File Upload (Phase 1)

Use Cases: Profile photos, KYC documents, before/after photos

Flow:
1. Client requests upload: POST /api/v1/uploads/get-url
2. Backend generates presigned PUT URL (MinIO, 5-min expiry)
3. Client uploads directly to MinIO
4. Backend validates: Content-Type, size, virus scan (ClamAV or Cloudmersive)
5. Store final URL in database
6. Generate presigned GET URL for display

### 1.9 Notifications (Phase 1)

Channels: SMS (Twilio/Africa's Talking), WhatsApp (WhatsApp Business API)

Events and Templates:
- Booking Confirmed (SMS, WhatsApp): "Your cleaning is confirmed for [Date] at [Time]. Cleaner: [Name]. Track: [Link]"
- Payment Received (SMS, WhatsApp): "Payment of KES [Amount] received. Receipt: [ID]"
- Worker Assigned (WhatsApp): "[Name] will arrive at [Time]. Contact: [Phone]"
- Job Started (WhatsApp): "Your cleaner has arrived and started the job."
- Job Completed (SMS, WhatsApp): "Job completed! Rate your experience: [Link]"
- Reminder (24h) (WhatsApp): "Reminder: You have a booking tomorrow at [Time]."

Implementation:
- Novu handles channel routing and template management
- Outbox pattern: Write to notification_outbox table
- BullMQ worker polls every 5 seconds, dispatches to Novu
- Failed notifications retried 3 times with exponential backoff

### 1.10 Sprints (Phase 1)

Sprint 1 (Days 1-7): Foundation
- Set up monorepo (Turborepo)
- Docker Compose dev environment
- PostgreSQL schema + migrations (Prisma)
- Keycloak configuration
- Express API skeleton + middleware
- Next.js web app skeleton + auth context

Sprint 2 (Days 8-14): Core Features
- User registration (OTP via Africa's Talking)
- Service catalog
- Booking creation + validation
- Address management
- Payment initiation (M-Pesa STK)
- Webhook handling + status updates

Sprint 3 (Days 15-21): Worker and Operations
- Worker registration + KYC upload
- Worker app screens (React Native)
- Job assignment flow
- Admin dashboard (Budibase or custom)
- Job state machine implementation
- Basic reporting

Sprint 4 (Days 22-28): Polish and Launch
- WhatsApp bot MVP
- Notification templates
- File upload (presigned URLs)
- Testing (unit, integration, E2E)
- Staging deployment
- Production deployment (AWS/GCP)

---

## Phase 2: Scale and Automation (Weeks 5-8)

### 2.1 Architecture Evolution

Clients:
- Next.js Web App
- React Native App
- WhatsApp Bot

Gateway: Kong Gateway + Rate Limiting

Core Services:
- Auth Service (Keycloak)
- Booking Service
- Payment Service
- Dispatch Service
- Notification Service
- Worker Service
- Customer Service

Message Bus: Apache Kafka

Data:
- PostgreSQL - Primary
- PostgreSQL - Read Replica
- Redis Cluster

External:
- M-Pesa Daraja
- Novu Notifications
- WhatsApp Business API

### 2.2 Key Additions

#### Apache Kafka (Event Streaming)

Topics:
- bookings.created (3 partitions, 7 day retention)
- bookings.confirmed (3 partitions, 7 day retention)
- bookings.cancelled (3 partitions, 7 day retention)
- workers.assigned (3 partitions, 7 day retention)
- workers.accepted (3 partitions, 7 day retention)
- workers.declined (3 partitions, 7 day retention)
- payments.completed (3 partitions, 30 day retention)
- payments.failed (3 partitions, 30 day retention)
- notifications.send (3 partitions, 1 day retention)

Consumer Groups:
- notification-processor: consumes notifications.send, sends via Novu
- dispatch-engine: consumes bookings.confirmed, finds and assigns worker
- analytics-aggregator: consumes all topics, updates analytics DB
- audit-logger: consumes all topics, writes to audit_log table

#### Outbox Pattern

Outbox Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID NOT NULL
- topic: VARCHAR(255)
- payload: JSONB
- headers: JSONB
- status: VARCHAR(20) - PENDING, SENT, FAILED
- retry_count: INTEGER DEFAULT 0
- last_error: TEXT
- created_at: TIMESTAMPTZ
- sent_at: TIMESTAMPTZ

Index: idx_outbox_pending on (status, created_at) WHERE status = PENDING

Flow:
1. Business transaction (e.g., create booking)
2. BEGIN TRANSACTION
3.    INSERT INTO bookings (...)
4.    INSERT INTO outbox (topic, payload) VALUES ('bookings.created', {...})
5. COMMIT
6. Background worker polls outbox every 5 seconds
7. For each PENDING record:
8.    Publish to Kafka
9.    UPDATE outbox SET status = 'SENT', sent_at = NOW()
10. On failure: increment retry_count, update last_error

#### BullMQ (Background Jobs)

Queues:
- mpesa-status-query: Poll transaction status (High priority)
- mpesa-reconciliation: Nightly reconciliation (Medium priority)
- worker-location-update: Geospatial indexing (Low priority)
- notification-delivery: Send notifications (High priority)
- job-reminders: Send pre-job reminders (Medium priority)
- report-generation: Generate daily/weekly reports (Low priority)

#### Read Replicas

Prisma configuration for read replicas:
- Primary: DATABASE_URL for writes
- Read Replica: READ_REPLICA_URL for reads
- Switch based on operation type (isWriteOperation flag)

### 2.3 Referral System

Schema Addition:
- customer_profiles.referral_code: VARCHAR(20) UNIQUE
- customer_profiles.referred_by: UUID (references users)
- customer_profiles.referral_count: INTEGER DEFAULT 0

Referrals Table:
- id: UUID PRIMARY KEY
- referrer_id: UUID (FK to users)
- referred_id: UUID (FK to users)
- status: VARCHAR(20) - PENDING, COMPLETED, REWARDED
- reward_amount: DECIMAL(10,2)
- created_at: TIMESTAMPTZ
- UNIQUE(referrer_id, referred_id)

Flow:
1. Customer shares referral link: https://serviceops.co.ke/r/JANE20
2. New user signs up with referral code "JANE20"
3. On first completed booking:
   a. Both get KES 200 credit
   b. referral.status = REWARDED
   c. customer_profiles.referral_count++

### 2.4 Recurring Bookings

Schema Addition:
- bookings.is_recurring: BOOLEAN DEFAULT FALSE
- bookings.recurring_rule_id: UUID

Recurring Rules Table:
- id: UUID PRIMARY KEY
- tenant_id: UUID (FK)
- customer_id: UUID (FK)
- service_id: UUID (FK)
- frequency: VARCHAR(20) - WEEKLY, BIWEEKLY, MONTHLY
- day_of_week: INTEGER (0=Sun, 1=Mon, ...)
- day_of_month: INTEGER
- start_date: DATE
- end_date: DATE
- next_booking_date: DATE
- is_active: BOOLEAN DEFAULT TRUE
- created_at: TIMESTAMPTZ

Cron Job:
- Runs daily at 6:00 AM
- Finds all recurring rules where next_booking_date = today
- Creates a new booking
- Updates next_booking_date based on frequency

### 2.5 Sprints (Phase 2)

Sprint 5 (Days 29-35): Event Streaming
- Set up Kafka (Confluent Cloud or self-hosted)
- Implement outbox pattern
- Refactor services to publish/consume events
- Set up read replicas
- Performance testing

Sprint 6 (Days 36-42): Automation
- BullMQ workers
- Recurring bookings
- Referral system
- Automated dispatch (basic algorithm)
- Nightly reconciliation job

---

## Phase 3: Multi-Product Expansion (Weeks 9-12)

### 3.1 Architecture Evolution

Identity:
- Keycloak - SSO
- Identity Service

Core Platform:
- Booking Service
- Payment Service
- Dispatch Service
- Notification Service
- Worker Service
- Customer Service
- Analytics Service

Products:
- Cleaning Vertical
- Laundry Vertical
- Caregiving Vertical
- Security Vertical

Data:
- PostgreSQL Cluster
- ClickHouse Analytics
- Redis
- MinIO

### 3.2 Multi-Tenancy (Fully Enabled)

Previous: tenant_id existed but single tenant
Now: Multiple agencies per country

Tenant Configs:
- tenants.country: VARCHAR(2) DEFAULT 'KE'
- tenants.currency: VARCHAR(3) DEFAULT 'KES'
- tenants.payment_settings: JSONB
- tenants.commission_rate: DECIMAL(5,2) DEFAULT 10.00

Row-Level Security (RLS) on ALL tables:
- ALTER TABLE users ENABLE ROW LEVEL SECURITY
- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY
- ALTER TABLE services ENABLE ROW LEVEL SECURITY

Policy Examples:
- tenant_isolation_users: USING (tenant_id = current_setting('app.tenant_id')::UUID)
- tenant_isolation_bookings: USING (tenant_id = current_setting('app.tenant_id')::UUID)

Middleware:
- Extract tenant from JWT or subdomain
- Set app.tenant_id GUC before each request

### 3.3 Multi-Product Support

Laundry Orders Table:
- id: UUID PRIMARY KEY
- booking_id: UUID (FK)
- items: JSONB
- weight_kg: DECIMAL(6,2)
- pickup_address_id: UUID
- delivery_address_id: UUID
- special_instructions: TEXT
- status: VARCHAR(20)

Caregiving Bookings Table:
- id: UUID PRIMARY KEY
- booking_id: UUID (FK)
- care_type: VARCHAR(50) - ELDERY, CHILD, DISABILITY
- patient_age: INTEGER
- medical_conditions: TEXT[]
- emergency_contact: JSONB
- duration_hours: INTEGER
- recurring_pattern: VARCHAR(50) - DAILY, LIVE_IN

### 3.4 Analytics (ClickHouse)

Why ClickHouse: Columnar storage, fast aggregations, real-time inserts

Bookings Analytics Table:
- event_date: Date
- tenant_id: UUID
- service_category: String
- status: String
- amount: Decimal64(2)
- city: String
- worker_id: UUID
- customer_id: UUID
- ENGINE = MergeTree()
- ORDER BY (event_date, tenant_id, service_category)

Pipeline:
- Kafka topic 'analytics.raw_events'
- ClickHouse Kafka Engine
- Materialized View
- Aggregated reports

### 3.5 Advanced Dispatch (OSRM)

Algorithm:
1. Get available workers for booking time range
2. For each worker:
   a. Calculate OSRM distance from worker to booking location
   b. Score = (1/distance)*DISTANCE_WEIGHT + reliability_score*RELIABILITY_WEIGHT + (1/(jobs_today+1))*WORKLOAD_WEIGHT
3. Return worker with highest score

### 3.6 Sprints (Phase 3)

Sprint 7 (Days 43-49): Multi-Tenant
- Enable RLS on all tables
- Tenant middleware
- Tenant onboarding flow
- Cross-tenant tests
- Data isolation audit

Sprint 8 (Days 50-56): New Products
- Laundry module
- Caregiving module
- Product-specific schemas
- Unified booking flow across products
- Analytics pipeline (ClickHouse)

---

## Phase 4: MobiWave Core Integration (Months 4-6)

### 4.1 Architecture Evolution

MobiWave Core:
- Identity Service
- Billing Service
- Notification Core
- Analytics Platform
- Configuration Service

ServiceOps Platform:
- Cleaning Vertical
- Laundry Vertical
- Caregiving Vertical
- Security Vertical
- Dispatch Engine
- Payment Adapter

Shared Infrastructure:
- Apache Kafka
- PostgreSQL Cluster
- ClickHouse
- Redis
- MinIO

### 4.2 MobiWave Core Services

Identity Service (Abstracted from Keycloak):
- OAuth2 / OIDC
- SAML for enterprise users
- Social logins (Google, Apple)
- Multi-factor authentication
- Biometric support (FaceID, Fingerprint)

Billing Service:
- Unified billing across all products
- Subscription management
- Invoicing
- Revenue recognition
- Multi-currency support (KES, USD, EUR)

Analytics Platform:
- Cross-product dashboards
- Funnel analysis (PostHog)
- Cohort analysis
- Predictive analytics (Churn, LTV)
- Real-time metrics (Prometheus + Grafana)

### 4.3 Integration Points

| ServiceOps | MobiWave Core | Interaction |
|------------|---------------|-------------|
| User registration | Identity Service | POST /identities |
| Authentication | Identity Service | Validate JWT |
| Payment | Billing Service | POST /billing/invoices |
| Notifications | Notification Core | POST /notifications |
| Analytics | Analytics Platform | POST /analytics/events |
| Service config | Configuration Service | GET /config/serviceops |

### 4.4 Configuration-Driven

ServiceOps Config YAML:
- version: "2.0"
- products:
  - cleaning: enabled, display_name, services (with base_price, duration_minutes)
  - laundry: enabled, display_name, per_kg_price, minimum_order
  - caregiving: enabled, display_name
- payment:
  - currency: KES
  - providers: mpesa (enabled, shortcode), card (enabled), bank_transfer (enabled)
- dispatch:
  - strategy: proximity_then_reliability
  - max_travel_distance_km: 15
  - auto_assign: true

### 4.5 White-Label Support

Dynamic theming based on tenant config:
- colors: tenant.config.brand_colors || defaultColors
- logo: tenant.config.logo_url || defaultLogo
- font: tenant.config.font_family || 'Inter'
- name: tenant.config.brand_name || 'ServiceOps'

### 4.6 Sprints (Phase 4)

Months 4-5: Core Abstraction
- Extract identity service from Keycloak
- Build billing service
- Unify notification platform
- Configuration service
- API gateway updates

Month 6: Launch and Iterate
- Performance optimization
- Load testing (100k bookings/day)
- Security audit (pen testing)
- Documentation
- Handover to operations

---

## Cross-Cutting Concerns

### Security

Authentication and Authorization:
- Keycloak: OAuth2/OIDC, SSO, RBAC
- JWT: Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- MFA: Optional for customers, mandatory for admins
- API Keys: For service-to-service communication

Data Protection:
- Encryption at rest: AES-256 (AWS KMS or HashiCorp Vault)
- Encryption in transit: TLS 1.3
- PII handling: Field-level encryption for sensitive data
- Right to erasure: Soft delete + PII scrubbing
- Audit logs: Immutable, tamper-evident

API Security:
- Rate limiting: 100 RPM per IP, 1000 RPM per authenticated user
- Input validation: Zod schemas on all endpoints
- CORS: Whitelist only known origins
- SQL Injection: Prisma ORM (parameterized queries)
- XSS: Sanitize all user input, Content-Security-Policy headers

### Monitoring and Observability

Metrics (Prometheus):
- Request rate, latency, error rate
- Database connection pool size
- Queue depth (BullMQ)
- Kafka lag

Logging (ELK Stack or CloudWatch):
- Structured JSON logs
- Correlation IDs across services
- Sensitive data redaction

Alerting (PagerDuty or OpsGenie):
- High error rate (> 1% for 5 min)
- High latency (p95 > 500ms for 10 min)
- Payment failures (> 5% for 5 min)
- Database connection issues

### Disaster Recovery

Backup Strategy:
- PostgreSQL: Continuous archiving to S3 (WAL-E or pgBackRest)
- Redis: Daily snapshots to S3
- MinIO: Cross-region replication
- Kafka: MirrorMaker 2 for cross-cluster replication

Recovery Objectives:
- RPO (Recovery Point Objective): < 1 hour
- RTO (Recovery Time Objective): < 4 hours
- Testing: Quarterly DR drills

---

## Appendices

### A. Environment Variables

Database:
- DATABASE_URL=postgresql://user:pass@host:5432/serviceops
- DIRECT_URL=postgresql://user:pass@host:5432/serviceops
- READ_REPLICA_URL=postgresql://user:pass@host:5433/serviceops

Redis:
- REDIS_URL=redis://localhost:6379/0

Keycloak:
- KEYCLOAK_URL=https://auth.serviceops.co.ke
- KEYCLOAK_REALM=serviceops
- KEYCLOAK_CLIENT_ID=serviceops-api
- KEYCLOAK_CLIENT_SECRET=supersecret

M-Pesa:
- MPESA_CONSUMER_KEY=xxx
- MPESA_CONSUMER_SECRET=xxx
- MPESA_SHORTCODE=174379
- MPESA_PASSKEY=xxx
- MPESA_BASE_URL=https://sandbox.safaricom.co.ke

Kafka (or Confluent Cloud):
- KAFKA_BROKERS=kafka:9092
- KAFKA_USERNAME=xxx
- KAFKA_PASSWORD=xxx

MinIO:
- MINIO_ENDPOINT=minio.serviceops.co.ke
- MINIO_ACCESS_KEY=xxx
- MINIO_SECRET_KEY=xxx
- MINIO_BUCKET=serviceops-uploads

Novu:
- NOVU_API_KEY=xxx
- NOVU_API_URL=https://api.novu.co

Africa's Talking (SMS):
- AT_API_KEY=xxx
- AT_USERNAME=serviceops
- AT_SENDER_ID=SVCOPS

### B. Docker Compose (Development)

Services:
- postgres (image: postgres:15, ports: 5432:5432)
- redis (image: redis:7-alpine, ports: 6379:6379)
- keycloak (image: quay.io/keycloak/keycloak:23.0, command: start-dev, ports: 8080:8080)
- minio (image: minio/minio:latest, command: server /data --console-address ":9001', ports: 9000:9000, 9001:9001)
- api (build from ./apps/api, ports: 3001:3001)
- web (build from ./apps/web, ports: 3000:3000)

Volumes:
- postgres_data

### C. Technology Radar

| Technology | Phase | Status |
|------------|-------|--------|
| Next.js | 1 | Adopt |
| React Native | 1 | Adopt |
| Express.js | 1 | Adopt |
| Prisma | 1 | Adopt |
| PostgreSQL 15 | 1 | Adopt |
| Redis | 1 | Adopt |
| Keycloak | 1 | Adopt |
| M-Pesa Daraja 2.0 | 1 | Adopt |
| Novu | 1 | Trial |
| MinIO | 1 | Adopt |
| Apache Kafka | 2 | Trial |
| BullMQ | 2 | Adopt |
| ClickHouse | 3 | Assess |
| Kong | 3 | Trial |
| PostHog | 3 | Trial |
| Terraform | 4 | Adopt |
| Kubernetes (EKS/GKE) | 4 | Adopt |
| Istio | 4 | Assess |

### D. Glossary

| Term | Definition |
|------|-----------|
| RLS | Row-Level Security |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| STK | Simu Toolkit (M-Pesa push prompt) |
| B2C | Business to Consumer (M-Pesa payout) |
| OTP | One-Time Password |
| KYC | Know Your Customer |
| OSRM | Open Source Routing Machine |

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 2026 | Initial release covering all 4 phases |
