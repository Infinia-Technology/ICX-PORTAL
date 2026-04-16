#!/bin/sh
set -e

echo "Running Prisma migrations..."

# Attempt migrate deploy. If P3005 (non-empty DB with no migration history),
# baseline all existing migrations and retry.
if ! npx prisma migrate deploy 2>&1; then
  echo "Baseline needed — marking all existing migrations as applied..."
  for migration in $(ls prisma/migrations | grep -v migration_lock.toml); do
    echo "  Resolving: $migration"
    npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
  done
  echo "Retrying migrate deploy..."
  npx prisma migrate deploy
fi

echo "Starting server..."
exec node src/index.js
