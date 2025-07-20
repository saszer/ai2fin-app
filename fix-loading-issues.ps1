#!/usr/bin/env powershell

# 🔧 FIX LOADING ISSUES - COMPREHENSIVE SOLUTION
# ===============================================
# This script fixes all pages stuck on loading by restarting services properly

Write-Host "🔧 FIXING LOADING ISSUES" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop all Node.js processes
Write-Host "1. 🛑 Stopping all Node.js processes..." -ForegroundColor Red
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ All Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  No Node.js processes to stop" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Wait for cleanup
Write-Host "2. ⏳ Waiting for system cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 3: Start backend service
Write-Host "3. 🚀 Starting backend service..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location "D:\embracingearthspace\ai2-core-app"
    npm start
}

Write-Host "   📊 Backend job started (ID: $($backendJob.Id))" -ForegroundColor Green

# Step 4: Wait for backend to start
Write-Host "4. ⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 5: Test backend health
Write-Host "5. 🏥 Testing backend health..." -ForegroundColor Cyan
$backendHealthy = $false
for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
        if ($response.status -eq "healthy") {
            Write-Host "   ✅ Backend is healthy!" -ForegroundColor Green
            $backendHealthy = $true
            break
        } else {
            Write-Host "   ⚠️  Backend status: $($response.status) (attempt $i/6)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Backend not responding (attempt $i/6)" -ForegroundColor Red
    }
    
    if ($i -lt 6) {
        Start-Sleep -Seconds 5
    }
}

if (-not $backendHealthy) {
    Write-Host "   💥 Backend failed to start properly!" -ForegroundColor Red
    Write-Host "      Check console output for errors" -ForegroundColor Red
}

Write-Host ""

# Step 6: Start frontend service
Write-Host "6. 🌐 Starting frontend service..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "D:\embracingearthspace\ai2-core-app\client"
    npm start
}

Write-Host "   📊 Frontend job started (ID: $($frontendJob.Id))" -ForegroundColor Green

# Step 7: Wait for frontend compilation
Write-Host "7. ⏳ Waiting for React compilation..." -ForegroundColor Yellow
Write-Host "   This may take 30-60 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Step 8: Test frontend
Write-Host "8. 🧪 Testing frontend..." -ForegroundColor Cyan
$frontendHealthy = $false
for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Frontend is running!" -ForegroundColor Green
            $frontendHealthy = $true
            break
        }
    } catch {
        Write-Host "   ❌ Frontend not responding (attempt $i/6)" -ForegroundColor Red
    }
    
    if ($i -lt 6) {
        Start-Sleep -Seconds 10
    }
}

Write-Host ""

# Step 9: Final status report
Write-Host "9. 📊 FINAL STATUS REPORT" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

if ($backendHealthy) {
    Write-Host "   ✅ Backend (3001): HEALTHY" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend (3001): NOT RESPONDING" -ForegroundColor Red
}

if ($frontendHealthy) {
    Write-Host "   ✅ Frontend (3000): RUNNING" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend (3000): NOT RESPONDING" -ForegroundColor Red
}

Write-Host ""

# Step 10: User instructions
if ($backendHealthy -and $frontendHealthy) {
    Write-Host "🎉 SUCCESS! Both services are running!" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Open browser to: http://localhost:3000" -ForegroundColor White
    Write-Host "2. Login to your account" -ForegroundColor White
    Write-Host "3. Navigate to All Transactions page" -ForegroundColor White
    Write-Host "4. Pages should load normally now!" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 TIP: If you still see loading issues:" -ForegroundColor Yellow
    Write-Host "- Hard refresh browser (Ctrl+F5)" -ForegroundColor White
    Write-Host "- Clear browser cache" -ForegroundColor White
    Write-Host "- Check browser developer console for errors" -ForegroundColor White
} else {
    Write-Host "⚠️  PARTIAL SUCCESS - Some services failed" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🛠️  MANUAL STARTUP REQUIRED:" -ForegroundColor Red
    
    if (-not $backendHealthy) {
        Write-Host "Backend: cd ai2-core-app && npm start" -ForegroundColor White
    }
    
    if (-not $frontendHealthy) {
        Write-Host "Frontend: cd ai2-core-app/client && npm start" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "📊 RUNNING PROCESSES:" -ForegroundColor Magenta
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}} | Format-Table

Write-Host "🎯 FIX COMPLETE!" -ForegroundColor Green 