# Check Cloudflare Header Injection
# embracingearth.space - Debug what headers Cloudflare is actually sending

Write-Host "🔍 Testing Cloudflare Header Injection" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test endpoints
$endpoints = @(
    "https://api.ai2fin.com/health",
    "https://api.ai2fin.com/",
    "https://api.ai2fin.com/api/health"
)

foreach ($endpoint in $endpoints) {
    Write-Host "📡 Testing: $endpoint" -ForegroundColor Yellow
    Write-Host ("─" * 60) -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -UseBasicParsing
        
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Show all headers
        Write-Host "   📋 All Response Headers:" -ForegroundColor Cyan
        $response.Headers.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor White
        }
        
        # Check for Origin Lock headers
        $originHeaders = $response.Headers.GetEnumerator() | Where-Object { 
            $_.Key -like "*origin*" -or $_.Key -like "*auth*" -or $_.Key -like "*cf-*" 
        }
        
        if ($originHeaders.Count -gt 0) {
            Write-Host "   🔍 Origin Lock Headers Found:" -ForegroundColor Green
            $originHeaders | ForEach-Object {
                Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ No Origin Lock Headers Found" -ForegroundColor Red
        }
        
        # Check for Cloudflare headers
        $cfHeaders = $response.Headers.GetEnumerator() | Where-Object { 
            $_.Key -like "cf-*" -or $_.Key -like "*cloudflare*" 
        }
        
        if ($cfHeaders.Count -gt 0) {
            Write-Host "   ☁️  Cloudflare Headers:" -ForegroundColor Blue
            $cfHeaders | ForEach-Object {
                Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Cyan
            }
        }
        
        # Show response data
        if ($response.Content) {
            try {
                $jsonData = $response.Content | ConvertFrom-Json
                Write-Host "   📄 Response Data:" -ForegroundColor Magenta
                Write-Host "      $($jsonData | ConvertTo-Json -Depth 2)" -ForegroundColor White
            } catch {
                $preview = $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
                Write-Host "   📄 Response: $preview" -ForegroundColor White
            }
        }
        
    } catch {
        Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            Write-Host "   Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            Write-Host "   Response Headers:" -ForegroundColor Red
            $_.Exception.Response.Headers.GetEnumerator() | Sort-Object Name | ForEach-Object {
                Write-Host "      $($_.Key): $($_.Value)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
}

# Test with manual header
Write-Host "🔐 Testing with Manual Header" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$testSecret = "j5tNRc1kQpCUFwnY9cMcPpYrL2ShjQe7blN0Qhyf9rxl"  # From your CF rule
$testEndpoint = "https://api.ai2fin.com/health"

try {
    Write-Host "🧪 Testing with manual header: x-origin-auth: $testSecret" -ForegroundColor Yellow
    
    $headers = @{"x-origin-auth" = $testSecret}
    $response = Invoke-WebRequest -Uri $testEndpoint -Method GET -Headers $headers -UseBasicParsing
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ SUCCESS - Manual header works!" -ForegroundColor Green
        Write-Host "   📝 This confirms the secret is correct" -ForegroundColor Green
    } else {
        Write-Host "   ❓ Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   🔒 BLOCKED - Even with manual header" -ForegroundColor Red
        Write-Host "   📝 This suggests the secret is wrong or there's another issue" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Analysis Complete" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
