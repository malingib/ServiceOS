#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ─── Configuration ────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
DB_NAME="${DB_NAME:-serviceops}"
DB_USER="${DB_USER:-serviceops}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "=== Database Backup ==="
echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "Backup:   ${BACKUP_FILE}"

# ─── Check pg_dump availability ──────────────────────────────────────────
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Error: pg_dump is not installed."
  exit 1
fi

# ─── Perform backup ──────────────────────────────────────────────────────
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --verbose \
  --no-owner \
  --file="$BACKUP_FILE" 2>&1 | tail -5

# ─── Compress ─────────────────────────────────────────────────────────────
gzip -f "$BACKUP_FILE"
echo "Compressed: ${BACKUP_FILE}.gz"

# ─── Cleanup old backups ─────────────────────────────────────────────────
find "$BACKUP_DIR" -name "${DB_NAME}-*.dump.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "Cleaned up backups older than ${RETENTION_DAYS} days."

BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "Backup size: ${BACKUP_SIZE}"
echo "=== Backup complete ==="
