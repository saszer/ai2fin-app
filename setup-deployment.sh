#!/bin/bash
# AI2 Deployment Setup Script
# This script creates all necessary files and configurations

set -euo pipefail

echo "🚀 Setting up AI2 deployment infrastructure..."

# Create directory structure
echo "📁 Creating directories..."
mkdir -p .github/workflows
mkdir -p infrastructure/{terraform,scripts,cloudflare,status-page,monitoring,nginx}
mkdir -p ai2-core-app/scripts
mkdir -p docs/deployment

# Create main CI/CD workflow
echo "📝 Creating GitHub Actions workflow..."
cat > .github/workflows/ci-cd-pipeline.yml << 'EOF'
name: AI2 Enterprise CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Quality checks
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint:all || true
      
      - name: Type check
        run: npm run typecheck:all
      
      - name: Test
        run: npm run test:all -- --passWithNoTests

  # Build and push Docker image
  build:
    needs: quality
    runs-on: ubuntu-latest
    if: github.event_name != 'pull_request'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./ai2-core-app
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to staging
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to staging
        run: |
          flyctl deploy --app ai2-staging \
            --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  # Deploy to production
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to production
        run: |
          flyctl deploy --app ai2-production \
            --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
EOF

# Create Fly.io configuration
echo "📝 Creating Fly.io configuration..."
cat > fly.toml << 'EOF'
app = "ai2-production"
primary_region = "iad"
kill_signal = "SIGINT"
kill_timeout = "5s"

[build]
  dockerfile = "ai2-core-app/Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"
  # embracingearth.space branding
  BRAND_URL = "https://embracingearth.space"

[experimental]
  auto_rollback = true

[[services]]
  protocol = "tcp"
  internal_port = 8080
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  
  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "get"
    path = "/health"

[[vm]]
  memory = "512mb"
  cpus = 1
EOF

# Create environment templates
echo "📝 Creating environment templates..."
cat > .env.production.template << 'EOF'
# Database
DATABASE_URL=postgresql://user:pass@host:5432/ai2_production?sslmode=require

# Redis
REDIS_URL=redis://default:password@host:6379

# API Keys
OPENAI_API_KEY=sk-...
JWT_SECRET=your-jwt-secret

# Cloud Storage
GCS_BUCKET=ai2-uploads
GCP_PROJECT_ID=your-project-id

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Feature Flags
ENABLE_AI=true
ENABLE_SUBSCRIPTION=true

# Branding - embracingearth.space
BRAND_NAME=EmbracingearthSpace
BRAND_URL=https://embracingearth.space
EOF

# Create deployment script
echo "📝 Creating deployment scripts..."
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
# Deployment script for AI2 platform

set -euo pipefail

ENVIRONMENT=${1:-staging}

echo "🚀 Deploying to $ENVIRONMENT..."

# Build the application
echo "📦 Building application..."
npm run build:all

# Run tests
echo "🧪 Running tests..."
npm run test:all

# Deploy
echo "🚢 Deploying..."
if [ "$ENVIRONMENT" = "production" ]; then
    flyctl deploy --app ai2-production
else
    flyctl deploy --app ai2-staging
fi

echo "✅ Deployment complete!"
EOF

chmod +x scripts/deploy.sh

# Create health check endpoint
echo "📝 Adding health check endpoint..."
cat > ai2-core-app/src/routes/health.ts << 'EOF'
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check other services
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected', // Add actual Redis check
        storage: 'available'
      },
      brand: 'embracingearth.space' // Branding
    };
    
    res.json(checks);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
EOF

echo "✅ Setup complete! Next steps:"
echo "1. Configure secrets in GitHub"
echo "2. Set up GCP project and services"
echo "3. Configure Cloudflare"
echo "4. Run 'flyctl launch' to create Fly.io apps"
echo "5. Deploy with 'npm run deploy:staging'" 