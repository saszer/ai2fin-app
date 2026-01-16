# Wazuh Local Development Startup Script
# embracingearth.space - Enterprise Security Monitoring
# This script starts Wazuh Manager, Indexer, and Dashboard locally using Docker Compose

Write-Host "🔒 Starting Wazuh SIEM/XDR Platform Locally" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue) -and -not (Get-Command docker -ErrorAction SilentlyContinue).Source.Contains("compose")) {
    Write-Host "❌ docker-compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file. Please edit it and set your passwords!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Edit .env file and set secure passwords before continuing!" -ForegroundColor Red
        Write-Host "   Press any key after you've set your passwords..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Write-Host "❌ .env.example not found. Cannot create .env file." -ForegroundColor Red
        exit 1
    }
}

# Generate secure password if WAZUH_API_PASSWORD is not set or is placeholder
$envContent = Get-Content ".env" -Raw
if ($envContent -match "WAZUH_API_PASSWORD=your-secure-password-here" -or $envContent -match "WAZUH_API_PASSWORD=$") {
    Write-Host "🔑 Generating secure Wazuh API password..." -ForegroundColor Yellow
    $securePassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $envContent = $envContent -replace "WAZUH_API_PASSWORD=.*", "WAZUH_API_PASSWORD=$securePassword"
    Set-Content -Path ".env" -Value $envContent -NoNewline
    Write-Host "✅ Generated Wazuh API password: $securePassword" -ForegroundColor Green
    Write-Host "   (Saved to .env file)" -ForegroundColor Gray
}

# Load environment variables
Write-Host "📋 Loading environment variables..." -ForegroundColor Yellow
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($value -and $value -ne "") {
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Generate Dashboard configuration
Write-Host "🔧 Generating Dashboard configuration..." -ForegroundColor Yellow
& "$PSScriptRoot/generate-dashboard-config.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Dashboard configuration" -ForegroundColor Red
    exit 1
}

# Check if services are already running
Write-Host "🔍 Checking for existing Wazuh containers..." -ForegroundColor Yellow
$existingContainers = docker ps -a --filter "name=wazuh-" --format "{{.Names}}"
if ($existingContainers) {
    Write-Host "⚠️  Found existing Wazuh containers:" -ForegroundColor Yellow
    $existingContainers | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    Write-Host ""
    $response = Read-Host "Do you want to stop and remove existing containers? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose.local.yml down
        Write-Host "✅ Stopped existing containers" -ForegroundColor Green
    }
}

# Start services
Write-Host ""
Write-Host "🚀 Starting Wazuh services..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes on first start (Indexer initialization)" -ForegroundColor Gray
Write-Host ""

docker-compose -f docker-compose.local.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Wazuh services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    Write-Host "   Manager API:   https://localhost:55000" -ForegroundColor White
    Write-Host "   Dashboard UI:   http://localhost:5601" -ForegroundColor White
    Write-Host "   Indexer API:    https://localhost:9200" -ForegroundColor White
    Write-Host ""
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Write-Host "   (This can take 5-10 minutes on first start)" -ForegroundColor Gray
    Write-Host ""
    
    # Wait for services to be healthy
    $maxWait = 600  # 10 minutes
    $elapsed = 0
    $checkInterval = 10
    
    while ($elapsed -lt $maxWait) {
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval
        
        $managerHealth = docker inspect --format='{{.State.Health.Status}}' wazuh-manager 2>$null
        $indexerHealth = docker inspect --format='{{.State.Health.Status}}' wazuh-indexer 2>$null
        $dashboardHealth = docker inspect --format='{{.State.Health.Status}}' wazuh-dashboard 2>$null
        
        Write-Host "   Manager: $managerHealth | Indexer: $indexerHealth | Dashboard: $dashboardHealth" -ForegroundColor Gray
        
        if ($managerHealth -eq "healthy" -and $indexerHealth -eq "healthy" -and $dashboardHealth -eq "healthy") {
            Write-Host ""
            Write-Host "✅ All services are healthy!" -ForegroundColor Green
            break
        }
    }
    
    Write-Host ""
    Write-Host "📋 Access Information:" -ForegroundColor Cyan
    Write-Host "   Dashboard URL: http://localhost:5601" -ForegroundColor White
    Write-Host "   Username: $env:WAZUH_API_USER" -ForegroundColor Yellow
    Write-Host "   Password: (check .env file for WAZUH_API_PASSWORD)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   View logs:     docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor White
    Write-Host "   Stop services: docker-compose -f docker-compose.local.yml down" -ForegroundColor White
    Write-Host "   View status:   docker-compose -f docker-compose.local.yml ps" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 embracingearth.space - Enterprise Security Monitoring" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Failed to start Wazuh services. Check logs:" -ForegroundColor Red
    Write-Host "   docker-compose -f docker-compose.local.yml logs" -ForegroundColor Yellow
    exit 1
}
