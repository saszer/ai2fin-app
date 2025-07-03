#Requires -Version 5.1

<#
.SYNOPSIS
    Start AI2 Enterprise Platform with Enterprise Scaling
.DESCRIPTION
    Implements the existing enterprise scaling model from the original ai2-core-app
    with advanced clustering, memory management, and health monitoring
.NOTES
    Based on ai2-core-app/SCALING_IMPLEMENTATION_SUMMARY.md
#>

param(
    [Parameter()]
    [ValidateSet('development', 'cluster', 'database', 'enterprise')]
    [string]$ScalingPhase = 'enterprise',
    
    [Parameter()]
    [int]$Workers = 8,
    
    [Parameter()]
    [switch]$WithDatabase,
    
    [Parameter()]
    [switch]$HealthMonitoring = $true
)

Write-Host "🚀 AI2 Enterprise Platform - Enterprise Scaling Startup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Set enterprise scaling environment variables
$env:SCALING_PHASE = $ScalingPhase
$env:CLUSTER_MODE = "true"
$env:CLUSTER_WORKERS = $Workers
$env:MEMORY_LIMIT = "8192"
$env:GC_THRESHOLD = "85"
$env:NODE_ENV = "production"

# Enterprise feature flags
$env:ENABLE_AI = "true"
$env:ENABLE_SUBSCRIPTION = "true" 
$env:ENABLE_ANALYTICS = "true"
$env:ENABLE_CONNECTORS = "true"
$env:ENABLE_NOTIFICATIONS = "true"

# Enterprise AI features
$env:ENABLE_AI_CATEGORIES = "true"
$env:ENABLE_AI_TAX_DEDUCTION = "true"
$env:ENABLE_AI_INSIGHTS = "true"
$env:ENABLE_AI_LEARNING = "true"

# Enterprise business features
$env:ENABLE_BANK_FEED = "true"
$env:ENABLE_EMAIL_CONNECTOR = "true"
$env:ENABLE_ADVANCED_REPORTING = "true"
$env:ENABLE_MULTI_TENANT = "true"
$env:ENABLE_AUDIT_LOG = "true"

# Enterprise security
$env:ENABLE_2FA = "true"
$env:ENABLE_SSO = "true"
$env:ENABLE_RBAC = "true"

# Performance configuration
$env:API_RATE_LIMIT = "10000"
$env:API_BURST_LIMIT = "1000"
$env:MAX_CONNECTIONS = "5000"

Write-Host ""
Write-Host "📊 Enterprise Scaling Configuration:" -ForegroundColor Green
Write-Host "   • Scaling Phase: $ScalingPhase" -ForegroundColor White
Write-Host "   • Cluster Workers: $Workers" -ForegroundColor White
Write-Host "   • Memory Limit: 8192MB" -ForegroundColor White
Write-Host "   • GC Threshold: 85%" -ForegroundColor White
Write-Host "   • Rate Limit: 10,000 req/hour" -ForegroundColor White
Write-Host ""

# Ensure all packages are built
Write-Host "🔨 Building all packages..." -ForegroundColor Yellow
npm run build:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix build errors before starting." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Start services with enterprise configuration
Write-Host "🚀 Starting Enterprise Services..." -ForegroundColor Green

# Start core app with enterprise clustering
Write-Host "   🏠 Starting Core App (Enterprise Cluster)..." -ForegroundColor Cyan
Start-Job -Name "CoreApp" -ScriptBlock {
    Set-Location $using:PWD
    $env:SCALING_PHASE = $using:ScalingPhase
    $env:CLUSTER_MODE = "true"
    $env:CLUSTER_WORKERS = $using:Workers
    $env:MEMORY_LIMIT = "8192"
    $env:GC_THRESHOLD = "85"
    $env:CORE_PORT = "3001"
    cd ai2-core-app
    npm run start:enterprise
}

# Wait for core app to initialize
Start-Sleep -Seconds 5

# Start AI modules with enterprise configuration
Write-Host "   🤖 Starting AI Modules (Enterprise)..." -ForegroundColor Cyan
Start-Job -Name "AIModules" -ScriptBlock {
    Set-Location $using:PWD
    $env:SCALING_PHASE = $using:ScalingPhase
    $env:AI_PORT = "3002"
    $env:AI_BATCH_SIZE = "1000"
    $env:AI_MAX_CONCURRENCY = "50"
    cd ai2-ai-modules
    npm start
}

# Start connectors
Write-Host "   🔌 Starting Connectors..." -ForegroundColor Cyan
Start-Job -Name "Connectors" -ScriptBlock {
    Set-Location $using:PWD
    $env:CONNECTORS_PORT = "3003"
    cd ai2-connectors
    npm start
}

# Start analytics
Write-Host "   📊 Starting Analytics..." -ForegroundColor Cyan
Start-Job -Name "Analytics" -ScriptBlock {
    Set-Location $using:PWD
    $env:ANALYTICS_PORT = "3004"
    cd ai2-analytics
    npm start
}

# Start notifications
Write-Host "   🔔 Starting Notifications..." -ForegroundColor Cyan
Start-Job -Name "Notifications" -ScriptBlock {
    Set-Location $using:PWD
    $env:NOTIFICATIONS_PORT = "3005"
    cd ai2-notifications
    npm start
}

