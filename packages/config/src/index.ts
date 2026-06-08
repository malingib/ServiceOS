import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().default('postgresql://localhost:5432/serviceops'),
  DATABASE_REPLICA_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('mobiwave-core'),

  JWT_SECRET: z.string().default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  LOG_REDACT_PATHS: z.string().optional(),

  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_STK_CALLBACK_URL: z.string().optional(),
  MPESA_B2C_CALLBACK_URL: z.string().optional(),

  NOVU_API_KEY: z.string().optional(),
  NOVU_API_URL: z.string().optional(),

  KEYCLOAK_URL: z.string().optional(),
  KEYCLOAK_REALM: z.string().default('mobiwave'),
  KEYCLOAK_CLIENT_ID: z.string().default('serviceops'),
  KEYCLOAK_CLIENT_SECRET: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().default('mobiwave'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),

  AT_API_KEY: z.string().optional(),
  AT_USERNAME: z.string().optional(),

  DEFAULT_TENANT_ID: z.string().uuid().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | null = null;

export function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  if (cachedConfig && !overrides) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({ ...process.env, ...overrides });

  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    throw new ConfigValidationError(errors);
  }

  const config = parsed.data;

  if (!overrides) {
    cachedConfig = config;
  }

  return config;
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

export function validateConfig(): { valid: boolean; errors: Array<{ path: string; message: string }> } {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  };
}

export class ConfigValidationError extends Error {
  public readonly errors: Array<{ path: string; message: string }>;

  constructor(errors: Array<{ path: string; message: string }>) {
    super(`Configuration validation failed: ${errors.map((e) => `${e.path}: ${e.message}`).join('; ')}`);
    this.name = 'ConfigValidationError';
    this.errors = errors;
  }
}

export function getCorsOrigins(): string[] {
  const config = getConfig();
  return config.CORS_ORIGINS.split(',').map((s) => s.trim());
}

export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return getConfig().NODE_ENV === 'production';
}
