#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== ServiceOps Project Setup ==="

# ─── Check prerequisites ──────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required (>=20)"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm is required (>=8)"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Warning: Docker is not installed. Cannot run infrastructure."; }

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Error: Node.js >=20 is required (found: $(node -v))"
  exit 1
fi

# ─── Copy env file if not exists ──────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — please update with your secrets."
fi

# ─── Install dependencies ─────────────────────────────────────────────────
echo "Installing dependencies..."
pnpm install

# ─── Generate Prisma client ───────────────────────────────────────────────
echo "Generating Prisma client..."
pnpm db:generate

# ─── Check prerequisites ──────────────────────────────────────────────────
echo "Make sure these services are running locally:"
echo "  - PostgreSQL (port 5432)"
echo "  - Redis      (port 6379)"
echo "  - Keycloak   (port 8080)"
echo "  - MinIO      (ports 9000, 9001)"

# ─── Push schema to database ──────────────────────────────────────────────
echo "Pushing database schema..."
pnpm db:push

# ─── Seed data ────────────────────────────────────────────────────────────
echo "Seeding development data..."
pnpm db:seed

echo ""
echo "=== Setup complete! ==="
echo "Run: pnpm dev          — Start all services in dev mode"
echo "Run: pnpm services:dev — Start services with PM2 watch mode"
echo "Run: pnpm docker:dev   — Start infrastructure containers"
echo ""
echo "Keycloak: http://localhost:8080/auth (admin / admin123)"
echo "MinIO:    http://localhost:9001 (serviceops / serviceops_dev)"
