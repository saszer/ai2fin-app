# AI2 Core Platform - Standalone Deployment
# Starts only the core financial management features (sellable standalone)

Write-Host "🏛️  Starting AI2 Core Platform (Standalone)" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

# Set core-only environment variables
$env:DEPLOYMENT_TYPE = "CORE_ONLY"
$env:NODE_ENV = "production"

# Core features only
$env:ENABLE_TRANSACTION_IMPORT = "true"
$env:ENABLE_MANUAL_TRANSACTIONS = "true" 
$env:ENABLE_CATEGORY_MANAGEMENT = "true"
$env:ENABLE_DASHBOARD = "true"
$env:ENABLE_CSV_IMPORT = "true"

# Disable all premium features
$env:ENABLE_AI = "false"
$env:ENABLE_AI_CATEGORIES = "false"
$env:ENABLE_AI_TAX_DEDUCTION = "false"
$env:ENABLE_AI_INSIGHTS = "false"
$env:ENABLE_AI_REPORTING = "false"

$env:ENABLE_SUBSCRIPTION = "false"
$env:ENABLE_PRICING = "false"
$env:ENABLE_USAGE_TRACKING = "false"
$env:ENABLE_TOKEN_SYSTEM = "false"

$env:ENABLE_BANK_FEED = "false"
$env:ENABLE_EMAIL_CONNECTOR = "false"
$env:ENABLE_API_CONNECTOR = "false"

$env:ENABLE_ANALYTICS = "false"
$env:ENABLE_ADVANCED_REPORTING = "false"
$env:ENABLE_EXPORTS = "false"

$env:ENABLE_NOTIFICATIONS = "false"
$env:ENABLE_EMAIL_NOTIFICATIONS = "false"
$env:ENABLE_SMS_NOTIFICATIONS = "false"
$env:ENABLE_PUSH_NOTIFICATIONS = "false"

$env:ENABLE_MULTI_TENANT = "false"
$env:ENABLE_SSO = "false"
$env:ENABLE_AUDIT_LOG = "false"
$env:ENABLE_COMPLIANCE = "false"

Write-Host "✅ Environment configured for CORE-ONLY deployment" -ForegroundColor Green
Write-Host "📦 Features: Core financial management, CSV import, manual transactions" -ForegroundColor Green
Write-Host "❌ Disabled: AI, Subscription, Analytics, Connectors, Notifications" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Build only core and shared packages
Write-Host "🔨 Building core packages..." -ForegroundColor Yellow
npm run build:shared
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Shared build failed" -ForegroundColor Red
    exit 1
}

npm run build:core
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Core build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Core build completed successfully" -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Start only core services
Write-Host "🎬 Starting core services..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

Write-Host "Starting services in order:" -ForegroundColor Cyan
Write-Host "  📦 Shared package (built)" -ForegroundColor Gray
Write-Host "  🏛️  Core App (port 3001)" -ForegroundColor Blue
Write-Host "  🌐 Frontend (port 3000)" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

# Start core service in standalone mode
npm run start:core:standalone

Write-Host "" -ForegroundColor White
Write-Host "🎉 AI2 Core Platform is running!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "  Core API:      http://localhost:3001" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔧 Health Check:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:3001/health" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "💰 Business Model: Core-Only (Standalone Product)" -ForegroundColor Blue
Write-Host "🎯 Target: Small businesses, basic financial management" -ForegroundColor Blue
Write-Host "💡 Upgrade Path: Add AI, Analytics, or Enterprise features" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "✨ Available Features:" -ForegroundColor Green
Write-Host "  • Manual transaction entry" -ForegroundColor White
Write-Host "  • CSV import/export" -ForegroundColor White
Write-Host "  • Category management" -ForegroundColor White
Write-Host "  • Basic dashboard" -ForegroundColor White
Write-Host "  • Transaction search & filter" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow 