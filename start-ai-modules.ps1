#!/usr/bin/env pwsh

# 🚀 Start AI Modules Service Script
# This script ensures the AI modules service starts correctly on port 3002

Write-Host "🚀 Starting AI Modules Service..." -ForegroundColor Green
Write-Host "=" * 50

# Check if port 3002 is already in use
$portCheck = netstat -an | findstr ":3002"
if ($portCheck) {
    Write-Host "⚠️ Port 3002 is already in use:" -ForegroundColor Yellow
    Write-Host $portCheck
    Write-Host ""
    
    $choice = Read-Host "Do you want to kill existing processes on port 3002? (y/N)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        # Find and kill processes using port 3002
        $processes = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Write-Host "🔪 Killing process $processId" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep 2
    }
}

# Change to AI modules directory
if (Test-Path "ai2-ai-modules") {
    Set-Location "ai2-ai-modules"
    Write-Host "📁 Changed to ai2-ai-modules directory" -ForegroundColor Blue
} else {
    Write-Host "❌ ai2-ai-modules directory not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root" -ForegroundColor Red
    exit 1
}

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in ai2-ai-modules!" -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ No .env file found in ai2-ai-modules" -ForegroundColor Yellow
    Write-Host "🔧 Copying from parent directory..." -ForegroundColor Blue
    
    if (Test-Path "../.env") {
        Copy-Item "../.env" ".env"
        Write-Host "✅ Copied .env file" -ForegroundColor Green
    } else {
        Write-Host "❌ No .env file found in parent directory either!" -ForegroundColor Red
        Write-Host "Please create a .env file with your OpenAI API key" -ForegroundColor Red
    }
}

# Start the service
Write-Host ""
Write-Host "🚀 Starting AI Modules Service on port 3002..." -ForegroundColor Green
Write-Host "📝 Logs will appear below. Press Ctrl+C to stop." -ForegroundColor Blue
Write-Host ""

# Start with proper error handling
try {
    npm start
} catch {
    Write-Host "❌ Failed to start AI modules service!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 