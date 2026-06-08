# Supabase Deployment Guide

Quick reference for deploying ServiceOS with Supabase Auth.

## Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Retrieve your project URL and API keys:
  - [ ] `SUPABASE_URL` (Project Settings > API)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API, under Service role)
  - [ ] `SUPABASE_ANON_KEY` (Project Settings > API, under Public anonymous)
  - [ ] `SUPABASE_JWT_SECRET` (Project Settings > API, JWT Secret)

### 2. Database Connection
- [ ] Copy PostgreSQL connection string from Supabase dashboard:
  - [ ] `POSTGRES_URL` (standard connection with pooling)
  - [ ] `POSTGRES_URL_NON_POOLING` (for Prisma migrations, marked as "Direct connection")

### 3. PostgreSQL Extensions
Verify these are enabled in your Supabase database (Dashboard > SQL Editor):
```sql
-- Check enabled extensions
SELECT * FROM pg_extension;

-- Enable if needed:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

### 4. Environment Variables Setup

#### Staging/Production Environment
Add these to your deployment platform (Vercel, Heroku, etc.):

```env
# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# PostgreSQL
POSTGRES_URL=postgresql://postgres.your-project:[PASSWORD]@db.your-project.supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres.your-project:[PASSWORD]@db.your-project.supabase.co:6543/postgres
READ_REPLICA_URL=postgresql://postgres.your-project:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# JWT (keep your existing secret for backward compatibility)
JWT_SECRET=your-secure-jwt-secret-change-this
JWT_ACCESS_EXPIRY=900
JWT_REFRESH_EXPIRY=604800

# Other services (unchanged)
REDIS_URL=your-redis-url
AT_API_KEY=your-africas-talking-key
AT_USERNAME=your-at-username
# ... other vars ...
```

#### Frontend Environment (Next.js, React, etc.)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://api.yourapp.com/api/v1
```

## Deployment Steps

### 1. Prepare Application
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run tests
pnpm test
pnpm test:integration
```

### 2. Database Migrations
```bash
# Push any schema changes to Supabase
pnpm db:push

# Or if starting fresh
pnpm db:migrate
```

### 3. Deploy Services

#### Option A: Traditional VPS/Self-Hosted
```bash
# Build all services
pnpm build

# Run migrations (if needed)
pnpm db:migrate

# Start services
pnpm services:start
```

#### Option B: Vercel/Container
```bash
# Push to git
git push origin main

# Vercel will auto-deploy with env vars
# Or deploy manually:
vercel --prod
```

#### Option C: Docker
```bash
# Build containers
docker compose -f infra/compose/docker-compose.prod.yml build

# Deploy
docker compose -f infra/compose/docker-compose.prod.yml up -d

# Run migrations
docker compose exec identity-service pnpm db:migrate
```

### 4. Verify Deployment

```bash
# Health check endpoints
curl https://api.yourapp.com/health

# Test auth flow
curl -X POST https://api.yourapp.com/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+254700000000"}'

# Check logs
# Supabase: Dashboard > Logs
# Services: Check PM2/Docker logs
```

## Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL connection
psql postgresql://postgres:password@db.supabase.co:5432/postgres

# Check Prisma can connect
pnpm db:studio
```

### Authentication Failures

**"Invalid SUPABASE_SERVICE_ROLE_KEY"**
- [ ] Verify the key in `.env` matches Supabase dashboard exactly
- [ ] Check for leading/trailing whitespace
- [ ] Regenerate the key if needed

**"PostgreSQL connection failed"**
- [ ] Verify `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` are correct
- [ ] Check IP whitelist in Supabase (if applicable)
- [ ] Ensure password doesn't contain special characters that need escaping

**"User not found in Supabase"**
- [ ] Verify registration created user in Supabase Auth
- [ ] Check Supabase Auth logs: Dashboard > Authentication > Logs
- [ ] Verify OTP verification was successful before registration

### OTP Not Sending

**SMS Delivery Issues**
- [ ] Verify Africa's Talking API key is valid
- [ ] Check AT_API_KEY format and account status
- [ ] Monitor AT account balance
- [ ] Check Service logs for API errors

**OTP Code Invalid**
- [ ] OTP codes expire after 5 minutes
- [ ] Check Redis connection for OTP storage
- [ ] Verify Redis has enough memory

## Monitoring

### Supabase Monitoring
- Dashboard: https://app.supabase.com/project/your-project
- Logs: Real-time request logs and errors
- Storage: Database usage and file storage
- Authentication: User registrations and auth events

### Application Monitoring
```bash
# Healthcheck
curl https://api.yourapp.com/health

# Check service status
pm2 status
pm2 logs

# Monitor Prisma queries
QUERY_ENGINE_LOG_LEVEL=debug pnpm dev
```

## Rollback Procedure

If critical issues occur:

1. **Immediate Rollback**
   ```bash
   # Point env vars back to previous database
   # Redeploy with previous config
   git revert <commit-hash>
   pnpm build && pnpm services:restart
   ```

2. **Data Safety**
   - All data remains in PostgreSQL (unchanged)
   - Supabase Auth data synced automatically
   - No data loss on rollback

3. **Restore Previous Auth**
   ```bash
   # If reverting to Keycloak, restore Keycloak service
   # Update JWT_SECRET to previous value
   # Redeploy auth service
   ```

## Performance Tuning

### Connection Pooling
Supabase uses PgBouncer by default. For best performance:
- Use `POSTGRES_URL` for application connections (pooled)
- Use `POSTGRES_URL_NON_POOLING` only for migrations

### JWT Verification
The middleware supports dual JWT verification for zero-downtime transitions:
- Attempts custom `JWT_SECRET` first (backward compatibility)
- Falls back to `SUPABASE_JWT_SECRET`
- Gradually migrate tokens to Supabase JWTs

### Caching
- OTP cache: Redis (5 min expiry)
- User metadata: Supabase Auth (immutable per request)
- Tenant data: Application DB with Prisma caching

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use platform secrets management (Vercel, GitHub, etc.)
   - Rotate keys periodically

2. **Database**
   - Enable SSL/TLS (Supabase provides)
   - Use service role key only on server-side
   - Use anon key for client-side operations

3. **JWT Tokens**
   - Keep JWT_SECRET secure
   - Use HTTPS for all auth endpoints
   - Set reasonable token expiry times

4. **OTP Security**
   - SMS delivery not guaranteed (show user code in UI as fallback)
   - Rate limit OTP requests
   - Implement exponential backoff for failed verifications

## Next Steps After Deployment

1. Monitor logs and alerts for first 24 hours
2. Run end-to-end tests in production environment
3. Perform user acceptance testing (UAT)
4. Train support team on any changes
5. Update documentation with new endpoints/behaviors
6. Clean up old Keycloak infrastructure
7. Celebrate successful migration!

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL**: https://www.postgresql.org/docs

## Contact

For issues with this migration:
1. Check SUPABASE_MIGRATION_SUMMARY.md
2. Review logs in Supabase dashboard
3. Check application service logs
4. Open issue with detailed error logs and steps to reproduce
