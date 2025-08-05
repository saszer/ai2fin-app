# 🚀 AI2 Platform Deployment Checklist

## Phase 1: Prerequisites & Accounts ✅

### 1.1 Service Accounts Setup
- [ ] **Fly.io Account**
  - Sign up at https://fly.io
  - Install flyctl: `curl -L https://fly.io/install.sh | sh`
  - Authenticate: `flyctl auth login`
  - Get API token: `flyctl auth token`
  
- [ ] **GCP Project**
  - Create project: `gcloud projects create ai2-production`
  - Enable APIs:
    ```bash
    gcloud services enable cloudsql.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable redis.googleapis.com
    ```
  - Create service account for CI/CD
  
- [ ] **Cloudflare Account**
  - Add domain: embracingearth.space
  - Get Zone ID and API token
  - Enable proxy for app subdomain

- [ ] **GitHub Settings**
  - Enable GitHub Actions
  - Configure secrets (see section 1.2)
  - Enable Dependabot

### 1.2 Required Secrets
Add these to GitHub repository secrets:
- [ ] `FLY_API_TOKEN` - From flyctl auth token
- [ ] `GCP_PROJECT_ID` - Your GCP project ID
- [ ] `GCP_SA_KEY` - Service account JSON key
- [ ] `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- [ ] `CLOUDFLARE_ZONE_ID` - Your zone ID
- [ ] `OPENAI_API_KEY` - For AI services
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string

## Phase 2: Infrastructure Setup 🏗️

### 2.1 Create Directory Structure
```bash
mkdir -p .github/workflows
mkdir -p infrastructure/{terraform,scripts,cloudflare,status-page,monitoring}
mkdir -p ai2-core-app/scripts
```

### 2.2 Core Configuration Files
- [x] Create `.github/workflows/ci-cd-pipeline.yml`
- [x] Create `fly.toml`, `fly.staging.toml`, `fly.preview.toml`
- [x] Create `infrastructure/terraform/main.tf`
- [x] Update Dockerfiles for each service

### 2.3 Database Setup
- [ ] Create Cloud SQL instance
- [ ] Run database migrations
- [ ] Set up connection pooling
- [ ] Configure backups

## Phase 3: Application Preparation 🔧

### 3.1 Code Updates
- [x] Add health check endpoints
- [ ] Implement graceful shutdown
- [ ] Add metrics endpoints
- [ ] Configure environment variables
- [ ] Update connection strings

### 3.2 Build Optimization
- [ ] Optimize Docker images
- [ ] Enable multi-stage builds
- [ ] Add .dockerignore files
- [ ] Implement build caching

### 3.3 Performance Configuration
- [x] Disable cluster mode for Fly.io deployment (CLUSTER_MODE=false)
- [x] Configure horizontal scaling via Fly.io
- [x] Set appropriate memory limits (512MB per instance)
- [x] Enable autoscaling: `flyctl autoscale balanced min=2 max=10`

## Phase 4: Security Implementation 🔒

### 4.1 Security Headers
- [ ] Configure Cloudflare WAF rules
- [ ] Set up rate limiting
- [ ] Enable DDoS protection
- [ ] Configure CSP headers

### 4.2 Secrets Management
- [ ] Rotate all secrets
- [ ] Set up GCP Secret Manager
- [ ] Configure Fly secrets
- [ ] Enable audit logging

## Phase 5: Monitoring & Observability 📊

### 5.1 Status Page
- [ ] Deploy Uptime Kuma
- [ ] Configure monitors
- [ ] Set up public page
- [ ] Add incident templates

### 5.2 Metrics & Alerts
- [ ] Deploy Prometheus
- [ ] Configure Grafana dashboards
- [ ] Set up alert rules
- [ ] Configure notifications

## Phase 6: Testing & Validation ✅

### 6.1 Pre-deployment Tests
- [ ] Run full test suite
- [ ] Load testing
- [ ] Security scanning
- [ ] Accessibility testing

### 6.2 Deployment Testing
- [ ] Test PR preview deployments
- [ ] Validate staging deployment
- [ ] Test rollback procedures
- [ ] Verify monitoring

## Phase 7: Go Live! 🎉

### 7.3 Mobile App Store Distribution (Optional)
- [ ] **PWA Setup Complete** ✅
  - [x] manifest.json configured
  - [x] serviceWorker.ts implemented
  - [x] App.tsx service worker registration
- [ ] **Mobile UI Enhancement**
  - [ ] Add mobile-specific CSS
  - [ ] Implement mobile navigation
  - [ ] Test responsive design
- [ ] **App Store Submission**
  - [ ] Google Play Store ($25 one-time)
  - [ ] Microsoft Store (Free)
  - [ ] Apple App Store ($99/year, optional)
- [ ] **PWA Builder Setup**
  - [ ] Install PWA Builder CLI
  - [ ] Generate app packages
  - [ ] Upload to stores

### 7.1 Production Deployment
- [ ] Final security review
- [ ] Deploy to production
- [ ] Verify all services
- [ ] Update DNS records

### 7.2 Post-deployment
- [ ] Monitor metrics
- [ ] Check status page
- [ ] Document procedures
- [ ] Team training

## Quick Start Commands

### Initialize Fly.io Apps
```bash
# Create staging app
flyctl launch --name ai2-staging --no-deploy

# Create production app
flyctl launch --name ai2-production --no-deploy
```

### Set up GCP Resources
```bash
# Create project
gcloud projects create ai2-production --name="AI2 Production"

# Create Cloud SQL instance
gcloud sql instances create ai2-main \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

### Deploy Infrastructure
```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Deploy Application
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## Cost Estimates

- **Fly.io**: $50-100/month (based on usage)
- **GCP Cloud SQL**: $25-50/month
- **GCP Storage**: $5-10/month
- **Cloudflare**: Free tier
- **Total**: ~$80-160/month

## Performance Considerations

### Cluster Mode Decision
- **Fly.io/Cloud**: Disable cluster mode (`CLUSTER_MODE=false`)
- **VPS/Dedicated**: Enable cluster mode (`CLUSTER_MODE=true`)
- **Workers**: Match CPU core count (4-8 typical)
- **Memory**: 512MB per Fly.io instance, 4GB+ for cluster mode

### Scaling Strategy
- **Fly.io**: Horizontal scaling (multiple instances)
  ```bash
  flyctl scale count 4
  flyctl autoscale balanced min=2 max=10
  ```
- **VPS**: Vertical scaling (cluster workers)
  ```bash
  CLUSTER_WORKERS=8 npm run start:enterprise
  ```

For detailed performance analysis, see [CLUSTER_MODE_PERFORMANCE_GUIDE.md](CLUSTER_MODE_PERFORMANCE_GUIDE.md)

## Security Checklist

- [ ] All secrets stored in Secret Manager
- [ ] WAF rules configured
- [ ] Rate limiting enabled
- [ ] SSL/TLS enforced
- [ ] Security headers set
- [ ] Access controls configured
- [ ] Monitoring alerts active
- [ ] Backup strategy implemented 