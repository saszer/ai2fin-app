# Health check for working services in AI2 Enterprise Platform
Write-Host "Health Check for Working Services..." -ForegroundColor Green

# Check AI modules service
Write-Host "Checking AI modules service (port 3002)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ AI modules service is running" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ AI modules service responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ AI modules service is not running or not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check shared package (no service, just verify it's built)
Write-Host "Checking shared package..." -ForegroundColor Yellow
if (Test-Path "shared/dist") {
    Write-Host "✅ Shared package is built" -ForegroundColor Green
} else {
    Write-Host "❌ Shared package is not built" -ForegroundColor Red
}

Write-Host "Health check completed!" -ForegroundColor Green 