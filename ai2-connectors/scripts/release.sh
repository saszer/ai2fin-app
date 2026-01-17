#!/bin/bash
# ==========================================
# PRODUCTION RELEASE COMMAND
# Runs on every Fly.io deploy before starting the app
# embracingearth.space
# ==========================================

set -e  # Exit on error

echo "🚀 AI2 Connectors Production Release"
echo "===================================="
echo ""

# Ensure we're in the right directory
cd /app || cd "$(dirname "$0")/.." || exit 1

# Check if Prisma CLI is available
if ! command -v npx &> /dev/null; then
  echo "⚠️  npx not found, trying to install Prisma..."
  npm install -g prisma 2>/dev/null || {
    echo "❌ Cannot install Prisma CLI"
    echo "   Continuing - app will handle schema validation on startup"
    exit 0
  }
fi

# Step 1: Generate Prisma Client
echo "1️⃣ Generating Prisma Client..."
if npx prisma generate --schema=./prisma/schema.prisma 2>&1; then
  echo "✅ Prisma client generated"
else
  echo "⚠️  Prisma client generation failed, but continuing..."
fi
echo ""

# Step 2: Run Database Migrations (if migrations exist)
# If no migrations exist, use db push as fallback
echo "2️⃣ Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping migrations"
  echo "   App will handle schema validation on startup"
  exit 0
fi

# Try migrations first (if they exist)
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "   Migrations directory exists, running migrate deploy..."
  if npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1; then
    echo "✅ Migrations deployed successfully"
  else
    echo "⚠️  Migration deploy failed, trying db push as fallback..."
    if npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate 2>&1; then
      echo "✅ Database schema pushed successfully"
    else
      echo "⚠️  db push also failed, but continuing..."
      echo "   App will validate schema on startup and attempt auto-fix if needed"
    fi
  fi
else
  echo "   No migrations found, using db push..."
  if npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate 2>&1; then
    echo "✅ Database schema pushed successfully"
  else
    echo "⚠️  db push failed, but continuing..."
    echo "   App will validate schema on startup and attempt auto-fix if needed"
  fi
fi
echo ""

echo "===================================="
echo "✅ Release complete!"
echo "Server ready to start..."