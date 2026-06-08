import { Request } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    phone: string;
    role: string;
    email?: string;
  };
}

export interface RegisterRequest {
  phone: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'WORKER';
  otp: string;
}

export interface LoginRequest {
  phone: string;
  otp: string;
}

export interface OtpRequest {
  phone: string;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CreateBookingRequest {
  serviceId: string;
  addressId: string;
  scheduledDate: string;
  scheduledStart: string;
  notes?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface RescheduleBookingRequest {
  newDate: string;
  newStart: string;
}

export interface AvailabilityQuery {
  serviceId: string;
  date: string;
  workerId?: string;
}

export interface StkPushRequest {
  bookingId: string;
  phoneNumber: string;
  amount: number;
}

export interface B2CRequest {
  destinationPhone: string;
  amount: number;
  occasion?: string;
}

export interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: unknown }>;
      };
    };
  };
}

export interface MpesaB2CCallbackPayload {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    TransactionAmount: number;
    TransactionReceipt: string;
    B2CUtilityAccountBalance: number;
    B2CRecipientIsRegisteredCustomer: string;
    B2CChargesPaidByBeneficiary: number;
    B2CReceiverPartyRegisteredName: string;
    B2CDateTime: string;
  };
}

export interface CreateCustomerRequest {
  userId?: string;
  homeAddress?: Record<string, unknown>;
  workAddress?: Record<string, unknown>;
  preferredPaymentMethod?: string;
  referralCode?: string;
}

export interface UpdateCustomerRequest {
  homeAddress?: Record<string, unknown>;
  workAddress?: Record<string, unknown>;
  preferredPaymentMethod?: string;
}

export interface CreateWorkerRequest {
  userId?: string;
  idNumber?: string;
  skills?: string[];
  hourlyRate?: number;
  workingHours?: Record<string, unknown>;
}

export interface UpdateWorkerRequest {
  skills?: string[];
  hourlyRate?: number;
  isAvailable?: boolean;
  workingHours?: Record<string, unknown>;
  currentLocation?: { lat: number; lng: number };
}

export interface SubmitKycRequest {
  idNumber: string;
  documentUrls: string[];
}

export interface CreateServiceRequest {
  name: string;
  slug?: string;
  description?: string;
  category: string;
  basePrice: number;
  durationMinutes: number;
  requirements?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  durationMinutes?: number;
  requirements?: string[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateAddressRequest {
  label?: string;
  streetAddress: string;
  apartmentSuite?: string;
  city: string;
  county: string;
  postalCode?: string;
  country?: string;
  location?: { lat: number; lng: number };
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  streetAddress?: string;
  apartmentSuite?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  country?: string;
  location?: { lat: number; lng: number };
  isDefault?: boolean;
}

export interface AssignWorkerRequest {
  bookingId: string;
  workerId: string;
}

export interface AutoAssignRequest {
  bookingId: string;
}

export interface UpdateJobStateRequest {
  state: string;
  location?: { lat: number; lng: number };
}

export interface WorkerHeartbeatRequest {
  location: { lat: number; lng: number };
}

export interface SendNotificationRequest {
  userId: string;
  template?: string;
  channel: string;
  subject?: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  trigger: string;
  rules?: CreateRuleRequest[];
}

export interface CreateRuleRequest {
  name: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority?: number;
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeWorkers: number;
  pendingBookings: number;
  completedToday: number;
  cancelledToday: number;
}

export interface ListQueryParams extends PaginationQuery {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
