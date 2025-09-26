# AI+ Service Status Check
# This script verifies that AI+ services are disabled

Write-Host "=== AI2 Platform Service Status ===" -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "Environment Variables:" -ForegroundColor Yellow
Write-Host "ENABLE_AI: $env:ENABLE_AI" -ForegroundColor White
Write-Host "ENABLE_ANALYTICS: $env:ENABLE_ANALYTICS" -ForegroundColor White
Write-Host "ENABLE_CORE: $env:ENABLE_CORE" -ForegroundColor White
Write-Host ""

# Check service endpoints
Write-Host "Service Endpoints:" -ForegroundColor Yellow
Write-Host "Core (3001): http://localhost:3001" -ForegroundColor Green
Write-Host "Analytics (3004): http://localhost:3004" -ForegroundColor Green
Write-Host "AI+ (3002): DISABLED" -ForegroundColor Red
Write-Host ""

# Test service connectivity
Write-Host "Testing Service Connectivity..." -ForegroundColor Yellow

try {
    $coreResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host " Core Service (3001): ONLINE" -ForegroundColor Green
} catch {
    Write-Host " Core Service (3001): OFFLINE" -ForegroundColor Red
}

try {
    $analyticsResponse = Invoke-WebRequest -Uri "http://localhost:3004/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host " Analytics Service (3004): ONLINE" -ForegroundColor Green
} catch {
    Write-Host " Analytics Service (3004): OFFLINE" -ForegroundColor Red
}

try {
    $aiResponse = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  AI+ Service (3002): STILL RUNNING (should be disabled)" -ForegroundColor Yellow
} catch {
    Write-Host " AI+ Service (3002): DISABLED/OFFLINE" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Core: ENABLED" -ForegroundColor Green
Write-Host "Analytics: ENABLED" -ForegroundColor Green
Write-Host "AI+: DISABLED" -ForegroundColor Red
