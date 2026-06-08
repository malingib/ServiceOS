import { v4 as uuidv4 } from 'uuid';

export interface MockUser {
  id: string;
  tenantId: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  verifiedAt: Date | null;
  lastLoginAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    phone: '+254700100200',
    email: 'test@serviceops.local',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: null,
    avatarUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    verifiedAt: new Date(),
    lastLoginAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export interface MockTenant {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  settings: Record<string, unknown> | null;
  paymentSettings: Record<string, unknown> | null;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function createMockTenant(overrides?: Partial<MockTenant>): MockTenant {
  return {
    id: uuidv4(),
    name: 'Test Tenant',
    slug: `test-${uuidv4().slice(0, 8)}`,
    country: 'KE',
    currency: 'KES',
    settings: null,
    paymentSettings: null,
    commissionRate: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export interface MockBooking {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  addressId: string;
  workerId: string | null;
  scheduledDate: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
  timezone: string;
  status: string;
  cancellationReason: string | null;
  cancelledBy: string | null;
  cancelledAt: Date | null;
  cancellationPolicySnapshot: Record<string, unknown> | null;
  baseAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  isRecurring: boolean;
  recurringRuleId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export function createMockBooking(overrides?: Partial<MockBooking>): MockBooking {
  const baseDate = new Date('2025-06-10');
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    customerId: uuidv4(),
    serviceId: uuidv4(),
    addressId: uuidv4(),
    workerId: null,
    scheduledDate: baseDate,
    scheduledStart: new Date(baseDate.setHours(10, 0, 0, 0)),
    scheduledEnd: new Date(baseDate.setHours(12, 0, 0, 0)),
    timezone: 'Africa/Nairobi',
    status: 'PENDING',
    cancellationReason: null,
    cancelledBy: null,
    cancelledAt: null,
    cancellationPolicySnapshot: null,
    baseAmount: 2500,
    discountAmount: 0,
    totalAmount: 2500,
    currency: 'KES',
    isRecurring: false,
    recurringRuleId: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

export interface MockPayment {
  id: string;
  tenantId: string;
  bookingId: string;
  customerId: string;
  amountGross: bigint;
  amountFee: bigint;
  amountNet: bigint;
  currency: string;
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  mpesaReceiptNumber: string | null;
  mpesaTransactionDate: Date | null;
  status: string;
  paymentMethod: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockPayment(overrides?: Partial<MockPayment>): MockPayment {
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    bookingId: uuidv4(),
    customerId: uuidv4(),
    amountGross: BigInt(250000),
    amountFee: BigInt(0),
    amountNet: BigInt(250000),
    currency: 'KES',
    merchantRequestId: null,
    checkoutRequestId: null,
    mpesaReceiptNumber: null,
    mpesaTransactionDate: null,
    status: 'PENDING',
    paymentMethod: 'MPESA_STK',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface MockJob {
  id: string;
  tenantId: string;
  bookingId: string;
  workerId: string;
  serviceId: string;
  status: string;
  startedLocation: Record<string, unknown> | null;
  completedLocation: Record<string, unknown> | null;
  acceptedAt: Date | null;
  enRouteAt: Date | null;
  arrivedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  noShowAt: Date | null;
  customerRating: number | null;
  customerReview: string | null;
  workerRating: number | null;
  workerReview: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockJob(overrides?: Partial<MockJob>): MockJob {
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    bookingId: uuidv4(),
    workerId: uuidv4(),
    serviceId: uuidv4(),
    status: 'ASSIGNED',
    startedLocation: null,
    completedLocation: null,
    acceptedAt: null,
    enRouteAt: null,
    arrivedAt: null,
    startedAt: null,
    completedAt: null,
    noShowAt: null,
    customerRating: null,
    customerReview: null,
    workerRating: null,
    workerReview: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface MockWorkerProfile {
  id: string;
  userId: string;
  tenantId: string;
  idNumber: string | null;
  kycStatus: string;
  kycData: Record<string, unknown> | null;
  skills: string[];
  hourlyRate: number | null;
  reliabilityScore: number;
  isAvailable: boolean;
  currentLocation: { lat: number; lng: number } | null;
  workingHours: Record<string, unknown> | null;
  documents: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockWorkerProfile(overrides?: Partial<MockWorkerProfile>): MockWorkerProfile {
  return {
    id: uuidv4(),
    userId: uuidv4(),
    tenantId: uuidv4(),
    idNumber: null,
    kycStatus: 'VERIFIED',
    kycData: null,
    skills: ['cleaning', 'laundry'],
    hourlyRate: 500,
    reliabilityScore: 4.5,
    isAvailable: true,
    currentLocation: { lat: -1.2921, lng: 36.8219 },
    workingHours: null,
    documents: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface MockService {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  basePrice: number;
  durationMinutes: number;
  requirements: string[];
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function createMockService(overrides?: Partial<MockService>): MockService {
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    name: 'Standard Cleaning',
    slug: 'standard-cleaning',
    description: 'Professional home cleaning service',
    category: 'CLEANING',
    basePrice: 2500,
    durationMinutes: 120,
    requirements: ['cleaning supplies'],
    isActive: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export interface MockCustomerProfile {
  id: string;
  userId: string;
  tenantId: string;
  homeAddress: Record<string, unknown> | null;
  workAddress: Record<string, unknown> | null;
  preferredPaymentMethod: string | null;
  loyaltyPoints: number;
  referralCode: string | null;
  referredBy: string | null;
  referralCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockCustomerProfile(overrides?: Partial<MockCustomerProfile>): MockCustomerProfile {
  return {
    id: uuidv4(),
    userId: uuidv4(),
    tenantId: uuidv4(),
    homeAddress: null,
    workAddress: null,
    preferredPaymentMethod: 'MPESA_STK',
    loyaltyPoints: 0,
    referralCode: `CUST${Math.floor(1000 + Math.random() * 9000)}`,
    referredBy: null,
    referralCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockStkPushResponse() {
  return {
    MerchantRequestID: uuidv4(),
    CheckoutRequestID: uuidv4(),
    ResponseCode: '0',
    ResponseDescription: 'Success. Request accepted for processing',
    CustomerMessage: 'Success. Request accepted for processing',
  };
}

export function createMockMpesaCallback(success = true) {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: uuidv4(),
        CheckoutRequestID: uuidv4(),
        ResultCode: success ? 0 : 1032,
        ResultDesc: success ? 'The service request is processed successfully.' : 'Request cancelled by user',
        CallbackMetadata: success
          ? {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'NLJ7HGS5P7' },
                { Name: 'TransactionDate', Value: '20250610120000' },
                { Name: 'PhoneNumber', Value: '254700100200' },
                { Name: 'Amount', Value: 2500 },
              ],
            }
          : undefined,
      },
    },
  };
}
