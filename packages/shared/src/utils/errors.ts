export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 402, 'PAYMENT_ERROR', true, details);
  }
}

export class MpesaError extends AppError {
  public readonly resultCode?: number;

  constructor(message: string, resultCode?: number, details?: Record<string, unknown>) {
    super(message, 502, 'MPESA_ERROR', true, details);
    this.resultCode = resultCode;
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, details);
    this.service = service;
  }
}

export class BookingConflictError extends AppError {
  constructor(workerId: string, date: string) {
    super(
      `Worker ${workerId} is not available for the requested time slot on ${date}`,
      409,
      'BOOKING_CONFLICT',
      true,
      { workerId, date },
    );
  }
}

export class IdempotencyError extends AppError {
  constructor(message = 'Duplicate request detected') {
    super(message, 409, 'IDEMPOTENCY_ERROR');
  }
}
