import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format').optional();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const registerSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['CUSTOMER', 'WORKER']),
  otp: z.string().length(6),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
});

export const otpRequestSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createBookingSchema = z.object({
  serviceId: uuidSchema,
  addressId: uuidSchema,
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  scheduledStart: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  notes: z.string().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const rescheduleBookingSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newStart: z.string().regex(/^\d{2}:\d{2}$/),
});

export const availabilityQuerySchema = z.object({
  serviceId: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workerId: uuidSchema.optional(),
});

export const stkPushSchema = z.object({
  bookingId: uuidSchema,
  phoneNumber: phoneSchema,
  amountMinor: z.coerce.bigint().positive(),
});

export const b2cSchema = z.object({
  destinationPhone: phoneSchema,
  amountMinor: z.coerce.bigint().positive(),
  occasion: z.string().max(100).optional(),
});

export const createCustomerSchema = z.object({
  homeAddress: z.record(z.unknown()).optional(),
  workAddress: z.record(z.unknown()).optional(),
  preferredPaymentMethod: z.string().max(50).optional(),
  referralCode: z.string().max(20).optional(),
});

export const updateCustomerSchema = z.object({
  homeAddress: z.record(z.unknown()).optional(),
  workAddress: z.record(z.unknown()).optional(),
  preferredPaymentMethod: z.string().max(50).optional(),
});

export const createWorkerSchema = z.object({
  idNumber: z.string().max(50).optional(),
  skills: z.array(z.string()).optional(),
  hourlyRateMinor: z.coerce.bigint().positive().optional(),
  workingHours: z.record(z.unknown()).optional(),
});

export const updateWorkerSchema = z.object({
  skills: z.array(z.string()).optional(),
  hourlyRateMinor: z.coerce.bigint().positive().optional(),
  isAvailable: z.boolean().optional(),
  workingHours: z.record(z.unknown()).optional(),
  currentLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const submitKycSchema = z.object({
  idNumber: z.string().min(1).max(50),
  documentUrls: z.array(z.string().url()).min(1),
});

export const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'CLEANING',
    'LAUNDRY',
    'CAREGIVER',
    'PEST_CONTROL',
    'SECURITY',
    'MAINTENANCE',
    'PLUMBING',
    'ELECTRICAL',
  ]),
  basePriceMinor: z.coerce.bigint().positive(),
  durationMinutes: z.number().int().positive(),
  requirements: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  basePriceMinor: z.coerce.bigint().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
  requirements: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  streetAddress: z.string().min(1),
  apartmentSuite: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  county: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default('Kenya'),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  streetAddress: z.string().min(1).optional(),
  apartmentSuite: z.string().max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  county: z.string().min(1).max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  isDefault: z.boolean().optional(),
});

export const assignWorkerSchema = z.object({
  bookingId: uuidSchema,
  workerId: uuidSchema,
});

export const autoAssignSchema = z.object({
  bookingId: uuidSchema,
});

export const updateJobStateSchema = z.object({
  state: z.enum([
    'ACCEPTED',
    'DECLINED',
    'EN_ROUTE',
    'IN_PROGRESS',
    'COMPLETED',
    'NO_SHOW',
  ]),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const workerHeartbeatSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

export const sendNotificationSchema = z.object({
  userId: uuidSchema,
  template: z.string().optional(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'PUSH']),
  subject: z.string().max(255).optional(),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  trigger: z.string().min(1).max(255),
  rules: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        conditions: z.record(z.unknown()),
        actions: z.record(z.unknown()),
        priority: z.number().int().optional(),
      }),
    )
    .optional(),
});

export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  country: z.string().length(2).default('KE'),
  currency: z.string().length(3).default('KES'),
  commissionRateBps: z.number().int().min(0).max(10000).default(1000),
  settings: z.record(z.unknown()).optional(),
  paymentSettings: z.record(z.unknown()).optional(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!formattedErrors[path]) formattedErrors[path] = [];
      formattedErrors[path].push(err.message);
    });
    throw new Error(JSON.stringify(formattedErrors));
  }
  return result.data;
}
