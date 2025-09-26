# Option 2 Implementation: Keep Core AI, Disable AI+ Microservice
# This gives you core AI functionality with ~60MB memory savings

Write-Host "=== OPTION 2 IMPLEMENTATION ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "STRATEGY: Keep Core AI, Disable AI+ Microservice" -ForegroundColor Green
Write-Host " Core AI services remain active" -ForegroundColor Green
Write-Host " AI+ microservice calls disabled" -ForegroundColor Green
Write-Host " ~60MB memory savings" -ForegroundColor Green
Write-Host " AI categorization and tax analysis still work" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Enable Core AI Services" -ForegroundColor Yellow
Write-Host "fly secrets set ENABLE_AI=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI_CATEGORIES=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI_TAX_DEDUCTION=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI_INSIGHTS=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI_REPORTING=true -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Disable AI+ Microservice" -ForegroundColor Yellow
Write-Host "fly secrets set AI_ENDPOINT=http://disabled -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set AI_SERVICE_URL=http://disabled -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Keep Analytics Enabled" -ForegroundColor Yellow
Write-Host "fly secrets set ENABLE_ANALYTICS=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_ADVANCED_REPORTING=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_DASHBOARD=true -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set ENABLE_EXPORTS=true -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "STEP 4: Memory Optimization Settings" -ForegroundColor Yellow
Write-Host "fly secrets set NODE_OPTIONS="--expose-gc --max-old-space-size=400" -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set MEMORY_THRESHOLD=0.75 -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set PERF_ALERT_HIGH_MEMORY_PCT=0.70 -a ai2-core-api" -ForegroundColor White
Write-Host "fly secrets set GC_INTERVAL_MS=30000 -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "STEP 5: Increase Memory Limit" -ForegroundColor Yellow
Write-Host "fly scale memory 512 -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "STEP 6: Deploy Changes" -ForegroundColor Yellow
Write-Host "fly deploy -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "EXPECTED RESULTS:" -ForegroundColor Green
Write-Host " Core AI categorization works" -ForegroundColor Green
Write-Host " Core AI tax analysis works" -ForegroundColor Green
Write-Host " AI+ microservice calls disabled" -ForegroundColor Green
Write-Host " ~60MB memory savings" -ForegroundColor Green
Write-Host " No OOM crashes (512MB + proper GC)" -ForegroundColor Green
Write-Host " Analytics features enabled" -ForegroundColor Green
Write-Host ""

Write-Host "MEMORY USAGE:" -ForegroundColor Cyan
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

Write-Host "VERIFICATION:" -ForegroundColor Yellow
Write-Host "fly logs -a ai2-core-api | grep -i 'ai\|memory\|gc'" -ForegroundColor White
Write-Host "curl https://ai2-core-api.fly.dev/health" -ForegroundColor White
Write-Host ""

Write-Host "This configuration gives you the best balance of AI functionality and memory efficiency!" -ForegroundColor Green
