# Health check for all services in AI2 Enterprise Platform
Write-Host "AI2 Enterprise Platform - Full Health Check" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

$services = @(
    @{ Name = "Core App"; Port = 3001; Url = "http://localhost:3001/health" },
    @{ Name = "AI Modules"; Port = 3002; Url = "http://localhost:3002/health" },
    @{ Name = "Connectors"; Port = 3003; Url = "http://localhost:3003/health" },
    @{ Name = "Analytics"; Port = 3004; Url = "http://localhost:3004/health" },
    @{ Name = "Notifications"; Port = 3005; Url = "http://localhost:3005/health" },
    @{ Name = "Subscription Service"; Port = 3010; Url = "http://localhost:3010/health" }
)

$healthyServices = 0
$totalServices = $services.Count

foreach ($service in $services) {
    Write-Host "Checking $($service.Name) (port $($service.Port))..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "PASS: $($service.Name) is healthy" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            Write-Host "  Version: $($data.version)" -ForegroundColor Gray
            Write-Host "  Status: $($data.status)" -ForegroundColor Gray
            $healthyServices++
        } else {
            Write-Host "WARN: $($service.Name) responded with status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "FAIL: $($service.Name) is not responding" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "Health Check Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Healthy Services: $healthyServices / $totalServices" -ForegroundColor Cyan

$healthPercentage = [math]::Round(($healthyServices / $totalServices) * 100, 1)
Write-Host "Platform Health: $healthPercentage%" -ForegroundColor Cyan

if ($healthyServices -eq $totalServices) {
    Write-Host "STATUS: ALL SYSTEMS OPERATIONAL" -ForegroundColor Green
} elseif ($healthyServices -ge ($totalServices * 0.8)) {
    Write-Host "STATUS: MOSTLY OPERATIONAL" -ForegroundColor Yellow
} else {
    Write-Host "STATUS: SERVICE ISSUES DETECTED" -ForegroundColor Red
}

Write-Host ""
Write-Host "Service Endpoints:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
foreach ($service in $services) {
    $status = if ($healthyServices -eq $totalServices) { "ONLINE" } else { "CHECK" }
    Write-Host "$($service.Name): http://localhost:$($service.Port)" -ForegroundColor Cyan
}

# Test specific endpoints if all services are healthy
if ($healthyServices -eq $totalServices) {
    Write-Host ""
    Write-Host "Testing Key Endpoints..." -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    
    # Test AI analysis endpoint
    try {
        $testTransaction = @{
            description = "Health Check Transaction"
            amount = -10.00
            date = (Get-Date).ToString("yyyy-MM-dd")
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/ai/analyze-transaction" -Method POST -Headers @{"Content-Type"="application/json"} -Body $testTransaction
        Write-Host "PASS: AI Analysis endpoint working" -ForegroundColor Green
    } catch {
        Write-Host "WARN: AI Analysis endpoint issue" -ForegroundColor Yellow
    }
    
    # Test Core transactions endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/core/transactions?limit=1"
        Write-Host "PASS: Core Transactions endpoint working" -ForegroundColor Green
    } catch {
        Write-Host "WARN: Core Transactions endpoint issue" -ForegroundColor Yellow
    }
    
    # Test Subscription plans endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3010/api/subscription/plans"
        Write-Host "PASS: Subscription Plans endpoint working" -ForegroundColor Green
    } catch {
        Write-Host "WARN: Subscription Plans endpoint issue" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Health check completed!" -ForegroundColor Green 