# JWT_SECRET Verification Script
# Compares JWT_SECRET between core app and connectors service

Write-Host "=== JWT_SECRET Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check core app
Write-Host "Checking ai2-core-api..." -ForegroundColor Yellow
try {
    $coreSecret = fly secrets get JWT_SECRET -a ai2-core-api 2>&1
    if ($LASTEXITCODE -eq 0) {
        $coreSecretValue = $coreSecret.Trim()
        $coreSecretLength = $coreSecretValue.Length
        $coreSecretHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($coreSecretValue))
        $coreSecretHashHex = [System.BitConverter]::ToString($coreSecretHash).Replace("-", "").Substring(0, 16)
        Write-Host "  ✅ JWT_SECRET found (length: $coreSecretLength, hash: $coreSecretHashHex)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to get JWT_SECRET from ai2-core-api" -ForegroundColor Red
        $coreSecretValue = $null
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
    $coreSecretValue = $null
}

Write-Host ""

# Check connectors service
Write-Host "Checking ai2-connectors..." -ForegroundColor Yellow
try {
    $connectorsSecret = fly secrets get JWT_SECRET -a ai2-connectors 2>&1
    if ($LASTEXITCODE -eq 0) {
        $connectorsSecretValue = $connectorsSecret.Trim()
        $connectorsSecretLength = $connectorsSecretValue.Length
        $connectorsSecretHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($connectorsSecretValue))
        $connectorsSecretHashHex = [System.BitConverter]::ToString($connectorsSecretHash).Replace("-", "").Substring(0, 16)
        Write-Host "  ✅ JWT_SECRET found (length: $connectorsSecretLength, hash: $connectorsSecretHashHex)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to get JWT_SECRET from ai2-connectors" -ForegroundColor Red
        $connectorsSecretValue = $null
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
    $connectorsSecretValue = $null
}

Write-Host ""

# Compare
if ($coreSecretValue -and $connectorsSecretValue) {
    if ($coreSecretValue -eq $connectorsSecretValue) {
        Write-Host "✅ SUCCESS: JWT_SECRET values MATCH!" -ForegroundColor Green
        Write-Host ""
        Write-Host "If you're still getting 'invalid signature' errors:" -ForegroundColor Yellow
        Write-Host "  1. Restart both services: fly apps restart ai2-core-api && fly apps restart ai2-connectors" -ForegroundColor White
        Write-Host "  2. Check that tokens are being passed correctly in Authorization header" -ForegroundColor White
        Write-Host "  3. Verify token format: 'Bearer <token>' (not just '<token>')" -ForegroundColor White
    } else {
        Write-Host "❌ ERROR: JWT_SECRET values DO NOT MATCH!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Fix:" -ForegroundColor Yellow
        Write-Host "  fly secrets set -a ai2-connectors JWT_SECRET=`"$coreSecretValue`"" -ForegroundColor White
        Write-Host ""
        Write-Host "Then restart both services:" -ForegroundColor Yellow
        Write-Host "  fly apps restart ai2-core-api" -ForegroundColor White
        Write-Host "  fly apps restart ai2-connectors" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  WARNING: Could not compare secrets (one or both are missing)" -ForegroundColor Yellow
    Write-Host ""
    if (-not $coreSecretValue) {
        Write-Host "  ❌ ai2-core-api JWT_SECRET is missing" -ForegroundColor Red
        Write-Host "     Fix: fly secrets set -a ai2-core-api JWT_SECRET=`"your-secret`"" -ForegroundColor White
    }
    if (-not $connectorsSecretValue) {
        Write-Host "  ❌ ai2-connectors JWT_SECRET is missing" -ForegroundColor Red
        Write-Host "     Fix: fly secrets set -a ai2-connectors JWT_SECRET=`"your-secret`"" -ForegroundColor White
    }
}

Write-Host ""



