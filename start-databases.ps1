# AI2 Database Startup Script
# embracingearth.space - Enterprise database management

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  AI2 DATABASE STARTUP SCRIPT" -ForegroundColor BrightWhite
Write-Host "===========================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`nChecking Docker status..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not running" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and start it" -ForegroundColor Yellow
    exit 1
}

# Function to start database services
function Start-DatabaseServices {
    param(
        [string]$ServicePath,
        [string]$ServiceName
    )
    
    Write-Host "`nStarting $ServiceName database..." -ForegroundColor Yellow
    
    if (Test-Path $ServicePath) {
        Push-Location $ServicePath
        try {
            # Start PostgreSQL and Redis
            Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Blue
            docker-compose up -d postgres redis
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $ServiceName database services started" -ForegroundColor Green
                
                # Wait for database to be ready
                Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
                Start-Sleep -Seconds 15
                
                # Run migrations
                Write-Host "Running database migrations..." -ForegroundColor Blue
                npx prisma migrate deploy
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ $ServiceName migrations completed" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Migration failed for $ServiceName" -ForegroundColor Yellow
                }
            } else {
                Write-Host "❌ Failed to start $ServiceName database services" -ForegroundColor Red
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "❌ Service path not found: $ServicePath" -ForegroundColor Red
    }
}

# Create environment files if they don't exist
function Create-EnvironmentFiles {
    Write-Host "`nChecking environment files..." -ForegroundColor Yellow
    
    # Core App .env
    $coreEnvPath = "ai2-core-app\.env"
    if (-not (Test-Path $coreEnvPath)) {
        Write-Host "Creating core app .env file..." -ForegroundColor Blue
        Copy-Item "ai2-core-app\env.example" $coreEnvPath
        Write-Host "✅ Core app .env created" -ForegroundColor Green
    } else {
        Write-Host "✅ Core app .env exists" -ForegroundColor Green
    }
    
    # Subscription Service .env
    $subsEnvPath = "ai2-subscription-service\.env"
    if (-not (Test-Path $subsEnvPath)) {
        Write-Host "Creating subscription service .env file..." -ForegroundColor Blue
        Copy-Item "ai2-subscription-service\env.example" $subsEnvPath
        Write-Host "✅ Subscription service .env created" -ForegroundColor Green
    } else {
        Write-Host "✅ Subscription service .env exists" -ForegroundColor Green
    }
}

# Main execution
try {
    # Create environment files
    Create-EnvironmentFiles
    
    # Start Core App Database
    Start-DatabaseServices -ServicePath "ai2-core-app" -ServiceName "Core App"
    
    # Start Subscription Service Database
    Start-DatabaseServices -ServicePath "ai2-subscription-service" -ServiceName "Subscription Service"
    
    # Check final status
    Write-Host "`n===========================================" -ForegroundColor Cyan
    Write-Host "  DATABASE STARTUP COMPLETE" -ForegroundColor BrightWhite
    Write-Host "===========================================" -ForegroundColor Cyan
    
    Write-Host "`nChecking running containers..." -ForegroundColor Yellow
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host "`n✅ Database services should now be running!" -ForegroundColor Green
    Write-Host "You can now start your applications:" -ForegroundColor Cyan
    Write-Host "  - Core App: cd ai2-core-app && npm start" -ForegroundColor White
    Write-Host "  - Subscription Service: cd ai2-subscription-service && npm start" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error during database startup: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")





