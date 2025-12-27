# Quick Health Check Verification Script
# Run this to verify Fly.io health check is working
# embracingearth.space

Write-Host "🔍 Checking Wazuh Health Status..." -ForegroundColor Cyan
Write-Host ""

# 1. Check Fly.io health checks
Write-Host "1️⃣ Fly.io Health Check Status:" -ForegroundColor Yellow
fly checks list -a ai2-wazuh
Write-Host ""

# 2. Check if port is listening (via SSH)
Write-Host "2️⃣ Checking if port 5601 is listening..." -ForegroundColor Yellow
$portCheck = fly ssh console -a ai2-wazuh -C "netstat -tlnp 2>/dev/null | grep 5601 || ss -tlnp 2>/dev/null | grep 5601 || echo 'Port not found'"
Write-Host $portCheck
Write-Host ""

# 3. Test Dashboard endpoint
Write-Host "3️⃣ Testing Dashboard endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://ai2-wazuh.fly.dev/api/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Dashboard responding: HTTP $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Dashboard not responding: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Check recent logs
Write-Host "4️⃣ Recent Dashboard logs (last 20 lines):" -ForegroundColor Yellow
fly logs -a ai2-wazuh 2>&1 | Select-String -Pattern "dashboard|5601|health" | Select-Object -Last 20
Write-Host ""

Write-Host "✅ Health check verification complete!" -ForegroundColor Green

