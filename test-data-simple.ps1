# Simple Data Loading Test
Write-Host "`n=== TESTING DATA LOADING ===" -ForegroundColor Cyan

# Step 1: Try to login
$loginBody = '{"email":"test@example.com","password":"Test123!"}'
Write-Host "`n[1] Attempting login..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "Login failed, trying registration..." -ForegroundColor Yellow
    
    $registerBody = '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
            -Method POST `
            -ContentType "application/json" `
            -Body $registerBody `
            -ErrorAction Stop
        
        $token = $registerResponse.token
        Write-Host "✓ Registration successful" -ForegroundColor Green
    } catch {
        Write-Host "✗ Both login and registration failed" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Test key data endpoints
Write-Host "`n[2] Testing data endpoints..." -ForegroundColor Yellow

$headers = @{ "Authorization" = "Bearer $token" }

# Test transactions endpoint
Write-Host "  - Transactions: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/bank/transactions" `
        -Headers $headers `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "✓ [200]" -ForegroundColor Green
} catch {
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host "✗ [$status]" -ForegroundColor Red
}

# Test categories endpoint
Write-Host "  - Categories: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/bank/categories" `
        -Headers $headers `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "✓ [200]" -ForegroundColor Green
} catch {
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host "✗ [$status]" -ForegroundColor Red
}

# Test bills patterns endpoint
Write-Host "  - Bills: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/bills/patterns" `
        -Headers $headers `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "✓ [200]" -ForegroundColor Green
} catch {
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host "✗ [$status]" -ForegroundColor Red
}

# Test subscription status
Write-Host "  - Subscription: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/subscription/status" `
        -Headers $headers `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "✓ [200]" -ForegroundColor Green
} catch {
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Write-Host "✗ [$status]" -ForegroundColor Red
}

Write-Host "`n[3] Result:" -ForegroundColor Yellow
Write-Host "If all endpoints returned 200, pages should load data correctly." -ForegroundColor Cyan
Write-Host "If you see 401/403 errors, there's a JWT issuer mismatch." -ForegroundColor Yellow
Write-Host "If you see 500 errors, check database connection." -ForegroundColor Yellow













