# Graph Report - ServiceOS  (2026-06-08)

## Corpus Check
- 217 files · ~102,974 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 760 nodes · 708 edges · 48 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `NovuClient` - 17 edges
2. `getRedis()` - 15 edges
3. `RedisMock` - 13 edges
4. `KeycloakService` - 12 edges
5. `BookingController` - 10 edges
6. `BookingService` - 10 edges
7. `MpesaClient` - 10 edges
8. `PaymentService` - 9 edges
9. `AuthController` - 9 edges
10. `AuthService` - 9 edges

## Surprising Connections (you probably didn't know these)
- `stopOutboxPoller()` --calls--> `disconnectProducer()`  [INFERRED]
  apps/event-ingestion-service/src/services/outbox-poller.ts → packages/kafka/src/index.ts
- `globalSetup()` --calls--> `cleanDatabase()`  [INFERRED]
  tests/integration/global-setup.ts → packages/testing/src/prisma-test-client.ts
- `pollOutbox()` --calls--> `publishEvent()`  [INFERRED]
  apps/event-ingestion-service/src/services/outbox-poller.ts → apps/event-ingestion-service/src/services/kafka-publisher.ts
- `processFailedEvents()` --calls--> `publishEvent()`  [INFERRED]
  apps/event-ingestion-service/src/services/dlq-handler.ts → apps/event-ingestion-service/src/services/kafka-publisher.ts
- `createTestAuthTokens()` --calls--> `generateTokens()`  [INFERRED]
  packages/testing/src/helpers.ts → packages/shared/src/middleware/auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (15): pollOutbox(), sleep(), startOutboxPoller(), stopOutboxPoller(), ConsumerGroup, disconnectProducer(), DQLHandler, getBrokers() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (12): acquireLock(), delCache(), DistributedLock, getCache(), getRedis(), getRedisOptions(), getRedisUrl(), invalidatePattern() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (6): expectPaginatedResult(), expectSuccess(), makeRequest(), buildHeaders(), NovuClient, NovuError

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (12): AppError, AuthenticationError, BookingConflictError, ConflictError, ExternalServiceError, ForbiddenError, IdempotencyError, MpesaError (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (5): generateTokens(), verifyRefreshToken(), AuthService, createTestAuthTokens(), createTestHeaders()

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (5): formatPhone(), getBaseUrl(), IdempotencyHelper, MpesaClient, MpesaError

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (13): ApiError, createApiClient(), del(), get(), getClient(), getPresignedUploadUrl(), handleError(), patch() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (4): AvailabilityService, BookingService, idempotencyCacheKey(), jsonSafe()

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (2): AuditWriter, PrismaAuditAdapter

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (1): RedisMock

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (2): EventEmitter, requestLogging()

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (4): idempotencyCacheKey(), jsonSafe(), PaymentService, readMpesaAmountMinor()

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (1): KeycloakService

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (1): BookingController

### Community 16 - "Community 16"
Cohesion: 0.2
Nodes (1): AuthController

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (1): WorkflowService

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): ConfigValidationError, getConfig(), getCorsOrigins(), isDevelopment(), isProduction(), loadConfig()

### Community 19 - "Community 19"
Cohesion: 0.36
Nodes (8): createClient(), getDatabaseUrl(), getDb(), getReplicaDb(), getReplicaUrl(), getTenantScopedDb(), healthCheck(), withTransaction()

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (6): processFailedEvents(), sleep(), startDlqHandler(), getProducer(), publishBatch(), publishEvent()

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (1): PaymentController

### Community 22 - "Community 22"
Cohesion: 0.42
Nodes (1): MpesaService

### Community 23 - "Community 23"
Cohesion: 0.28
Nodes (1): MessagingService

### Community 25 - "Community 25"
Cohesion: 0.32
Nodes (1): DocumentsService

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (1): WorkerController

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (1): ServiceController

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (1): ServiceService

