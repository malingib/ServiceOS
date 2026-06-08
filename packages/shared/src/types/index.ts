import {
  UserRole,
  UserStatus,
  BookingStatus,
  JobStatus,
  PaymentStatus,
  PaymentMethod,
  KycStatus,
  ServiceCategory,
  ReferralStatus,
  RecurringFrequency,
  NotificationChannel,
  NotificationStatus,
  AuditAction,
  DocumentCategory,
  WorkflowStatus,
  OutboxStatus,
} from './enums';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  settings?: Record<string, unknown>;
  paymentSettings?: Record<string, unknown>;
  commissionRateBps: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface User {
  id: string;
  tenantId: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  verifiedAt?: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  tenantId: string;
  homeAddress?: Record<string, unknown>;
  workAddress?: Record<string, unknown>;
  preferredPaymentMethod?: string;
  loyaltyPoints: number;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  tenantId: string;
  idNumber?: string;
  kycStatus: KycStatus;
  kycData?: Record<string, unknown>;
  skills: string[];
  hourlyRateMinor?: bigint;
  reliabilityScore: number;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  workingHours?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  category: ServiceCategory;
  basePriceMinor: bigint;
  durationMinutes: number;
  requirements: string[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Address {
  id: string;
  userId: string;
  tenantId: string;
  label?: string;
  streetAddress: string;
  apartmentSuite?: string;
  city: string;
  county: string;
  postalCode?: string;
  country: string;
  location?: { lat: number; lng: number };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  addressId: string;
  workerId?: string;
  scheduledDate: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
  timezone: string;
  status: BookingStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationPolicySnapshot?: Record<string, unknown>;
  baseAmountMinor: bigint;
  discountAmountMinor: bigint;
  totalAmountMinor: bigint;
  currency: string;
  isRecurring: boolean;
  recurringRuleId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deletedAt?: Date;
}

export interface Job {
  id: string;
  tenantId: string;
  bookingId: string;
  workerId: string;
  serviceId: string;
  status: JobStatus;
  startedLocation?: { lat: number; lng: number };
  completedLocation?: { lat: number; lng: number };
  acceptedAt?: Date;
  enRouteAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  noShowAt?: Date;
  customerRating?: number;
  customerReview?: string;
  workerRating?: number;
  workerReview?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  bookingId: string;
  customerId: string;
  amountGross: bigint;
  amountFee: bigint;
  amountNet: bigint;
  currency: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  mpesaTransactionDate?: Date;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  paymentId: string;
  userId: string;
  type: string;
  amount: bigint;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Review {
  id: string;
  tenantId: string;
  jobId: string;
  customerId: string;
  workerId: string;
  rating: number;
  review?: string;
  createdAt: Date;
}

export interface Referral {
  id: string;
  tenantId: string;
  referrerId: string;
  referredId: string;
  status: ReferralStatus;
  rewardAmountMinor?: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyPoint {
  id: string;
  tenantId: string;
  userId: string;
  points: number;
  type: string;
  bookingId?: string;
  description?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Document {
  id: string;
  tenantId: string;
  userId: string;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  category: DocumentCategory;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UploadLog {
  id: string;
  tenantId: string;
  documentId?: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  error?: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  action: AuditAction | string;
  fromState?: string;
  toState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Outbox {
  id: string;
  tenantId: string;
  channel: string;
  eventType: string;
  eventKey: string;
  payload: Record<string, unknown>;
  headers: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError?: string;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface RecurringRule {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startDate: Date;
  endDate?: Date;
  nextBookingDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  trigger: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rule {
  id: string;
  tenantId: string;
  workflowId: string;
  name: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  tenantId: string;
  workflowId: string;
  ruleId?: string;
  trigger: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: WorkflowStatus;
  error?: string;
  executedAt?: Date;
  createdAt: Date;
}

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationLog {
  id: string;
  tenantId: string;
  userId?: string;
  templateId?: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  status: NotificationStatus;
  externalId?: string;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface Prompt {
  id: string;
  tenantId?: string;
  name: string;
  template: string;
  variables: string[];
  provider: string;
  model: string;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiUsage {
  id: string;
  tenantId: string;
  userId?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsdMicros?: bigint;
  endpoint?: string;
  durationMs?: number;
  createdAt: Date;
}
