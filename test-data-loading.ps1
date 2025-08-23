#!/usr/bin/env pwsh
# Test Data Loading with Auth Flow
# embracingearth.space

Write-Host "`n=== TESTING DATA LOADING WITH AUTH ===" -ForegroundColor Cyan

# Test credentials
$email = "test@example.com"
$password = "Test123!"
$token = $null

# Step 1: Login to get JWT token
Write-Host "`n[1] Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    if ($loginResponse.token) {
        Write-Host "✓ Login successful, token received" -ForegroundColor Green
        $token = $loginResponse.token
    }
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
}

# If login failed, try registration
if (-not $token) {
    Write-Host "[1b] Creating test user..." -ForegroundColor Yellow
    $registerBody = @{
        email = $email
        password = $password
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
            -Method POST `
            -ContentType "application/json" `
            -Body $registerBody `
            -ErrorAction Stop
        
        if ($registerResponse.token) {
            Write-Host "✓ User created, token received" -ForegroundColor Green
            $token = $registerResponse.token
        }
    } catch {
        Write-Host "✗ Registration failed: $_" -ForegroundColor Red
        exit 1
    }
}

if (-not $token) {
    Write-Host "✗ No token available, cannot continue" -ForegroundColor Red
    exit 1
}

# Step 2: Test authenticated endpoints
Write-Host "`n[2] Testing Data Endpoints with Token..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

# Test endpoints that pages use
$endpoints = @(
    @{name="Transactions"; url="/api/bank/transactions"},
    @{name="Categories"; url="/api/bank/categories"},
    @{name="Bills Patterns"; url="/api/bills/patterns"},
    @{name="CSV Uploads"; url="/api/bank/csv-uploads"},
    @{name="User Preferences"; url="/api/country-preferences"},
    @{name="Subscription Status"; url="/api/subscription/status"},
    @{name="Services Status"; url="/api/services/status"}
)

$results = @()

foreach ($endpoint in $endpoints) {
    Write-Host "`n  Testing $($endpoint.name)..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001$($endpoint.url)" `
            -Headers $headers `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $content = $null
        try {
            $content = $response.Content | ConvertFrom-Json
        } catch {
            # Content might not be JSON
        }
        
        if ($statusCode -eq 200) {
            Write-Host " ✓ [200 OK]" -ForegroundColor Green
            
            # Show data summary
            if ($content) {
                switch ($endpoint.name) {
                    "Transactions" {
                        $count = 0
                        if ($content.transactions) { 
                            $count = $content.transactions.Count 
                        } elseif ($content -is [array]) { 
                            $count = $content.Count 
                        }
                        Write-Host "    Data: $count transactions" -ForegroundColor Gray
                    }
                    "Categories" {
                        $count = 0
                        if ($content.categories) { 
                            $count = $content.categories.Count 
                        } elseif ($content -is [array]) { 
                            $count = $content.Count 
                        }
                        Write-Host "    Data: $count categories" -ForegroundColor Gray
                    }
                    "Bills Patterns" {
                        $count = 0
                        if ($content.data) { 
                            $count = $content.data.Count 
                        } elseif ($content.patterns) { 
                            $count = $content.patterns.Count 
                        } elseif ($content -is [array]) { 
                            $count = $content.Count 
                        }
                        Write-Host "    Data: $count bill patterns" -ForegroundColor Gray
                    }
                    "Subscription Status" {
                        $plan = "unknown"
                        if ($content.subscription) { 
                            $plan = $content.subscription.plan 
                        } elseif ($content.plan) { 
                            $plan = $content.plan 
                        }
                        Write-Host "    Plan: $plan" -ForegroundColor Gray
                    }
                    "Services Status" {
                        $online = 0
                        $total = 0
                        if ($content.onlineCount) { $online = $content.onlineCount }
                        if ($content.totalCount) { $total = $content.totalCount }
                        Write-Host "    Services: $online/$total online" -ForegroundColor Gray
                    }
                    default {
                        Write-Host "    Response received" -ForegroundColor Gray
                    }
                }
            }
            
            $results += @{endpoint=$endpoint.name; status="PASS"; code=$statusCode}
        } else {
            Write-Host " ? [$statusCode]" -ForegroundColor Yellow
            $results += @{endpoint=$endpoint.name; status="WARN"; code=$statusCode}
        }
    } catch {
        $errorMsg = $_.Exception.Message
        $statusCode = 0
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq 401 -or $errorMsg -match "401") {
            Write-Host " ✗ [401 Unauthorized]" -ForegroundColor Red
            Write-Host "    Auth token rejected!" -ForegroundColor Red
            $results += @{endpoint=$endpoint.name; status="FAIL"; code=401}
        } elseif ($statusCode -eq 403 -or $errorMsg -match "403") {
            Write-Host " ✗ [403 Forbidden]" -ForegroundColor Red
            Write-Host "    Token invalid or expired!" -ForegroundColor Red
            $results += @{endpoint=$endpoint.name; status="FAIL"; code=403}
        } elseif ($statusCode -eq 404 -or $errorMsg -match "404") {
            Write-Host " ✗ [404 Not Found]" -ForegroundColor Red
            $results += @{endpoint=$endpoint.name; status="FAIL"; code=404}
        } elseif ($statusCode -eq 500 -or $errorMsg -match "500") {
            Write-Host " ✗ [500 Server Error]" -ForegroundColor Red
            $results += @{endpoint=$endpoint.name; status="FAIL"; code=500}
        } else {
            Write-Host " ✗ [Connection Failed]" -ForegroundColor Red
            Write-Host "    Error: $errorMsg" -ForegroundColor Red
            $results += @{endpoint=$endpoint.name; status="FAIL"; code=0}
        }
    }
}

