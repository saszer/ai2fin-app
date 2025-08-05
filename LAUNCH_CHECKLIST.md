# 🚀 AI2 Platform Launch Checklist

## Phase 1: Infrastructure Setup (Day 1)

### 1.1 Create Cloud Accounts
- [ ] **Fly.io Account**
  ```bash
  # Sign up at https://fly.io
  # Install CLI: curl -L https://fly.io/install.sh | sh
  # Login: flyctl auth login
  # Get token: flyctl auth token
  ```

- [ ] **GCP Project**
  ```bash
  # Create project
  gcloud projects create ai2-production --name="AI2 Production"
  
  # Enable APIs
  gcloud services enable cloudsql.googleapis.com
  gcloud services enable secretmanager.googleapis.com
  gcloud services enable storage.googleapis.com
  gcloud services enable redis.googleapis.com
  ```

- [ ] **Cloudflare Account**
  ```bash
  # Add domain: embracingearth.space
  # Get Zone ID and API token
  # Enable proxy for app subdomain
  ```

### 1.2 Configure GitHub Secrets
Add these to GitHub repository secrets:

- [ ] `FLY_API_TOKEN` - From flyctl auth token
- [ ] `GCP_PROJECT_ID` - ai2-production
- [ ] `GCP_SA_KEY` - Service account JSON key
- [ ] `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- [ ] `CLOUDFLARE_ZONE_ID` - Your zone ID
- [ ] `OPENAI_API_KEY` - For AI services
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string

### 1.3 Initialize Infrastructure
```bash
# Create Fly.io apps
flyctl launch --name ai2-staging --no-deploy
flyctl launch --name ai2-production --no-deploy

# Initialize Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Phase 2: Database Setup (Day 1)

### 2.1 Create Production Database
```bash
# Create Cloud SQL instance
gcloud sql instances create ai2-main \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=your_secure_password

# Create database
gcloud sql databases create ai2_production --instance=ai2-main

# Create user
gcloud sql users create ai2_user --instance=ai2-main --password=your_password
```

### 2.2 Run Database Migrations
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://ai2_user:password@host:5432/ai2_production"

# Run migrations
cd ai2-core-app
npx prisma migrate deploy
npx prisma generate
```

## Phase 3: First Deployment (Day 1)

### 3.1 Deploy to Staging
```bash
# Deploy staging environment
npm run deploy:staging

# Verify staging deployment
curl https://ai2-staging.fly.dev/health
```

### 3.2 Test Staging Environment
- [ ] Health check endpoint: `/health`
- [ ] Authentication: Login/Register
- [ ] Core features: Transactions, Categories
- [ ] AI features: Categorization, Analysis
- [ ] Mobile responsiveness
- [ ] PWA installation

### 3.3 Deploy to Production
```bash
# Deploy production environment
npm run deploy:production

# Verify production deployment
curl https://app.embracingearth.space/health
```

## Phase 4: Domain & SSL Setup (Day 1)

### 4.1 Configure Domain
```bash
# Add DNS records in Cloudflare
app.embracingearth.space → CNAME → ai2-production.fly.dev

# Enable Cloudflare proxy (orange cloud)
# This provides SSL, CDN, and security
```

### 4.2 Verify SSL Certificate
```bash
# Check SSL is working
curl -I https://app.embracingearth.space

# Should return 200 OK with HTTPS
```

## Phase 5: Monitoring Setup (Day 2)

### 5.1 Deploy Status Page
```bash
# Deploy Uptime Kuma
cd infrastructure/status-page
docker-compose up -d

# Configure monitors for:
# - https://app.embracingearth.space
# - https://ai2-staging.fly.dev
# - Database connectivity
```

### 5.2 Set Up Alerts
- [ ] Email notifications for downtime
- [ ] Slack/Discord webhooks (optional)
- [ ] Performance monitoring
- [ ] Error tracking

## Phase 6: Security Hardening (Day 2)

### 6.1 Configure Cloudflare Security
```bash
# Enable security features
- WAF (Web Application Firewall)
- Rate limiting
- DDoS protection
- Security headers
```

### 6.2 Set Up Secrets Management
```bash
# Store secrets in GCP Secret Manager
gcloud secrets create openai-api-key --data-file=openai-key.txt
gcloud secrets create database-url --data-file=db-url.txt

# Update Fly.io secrets
flyctl secrets set OPENAI_API_KEY=@openai-key.txt
flyctl secrets set DATABASE_URL=@db-url.txt
```

## Phase 7: Testing & Validation (Day 2)

### 7.1 Load Testing
```bash
# Test with realistic load
npm run test:load

# Verify performance under stress
# - 100 concurrent users
# - AI endpoint response times
# - Database query performance
```

### 7.2 Security Testing
```bash
# Run security scans
npm run test:security

# Check for vulnerabilities
# - Dependency vulnerabilities
# - SQL injection
# - XSS protection
# - CSRF protection
```

### 7.3 User Acceptance Testing
- [ ] Test all user flows
- [ ] Verify mobile experience
- [ ] Test PWA installation
- [ ] Validate AI features
- [ ] Check data accuracy

## Phase 8: Go Live! (Day 3)

### 8.1 Final Production Deployment
```bash
# Deploy latest version
git checkout main
git pull origin main
npm run deploy:production

# Verify deployment
curl https://app.embracingearth.space/health
```

### 8.2 Monitor Launch
- [ ] Watch error rates
- [ ] Monitor performance
- [ ] Check user registrations
- [ ] Verify AI functionality
- [ ] Monitor database performance

### 8.3 Post-Launch Tasks
- [ ] Document procedures
- [ ] Set up backup monitoring
- [ ] Configure automated scaling
- [ ] Plan feature releases
- [ ] Set up user feedback system

## 🔄 **Ongoing Development Workflow**

### **Feature Development Cycle**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Develop locally
npm run dev
# Test your changes

# 3. Push to staging
git push origin feature/new-feature
# Creates PR → Auto-deploys to staging

# 4. Test on staging
# Visit: https://ai2-staging.fly.dev
# Verify everything works

# 5. Merge to production
git checkout main
git merge feature/new-feature
git push origin main
# Auto-deploys to production
```

### **Hotfix Process**
```bash
# For urgent fixes
git checkout -b hotfix/critical-bug
# Fix the issue
git push origin hotfix/critical-bug
# Deploy directly to production if needed
```

## 📊 **Monitoring & Maintenance**

### **Daily Monitoring**
- [ ] Check status page
- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Check database health

### **Weekly Tasks**
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Backup verification
- [ ] Performance optimization

### **Monthly Tasks**
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Feature planning
- [ ] User feedback analysis

## 🚨 **Emergency Procedures**

### **Rollback Process**
```bash
# If production has issues
git checkout main
git revert HEAD
git push origin main
# Auto-rollback deployment
```

### **Database Recovery**
```bash
# Restore from backup
gcloud sql backups restore [BACKUP_ID] \
  --instance=ai2-main \
  --restored-instance-name=ai2-main-restored
```

---

**Your app is ready to launch! Follow this checklist step by step.** 🚀 