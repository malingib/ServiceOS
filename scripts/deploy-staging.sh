#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Deploying to Staging ==="

if [ ! -f .env.staging ]; then
  echo "Error: .env.staging not found. Create it from .env.example and fill in staging secrets."
  exit 1
fi

# ─── Pull latest code ────────────────────────────────────────────────────
echo "Pulling latest code..."
git checkout develop
git pull origin develop

# ─── Install and build ───────────────────────────────────────────────────
echo "Installing dependencies..."
pnpm install

echo "Building..."
pnpm build

# ─── Run migrations ──────────────────────────────────────────────────────
echo "Running database migrations..."
./scripts/db-migrate.sh staging

# ─── Seed data ───────────────────────────────────────────────────────────
echo "Seeding staging data..."
./scripts/seed-data.sh staging

# ─── Reload PM2 ─────────────────────────────────────────────────────────
echo "Reloading PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 start infra/pm2/ecosystem.staging.config.js

# ─── Health check ────────────────────────────────────────────────────────
echo "Running health checks..."
sleep 5
SERVICES=(
  "http://localhost:3001/health"
)

for url in "${SERVICES[@]}"; do
  if curl -sf "$url" >/dev/null 2>&1; then
    echo "OK: $url"
  else
    echo "WARNING: $url is not responding"
  fi
done

echo ""
echo "=== Staging deployment complete ==="
