# Quick Memory Fix Script for Fly.io
# Run this to immediately fix the OOM crash

Write-Host "=== AI2 Core App Memory Fix ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Increase Memory to 512MB" -ForegroundColor Yellow
Write-Host "Command: fly scale memory 512 -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Disable AI+ Services" -ForegroundColor Yellow
Write-Host "Commands:" -ForegroundColor White
Write-Host "fly secrets set ENABLE_AI=false -a ai2-core-api" -ForegroundColor Gray
Write-Host "fly secrets set ENABLE_AI_CATEGORIES=false -a ai2-core-api" -ForegroundColor Gray
Write-Host "fly secrets set ENABLE_AI_TAX_DEDUCTION=false -a ai2-core-api" -ForegroundColor Gray
Write-Host "fly secrets set ENABLE_AI_INSIGHTS=false -a ai2-core-api" -ForegroundColor Gray
Write-Host "fly secrets set ENABLE_AI_REPORTING=false -a ai2-core-api" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 3: Enable Memory Monitoring" -ForegroundColor Yellow
Write-Host "Commands:" -ForegroundColor White
Write-Host "fly secrets set NODE_OPTIONS="--max-old-space-size=400 --expose-gc" -a ai2-core-api" -ForegroundColor Gray
Write-Host "fly secrets set MEMORY_MONITORING=true -a ai2-core-api" -ForegroundColor Gray
Write-Host "fly secrets set GC_INTERVAL_MS=30000 -a ai2-core-api" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 4: Deploy Optimized Configuration" -ForegroundColor Yellow
Write-Host "Command: fly deploy -a ai2-core-api" -ForegroundColor White
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Green
Write-Host " Memory increased from 256MB to 512MB" -ForegroundColor Green
Write-Host " AI+ services disabled (saves memory)" -ForegroundColor Green
Write-Host " Memory monitoring enabled" -ForegroundColor Green
Write-Host " OOM crashes prevented" -ForegroundColor Green
Write-Host " Cost savings from AI+ disable" -ForegroundColor Green
Write-Host ""

Write-Host "Cost Impact:" -ForegroundColor Cyan
Write-Host "Memory increase: +.25/month" -ForegroundColor White
Write-Host "AI+ disable: --10/month" -ForegroundColor White
Write-Host "Net savings: .75-8.75/month" -ForegroundColor Green
Write-Host ""

Write-Host "Verification:" -ForegroundColor Yellow
Write-Host "fly logs -a ai2-core-api | grep -i memory" -ForegroundColor White
Write-Host "curl https://ai2-core-api.fly.dev/health" -ForegroundColor White
