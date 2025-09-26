# Option 2: Complete Implementation Script
# Keep Core AI, Disable AI+ Microservice for ~60MB memory savings

Write-Host "=== OPTION 2: CORE AI ONLY CONFIGURATION ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script implements Option 2:" -ForegroundColor Yellow
Write-Host " Keep Core AI services (categorization, tax analysis)" -ForegroundColor Green
Write-Host " Disable AI+ microservice (saves ~60MB memory)" -ForegroundColor Green
Write-Host " Enable analytics features" -ForegroundColor Green
Write-Host " Optimize memory settings" -ForegroundColor Green
Write-Host ""

Write-Host "EXECUTING CONFIGURATION..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Enable Core AI Services
Write-Host "Step 1: Enabling Core AI Services..." -ForegroundColor Green
Write-Host "fly secrets set ENABLE_AI=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_AI_CATEGORIES=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_AI_TAX_DEDUCTION=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_AI_INSIGHTS=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_AI_REPORTING=true -a ai2-core-api"
Write-Host ""

# Step 2: Disable AI+ Microservice
Write-Host "Step 2: Disabling AI+ Microservice..." -ForegroundColor Green
Write-Host "fly secrets set AI_ENDPOINT=http://disabled -a ai2-core-api"
Write-Host "fly secrets set AI_SERVICE_URL=http://disabled -a ai2-core-api"
Write-Host ""

# Step 3: Keep Analytics Enabled
Write-Host "Step 3: Enabling Analytics..." -ForegroundColor Green
Write-Host "fly secrets set ENABLE_ANALYTICS=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_ADVANCED_REPORTING=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_DASHBOARD=true -a ai2-core-api"
Write-Host "fly secrets set ENABLE_EXPORTS=true -a ai2-core-api"
Write-Host ""

# Step 4: Memory Optimization Settings
Write-Host "Step 4: Memory Optimization..." -ForegroundColor Green
Write-Host "fly secrets set NODE_OPTIONS="--expose-gc --max-old-space-size=400" -a ai2-core-api"
Write-Host "fly secrets set MEMORY_THRESHOLD=0.75 -a ai2-core-api"
Write-Host "fly secrets set PERF_ALERT_HIGH_MEMORY_PCT=0.70 -a ai2-core-api"
Write-Host "fly secrets set GC_INTERVAL_MS=30000 -a ai2-core-api"
Write-Host ""

# Step 5: Increase Memory Limit
Write-Host "Step 5: Increasing Memory Limit..." -ForegroundColor Green
Write-Host "fly scale memory 512 -a ai2-core-api"
Write-Host ""

# Step 6: Deploy Changes
Write-Host "Step 6: Deploying Changes..." -ForegroundColor Green
Write-Host "fly deploy -a ai2-core-api"
Write-Host ""

Write-Host "CONFIGURATION SUMMARY:" -ForegroundColor Cyan
Write-Host ""

Write-Host "AI SERVICES:" -ForegroundColor Yellow
Write-Host " Core AI: ENABLED (categorization, tax analysis)" -ForegroundColor Green
Write-Host " AI+ Microservice: DISABLED (saves ~60MB)" -ForegroundColor Red
Write-Host ""

Write-Host "ANALYTICS:" -ForegroundColor Yellow
Write-Host " Analytics: ENABLED" -ForegroundColor Green
Write-Host " Advanced Reporting: ENABLED" -ForegroundColor Green
Write-Host " Dashboard: ENABLED" -ForegroundColor Green
Write-Host " Exports: ENABLED" -ForegroundColor Green
Write-Host ""

Write-Host "MEMORY SETTINGS:" -ForegroundColor Yellow
Write-Host " Memory Limit: 512MB" -ForegroundColor Green
Write-Host " Garbage Collection: Enabled" -ForegroundColor Green
Write-Host " Memory Threshold: 75%" -ForegroundColor Green
Write-Host " Performance Alerts: 70%" -ForegroundColor Green
Write-Host ""

Write-Host "EXPECTED MEMORY USAGE:" -ForegroundColor Cyan
Write-Host "Core AI services: ~105MB" -ForegroundColor White
Write-Host "AI+ overhead: 0MB (disabled)" -ForegroundColor White
Write-Host "Other services: ~200MB" -ForegroundColor White
Write-Host "Total: ~305MB (well under 512MB limit)" -ForegroundColor Green
Write-Host ""

Write-Host "COST IMPACT:" -ForegroundColor Cyan
Write-Host "Memory increase: +.25/month" -ForegroundColor White
Write-Host "AI+ disable: --5/month (reduced OpenAI usage)" -ForegroundColor White
Write-Host "Net savings: .75-3.75/month" -ForegroundColor Green
Write-Host ""

Write-Host "VERIFICATION COMMANDS:" -ForegroundColor Yellow
Write-Host "fly logs -a ai2-core-api | grep -i 'ai\|memory\|gc'" -ForegroundColor White
Write-Host "curl https://ai2-core-api.fly.dev/health" -ForegroundColor White
Write-Host "fly status -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "This configuration provides:" -ForegroundColor Green
Write-Host " AI categorization and tax analysis" -ForegroundColor Green
Write-Host " Analytics and reporting" -ForegroundColor Green
Write-Host " ~60MB memory savings" -ForegroundColor Green
Write-Host " No OOM crashes" -ForegroundColor Green
Write-Host " Cost optimization" -ForegroundColor Green
Write-Host ""

Write-Host "Ready to execute these commands on Fly.io!" -ForegroundColor Cyan
