import type { Address, ISODateTime, Money, UUID } from "./shared";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "DECLINED"
  | "NO_SHOW"
  | "STALLED"
  | "DISPUTED"
  | "RESCHEDULED";

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
  basePrice: Money;
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