### Community 29 - "Community 29"
Cohesion: 0.32
Nodes (1): WorkerService

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (1): MessagingController

### Community 31 - "Community 31"
Cohesion: 0.46
Nodes (1): AiService

### Community 32 - "Community 32"
Cohesion: 0.32
Nodes (2): calculateDistance(), DispatchService

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (1): RewardsService

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (1): DocumentsController

### Community 35 - "Community 35"
Cohesion: 0.38
Nodes (1): AnalyticsService

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (1): WorkflowController

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (1): CustomerController

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (1): CustomerService

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (1): RewardsController

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (1): OtpService

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (1): AnalyticsController

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (1): AiController

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (1): HeartbeatService

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (1): NotificationService

### Community 47 - "Community 47"
Cohesion: 0.4
Nodes (2): globalSetup(), cleanDatabase()

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (1): SmsService

### Community 49 - "Community 49"
Cohesion: 0.5
Nodes (1): WhatsAppService

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): RootLayout()

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (1): ReconciliationService

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): EmailService

## Knowledge Gaps
- **Thin community `Community 8`** (16 nodes): `index.ts`, `AuditWriter`, `.constructor()`, `.destroy()`, `.flush()`, `.toRecord()`, `.write()`, `.writeMany()`, `createBookingAuditEntry()`, `createJobAuditEntry()`, `createPaymentAuditEntry()`, `createUserAuditEntry()`, `PrismaAuditAdapter`, `.constructor()`, `.create()`, `.createMany()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (15 nodes): `redis-mock.ts`, `createRedisMock()`, `RedisMock`, `.del()`, `.exists()`, `.expire()`, `.flushall()`, `.get()`, `.getStore()`, `.keys()`, `.multi()`, `.quit()`, `.set()`, `.setex()`, `.ttl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (14 nodes): `index.ts`, `clearTenantContext()`, `ensureAuth()`, `errorTracking()`, `EventEmitter`, `.emit()`, `.off()`, `.on()`, `.once()`, `.removeAllListeners()`, `getCurrentTenantId()`, `getTenantContext()`, `requestLogging()`, `setTenantContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (13 nodes): `keycloak.service.ts`, `KeycloakService`, `.adminRequest()`, `.assignRole()`, `.blacklistToken()`, `.createUser()`, `.deleteUser()`, `.getAdminToken()`, `.getClientToken()`, `.getUser()`, `.getUserByUsername()`, `.isTokenBlacklisted()`, `.updateUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (11 nodes): `booking.controller.ts`, `BookingController`, `.assignWorker()`, `.availability()`, `.cancel()`, `.complete()`, `.confirm()`, `.create()`, `.getById()`, `.list()`, `.reschedule()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (10 nodes): `auth.controller.ts`, `AuthController`, `.login()`, `.logout()`, `.me()`, `.refresh()`, `.register()`, `.requestOtp()`, `.tenants()`, `.verifyOtp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (10 nodes): `workflow.service.ts`, `WorkflowService`, `.create()`, `.evaluateConditions()`, `.execute()`, `.executeActions()`, `.getById()`, `.getNestedValue()`, `.list()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (9 nodes): `payment.controller.ts`, `PaymentController`, `.b2c()`, `.b2cCallback()`, `.getById()`, `.getStatus()`, `.reconcile()`, `.stkCallback()`, `.stkPush()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (9 nodes): `mpesa.service.ts`, `MpesaService`, `.generatePassword()`, `.getAccessToken()`, `.getTimestamp()`, `.initiateB2C()`, `.initiateStkPush()`, `.parseCallbackMetadata()`, `.queryTransactionStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (9 nodes): `messaging.service.ts`, `MessagingService`, `.bulk()`, `.createTemplate()`, `.getStatus()`, `.listTemplates()`, `.renderTemplate()`, `.send()`, `.updateTemplate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (8 nodes): `documents.service.ts`, `DocumentsService`, `.confirmUpload()`, `.deleteDocument()`, `.generatePresignedUrl()`, `.generateUploadUrl()`, `.getDownloadUrl()`, `.listDocuments()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (8 nodes): `worker.controller.ts`, `WorkerController`, `.create()`, `.getById()`, `.list()`, `.submitKyc()`, `.update()`, `.updateLocation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (8 nodes): `service.controller.ts`, `ServiceController`, `.create()`, `.delete()`, `.getById()`, `.getBySlug()`, `.list()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (8 nodes): `service.service.ts`, `ServiceService`, `.create()`, `.delete()`, `.getById()`, `.getBySlug()`, `.list()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (8 nodes): `worker.service.ts`, `WorkerService`, `.create()`, `.getById()`, `.list()`, `.submitKyc()`, `.update()`, `.updateLocation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (8 nodes): `messaging.controller.ts`, `MessagingController`, `.bulk()`, `.createTemplate()`, `.getStatus()`, `.listTemplates()`, `.send()`, `.updateTemplate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (8 nodes): `ai.service.ts`, `AiService`, `.callAiProvider()`, `.chat()`, `.classify()`, `.getUsage()`, `.logUsage()`, `.summarize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (8 nodes): `dispatch.service.ts`, `calculateDistance()`, `DispatchService`, `.assignManual()`, `.autoAssign()`, `.getWorkerJobs()`, `.listJobs()`, `.updateJobState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (7 nodes): `rewards.service.ts`, `RewardsService`, `.createReferral()`, `.earnPoints()`, `.getPoints()`, `.listPromotions()`, `.redeemPoints()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (7 nodes): `documents.controller.ts`, `DocumentsController`, `.confirmUpload()`, `.deleteDocument()`, `.getDownloadUrl()`, `.getUploadUrl()`, `.listDocuments()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (7 nodes): `analytics.service.ts`, `AnalyticsService`, `.getBookings()`, `.getDashboard()`, `.getRevenue()`, `.getWorkers()`, `.groupByTime()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (7 nodes): `workflow.controller.ts`, `WorkflowController`, `.create()`, `.execute()`, `.getById()`, `.list()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (7 nodes): `customer.controller.ts`, `CustomerController`, `.create()`, `.delete()`, `.getById()`, `.list()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (7 nodes): `customer.service.ts`, `CustomerService`, `.create()`, `.delete()`, `.getById()`, `.list()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (6 nodes): `rewards.controller.ts`, `RewardsController`, `.createReferral()`, `.getPoints()`, `.listPromotions()`, `.redeemPoints()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (6 nodes): `otp.service.ts`, `OtpService`, `.exists()`, `.generate()`, `.invalidate()`, `.verify()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (6 nodes): `analytics.controller.ts`, `AnalyticsController`, `.getBookings()`, `.getDashboard()`, `.getRevenue()`, `.getWorkers()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (6 nodes): `ai.controller.ts`, `AiController`, `.chat()`, `.classify()`, `.getUsage()`, `.summarize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (6 nodes): `heartbeat.service.ts`, `HeartbeatService`, `.checkStaleWorkers()`, `.getOnlineWorkers()`, `.getWorkerStatus()`, `.recordHeartbeat()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (5 nodes): `notification.service.ts`, `NotificationService`, `.getStatus()`, `.listByUser()`, `.send()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (5 nodes): `globalSetup()`, `prisma-test-client.ts`, `cleanDatabase()`, `createTestTenant()`, `global-setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `sms.service.ts`, `SmsService`, `.send()`, `.sendBulk()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `whatsapp.service.ts`, `WhatsAppService`, `.sendMessage()`, `.sendText()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `RootLayout()`, `layout.tsx`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `reconciliation.service.ts`, `ReconciliationService`, `.runNightlyReconciliation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (3 nodes): `email.service.ts`, `EmailService`, `.send()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getBaseUrl()` connect `Community 5` to `Community 2`, `Community 6`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._