# Simple Service Startup Script
# embracingearth.space - Direct service startup without Docker

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  STARTING AI2 CORE AND SUBSCRIPTION SERVICES" -ForegroundColor BrightWhite
Write-Host "===========================================" -ForegroundColor Cyan

# Function to start a service
function Start-Service {
    param(
        [string]$ServicePath,
        [string]$ServiceName,
        [string]$Port
    )
    
    Write-Host "`nStarting $ServiceName..." -ForegroundColor Yellow
    
    if (Test-Path $ServicePath) {
        # Start the service in a new PowerShell window
        $command = "cd '$ServicePath'; npm start"
        Start-Process powershell -ArgumentList "-Command", $command -WindowStyle Normal
        
        Write-Host "$ServiceName started on port $Port" -ForegroundColor Green
        Write-Host "   URL: http://localhost:$Port" -ForegroundColor Blue
    } else {
        Write-Host "❌ Service path not found: $ServicePath" -ForegroundColor Red
    }
}

# Start Core App
Start-Service -ServicePath "ai2-core-app" -ServiceName "Core App" -Port "3001"

# Wait a moment
Start-Sleep -Seconds 3

# Start Subscription Service  
Start-Service -ServicePath "ai2-subscription-service" -ServiceName "Subscription Service" -Port "3000"

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "  SERVICES STARTED" -ForegroundColor BrightWhite
Write-Host "===========================================" -ForegroundColor Cyan

Write-Host "`nBoth services are starting in separate windows:" -ForegroundColor Green
Write-Host "  • Core App: http://localhost:3001" -ForegroundColor Blue
Write-Host "  • Subscription Service: http://localhost:3000" -ForegroundColor Blue

Write-Host "`nNote: If you see database connection errors:" -ForegroundColor Yellow
Write-Host "  1. The services will use SQLite for local development" -ForegroundColor Yellow
Write-Host "  2. Check the console windows for any error messages" -ForegroundColor Yellow
Write-Host "  3. Database files will be created automatically" -ForegroundColor Yellow

Write-Host "`nServices should be ready in 10-15 seconds!" -ForegroundColor Green
