# Feature Flag Analysis - Do You Need to Set These?

Write-Host "=== FEATURE FLAG ANALYSIS ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "ANALYSIS OF ENABLE_AI, ENABLE_ANALYTICS, ENABLE_CORE:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. ENABLE_AI" -ForegroundColor Green
Write-Host "    USED: process.env.ENABLE_AI === 'true'" -ForegroundColor Green
Write-Host "    PURPOSE: Controls AI features (categorization, tax deduction, insights)" -ForegroundColor Green
Write-Host "    DEFAULT: false (if not set)" -ForegroundColor Green
Write-Host "    RECOMMENDATION: Set to 'false' to disable AI+ and save memory" -ForegroundColor Green
Write-Host ""

Write-Host "2. ENABLE_ANALYTICS" -ForegroundColor Green
Write-Host "    USED: process.env.ENABLE_ANALYTICS === 'true'" -ForegroundColor Green
Write-Host "    PURPOSE: Controls analytics features (reporting, exports, insights)" -ForegroundColor Green
Write-Host "    DEFAULT: false (if not set)" -ForegroundColor Green
Write-Host "    RECOMMENDATION: Set to 'true' to keep analytics enabled" -ForegroundColor Green
Write-Host ""

Write-Host "3. ENABLE_CORE" -ForegroundColor Red
Write-Host "    NOT FOUND: No references to ENABLE_CORE in codebase" -ForegroundColor Red
Write-Host "    PURPOSE: Unknown - not used anywhere" -ForegroundColor Red
Write-Host "    RECOMMENDATION: Don't set - not needed" -ForegroundColor Red
Write-Host ""

Write-Host "CORE MODULE STATUS:" -ForegroundColor Yellow
Write-Host " Core module is ALWAYS enabled (hardcoded: enabled: true)" -ForegroundColor Green
Write-Host " Core features: transactions, categories, dashboard, csv-import" -ForegroundColor Green
Write-Host " No environment variable needed for core functionality" -ForegroundColor Green
Write-Host ""

Write-Host "REQUIRED SETTINGS FOR MEMORY OPTIMIZATION:" -ForegroundColor Yellow
Write-Host ""

Write-Host " SET THESE (to disable AI+ and save memory):" -ForegroundColor Green
Write-Host "   ENABLE_AI=false" -ForegroundColor White
Write-Host "   ENABLE_AI_CATEGORIES=false" -ForegroundColor White
Write-Host "   ENABLE_AI_TAX_DEDUCTION=false" -ForegroundColor White
Write-Host "   ENABLE_AI_INSIGHTS=false" -ForegroundColor White
Write-Host "   ENABLE_AI_REPORTING=false" -ForegroundColor White
Write-Host ""

Write-Host " SET THESE (to keep analytics enabled):" -ForegroundColor Green
Write-Host "   ENABLE_ANALYTICS=true" -ForegroundColor White
Write-Host "   ENABLE_ADVANCED_REPORTING=true" -ForegroundColor White
Write-Host "   ENABLE_DASHBOARD=true" -ForegroundColor White
Write-Host "   ENABLE_EXPORTS=true" -ForegroundColor White
Write-Host ""

Write-Host " DON'T SET (not used in codebase):" -ForegroundColor Red
Write-Host "   ENABLE_CORE (not referenced anywhere)" -ForegroundColor White
Write-Host ""

Write-Host "SUMMARY:" -ForegroundColor Cyan
Write-Host " ENABLE_AI=false - REQUIRED (saves memory)" -ForegroundColor Green
Write-Host " ENABLE_ANALYTICS=true - REQUIRED (keeps analytics)" -ForegroundColor Green
Write-Host " ENABLE_CORE - NOT NEEDED (core always enabled)" -ForegroundColor Red
Write-Host ""

Write-Host "The core application will work without ENABLE_CORE because" -ForegroundColor White
Write-Host "it's hardcoded as enabled: true in the module configuration." -ForegroundColor White
