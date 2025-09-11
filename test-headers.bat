@echo off
echo Testing Production Headers for Origin Lock
echo =========================================
echo.

echo Testing api.ai2fin.com/health...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://api.ai2fin.com/health' -UseBasicParsing; Write-Host 'Status:' $r.StatusCode; Write-Host 'Headers:'; $r.Headers | Out-String } catch { Write-Host 'Error:' $_.Exception.Message }"
echo.

echo Testing api.ai2fin.com/api/core/status...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://api.ai2fin.com/api/core/status' -UseBasicParsing; Write-Host 'Status:' $r.StatusCode; Write-Host 'Headers:'; $r.Headers | Out-String } catch { Write-Host 'Error:' $_.Exception.Message }"
echo.

echo Testing subscription.ai2fin.com/health...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://subscription.ai2fin.com/health' -UseBasicParsing; Write-Host 'Status:' $r.StatusCode; Write-Host 'Headers:'; $r.Headers | Out-String } catch { Write-Host 'Error:' $_.Exception.Message }"
echo.

pause
