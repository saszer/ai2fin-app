# AI+ Disable Deployment Guide for Fly.io

## Overview
This guide shows how to disable AI+ services while keeping Core and Analytics running on Fly.io.

## Current Service Architecture
- **Core Service**: Port 3001 (ai2-core-app) - ENABLED
- **Analytics Service**: Port 3004 (ai2-analytics) - ENABLED  
- **AI+ Service**: Port 3002 (ai2-ai-modules) - DISABLED

## Method 1: Environment Variables (Recommended)

### 1. Set Environment Variables in Fly.io
`ash
# Disable AI features
fly secrets set ENABLE_AI=false
fly secrets set ENABLE_AI_CATEGORIES=false
fly secrets set ENABLE_AI_TAX_DEDUCTION=false
fly secrets set ENABLE_AI_INSIGHTS=false
fly secrets set ENABLE_AI_REPORTING=false

# Keep analytics enabled
fly secrets set ENABLE_ANALYTICS=true

# Keep core enabled
fly secrets set ENABLE_CORE=true
`

### 2. Deploy with AI+ Disabled
`ash
# Deploy core app
cd ai2-core-app
fly deploy

# Deploy analytics (if separate)
cd ../ai2-analytics
fly deploy
`

## Method 2: Configuration File

### 1. Use the Production Template
Copy env.production-no-ai.template to .env in your deployment:
`ash
cp env.production-no-ai.template ai2-core-app/.env
`

### 2. Update Fly.io Configuration
Ensure your ly.toml only includes the services you want:
`	oml
[env]
  ENABLE_AI = "false"
  ENABLE_ANALYTICS = "true"
  ENABLE_CORE = "true"
`

## Method 3: Service Discovery Update

### 1. Update Service Discovery
Modify shared/src/config/features.js to disable AI endpoints:
`javascript
ai: {
    enabled: false, // Changed from process.env.ENABLE_AI === 'true'
    endpoint: process.env.AI_ENDPOINT || 'http://localhost:3002',
    features: [], // Empty features array
},
`

### 2. Rebuild and Deploy
`ash
cd ai2-core-app
npm run build:local
fly deploy
`

## Verification

### 1. Check Service Status
Run the status check script:
`ash
.\check-ai-plus-status.ps1
`

### 2. Verify in Application
- AI categorization features should be disabled
- Analytics dashboard should still work
- Core transaction features should work
- No calls to port 3002 should be made

## Rollback (Re-enable AI+)

### 1. Re-enable Environment Variables
`ash
fly secrets set ENABLE_AI=true
fly secrets set ENABLE_AI_CATEGORIES=true
fly secrets set ENABLE_AI_TAX_DEDUCTION=true
fly secrets set ENABLE_AI_INSIGHTS=true
fly secrets set ENABLE_AI_REPORTING=true
`

### 2. Deploy AI+ Service
`ash
cd ai2-ai-modules
fly deploy
`

### 3. Restart Core Service
`ash
cd ai2-core-app
fly deploy
`

## Cost Optimization
- AI+ service will not consume resources
- OpenAI API calls will be eliminated
- Reduced memory and CPU usage
- Lower Fly.io costs

## Notes
- Core and Analytics services remain fully functional
- Users can still manually categorize transactions
- All data remains intact
- Easy to re-enable AI+ when needed
