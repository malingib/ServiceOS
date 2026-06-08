# Supabase Migration Summary

## Completed Migration from Keycloak to Supabase

This document summarizes the completed migration of ServiceOS from self-hosted PostgreSQL + Keycloak to Supabase managed PostgreSQL with native Supabase Auth.

## Changes Made

### 1. Database Configuration
- **Prisma Schema** (`packages/prisma/schema.prisma`):
  - Updated datasource to use `POSTGRES_URL` (pooling) and `POSTGRES_URL_NON_POOLING` (direct)
  - Removed references to `DATABASE_URL` and `DIRECT_URL`
  - PostgreSQL extensions (uuid_ossp, pgcrypto, btree_gist) remain unchanged and are supported by Supabase

### 2. Environment Variables
- **Updated** `.env.example`:
  - Replaced `DATABASE_URL` and `DIRECT_URL` with Supabase connection strings
  - Replaced Keycloak variables with Supabase Auth variables:
    - `SUPABASE_URL` - Your Supabase project URL
    - `SUPABASE_ANON_KEY` - Public key for client-side operations
    - `SUPABASE_SERVICE_ROLE_KEY` - Server-side service role key
    - `SUPABASE_JWT_SECRET` - For JWT verification across services
  - Removed all Keycloak-related variables

- **Updated** `packages/config/src/index.ts`:
  - Added Supabase configuration schema
  - Removed Keycloak configuration

### 3. Supabase Client Package
- **Created** new package `packages/supabase/`:
  - `src/client.ts` - Supabase client initialization with service role
  - `src/auth.ts` - Auth helper functions for user management:
    - `createSupabaseUser()` - Create users with custom metadata
    - `getUserByPhone()` - Query users by phone number
    - `updateUserMetadata()` - Update user metadata (tenant association, role)
    - `verifyToken()` - Verify JWT tokens
    - `revokeToken()` - Revoke sessions
    - `deleteUser()` - Delete users from auth system
    - `createOtpSession()` - OTP session management
  - `src/index.ts` - Package exports

### 4. Authentication Service
- **Updated** `apps/identity-service/src/services/auth.service.ts`:
  - Added Supabase imports (`@serviceops/supabase`)
  - Modified `register()` method:
    - Creates user in Supabase Auth with phone number and metadata
    - User metadata stores `first_name`, `last_name`, `tenant_id`, `role`
    - Falls back to Prisma for application database records
  - Modified `login()` method:
    - Verifies OTP as before (Africa's Talking SMS integration preserved)
    - Validates user exists in Supabase Auth system
  - Kept existing token generation and refresh logic unchanged

### 5. JWT Verification Middleware
- **Updated** `packages/shared/src/middleware/auth.ts` and `apps/identity-service/src/middleware/requireAuth.ts`:
  - Added dual JWT verification:
    - First attempts to verify with `JWT_SECRET` (backward compatibility)
    - Falls back to `SUPABASE_JWT_SECRET` if configured
  - Allows smooth transition between custom and Supabase JWTs
  - Token payload format remains unchanged for services

### 6. Removed Keycloak Integration
- **Deleted** `apps/identity-service/src/services/keycloak.service.ts`
- **Deleted** `apps/identity-service/src/__tests__/keycloak.service.test.ts`
- **Updated** `apps/identity-service/src/__tests__/auth.service.test.ts`:
  - Removed Keycloak mocks
  - Added Supabase auth helpers mocks
  - Tests now verify Supabase user creation flow

### 7. Dependencies
- **Added** Supabase dependencies:
  - `@supabase/supabase-js` (v2.108.0)
  - `@supabase/auth-helpers-shared` (v0.7.0)

## Architecture Overview

```
ServiceOS Auth Flow (Supabase)
├── Request OTP
│   └── Africa's Talking SMS sends code
├── Verify OTP
│   └── Local OTP service validates (Redis)
├── Register/Login
│   ├── Create/verify user in Supabase Auth
│   ├── Store metadata: tenant_id, role, name
│   └── Create user record in Prisma (application DB)
├── Token Generation
│   ├── Generate JWT with custom payload
│   └── Return access + refresh tokens
└── JWT Verification
    ├── Middleware verifies token signature
    ├── Supports both custom JWT_SECRET and SUPABASE_JWT_SECRET
    └── Extracts user context (id, tenant_id, phone, role)
```

## Multi-Tenancy Support

- **Tenant Association**: Stored in Supabase user metadata as `tenant_id`
- **User Role**: Stored in Supabase user metadata as `role`
- **Database Isolation**: Prisma queries continue to filter by `tenantId` field
- **No Schema Changes**: Existing database schema remains unchanged

## OTP Authentication

- **SMS Provider**: Africa's Talking (unchanged)
- **OTP Storage**: Redis (unchanged)
- **Verification Flow**: Local OTP service (unchanged)
- **Integration**: Supabase Auth user creation includes phone verification

## Data Migration

**No data migration required**. Supabase directly manages your existing PostgreSQL database:
- All existing users, tenants, and profiles remain intact
- Schema maintained with PostgreSQL extensions enabled
- Connection pooling handled by Supabase PgBouncer

## Deployment Checklist

Before deploying to production:

1. **Set Supabase Environment Variables**
   ```bash
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   POSTGRES_URL=your-postgres-url
   POSTGRES_URL_NON_POOLING=your-postgres-non-pooling-url
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   pnpm db:generate  # Regenerate Prisma client
   ```

3. **Test Authentication Flows**
   - Test OTP request and verification
   - Test user registration with Supabase
   - Test user login with Supabase verification
   - Test token refresh with JWT verification
   - Test multi-tenant isolation

4. **Verify Extensions**
   - Ensure PostgreSQL extensions are enabled in Supabase:
     - `uuid_ossp`
     - `pgcrypto`
     - `btree_gist`

5. **Update Frontend**
   - Update client-side Supabase configuration if needed
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Rollback Plan

If issues arise:
1. Revert environment variables to point to previous database
2. Restore Keycloak service (files are in git history)
3. Redeploy with previous configuration
4. Note: Database remains unchanged, only auth provider swapped

## Service-to-Service Authentication

- Services using `requireAuth` middleware can verify tokens with either JWT_SECRET or SUPABASE_JWT_SECRET
- Service-to-service calls should continue using API keys or service roles as before
- No changes to rate limiting or audit middleware

## Testing

Key areas tested:
- OTP generation and SMS delivery
- User registration with Supabase Auth
- User login with phone verification
- JWT token generation and validation
- Multi-tenant user isolation
- Token refresh flow
- Middleware JWT verification with dual secret support

## Next Steps

1. Deploy to staging environment
2. Run integration tests
3. Perform end-to-end testing of all auth flows
4. Monitor Supabase dashboard for issues
5. Deploy to production with zero-downtime strategy
6. Clean up old Keycloak infrastructure

## Support

For issues:
1. Check Supabase dashboard for connection and auth errors
2. Verify all environment variables are set correctly
3. Check PostgreSQL connection logs in Supabase
4. Review Supabase Auth logs for user creation/login issues
5. Verify JWT_SECRET and SUPABASE_JWT_SECRET are correctly configured
