#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENV="${1:-development}"

case "$ENV" in
  development|staging|production) ;;
  *)
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

echo "=== Running Prisma Migrations ($ENV) ==="

export NODE_ENV="$ENV"

# Generate client first
pnpm db:generate

# Run migrations
pnpm db:migrate

echo ""
echo "=== Migrations complete ($ENV) ==="