# Step 3: Test Database Connectivity
Write-Host "`n[3] Testing Database Access..." -ForegroundColor Yellow

# Try to create a test transaction
$testTransaction = @{
    date = (Get-Date).ToString("yyyy-MM-dd")
    description = "Test Transaction"
    amount = 10.50
    type = "debit"
    category = "Other"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/bank/transactions" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $testTransaction `
        -ErrorAction Stop
    
    Write-Host "✓ Database write successful" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "404") {
        Write-Host "! Create endpoint not found (might be expected)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Database write failed: $errorMsg" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.status -eq "FAIL" }).Count
$warned = ($results | Where-Object { $_.status -eq "WARN" }).Count
$total = $results.Count

Write-Host "Passed: $passed/$total" -ForegroundColor Green
if ($warned -gt 0) { Write-Host "Warnings: $warned" -ForegroundColor Yellow }
if ($failed -gt 0) { 
    Write-Host "Failed: $failed" -ForegroundColor Red
    Write-Host "`nFailed endpoints:" -ForegroundColor Red
    $results | Where-Object { $_.status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.endpoint) [$($_.code)]" -ForegroundColor Red
    }
}

# Check if data loading would work
if ($passed -ge 4) {
    Write-Host "`n✓ DATA LOADING SHOULD WORK" -ForegroundColor Green
    Write-Host "  Core data endpoints are responding correctly" -ForegroundColor Gray
} else {
    Write-Host "`n✗ DATA LOADING WILL FAIL" -ForegroundColor Red
    Write-Host "  Critical endpoints are not responding" -ForegroundColor Red
    
    # Diagnostic suggestions
    Write-Host "`nDiagnostic Steps:" -ForegroundColor Yellow
    Write-Host "1. Check JWT_SECRET is same in all services" -ForegroundColor Gray
    Write-Host "2. Verify DATABASE_URL is correct" -ForegroundColor Gray
    Write-Host "3. Check if Prisma schema is synced" -ForegroundColor Gray
    Write-Host "4. Ensure subscription service is running" -ForegroundColor Gray
    Write-Host "5. Check JWT issuer is 'ai2-platform' in all tokens" -ForegroundColor Gray
}