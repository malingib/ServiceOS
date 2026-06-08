CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_worker_time_no_overlap;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_worker_time_no_overlap
  EXCLUDE USING gist (
    worker_id WITH =,
    tstzrange(scheduled_start, scheduled_end, '[)') WITH &&
  )
  WHERE (
    worker_id IS NOT NULL
    AND deleted_at IS NULL
    AND status IN ('CONFIRMED', 'ASSIGNED', 'IN_PROGRESS')
  );

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_booking_id_key;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_booking_id_key UNIQUE (booking_id);

DO $$
DECLARE
  scoped_table text;
BEGIN
  FOREACH scoped_table IN ARRAY ARRAY[
    'users',
    'customer_profiles',
    'worker_profiles',
    'services',
    'addresses',
    'bookings',
    'jobs',
    'job_events',
    'payments',
    'ledger_entries',
    'referrals',
    'loyalty_points',
    'documents',
    'upload_logs',
    'audit_log',
    'outbox',
    'recurring_rules',
    'workflows',
    'rules',
    'workflow_executions',
    'notification_templates',
    'notification_logs',
    'ai_usage'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', scoped_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', scoped_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', scoped_table);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
      scoped_table
    );
  END LOOP;
END $$;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON prompts;
CREATE POLICY tenant_isolation ON prompts
  USING (
    tenant_id IS NULL
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id IS NULL
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
