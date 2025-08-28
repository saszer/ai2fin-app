# AI2 Platform - Comprehensive Environment Variables Template
# embracingearth.space - Copy the relevant sections to your .env file

## 🔧 CORE APPLICATION SETTINGS
```bash
# Application Environment
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
DEBUG=ai2:*

# Memory and Performance
NODE_OPTIONS=--max-old-space-size=2048 --expose-gc
MAX_CONNECTIONS=1000
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000
```

## 🔐 AUTHENTICATION & SECURITY
```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_embracingearth_space
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Cookie Authentication (BFF)
COOKIE_SECRET=your_cookie_secret_32_chars_min
COOKIE_SAMESITE=None
COOKIE_SECURE=false
CSRF_ENABLED=true
ENABLE_JTI_VALIDATION=true

# Password Hashing
BCRYPT_ROUNDS=12
HASH_ROUNDS=12

# Service Authentication
SERVICE_SECRET=your_service_secret_for_internal_communication
```

## 🗄️ DATABASE CONFIGURATION
```bash
# Primary Database
DATABASE_URL=postgresql://aifin_user:ai2@127.0.0.1:5434/aifin

# Read Replicas (Optional)
DATABASE_READ_URL=postgresql://aifin_user:ai2@127.0.0.1:5433/aifin

# Connection Pooling
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=100
DATABASE_POOL_IDLE_TIMEOUT=30000

# Database Maintenance
ENABLE_AUTO_VACUUM=true
VACUUM_SCHEDULE="0 4 * * 0"
ENABLE_QUERY_LOGGING=false
SLOW_QUERY_THRESHOLD=1000
```

## 🔗 OIDC CONFIGURATION (Zitadel)
```bash
# OIDC Provider Settings
OIDC_ISSUER=https://zitadel-ckrqb7.zitadel.cloud
OIDC_AUDIENCE=334417108637726
OIDC_JWKS_URI=https://zitadel-ckrqb7.zitadel.cloud/oauth/v2/keys
OIDC_CLIENT_ID=your_oidc_client_id
OIDC_PRIVATE_KEY=your_oidc_private_key_pem
OIDC_KEY_ID=your_oidc_key_id
OIDC_ENRICH_USERINFO=true
```

## 🤖 AI CONFIGURATION
```bash
# OpenAI Settings
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4
AI_TIMEOUT=30000
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.1
AI_BATCH_SIZE=1000
AI_MAX_CONCURRENCY=50
AI_RETRY_ATTEMPTS=3
AI_REQUEST_TIMEOUT=30000
AI_MAX_RETRIES=3
```

## 📧 EMAIL CONFIGURATION
```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@embracingearth.space
```

## 💳 PAYMENT PROCESSING
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 📱 SMS CONFIGURATION
```bash
# Twilio Settings
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🚨 MONITORING & ALERTING
```bash
# Notification Services
SLACK_WEBHOOK_URL=your_slack_webhook_url
ALERT_WEBHOOK_URL=your_alert_webhook_url
PAGERDUTY_API_KEY=your_pagerduty_api_key

# Application Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
AIKIDO_TOKEN=your_aikido_security_token

# Health Monitoring
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
MEMORY_THRESHOLD=90
CPU_THRESHOLD=80
GC_THRESHOLD=85
```

## 🔄 CACHING & REDIS
```bash
# Redis Configuration
REDIS_URL=redis://:redis_password@localhost:6379
REDIS_PASSWORD=redis_password
REDIS_DB=0
REDIS_CLUSTER=false

# Cache Settings
CACHE_TTL=3600
SESSION_TTL=86400
```

## 🌐 CORS & SECURITY
```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security Headers
ENABLE_HELMET=true
ENABLE_RATE_LIMITING=true

# Origin Lock (Cloudflare)
ENFORCE_CF_ORIGIN_LOCK=false
ORIGIN_HEADER_NAME=x-origin-auth
ORIGIN_SHARED_SECRET=your_origin_shared_secret
```

## 📊 RATE LIMITING
```bash
# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000
RATE_LIMIT_BURST_REQUESTS=200
API_RATE_LIMIT=10000
API_RATE_WINDOW=3600000
API_BURST_LIMIT=1000
```

## 📁 FILE UPLOAD
```bash
# File Upload Settings
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=csv,pdf,jpg,png
```

## ☁️ CLOUD STORAGE (AWS S3)
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket
```

## 🏢 ENTERPRISE FEATURES
```bash
# Multi-tenancy
MULTI_TENANT_MODE=false
DEFAULT_TENANT_ID=default

# Compliance
GDPR_COMPLIANCE=true
HIPAA_COMPLIANCE=false
SOC2_COMPLIANCE=false
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=2555
AUDIT_LOG_INCLUDE_DATA=false

# Enterprise Security
ENABLE_ENCRYPTION_AT_REST=false
ENABLE_2FA=false
ENABLE_SSO=false
ENABLE_RBAC=false
```

## 🔧 CLUSTERING & SCALING
```bash
# Cluster Configuration
CLUSTER_MODE=false
CLUSTER_WORKERS=4
ENABLE_WORKER_RESTART=true
WORKER_ID=0

# Load Balancing
ENABLE_STICKY_SESSIONS=false
SESSION_STORE=memory

# Scaling Phase
SCALING_PHASE=development
```

