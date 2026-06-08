import { v4 as uuidv4 } from 'uuid';
import { generateTokens } from '@mobiwave/shared';

export function createTestUserPayload(overrides?: {
  phone?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  tenantId?: string;
}) {
  return {
    phone: overrides?.phone || '+254700100200',
    firstName: overrides?.firstName || 'Jane',
    lastName: overrides?.lastName || 'Test',
    role: overrides?.role || 'CUSTOMER',
    tenantId: overrides?.tenantId || uuidv4(),
  };
}

export function createTestAuthTokens(userId: string, tenantId: string, role = 'CUSTOMER') {
  return generateTokens({
    sub: userId,
    tenant_id: tenantId,
    phone: '+254700100200',
    role,
  });
}

export function createTestHeaders(userId: string, tenantId: string, role = 'CUSTOMER') {
  const tokens = createTestAuthTokens(userId, tenantId, role);
  return {
    Authorization: `Bearer ${tokens.accessToken}`,
    'X-Tenant-Id': tenantId,
    'X-Request-Id': uuidv4(),
  };
}

export function createTestBookingPayload(overrides?: {
  serviceId?: string;
  addressId?: string;
  scheduledDate?: string;
  scheduledStart?: string;
  notes?: string;
}) {
  return {
    serviceId: overrides?.serviceId || uuidv4(),
    addressId: overrides?.addressId || uuidv4(),
    scheduledDate: overrides?.scheduledDate || '2025-06-15',
    scheduledStart: overrides?.scheduledStart || '10:00',
    notes: overrides?.notes || 'Test booking',
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function expectErrorResponse(res: { statusCode: number; body: { success: boolean; error?: { code: string } } },
  expectedStatus: number, expectedCode?: string) {
  expect(res.statusCode).toBe(expectedStatus);
  expect(res.body.success).toBe(false);
  if (expectedCode) {
    expect(res.body.error?.code).toBe(expectedCode);
  }
}
