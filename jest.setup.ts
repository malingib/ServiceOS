import { cleanDatabase, prismaTestClient } from '@mobiwave/testing';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/serviceops_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MPESA_BASE_URL = 'https://sandbox.safaricom.co.ke';
process.env.MPESA_CONSUMER_KEY = 'test-consumer-key';
process.env.MPESA_CONSUMER_SECRET = 'test-consumer-secret';
process.env.MPESA_SHORTCODE = '174379';
process.env.MPESA_PASSKEY = 'test-passkey';
process.env.AT_API_URL = 'https://api.africastalking.com/version1';
process.env.AT_API_KEY = 'test-at-api-key';
process.env.AT_USERNAME = 'sandbox';
process.env.KEYCLOAK_URL = 'http://localhost:8080';
process.env.KEYCLOAK_REALM = 'serviceops';
process.env.KEYCLOAK_CLIENT_ID = 'serviceops-api';
process.env.KEYCLOAK_CLIENT_SECRET = 'test-secret';
process.env.DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

beforeEach(async () => {
  jest.clearAllMocks();
});

afterEach(async () => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await prismaTestClient.$disconnect();
});