## 📝 LOGGING & DATA RETENTION
```bash
# Log Configuration
LOG_FORMAT=json
LOG_RETENTION_DAYS=90
LOG_MAX_SIZE=500MB
LOG_MAX_FILES=50
LOG_COMPRESSION_AGE=7
ENABLE_LOG_COMPRESSION=true
LOGS_DIRECTORY=./logs
ENABLE_LOG_ROTATION=true

# Data Retention
ENABLE_DATA_RETENTION=false
USER_ACTIVITY_RETENTION_DAYS=365
DELETED_ENTITY_RETENTION_DAYS=90
AI_FEEDBACK_RETENTION_DAYS=1095
CSV_RETENTION_DAYS=730
TRANSACTION_RETENTION_DAYS=2555
SESSION_RETENTION_DAYS=30
DATA_RETENTION_BATCH_SIZE=1000
DATA_RETENTION_DELAY_MS=100
```

## ⏰ SCHEDULED JOBS
```bash
# Job Scheduling
ENABLE_SCHEDULED_JOBS=true
ENABLE_HEALTH_CHECKS=true
ENABLE_DB_MAINTENANCE=true
DATA_RETENTION_SCHEDULE="0 2 * * *"
LOG_ROTATION_SCHEDULE="0 1 * * *"
DB_MAINTENANCE_SCHEDULE="0 3 * * 0"
HEALTH_CHECK_SCHEDULE="*/5 * * * *"
```

## 🚨 BACKUP & DISASTER RECOVERY
```bash
# Backup Configuration
ENABLE_AUTO_BACKUP=false
BACKUP_SCHEDULE="0 6 * * *"
BACKUP_RETENTION_DAYS=30
BACKUP_LOCATION=./backups
REMOTE_BACKUP_ENABLED=false
REMOTE_BACKUP_TYPE=s3
```

## 🎛️ FEATURE FLAGS
```bash
# Core Features
ENABLE_AI=true
ENABLE_AI_ANALYSIS=true
ENABLE_AI_CATEGORIES=true
ENABLE_AI_TAX_DEDUCTION=true
ENABLE_AI_INSIGHTS=true
ENABLE_AI_LEARNING=true
ENABLE_BILL_DETECTION=true
ENABLE_TAX_ANALYSIS=true
ENABLE_RECURRING_PATTERNS=true

# Advanced Features
ENABLE_BANK_FEED=false
ENABLE_EMAIL_PARSING=false
ENABLE_EMAIL_CONNECTOR=false
ENABLE_EXPORT_FEATURES=true
ENABLE_BULK_OPERATIONS=true
ENABLE_ADVANCED_REPORTING=false

# Service Features
ENABLE_SUBSCRIPTION=true
ENABLE_ANALYTICS=true
ENABLE_CONNECTORS=true
ENABLE_NOTIFICATIONS=true

# Storage & Alerts
ENABLE_STORAGE_ALERTS=true
STORAGE_ALERT_THRESHOLD=80
ENABLE_MEMORY_ALERTS=true
MEMORY_ALERT_THRESHOLD=90
```

## 🔧 MICROSERVICES CONFIGURATION
```bash
# Service URLs
SUBSCRIPTION_SERVICE_URL=http://localhost:3010
AI_MODULES_URL=http://localhost:3002
CONNECTORS_URL=http://localhost:3003
ANALYTICS_URL=http://localhost:3004
NOTIFICATIONS_URL=http://localhost:3005

# Service Ports
CORE_PORT=3001
AI_PORT=3002
CONNECTORS_PORT=3003
ANALYTICS_PORT=3004
NOTIFICATIONS_PORT=3005
SUBSCRIPTION_PORT=3010

# Service Cache
SUBS_STATUS_TTL_MS=300000
```

## 🚧 MAINTENANCE & EMERGENCY
```bash
# Maintenance Mode
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE="System maintenance in progress. Please try again later."
MAINTENANCE_ALLOWED_IPS=127.0.0.1

# Emergency Settings
EMERGENCY_STORAGE_THRESHOLD=95
EMERGENCY_MEMORY_THRESHOLD=95
ENABLE_EMERGENCY_CLEANUP=true
```

## 🧪 DEVELOPMENT & TESTING
```bash
# Development Settings
MOCK_EXTERNAL_SERVICES=false
ENABLE_DEBUG_ROUTES=false
DISABLE_AUTH_FOR_TESTING=false

# Testing
ENABLE_METRICS=true
METRICS_PORT=9090
```

## 📦 DEPLOYMENT INFO
```bash
# Deployment Configuration
DEPLOYMENT_ENVIRONMENT=development
DEPLOYMENT_VERSION=2.0.0
BUILD_NUMBER=${BUILD_NUMBER}
COMMIT_SHA=${COMMIT_SHA}
KUBERNETES_NAMESPACE=ai2-development
DOCKER_REGISTRY=registry.embracingearth.space
CONTAINER_TAG=latest
COMPOSE_PROJECT_NAME=ai2_platform
```

---

## 🚀 QUICK START FOR LOCAL DEVELOPMENT

Create your `.env` file with these minimal required variables:

```bash
# Minimal .env for local development
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://aifin_user:ai2@127.0.0.1:5434/aifin
JWT_SECRET=aifin-super-secret-jwt-key-2024-make-it-long-and-random-embracingearth-space
OIDC_ISSUER=https://zitadel-ckrqb7.zitadel.cloud
OIDC_AUDIENCE=334417108637726
OPENAI_API_KEY=your_openai_api_key_here
COOKIE_SAMESITE=None
COOKIE_SECURE=false
```

This template includes all environment variables found in your codebase. Choose the ones relevant to your deployment and configure them accordingly.


