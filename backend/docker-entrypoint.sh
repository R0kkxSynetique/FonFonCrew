#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."

# Wait for PostgreSQL to be available
until nc -z db 5432 2>/dev/null; do
  echo "   Database not ready yet — retrying in 2s..."
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running Prisma migrations..."
npx prisma db push --skip-generate

echo "🚀 Starting server..."
exec node src/server.js
