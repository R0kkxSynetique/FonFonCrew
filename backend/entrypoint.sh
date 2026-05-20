#!/bin/bash

cd /home/container

export DB_TYPE=${DB_TYPE:-postgresql}

if [ "${DB_TYPE}" = "mysql" ]; then
  DEFAULT_PORT=3306
else
  DEFAULT_PORT=5432
fi

DB_HOST_INTERNAL=${DB_HOST:-db}
DB_PORT_INTERNAL=${DB_PORT:-$DEFAULT_PORT}

echo "🔧 Configuring Prisma for database type: ${DB_TYPE}"
sed -i -E "s/provider[[:space:]]*=[[:space:]]*\"[^\"]*\"/provider = \"${DB_TYPE}\"/" prisma/schema.prisma

echo "📦 Generating Prisma client..."
npx prisma generate

echo "⏳ Waiting for database at ${DB_HOST_INTERNAL}:${DB_PORT_INTERNAL}..."
until nc -z "${DB_HOST_INTERNAL}" "${DB_PORT_INTERNAL}" 2>/dev/null; do
  echo "   Database not ready yet — retrying in 2s..."
  sleep 2
done
echo "✅ Database is ready!"

if [ "${RUN_PRISMA_MIGRATIONS}" = "true" ]; then
    echo "🔄 Running Prisma migrations..."
    npx prisma db push --skip-generate
fi

if [ "${RUN_PRISMA_SEED}" = "true" ]; then
    echo "🔄 Running Prisma seed..."
    npx prisma db seed --
fi

if [ -z "${STARTUP}" ]; then
    echo "🚀 Starting server with default command..."
    exec node src/server.js
else
    MODIFIED_STARTUP=$(echo -e ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')
    echo "🚀 Starting server with: ${MODIFIED_STARTUP}"
    
    eval ${MODIFIED_STARTUP}
fi
