#!/usr/bin/env pwsh
# AI2 Full Integration Startup Script
# Connects AI2 Core + Subscription Service + Frontend

param(
    [Parameter(Mandatory=$false)]
    [switch]$Stop,
    
    [Parameter(Mandatory=$false)]
    [switch]$Status,
    
    [Parameter(Mandatory=$false)]
    [switch]$Test,
    
    [Parameter(Mandatory=$false)]
    [switch]$Docker
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info { param([string]$Message) Write-Host "INFO: $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "SUCCESS: $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "WARNING: $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "ERROR: $Message" -ForegroundColor Red }

# Configuration
$AI2_DIR = "AI2"
$SUBSCRIPTION_DIR = "ai2-subscription-service"
$CORE_PORT = 3001
$SUBSCRIPTION_PORT = 3010
$FRONTEND_PORT = 3000

function Stop-AllServices {
    Write-Info "Stopping all services..."
    
    # Stop Node.js processes
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
    
    # Stop Docker containers if running
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker-compose -f "$SUBSCRIPTION_DIR/docker-compose.yml" down -v 2>$null
    }
    
    Write-Success "All services stopped"
}

function Show-Status {
    Write-Info "Checking service status..."
    
    $services = @(
        @{ Name = "AI2 Core"; URL = "http://localhost:$CORE_PORT/health" }
        @{ Name = "Subscription Service"; URL = "http://localhost:$SUBSCRIPTION_PORT/health" }
        @{ Name = "Frontend"; URL = "http://localhost:$FRONTEND_PORT" }
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "$($service.Name) is running"
            } else {
                Write-Warning "$($service.Name) responded with status $($response.StatusCode)"
            }
        } catch {
            Write-Error "$($service.Name) is not responding"
        }
    }
}

function Test-Integration {
    Write-Info "Testing integration..."
    
    # Test subscription integration
    if (Test-Path "$AI2_DIR/test-subscription-integration.js") {
        Write-Info "Running subscription integration test..."
        Set-Location $AI2_DIR
        node test-subscription-integration.js
        Set-Location ..
    }
    
    # Test API endpoints
    $endpoints = @(
        "http://localhost:$CORE_PORT/api/health",
        "http://localhost:$SUBSCRIPTION_PORT/api/subscription/plans"
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 5
            Write-Success "✅ $endpoint - Status: $($response.StatusCode)"
        } catch {
            Write-Error "❌ $endpoint - Not responding"
        }
    }
}

function Start-WithDocker {
    Write-Info "Starting with Docker Compose..."
    
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker not found. Please install Docker Desktop."
        exit 1
    }
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    } catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        exit 1
    }
    
    Set-Location $SUBSCRIPTION_DIR
    
    # Create environment file if it doesn't exist
    if (!(Test-Path ".env")) {
        Copy-Item "env.example" ".env"
        Write-Info "Created .env file from template"
    }
    
    # Start services
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker services started successfully!"
        Write-Info "Waiting for services to be ready..."
        Start-Sleep -Seconds 15
        
        Show-Status
    } else {
        Write-Error "Failed to start Docker services"
        exit 1
    }
    
    Set-Location ..
}

function Start-WithoutDocker {
    Write-Info "Starting services without Docker..."
    
    # Create environment files
    Create-EnvironmentFiles
    
    # Start AI2 Core
    Write-Info "Starting AI2 Core..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $AI2_DIR; npm run dev:server"
    Start-Sleep 5
    
    # Start Subscription Service
    Write-Info "Starting Subscription Service..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $SUBSCRIPTION_DIR; npm run dev:gateway"
    Start-Sleep 5
    
    # Start Frontend
    Write-Info "Starting Frontend..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $AI2_DIR/client; npm start"
    Start-Sleep 10
    
    Write-Success "All services started!"
    Show-Status
}

