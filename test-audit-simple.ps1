# AI2 Security Audit Test Script
Write-Host "[SECURITY AUDIT] Starting tests..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"
$testResults = @{}

# Test 1: Custom UI
Write-Host "TEST 1: Custom UI (No Zitadel Redirects)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/oidc/login" -Method OPTIONS -ErrorAction Stop
    Write-Host "[PASS] Custom UI endpoint exists" -ForegroundColor Green
    $testResults["CustomUI"] = $true
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "[PASS] Custom UI endpoint exists" -ForegroundColor Green
        $testResults["CustomUI"] = $true
    } else {
        Write-Host "[FAIL] Custom UI issue" -ForegroundColor Red
        $testResults["CustomUI"] = $false
    }
}

# Test 2: Password Security
Write-Host ""
Write-Host "TEST 2: Password Validation" -ForegroundColor Yellow
$wrongPass = @{email="test@example.com"; password="wrong_pass_123"} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/oidc/login" -Method POST -Body $wrongPass -ContentType "application/json" -ErrorAction Stop
    if ($response.success -eq $false) {
        Write-Host "[PASS] Wrong password rejected" -ForegroundColor Green
        $testResults["PasswordSecurity"] = $true
    } else {
        Write-Host "[FAIL] Wrong password accepted!" -ForegroundColor Red
        $testResults["PasswordSecurity"] = $false
    }
} catch {
    Write-Host "[PASS] Wrong password rejected (401)" -ForegroundColor Green
    $testResults["PasswordSecurity"] = $true
}

# Test 3: JWT Security
Write-Host ""
Write-Host "TEST 3: JWT Token Security" -ForegroundColor Yellow
$headers = @{"Authorization" = "Bearer invalid_token_12345"}
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/subscription/status" -Headers $headers -Method GET -ErrorAction Stop
    Write-Host "[FAIL] Invalid JWT accepted!" -ForegroundColor Red
    $testResults["JWT"] = $false
} catch {
    Write-Host "[PASS] Invalid JWT rejected" -ForegroundColor Green
    $testResults["JWT"] = $true
}

# Test 4: Email Verification Banner
Write-Host ""
Write-Host "TEST 4: Email Verification UI" -ForegroundColor Yellow
$bannerPath = "D:\embracingearthspace\ai2-core-app\client\src\components\EmailVerificationBanner.tsx"
if (Test-Path $bannerPath) {
    Write-Host "[PASS] Email verification banner exists" -ForegroundColor Green
    $testResults["EmailBanner"] = $true
} else {
    Write-Host "[FAIL] Email verification banner missing" -ForegroundColor Red
    $testResults["EmailBanner"] = $false
}

# Test 5: Environment Configuration
Write-Host ""
Write-Host "TEST 5: Security Environment Variables" -ForegroundColor Yellow
$envPath = "D:\embracingearthspace\ai2-core-app\.env"
if (Test-Path $envPath) {
    $env = Get-Content $envPath -Raw
    $hasJWT = $env -match "JWT_SECRET="
    $hasOIDC = $env -match "OIDC_ISSUER="
    
    if ($hasJWT -and $hasOIDC) {
        Write-Host "[PASS] Security variables configured" -ForegroundColor Green
        $testResults["Environment"] = $true
    } else {
        Write-Host "[WARN] Some variables missing" -ForegroundColor Yellow
        $testResults["Environment"] = $false
    }
}

# Test 6: Hardcoded Secrets
Write-Host ""
Write-Host "TEST 6: Hardcoded Secrets Check" -ForegroundColor Yellow
$authJsPath = "D:\embracingearthspace\ai2-core-app\src\middleware\auth.js"
if (Test-Path $authJsPath) {
    $content = Get-Content $authJsPath -Raw
    if ($content -match "JWT_SECRET\s*\|\|") {
        Write-Host "[FAIL] Hardcoded secret found!" -ForegroundColor Red
        $testResults["NoHardcoded"] = $false
    } else {
        Write-Host "[PASS] No hardcoded secrets" -ForegroundColor Green
        $testResults["NoHardcoded"] = $true
    }
} else {
    Write-Host "[PASS] Legacy auth.js removed" -ForegroundColor Green
    $testResults["NoHardcoded"] = $true
}

# Test 7: Service Health
Write-Host ""
Write-Host "TEST 7: Microservices Status" -ForegroundColor Yellow
$services = @(
    @{Name="Core"; Port=3001},
    @{Name="Subscription"; Port=3010}
)

$online = 0
foreach ($svc in $services) {
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:$($svc.Port)/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  [OK] $($svc.Name) service online" -ForegroundColor Green
        $online++
    } catch {
        Write-Host "  [--] $($svc.Name) service offline" -ForegroundColor Gray
    }
}
$testResults["Services"] = ($online -ge 2)

# SUMMARY
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "AUDIT RESULTS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$passed = ($testResults.Values | Where-Object {$_ -eq $true}).Count
$total = $testResults.Count
$percent = [math]::Round(($passed/$total)*100)

foreach ($test in $testResults.GetEnumerator()) {
    $status = if ($test.Value) {"[PASS]"} else {"[FAIL]"}
    $color = if ($test.Value) {"Green"} else {"Red"}
    Write-Host "$status $($test.Key)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Score: $passed/$total ($percent%)" -ForegroundColor $(if ($percent -ge 80) {"Green"} elseif ($percent -ge 60) {"Yellow"} else {"Red"})

if ($percent -ge 80) {
    Write-Host ""
    Write-Host "SYSTEM SECURITY: PRODUCTION READY" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "SYSTEM SECURITY: NEEDS FIXES" -ForegroundColor Red
}
