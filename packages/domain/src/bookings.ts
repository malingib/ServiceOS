import type { Address, ISODateTime, Money, UUID } from "./shared";

export type BookingStatus =
  | "DRAFT"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REVIEWED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUND_FAILED"
  | "STALLED"
  | "DISPUTED"
  | "RESOLVED";

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface RecurringRuleInput {
  frequency: RecurrenceFrequency;
  interval: number;
  until?: ISODateTime;
  byWeekday?: number[];
}

export interface BookingSnapshot {
  serviceId: UUID;
  serviceName: string;
  serviceCategory: string;
  durationMinutes: number;
  basePriceMinor: Money;
}

export interface BookingCustomerSnapshot {
  customerId: UUID;
  fullName: string;
  phone: string;
  email?: string;
}

export interface BookingWindow {
  scheduledStart: ISODateTime;
  scheduledEnd: ISODateTime;
  timezone: string;
}

export interface CreateBookingRequest {
  tenantId: UUID;
  customerId: UUID;
  serviceId: UUID;
  scheduledStart: ISODateTime;
  scheduledEnd?: ISODateTime;
  address: Address;
  notes?: string;
  preferredWorkerId?: UUID;
  paymentMethod?: "MPESA_STK" | "CASH" | "BANK_TRANSFER";
  recurringRule?: RecurringRuleInput;
}

export interface RescheduleBookingRequest {
  scheduledStart: ISODateTime;
  scheduledEnd?: ISODateTime;
  reason?: string;
}

export interface CancelBookingRequest {
  reason: string;
  cancelledBy: "CUSTOMER" | "ADMIN" | "SYSTEM";
}

export interface BookingRecord {
  bookingId: UUID;
  tenantId: UUID;
  customerId: UUID;
  serviceId: UUID;
  status: BookingStatus;
  scheduledStart: ISODateTime;
  scheduledEnd: ISODateTime;
  address: Address;
  bookingSnapshot: BookingSnapshot;
  customerSnapshot: BookingCustomerSnapshot;
  cancellationPolicySnapshot?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface BookingAvailabilityQuery {
  tenantId: UUID;
  serviceId: UUID;
  date: string;
  workerId?: UUID;
}

export interface BookingAvailabilitySlot {
  start: ISODateTime;
  end: ISODateTime;
  available: boolean;
  reason?: string;
}

export interface BookingListFilter {
  tenantId?: UUID;
  customerId?: UUID;
  workerId?: UUID;
  serviceId?: UUID;
  status?: BookingStatus[];
  from?: ISODateTime;
  to?: ISODateTime;
}
