# AI2 Subscription System Startup Script
Write-Host "🚀 Starting AI2 Subscription System..." -ForegroundColor Green

# Function to test if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    }
    catch {
        return $false
    }
}

# Function to kill processes on a port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($processes) {
            foreach ($process in $processes) {
                Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process $process on port $Port" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "Could not kill processes on port $Port" -ForegroundColor Yellow
    }
}

# Check and clear ports
Write-Host "Checking ports..." -ForegroundColor Cyan

if (Test-Port -Port 3001) {
    Write-Host "Port 3001 (Core App) is in use. Stopping existing process..." -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 3001
}

if (Test-Port -Port 3006) {
    Write-Host "Port 3006 (Subscription Service) is in use. Stopping existing process..." -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 3006
}

# Wait a moment for processes to stop
Start-Sleep -Seconds 2

# Start subscription service
Write-Host "Starting Subscription Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'ai2-subscription-service'; npm run build; npm start" -WindowStyle Normal

# Wait for subscription service to start
Write-Host "Waiting for subscription service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if subscription service is running
$retries = 0
while ($retries -lt 10) {
    if (Test-Port -Port 3006) {
        Write-Host "Subscription Service is running on port 3006" -ForegroundColor Green
        break
    }
    $retries++
    Write-Host "Waiting for subscription service... (attempt $retries/10)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if ($retries -eq 10) {
    Write-Host "Subscription Service failed to start" -ForegroundColor Red
    exit 1
}

# Start core app
Write-Host "Starting Core App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'ai2-core-app'; npm run build; npm start" -WindowStyle Normal

# Wait for core app to start
Write-Host "Waiting for core app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if core app is running
$retries = 0
while ($retries -lt 10) {
    if (Test-Port -Port 3001) {
        Write-Host "Core App is running on port 3001" -ForegroundColor Green
        break
    }
    $retries++
    Write-Host "Waiting for core app... (attempt $retries/10)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if ($retries -eq 10) {
    Write-Host "Core App failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "AI2 Subscription System is ready!" -ForegroundColor Green
Write-Host "Core App: http://localhost:3001" -ForegroundColor White
Write-Host "Subscription Service: http://localhost:3006" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Available endpoints:" -ForegroundColor Cyan
Write-Host "  /api/subscription/plans - View available plans" -ForegroundColor Gray
Write-Host "  /api/subscription/status - Check subscription status" -ForegroundColor Gray
Write-Host "  /api/subscription/create - Create new subscription" -ForegroundColor Gray
Write-Host "  /api/subscription/cancel - Cancel subscription" -ForegroundColor Gray
Write-Host "  /api/subscription/feature/:feature - Check feature access" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "To stop all services, close the PowerShell windows or run:" -ForegroundColor Yellow
Write-Host "  taskkill /F /IM node.exe" -ForegroundColor Gray 