function Create-EnvironmentFiles {
    Write-Info "Setting up environment configuration..."
    
    # AI2 Core .env
    $ai2EnvPath = "$AI2_DIR/.env"
    if (!(Test-Path $ai2EnvPath)) {
        $ai2EnvContent = @"
# AI2 Core Configuration
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./aifin.db"
JWT_SECRET="ai2-dev-jwt-secret-$(Get-Random)"
OPENAI_API_KEY="your-openai-api-key-here"

# Subscription Service Integration
REACT_APP_SUBSCRIPTION_API_URL=http://localhost:$SUBSCRIPTION_PORT
SUBSCRIPTION_API_URL=http://localhost:$SUBSCRIPTION_PORT
"@
        $ai2EnvContent | Out-File -FilePath $ai2EnvPath -Encoding UTF8
        Write-Info "Created AI2 Core .env file"
    }
    
    # Subscription Service .env
    $subEnvPath = "$SUBSCRIPTION_DIR/.env"
    if (!(Test-Path $subEnvPath)) {
        $subEnvContent = @"
# Subscription Service Configuration
NODE_ENV=development
PORT=$SUBSCRIPTION_PORT
JWT_SECRET="ai2-dev-jwt-secret-$(Get-Random)"
SUBSCRIPTION_SECRET="ai2-dev-subscription-secret-$(Get-Random)"
DATABASE_URL="postgresql://ai2_user:ai2_password@localhost:5432/ai2_subscription"
REDIS_URL="redis://localhost:6379"
STRIPE_SECRET_KEY="your-stripe-secret-key"
AI2_CORE_URL="http://localhost:$CORE_PORT"
"@
        $subEnvContent | Out-File -FilePath $subEnvPath -Encoding UTF8
        Write-Info "Created Subscription Service .env file"
    }
}

function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    # AI2 Core dependencies
    if (Test-Path "$AI2_DIR/package.json") {
        Write-Info "Installing AI2 Core dependencies..."
        Set-Location $AI2_DIR
        npm install
        Set-Location ..
    }
    
    # AI2 Client dependencies
    if (Test-Path "$AI2_DIR/client/package.json") {
        Write-Info "Installing AI2 Client dependencies..."
        Set-Location "$AI2_DIR/client"
        npm install
        Set-Location ../..
    }
    
    # Subscription Service dependencies
    if (Test-Path "$SUBSCRIPTION_DIR/package.json") {
        Write-Info "Installing Subscription Service dependencies..."
        Set-Location $SUBSCRIPTION_DIR
        npm install
        Set-Location ..
    }
}

# Main execution
try {
    Write-Host "AI2 Full Integration Startup" -ForegroundColor Magenta
    Write-Host "=================================" -ForegroundColor Magenta
    
    if ($Stop) {
        Stop-AllServices
        exit 0
    }
    
    if ($Status) {
        Show-Status
        exit 0
    }
    
    if ($Test) {
        Test-Integration
        exit 0
    }
    
    # Check if directories exist
    if (!(Test-Path $AI2_DIR)) {
        Write-Error "AI2 directory not found: $AI2_DIR"
        exit 1
    }
    
    if (!(Test-Path $SUBSCRIPTION_DIR)) {
        Write-Error "Subscription service directory not found: $SUBSCRIPTION_DIR"
        exit 1
    }
    
    # Install dependencies if needed
    if (!(Test-Path "$AI2_DIR/node_modules")) {
        Install-Dependencies
    }
    
    # Start services
    if ($Docker) {
        Start-WithDocker
    } else {
        Start-WithoutDocker
    }
    
    Write-Host ""
    Write-Host "AI2 Full Integration is ready!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "Frontend:        http://localhost:$FRONTEND_PORT" -ForegroundColor White
    Write-Host "AI2 Core API:    http://localhost:$CORE_PORT" -ForegroundColor White
    Write-Host "Subscription API: http://localhost:$SUBSCRIPTION_PORT" -ForegroundColor White
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Cyan
    Write-Host "  • AI-powered financial management" -ForegroundColor White
    Write-Host "  • Subscription-based AI usage" -ForegroundColor White
    Write-Host "  • Token-based access control" -ForegroundColor White
    Write-Host "  • Real-time analytics" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  • Status: .\start-full-integration.ps1 -Status" -ForegroundColor White
    Write-Host "  • Test:   .\start-full-integration.ps1 -Test" -ForegroundColor White
    Write-Host "  • Stop:   .\start-full-integration.ps1 -Stop" -ForegroundColor White
    Write-Host "  • Docker: .\start-full-integration.ps1 -Docker" -ForegroundColor White
    
} catch {
    Write-Error "Startup failed: $($_.Exception.Message)"
    exit 1
} 