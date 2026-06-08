import type { ISODateTime, Money, UUID } from "./shared";

export type PaymentMethod = "MPESA_STK" | "MPESA_B2C" | "CASH" | "BANK_TRANSFER" | "CARD";
export type PaymentStatus =
  | "INITIATED"
  | "SUCCESS"
  | "FAILED"
  | "UNKNOWN"
  | "RECONCILED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "REFUND_FAILED";

export interface PaymentRecord {
  paymentId: UUID;
  tenantId: UUID;
  bookingId?: UUID;
  customerId: UUID;
  status: PaymentStatus;
  method: PaymentMethod;
  amountGross: Money;
  amountFee?: Money;
  amountNet?: Money;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  externalReference?: string;
  idempotencyKey?: string;
  callbackReceivedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface MpesaStkPushRequest {
  tenantId: UUID;
  bookingId?: UUID;
  customerId: UUID;
  phone: string;
  amount: Money;
  accountReference: string;
  transactionDesc?: string;
  idempotencyKey?: string;
  callbackUrl?: string;
}

export interface MpesaStkPushResponse {
  paymentId: UUID;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  status: PaymentStatus;
}

export interface MpesaCallbackPayload {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  callbackMetadata: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
  receivedAt: ISODateTime;
}

export interface MpesaB2CRequest {
  tenantId: UUID;
  recipientPhone: string;
  amount: Money;
  reference: string;
  remarks?: string;
  idempotencyKey?: string;
}

export interface PaymentStatusQuery {
  tenantId?: UUID;
  paymentId: UUID;
}
