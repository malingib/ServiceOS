export interface BaseEvent {
  specversion: '1.0';
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype: 'application/json';
  data: Record<string, unknown>;
}

export interface IdentityUserRegisteredEvent extends BaseEvent {
  type: 'identity.user.registered';
  data: {
    tenantId: string;
    userId: string;
    phone: string;
    role: string;
  };
}

export interface IdentityUserVerifiedEvent extends BaseEvent {
  type: 'identity.user.verified';
  data: {
    tenantId: string;
    userId: string;
    phone: string;
  };
}

export interface IdentityUserLoggedInEvent extends BaseEvent {
  type: 'identity.user.logged_in';
  data: {
    tenantId: string;
    userId: string;
    phone: string;
  };
}

export interface IdentityUserLoggedOutEvent extends BaseEvent {
  type: 'identity.user.logged_out';
  data: {
    tenantId: string;
    userId: string;
  };
}

export interface BookingCreatedEvent extends BaseEvent {
  type: 'booking.created';
  data: {
    tenantId: string;
    bookingId: string;
    customerId: string;
    serviceId: string;
    scheduledDate: string;
    totalAmountMinor: string;
    currency: string;
  };
}

export interface BookingConfirmedEvent extends BaseEvent {
  type: 'booking.confirmed';
  data: {
    tenantId: string;
    bookingId: string;
    customerId: string;
    serviceId: string;
    workerId?: string;
  };
}

export interface BookingAssignedEvent extends BaseEvent {
  type: 'booking.assigned';
  data: {
    tenantId: string;
    bookingId: string;
    customerId: string;
    workerId: string;
    serviceId: string;
  };
}

export interface BookingCancelledEvent extends BaseEvent {
  type: 'booking.cancelled';
  data: {
    tenantId: string;
    bookingId: string;
    customerId: string;
    reason?: string;
    cancelledBy: string;
  };
}

export interface BookingRescheduledEvent extends BaseEvent {
  type: 'booking.rescheduled';
  data: {
    tenantId: string;
    bookingId: string;
    oldDate: string;
    newDate: string;
  };
}

export interface PaymentInitiatedEvent extends BaseEvent {
  type: 'payment.initiated';
  data: {
    tenantId: string;
    paymentId: string;
    bookingId: string;
    customerId: string;
    amountMinor: string;
    currency: string;
    checkoutRequestId: string;
  };
}

export interface PaymentCompletedEvent extends BaseEvent {
  type: 'payment.completed';
  data: {
    tenantId: string;
    paymentId: string;
    bookingId: string;
    customerId: string;
    amountMinor: string;
    currency: string;
    mpesaReceiptNumber: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  type: 'payment.failed';
  data: {
    tenantId: string;
    paymentId: string;
    bookingId: string;
    customerId: string;
    reason: string;
    resultCode?: number;
  };
}

export interface PaymentRefundedEvent extends BaseEvent {
  type: 'payment.refunded';
  data: {
    tenantId: string;
    paymentId: string;
    bookingId: string;
    amountMinor: string;
    currency: string;
  };
}

export interface DispatchWorkerAssignedEvent extends BaseEvent {
  type: 'dispatch.worker.assigned';
  data: {
    tenantId: string;
    jobId: string;
    bookingId: string;
    workerId: string;
  };
}

export interface DispatchWorkerAcceptedEvent extends BaseEvent {
  type: 'dispatch.worker.accepted';
  data: {
    tenantId: string;
    jobId: string;
    bookingId: string;
    workerId: string;
  };
}

export interface DispatchWorkerDeclinedEvent extends BaseEvent {
  type: 'dispatch.worker.declined';
  data: {
    tenantId: string;
    jobId: string;
    bookingId: string;
    workerId: string;
  };
}

export interface DispatchWorkerNoShowEvent extends BaseEvent {
  type: 'dispatch.worker.no_show';
  data: {
    tenantId: string;
    jobId: string;
    bookingId: string;
    workerId: string;
  };
}

export interface DispatchJobCompletedEvent extends BaseEvent {
  type: 'dispatch.job.completed';
  data: {
    tenantId: string;
    jobId: string;
    bookingId: string;
    workerId: string;
    rating?: number;
  };
}

export interface CrmCustomerCreatedEvent extends BaseEvent {
  type: 'crm.customer.created';
  data: {
    tenantId: string;
    userId: string;
    customerProfileId: string;
  };
}

export interface CrmWorkerVerifiedEvent extends BaseEvent {
  type: 'crm.worker.verified';
  data: {
    tenantId: string;
    userId: string;
    workerProfileId: string;
  };
}

export interface CrmServiceUpdatedEvent extends BaseEvent {
  type: 'crm.service.updated';
  data: {
    tenantId: string;
    serviceId: string;
  };
}

export interface MessagingMessageDeliveredEvent extends BaseEvent {
  type: 'messaging.message.delivered';
  data: {
    tenantId: string;
    notificationLogId: string;
    channel: string;
    recipient: string;
  };
}

export interface MessagingMessageFailedEvent extends BaseEvent {
  type: 'messaging.message.failed';
  data: {
    tenantId: string;
    notificationLogId: string;
    channel: string;
    recipient: string;
    error: string;
  };
}

export interface RewardReferralEarnedEvent extends BaseEvent {
  type: 'reward.referral_earned';
  data: {
    tenantId: string;
    referralId: string;
    referrerId: string;
    referredId: string;
    amountMinor: string;
  };
}

export interface RewardPointsEarnedEvent extends BaseEvent {
  type: 'reward.points_earned';
  data: {
    tenantId: string;
    userId: string;
    points: number;
    bookingId: string;
  };
}

export interface RewardRedeemedEvent extends BaseEvent {
  type: 'reward.redeemed';
  data: {
    tenantId: string;
    userId: string;
    pointsAmount: number;
    bookingId?: string;
  };
}

export interface AiRequestProcessedEvent extends BaseEvent {
  type: 'ai.request.processed';
  data: {
    tenantId: string;
    userId?: string;
    endpoint: string;
    provider: string;
    model: string;
    tokens: number;
  };
}

export interface WorkflowExecutedEvent extends BaseEvent {
  type: 'workflow.executed';
  data: {
    tenantId: string;
    workflowId: string;
    executionId: string;
    trigger: string;
    status: string;
  };
}

export type DomainEvent =
  | IdentityUserRegisteredEvent
  | IdentityUserVerifiedEvent
  | IdentityUserLoggedInEvent
  | IdentityUserLoggedOutEvent
  | BookingCreatedEvent
  | BookingConfirmedEvent
  | BookingAssignedEvent
  | BookingCancelledEvent
  | BookingRescheduledEvent
  | PaymentInitiatedEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | PaymentRefundedEvent
  | DispatchWorkerAssignedEvent
  | DispatchWorkerAcceptedEvent
  | DispatchWorkerDeclinedEvent
  | DispatchWorkerNoShowEvent
  | DispatchJobCompletedEvent
  | CrmCustomerCreatedEvent
  | CrmWorkerVerifiedEvent
  | CrmServiceUpdatedEvent
  | MessagingMessageDeliveredEvent
  | MessagingMessageFailedEvent
  | RewardReferralEarnedEvent
  | RewardPointsEarnedEvent
  | RewardRedeemedEvent
  | AiRequestProcessedEvent
  | WorkflowExecutedEvent;

export function createEvent(
  type: string,
  source: string,
  data: Record<string, unknown>,
): BaseEvent {
  return {
    specversion: '1.0',
    type,
    source,
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    data,
  };
}
