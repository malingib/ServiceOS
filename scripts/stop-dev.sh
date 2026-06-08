#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Stopping ServiceOps (Development Mode) ==="

# ─── Stop PM2 processes ───────────────────────────────────────────────────
echo "Stopping PM2 processes..."
pnpm services:stop || true
pm2 delete all 2>/dev/null || true

# ─── Stop Docker containers ───────────────────────────────────────────────
echo "Stopping Docker containers..."
pnpm docker:stop || true

echo ""
echo "=== All services stopped ==="
