# AI2 Enterprise Platform - Full Deployment
# Starts all modules with enterprise features enabled

Write-Host "🚀 Starting AI2 Enterprise Platform (Full Deployment)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Set enterprise environment variables
$env:DEPLOYMENT_TYPE = "ENTERPRISE"
$env:NODE_ENV = "production"

# Enable all enterprise features
$env:ENABLE_AI = "true"
$env:ENABLE_AI_CATEGORIES = "true"
$env:ENABLE_AI_TAX_DEDUCTION = "true"
$env:ENABLE_AI_INSIGHTS = "true"
$env:ENABLE_AI_REPORTING = "true"

$env:ENABLE_SUBSCRIPTION = "true"
$env:ENABLE_PRICING = "true"
$env:ENABLE_USAGE_TRACKING = "true"
$env:ENABLE_TOKEN_SYSTEM = "true"

$env:ENABLE_BANK_FEED = "true"
$env:ENABLE_EMAIL_CONNECTOR = "true"
$env:ENABLE_API_CONNECTOR = "true"
$env:ENABLE_CSV_IMPORT = "true"

$env:ENABLE_ANALYTICS = "true"
$env:ENABLE_ADVANCED_REPORTING = "true"
$env:ENABLE_DASHBOARD = "true"
$env:ENABLE_EXPORTS = "true"

$env:ENABLE_NOTIFICATIONS = "true"
$env:ENABLE_EMAIL_NOTIFICATIONS = "true"
$env:ENABLE_SMS_NOTIFICATIONS = "true"
$env:ENABLE_PUSH_NOTIFICATIONS = "true"

$env:ENABLE_MULTI_TENANT = "true"
$env:ENABLE_SSO = "true"
$env:ENABLE_AUDIT_LOG = "true"
$env:ENABLE_COMPLIANCE = "true"

# Set service endpoints
$env:CORE_ENDPOINT = "http://localhost:3001"
$env:AI_ENDPOINT = "http://localhost:3002"
$env:SUBSCRIPTION_ENDPOINT = "http://localhost:3010"
$env:ANALYTICS_ENDPOINT = "http://localhost:3004"
$env:CONNECTORS_ENDPOINT = "http://localhost:3005"
$env:NOTIFICATIONS_ENDPOINT = "http://localhost:3006"

Write-Host "✅ Environment configured for ENTERPRISE deployment" -ForegroundColor Green
Write-Host "📊 All modules enabled: AI, Subscription, Analytics, Connectors, Notifications" -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Build all packages
Write-Host "🔨 Building all packages..." -ForegroundColor Yellow
npm run build:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host "" -ForegroundColor White

# Start all services
Write-Host "🎬 Starting all services..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

Write-Host "Starting services in order:" -ForegroundColor Cyan
Write-Host "  📦 Shared package (built)" -ForegroundColor Gray
Write-Host "  🏛️  Core App (port 3001)" -ForegroundColor Blue
Write-Host "  🤖 AI Modules (port 3002)" -ForegroundColor Magenta  
Write-Host "  💳 Subscription Service (port 3010)" -ForegroundColor Green
Write-Host "  🔗 Connectors (port 3005)" -ForegroundColor Yellow
Write-Host "  📊 Analytics (port 3004)" -ForegroundColor Red
Write-Host "  🔔 Notifications (port 3006)" -ForegroundColor White
Write-Host "  🌐 Frontend (port 3000)" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

# Start all services using the monorepo script
npm run start:premium

Write-Host "" -ForegroundColor White
Write-Host "🎉 AI2 Enterprise Platform is running!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "  Core API:      http://localhost:3001" -ForegroundColor White
Write-Host "  AI Service:    http://localhost:3002" -ForegroundColor White
Write-Host "  Analytics:     http://localhost:3004" -ForegroundColor White
Write-Host "  Connectors:    http://localhost:3005" -ForegroundColor White
Write-Host "  Notifications: http://localhost:3006" -ForegroundColor White
Write-Host "  Subscription:  http://localhost:3010" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔧 Health Checks:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:3001/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:3002/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:3004/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:3005/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:3006/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:3010/health" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "💰 Business Model: Enterprise (All Features)" -ForegroundColor Green
Write-Host "🎯 Target: Enterprise customers, high scalability" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow 