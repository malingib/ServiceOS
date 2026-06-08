#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Starting ServiceOps (Development Mode) ==="

echo "Ensure PostgreSQL (5432), Redis (6379), Keycloak (8080), MinIO (9000/9001) are running."

# ─── Generate Prisma client ───────────────────────────────────────────────
pnpm db:generate

# ─── Push schema if needed ────────────────────────────────────────────────
pnpm db:push

# ─── Seed data ────────────────────────────────────────────────────────────
pnpm db:seed

# ─── Start all services with Turborepo ───────────────────────────────────
echo "Starting all services with turbo dev..."
pnpm dev
