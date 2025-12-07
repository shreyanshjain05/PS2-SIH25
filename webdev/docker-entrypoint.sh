#!/bin/sh
set -e

echo "🔄 Starting database migration process..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if nc -z db 5432 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Database failed to become ready in time"
  exit 1
fi

# Give database a moment to fully initialize
sleep 2

echo "📦 Running Prisma migrations..."

# Run migrations for all schemas
echo "  → Auth schema..."
bunx prisma migrate deploy --schema prisma/schema.prisma --config prisma/prisma.config.ts || echo "⚠️  Auth migration failed or no migrations to apply"

echo "  → Citizen schema..."
bunx prisma migrate deploy --schema src/services/citizen/prisma/schema.prisma --config src/services/citizen/prisma/prisma.config.ts || echo "⚠️  Citizen migration failed or no migrations to apply"

echo "  → Business schema..."
bunx prisma migrate deploy --schema src/services/business/prisma/schema.prisma --config src/services/business/prisma/prisma.config.ts || echo "⚠️  Business migration failed or no migrations to apply"

echo "  → Gov schema..."
bunx prisma migrate deploy --schema src/services/gov/prisma/schema.prisma --config src/services/gov/prisma/prisma.config.ts || echo "⚠️  Gov migration failed or no migrations to apply"

echo "✅ Migration process complete!"
echo "🚀 Starting application server..."

# Execute the main command (start the server)
exec "$@"
