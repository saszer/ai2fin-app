# Test AI DataBuckets Implementation
Write-Host "Testing AI DataBuckets Implementation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if services are running
Write-Host "`nChecking service status..." -ForegroundColor Yellow

# Check Core App
try {
    $coreResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Core App is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Core App is not running on port 3001" -ForegroundColor Red
    Write-Host "   Start it with: cd ai2-core-app && npm start" -ForegroundColor Yellow
}

# Check AI Modules
try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3002/health" -Method GET -ErrorAction Stop
    Write-Host "✅ AI Modules service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Modules service is not running on port 3002" -ForegroundColor Red
    Write-Host "   Start it with: cd ai2-ai-modules && npm start" -ForegroundColor Yellow
}

# Check Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend is not running on port 3000" -ForegroundColor Red
    Write-Host "   Start it with: cd ai2-core-app/client && npm start" -ForegroundColor Yellow
}

Write-Host "`nTesting AI DataBuckets Workflow:" -ForegroundColor Yellow
Write-Host "1. Upload a CSV file to create a data bucket" -ForegroundColor White
Write-Host "2. Navigate to Bank Transactions page" -ForegroundColor White
Write-Host "3. Find your data bucket in the list" -ForegroundColor White
Write-Host "4. Click 'Run AI Analysis' button" -ForegroundColor White
Write-Host "5. Watch the progress indicators" -ForegroundColor White
Write-Host "6. Review the analysis results" -ForegroundColor White

Write-Host "`nAPI Endpoints to test manually:" -ForegroundColor Yellow
Write-Host "- POST http://localhost:3001/api/databuckets/{uploadId}/analyze" -ForegroundColor White
Write-Host "- POST http://localhost:3002/api/ai/orchestrate" -ForegroundColor White

Write-Host "`nExample cURL command for testing:" -ForegroundColor Yellow
Write-Host @"
curl -X POST http://localhost:3001/api/databuckets/YOUR_UPLOAD_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "includeTaxAnalysis": true,
      "includeBillDetection": true,
      "includeRecurringPatterns": true,
      "confidenceThreshold": 0.7
    }
  }'
"@ -ForegroundColor Gray

Write-Host "`nCheck Implementation Guide:" -ForegroundColor Yellow
Write-Host "AI_DATABUCKETS_IMPLEMENTATION_GUIDE.md" -ForegroundColor White 