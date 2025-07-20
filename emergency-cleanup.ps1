#!/usr/bin/env powershell

# 🚨 EMERGENCY SYSTEM LOAD CLEANUP
# ================================
# This script immediately reduces high system load caused by Node.js memory leaks

Write-Host "🚨 EMERGENCY SYSTEM LOAD CLEANUP" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# 1. Show current Node.js processes
Write-Host "📊 Current Node.js processes:" -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}, HandleCount | Sort-Object "Memory(MB)" -Descending | Format-Table

# 2. Identify memory-hungry processes
$heavyProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.WorkingSet -gt 500MB }

if ($heavyProcesses) {
    Write-Host "⚠️  Found memory-hungry processes (>500MB):" -ForegroundColor Red
    $heavyProcesses | Select-Object Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}, HandleCount | Format-Table
    
    Write-Host "🔄 Killing memory-hungry processes..." -ForegroundColor Yellow
    foreach ($process in $heavyProcesses) {
        try {
            Write-Host "   Killing PID $($process.Id) using $([math]::Round($process.WorkingSet/1MB,2))MB" -ForegroundColor Red
            Stop-Process -Id $process.Id -Force
            Write-Host "   ✅ Successfully killed PID $($process.Id)" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Failed to kill PID $($process.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ No memory-hungry processes found" -ForegroundColor Green
}

Write-Host ""

# 3. Wait a moment for cleanup
Write-Host "⏳ Waiting for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 4. Show remaining processes
Write-Host "📊 Remaining Node.js processes:" -ForegroundColor Yellow
$remainingProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($remainingProcesses) {
    $remainingProcesses | Select-Object Id, ProcessName, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}, HandleCount | Sort-Object "Memory(MB)" -Descending | Format-Table
    
    $totalMemory = ($remainingProcesses | Measure-Object WorkingSet -Sum).Sum / 1MB
    Write-Host "📊 Total Node.js memory usage: $([math]::Round($totalMemory,2))MB" -ForegroundColor Cyan
} else {
    Write-Host "✅ No Node.js processes running" -ForegroundColor Green
}

Write-Host ""

# 5. Performance fixes applied
Write-Host "🛠️  PERFORMANCE FIXES APPLIED:" -ForegroundColor Green
Write-Host "✅ SystemStatus polling: 30s → 2 minutes" -ForegroundColor Green
Write-Host "✅ AITestingDashboard polling: 30s → 5 minutes" -ForegroundColor Green  
Write-Host "✅ ServiceDiscovery polling: 30s → 3 minutes" -ForegroundColor Green
Write-Host "✅ FeatureTesting polling: 2m → 10 minutes" -ForegroundColor Green
Write-Host "✅ Added AbortController for request cleanup" -ForegroundColor Green

Write-Host ""

# 6. Restart recommendation
Write-Host "🚀 RECOMMENDED NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. cd ai2-core-app" -ForegroundColor White
Write-Host "2. npm start" -ForegroundColor White
Write-Host "3. Monitor with: Get-Process -Name node | Select-Object Id, @{Name='Memory(MB)';Expression={[math]::Round(`$_.WorkingSet/1MB,2)}}" -ForegroundColor White

Write-Host ""

# 7. Monitoring commands
Write-Host "📊 MONITORING COMMANDS:" -ForegroundColor Cyan
Write-Host "# Check memory usage:" -ForegroundColor White
Write-Host "tasklist /fi `"imagename eq node.exe`" /fo table" -ForegroundColor Gray
Write-Host ""
Write-Host "# Monitor handles:" -ForegroundColor White  
Write-Host "Get-Process -Name node | Select-Object Id, HandleCount, @{Name='Memory(MB)';Expression={[math]::Round(`$_.WorkingSet/1MB,2)}}" -ForegroundColor Gray
Write-Host ""
Write-Host "# Check system load:" -ForegroundColor White
Write-Host "Get-Counter `"\Processor(_Total)\% Processor Time`"" -ForegroundColor Gray

Write-Host ""
Write-Host "🎉 EMERGENCY CLEANUP COMPLETED!" -ForegroundColor Green
Write-Host "System load should be significantly reduced." -ForegroundColor Green 