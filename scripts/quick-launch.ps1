# 🚀 AI2 Platform Quick Launch Script (PowerShell)
# embracingearth.space - Automated deployment setup

param(
    [switch]$SkipPrerequisites,
    [switch]$SkipDeploy,
    [switch]$StagingOnly
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting AI2 Platform Launch..." -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required tools are installed
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm found: $npmVersion"
    }
    catch {
        Write-Error "npm is not installed"
        exit 1
    }
    
    # Check flyctl
    try {
        $flyVersion = flyctl version
        Write-Success "flyctl found: $flyVersion"
    }
    catch {
        Write-Warning "flyctl not found. Please install from https://fly.io/install.sh"
    }
    
    # Check gcloud
    try {
        $gcloudVersion = gcloud --version | Select-Object -First 1
        Write-Success "gcloud found: $gcloudVersion"
    }
    catch {
        Write-Warning "gcloud not found. Please install Google Cloud SDK"
        Write-Status "Visit: https://cloud.google.com/sdk/docs/install"
    }
    
    Write-Success "Prerequisites check completed"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install service dependencies
    $services = @("ai2-core-app", "ai2-ai-modules", "ai2-connectors", "ai2-analytics", "ai2-notifications", "ai2-subscription-service")
    
    foreach ($service in $services) {
        Write-Status "Installing dependencies for $service"
        Set-Location $service
        npm install
        Set-Location ..
    }
    
    Write-Success "Dependencies installed"
}

# Setup Fly.io apps
function Setup-FlyApps {
    Write-Status "Setting up Fly.io applications..."
    
    # Check if apps exist
    $apps = flyctl apps list 2>$null | Select-String "ai2-"
    
    # Create staging app
    if ($apps -notmatch "ai2-staging") {
        flyctl launch --name ai2-staging --no-deploy --copy-config fly.staging.toml
        Write-Success "Created ai2-staging app"
    }
    else {
        Write-Status "ai2-staging app already exists"
    }
    
    # Create production app
    if ($apps -notmatch "ai2-production") {
        flyctl launch --name ai2-production --no-deploy --copy-config fly.toml
        Write-Success "Created ai2-production app"
    }
    else {
        Write-Status "ai2-production app already exists"
    }
}

# Setup GCP project
function Setup-GCP {
    Write-Status "Setting up GCP project..."
    
    # Create project if it doesn't exist
    try {
        gcloud projects describe ai2-production 2>$null
        Write-Status "GCP project ai2-production already exists"
    }
    catch {
        gcloud projects create ai2-production --name="AI2 Production"
        Write-Success "Created GCP project: ai2-production"
    }
    
    # Set project
    gcloud config set project ai2-production
    
    # Enable required APIs
    $apis = @("cloudsql.googleapis.com", "secretmanager.googleapis.com", "storage.googleapis.com", "redis.googleapis.com")
    
    foreach ($api in $apis) {
        gcloud services enable $api
    }
    
    Write-Success "GCP setup completed"
}

# Create database
function Create-Database {
    Write-Status "Creating production database..."
    
    # Create Cloud SQL instance
    try {
        gcloud sql instances describe ai2-main 2>$null
        Write-Status "Cloud SQL instance ai2-main already exists"
    }
    catch {
        $password = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        
        gcloud sql instances create ai2-main `
            --database-version=POSTGRES_15 `
            --tier=db-f1-micro `
            --region=us-central1 `
            --root-password=$password `
            --storage-type=SSD `
            --storage-size=10GB `
            --backup-start-time=23:00 `
            --maintenance-window-day=SUN `
            --maintenance-window-hour=02
        
        Write-Success "Created Cloud SQL instance: ai2-main"
    }
    
    # Create database
    try {
        gcloud sql databases create ai2_production --instance=ai2-main
    }
    catch {
        Write-Status "Database ai2_production already exists or creation failed"
    }
    
    # Create user
    try {
        $userPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        gcloud sql users create ai2_user --instance=ai2-main --password=$userPassword
    }
    catch {
        Write-Status "User ai2_user already exists or creation failed"
    }
    
    Write-Success "Database setup completed"
}

# Deploy to staging
function Deploy-Staging {
    Write-Status "Deploying to staging..."
    
    # Build and deploy
    npm run build:all
    flyctl deploy --app ai2-staging
    
    # Wait for deployment
    Start-Sleep -Seconds 30
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "https://ai2-staging.fly.dev/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Staging deployment successful"
            Write-Status "Staging URL: https://ai2-staging.fly.dev"
        }
        else {
            throw "Health check failed"
        }
    }
    catch {
        Write-Error "Staging deployment failed"
        exit 1
    }
}

# Deploy to production
function Deploy-Production {
    Write-Status "Deploying to production..."
    
    # Build and deploy
    npm run build:all
    flyctl deploy --app ai2-production
    
    # Wait for deployment
    Start-Sleep -Seconds 30
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "https://ai2-production.fly.dev/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Production deployment successful"
            Write-Status "Production URL: https://ai2-production.fly.dev"
        }
        else {
            throw "Health check failed"
        }
    }
    catch {
        Write-Error "Production deployment failed"
        exit 1
    }
}

# Setup monitoring
function Setup-Monitoring {
    Write-Status "Setting up monitoring..."
    
    # Create status page directory
    New-Item -ItemType Directory -Force -Path "infrastructure/status-page" | Out-Null
    
    # Deploy status page (if Docker is available)
    try {
        Set-Location "infrastructure/status-page"
        docker-compose up -d
        Set-Location "../.."
        Write-Success "Status page deployed"
    }
    catch {
        Write-Warning "Status page deployment skipped (Docker not available)"
    }
    
    Write-Success "Monitoring setup completed"
}

# Main execution
function Main {
    Write-Host "🎯 AI2 Platform Quick Launch" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    # Check prerequisites
    if (-not $SkipPrerequisites) {
        Test-Prerequisites
    }
    
    # Install dependencies
    Install-Dependencies
    
    # Setup infrastructure
    Setup-FlyApps
    Setup-GCP
    Create-Database
    
    # Deploy applications
    if (-not $SkipDeploy) {
        Deploy-Staging
        
        if (-not $StagingOnly) {
            Deploy-Production
        }
    }
    
    # Setup monitoring
    Setup-Monitoring
    
    Write-Host ""
    Write-Host "🎉 Launch completed successfully!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "📱 Staging: https://ai2-staging.fly.dev" -ForegroundColor Yellow
    if (-not $StagingOnly) {
        Write-Host "🚀 Production: https://ai2-production.fly.dev" -ForegroundColor Yellow
    }
    Write-Host "📊 Status Page: http://localhost:3001 (if deployed)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Configure domain: app.embracingearth.space" -ForegroundColor White
    Write-Host "2. Set up Cloudflare DNS and SSL" -ForegroundColor White
    Write-Host "3. Configure GitHub secrets for CI/CD" -ForegroundColor White
    Write-Host "4. Test all features on staging" -ForegroundColor White
    Write-Host "5. Monitor production deployment" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "- Launch Checklist: LAUNCH_CHECKLIST.md" -ForegroundColor White
    Write-Host "- Deployment Guide: DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
    Write-Host "- PWA Guide: PWA_APP_STORE_INTEGRATION.md" -ForegroundColor White
}

# Run main function
Main 