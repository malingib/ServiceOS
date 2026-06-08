#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENV="${1:-development}"

case "$ENV" in
  development|staging) ;;
  *)
    echo "Usage: $0 [development|staging]"
    echo "Warning: Running seed on production is NOT recommended."
    exit 1
    ;;
esac

echo "=== Seeding Database ($ENV) ==="

export NODE_ENV="$ENV"

pnpm db:seed

echo ""
echo "=== Seed complete ($ENV) ==="
