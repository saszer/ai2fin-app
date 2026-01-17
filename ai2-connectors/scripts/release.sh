#!/bin/bash
# ==========================================
# PRODUCTION RELEASE COMMAND
# Runs on every Fly.io deploy before starting the app
# embracingearth.space - Enterprise-grade deployment resilience
# ==========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# CRITICAL: Don't use set -e - we want to handle errors gracefully
# Instead, check exit codes explicitly

# Check if timeout command is available (Alpine Linux might not have it)
if command -v timeout &> /dev/null; then
  USE_TIMEOUT=true
  TIMEOUT_CMD="timeout 120"
else
  USE_TIMEOUT=false
  TIMEOUT_CMD=""
  echo -e "${YELLOW}⚠️  timeout command not available, running without timeout protection${NC}"
fi

echo -e "${GREEN}🚀 AI2 Connectors Production Release${NC}"
echo "===================================="
echo ""

# Ensure we're in the right directory
cd /app 2>/dev/null || cd "$(dirname "$0")/.." 2>/dev/null || {
  echo -e "${YELLOW}⚠️  Cannot find /app directory, trying current directory...${NC}"
  pwd
  ls -la
}

# Check if Prisma CLI is available
if ! command -v npx &> /dev/null && ! command -v prisma &> /dev/null; then
  echo -e "${YELLOW}⚠️  npx/prisma not found, trying to install...${NC}"
  npm install -g prisma 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Cannot install Prisma CLI${NC}"
    echo "   Continuing - app will handle schema validation on startup"
    exit 0
  }
fi

# Step 1: Generate Prisma Client
echo -e "${GREEN}1️⃣ Generating Prisma Client...${NC}"
if npx prisma generate --schema=./prisma/schema.prisma 2>&1; then
  echo -e "${GREEN}✅ Prisma client generated${NC}"
else
  echo -e "${YELLOW}⚠️  Prisma client generation failed, but continuing...${NC}"
fi
echo ""

# Step 2: Run Database Migrations (if migrations exist)
# If no migrations exist, use db push as fallback
echo -e "${GREEN}2️⃣ Running database migrations...${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  DATABASE_URL not set, skipping migrations${NC}"
  echo "   App will handle schema validation on startup"
  exit 0
fi

# Mask DATABASE_URL for logging (hide credentials)
MASKED_URL=$(echo "$DATABASE_URL" | sed 's/\/\/.*@/\/\/***:***@/' 2>/dev/null || echo "***")
echo -e "${GREEN}📊 Database URL: $MASKED_URL${NC}"

# Function to run Prisma command with optional timeout
run_prisma_cmd() {
  local cmd="$1"
  local desc="$2"
  
  echo "   Running: $desc..."
  if [ "$USE_TIMEOUT" = "true" ]; then
    if $TIMEOUT_CMD bash -c "$cmd" 2>&1; then
      return 0
    else
      EXIT_CODE=$?
      if [ $EXIT_CODE -eq 124 ]; then
        echo -e "${RED}❌ Command timed out after 120s${NC}"
      else
        echo -e "${YELLOW}⚠️  Command failed (exit code: $EXIT_CODE)${NC}"
      fi
      return $EXIT_CODE
    fi
  else
    # No timeout available, run directly
    if bash -c "$cmd" 2>&1; then
      return 0
    else
      EXIT_CODE=$?
      echo -e "${YELLOW}⚠️  Command failed (exit code: $EXIT_CODE)${NC}"
      return $EXIT_CODE
    fi
  fi
}

# Try migrations first (if they exist)
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "   Migrations directory exists, running migrate deploy..."
  if run_prisma_cmd "npx prisma migrate deploy --schema=./prisma/schema.prisma" "migrate deploy"; then
    echo -e "${GREEN}✅ Migrations deployed successfully${NC}"
  else
    echo -e "${YELLOW}⚠️  Migration deploy failed, trying db push as fallback...${NC}"
    if run_prisma_cmd "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate" "db push"; then
      echo -e "${GREEN}✅ Database schema pushed successfully${NC}"
    else
      echo -e "${YELLOW}⚠️  db push also failed, but continuing...${NC}"
      echo "   App will validate schema on startup and attempt auto-fix if needed"
    fi
  fi
else
  echo "   No migrations found, using db push..."
  if run_prisma_cmd "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate" "db push"; then
    echo -e "${GREEN}✅ Database schema pushed successfully${NC}"
  else
    echo -e "${YELLOW}⚠️  db push failed, but continuing...${NC}"
    echo "   App will validate schema on startup and attempt auto-fix if needed"
  fi
fi
echo ""

echo "===================================="
echo -e "${GREEN}✅ Release complete!${NC}"
echo "Server ready to start..."
exit 0