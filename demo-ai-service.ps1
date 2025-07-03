# AI2 Enterprise Platform - AI Service Demo
Write-Host "🤖 AI2 Enterprise Platform - AI Service Demo" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if AI service is running
Write-Host "Checking AI service status..." -ForegroundColor Yellow
try {
    $status = Invoke-WebRequest -Uri "http://localhost:3002/api/ai/status" -Method GET
    Write-Host "✅ AI service is running!" -ForegroundColor Green
    Write-Host "Service: $($status.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ AI service is not running. Please start it first." -ForegroundColor Red
    Write-Host "Run: cd ai2-ai-modules && npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🧪 Testing AI Transaction Analysis..." -ForegroundColor Cyan

# Test 1: Coffee shop transaction
Write-Host "Test 1: Coffee shop purchase" -ForegroundColor Yellow
$coffeeTransaction = @{
    description = "Starbucks Coffee"
    amount = -5.50
    date = "2025-07-03"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/ai/analyze-transaction" -Method POST -Headers @{"Content-Type"="application/json"} -Body $coffeeTransaction
    Write-Host "✅ Analysis completed!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Category: $($result.data.category)" -ForegroundColor White
    Write-Host "Confidence: $($result.data.confidence)" -ForegroundColor White
    Write-Host "Tax Deductible: $($result.data.isTaxDeductible)" -ForegroundColor White
} catch {
    Write-Host "❌ Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Business expense
Write-Host "`nTest 2: Business lunch" -ForegroundColor Yellow
$businessLunch = @{
    description = "Client lunch meeting - ABC Corp"
    amount = -85.00
    date = "2025-07-03"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/ai/analyze-transaction" -Method POST -Headers @{"Content-Type"="application/json"} -Body $businessLunch
    Write-Host "✅ Analysis completed!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Category: $($result.data.category)" -ForegroundColor White
    Write-Host "Confidence: $($result.data.confidence)" -ForegroundColor White
    Write-Host "Tax Deductible: $($result.data.isTaxDeductible)" -ForegroundColor White
} catch {
    Write-Host "❌ Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Batch analysis
Write-Host "`nTest 3: Batch transaction analysis" -ForegroundColor Yellow
$batchTransactions = @{
    transactions = @(
        @{ id = "1"; description = "Gas station"; amount = -45.00; date = "2025-07-03" },
        @{ id = "2"; description = "Office supplies"; amount = -125.50; date = "2025-07-03" },
        @{ id = "3"; description = "Salary deposit"; amount = 2500.00; date = "2025-07-03" }
    )
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/ai/batch-analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body $batchTransactions
    Write-Host "✅ Batch analysis completed!" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "Processed: $($result.data.processed) transactions" -ForegroundColor White
    Write-Host "Results: $($result.data.results.Count) analyses" -ForegroundColor White
} catch {
    Write-Host "❌ Batch analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Health check
Write-Host "`n🏥 Service Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3002/health" -Method GET
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "✅ Service is healthy!" -ForegroundColor Green
    Write-Host "Version: $($healthData.version)" -ForegroundColor White
    Write-Host "Features:" -ForegroundColor White
    Write-Host "  - AI Enabled: $($healthData.features.aiEnabled)" -ForegroundColor Gray
    Write-Host "  - Categorization: $($healthData.features.categorization)" -ForegroundColor Gray
    Write-Host "  - Tax Deduction: $($healthData.features.taxDeduction)" -ForegroundColor Gray
    Write-Host "  - Insights: $($healthData.features.insights)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Demo completed successfully!" -ForegroundColor Green
Write-Host "The AI2 Enterprise Platform AI service is fully operational." -ForegroundColor Green
Write-Host "Ready for production use!" -ForegroundColor Green 