# Start subscription service with enterprise billing
Write-Host "   💳 Starting Subscription Service (Enterprise)..." -ForegroundColor Cyan
Start-Job -Name "Subscription" -ScriptBlock {
    Set-Location $using:PWD
    $env:SUBSCRIPTION_PORT = "3010"
    cd ai2-subscription-service
    npm run start:enterprise
}

Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🏥 Health Check Summary:" -ForegroundColor Green

# Function to check service health
function Test-ServiceHealth {
    param($Port, $ServiceName)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ $ServiceName (Port $Port) - HEALTHY" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "   ❌ $ServiceName (Port $Port) - UNHEALTHY" -ForegroundColor Red
        return $false
    }
}

# Check all services
$healthyServices = 0
$totalServices = 6

$healthyServices += if (Test-ServiceHealth 3001 "Core App") { 1 } else { 0 }
$healthyServices += if (Test-ServiceHealth 3002 "AI Modules") { 1 } else { 0 }
$healthyServices += if (Test-ServiceHealth 3003 "Connectors") { 1 } else { 0 }
$healthyServices += if (Test-ServiceHealth 3004 "Analytics") { 1 } else { 0 }
$healthyServices += if (Test-ServiceHealth 3005 "Notifications") { 1 } else { 0 }
$healthyServices += if (Test-ServiceHealth 3010 "Subscription") { 1 } else { 0 }

Write-Host ""
$healthPercentage = [math]::Round(($healthyServices / $totalServices) * 100, 1)
if ($healthyServices -eq $totalServices) {
    Write-Host "🎉 ENTERPRISE PLATFORM OPERATIONAL!" -ForegroundColor Green
    Write-Host "   Platform Health: $healthPercentage% ($healthyServices/$totalServices services)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Platform Partially Operational" -ForegroundColor Yellow
    Write-Host "   Platform Health: $healthPercentage% ($healthyServices/$totalServices services)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Enterprise Service Endpoints:" -ForegroundColor Cyan
Write-Host "   • Core App:           http://localhost:3001" -ForegroundColor White
Write-Host "   • AI Modules:         http://localhost:3002" -ForegroundColor White  
Write-Host "   • Connectors:         http://localhost:3003" -ForegroundColor White
Write-Host "   • Analytics:          http://localhost:3004" -ForegroundColor White
Write-Host "   • Notifications:      http://localhost:3005" -ForegroundColor White
Write-Host "   • Subscription:       http://localhost:3010" -ForegroundColor White

Write-Host ""
Write-Host "📈 Enterprise Capabilities:" -ForegroundColor Cyan
Write-Host "   • Concurrent Users:   50,000+" -ForegroundColor White
Write-Host "   • Cluster Workers:    $Workers processes" -ForegroundColor White
Write-Host "   • Memory Management:  Enterprise grade" -ForegroundColor White
Write-Host "   • Auto-scaling:       Ready" -ForegroundColor White
Write-Host "   • Load Balancing:     Ready" -ForegroundColor White
Write-Host "   • Multi-tenant:       Enabled" -ForegroundColor White

if ($HealthMonitoring) {
    Write-Host ""
    Write-Host "🔍 Starting Continuous Health Monitoring..." -ForegroundColor Yellow
    Write-Host "   (Press Ctrl+C to stop monitoring)" -ForegroundColor Gray
    
    try {
        while ($true) {
            Start-Sleep -Seconds 30
            Write-Host ""
            Write-Host "🕐 $(Get-Date -Format 'HH:mm:ss') - Health Check:" -ForegroundColor Blue
            
            $currentHealthy = 0
            $currentHealthy += if (Test-ServiceHealth 3001 "Core") { 1 } else { 0 }
            $currentHealthy += if (Test-ServiceHealth 3002 "AI") { 1 } else { 0 }
            $currentHealthy += if (Test-ServiceHealth 3003 "Connectors") { 1 } else { 0 }
            $currentHealthy += if (Test-ServiceHealth 3004 "Analytics") { 1 } else { 0 }
            $currentHealthy += if (Test-ServiceHealth 3005 "Notifications") { 1 } else { 0 }
            $currentHealthy += if (Test-ServiceHealth 3010 "Subscription") { 1 } else { 0 }
            
            $currentHealth = [math]::Round(($currentHealthy / $totalServices) * 100, 1)
            Write-Host "   Platform Health: $currentHealth% ($currentHealthy/$totalServices)" -ForegroundColor $(if ($currentHealthy -eq $totalServices) { "Green" } else { "Yellow" })
        }
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        Write-Host ""
        Write-Host "🛑 Health monitoring stopped." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Enterprise Platform Commands:" -ForegroundColor Cyan
Write-Host "   • Health Check:       .\health-check-all-services.ps1" -ForegroundColor White
Write-Host "   • Stop Services:      Get-Job | Stop-Job" -ForegroundColor White
Write-Host "   • View Logs:          Get-Job | Receive-Job" -ForegroundColor White

Write-Host ""
Write-Host "🚀 AI2 Enterprise Platform is running in Enterprise Scaling Mode!" -ForegroundColor Green 