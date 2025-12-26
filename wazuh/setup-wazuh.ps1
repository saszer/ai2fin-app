# Wazuh Setup Script for Fly.io
# embracingearth.space - Enterprise Security Monitoring

Write-Host "🔒 Setting up Wazuh SIEM/XDR Platform" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Fly CLI is installed
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI not found. Install from: https://fly.io/docs/getting-started/installing-flyctl/" -ForegroundColor Red
    exit 1
}

# Generate Wazuh API password
Write-Host "🔑 Generating Wazuh API credentials..." -ForegroundColor Yellow
$wazuhApiPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$wazuhApiUser = "wazuh"

Write-Host "✅ Generated credentials:" -ForegroundColor Green
Write-Host "   User: $wazuhApiUser" -ForegroundColor Cyan
Write-Host "   Password: $wazuhApiPassword" -ForegroundColor Cyan
Write-Host ""

# Create Fly.io app
Write-Host "🚀 Creating Wazuh app on Fly.io..." -ForegroundColor Yellow
$appName = "ai2-wazuh"

try {
    flyctl apps create $appName --org embracingearth
    Write-Host "✅ App created: $appName" -ForegroundColor Green
} catch {
    Write-Host "⚠️ App may already exist, continuing..." -ForegroundColor Yellow
}

# Set secrets
Write-Host "🔐 Setting Wazuh secrets..." -ForegroundColor Yellow
flyctl secrets set -a $appName WAZUH_API_USER="$wazuhApiUser"
flyctl secrets set -a $appName WAZUH_API_PASSWORD="$wazuhApiPassword"

Write-Host "✅ Secrets set" -ForegroundColor Green
Write-Host ""

# Create volume for data persistence
Write-Host "💾 Creating data volume..." -ForegroundColor Yellow
try {
    flyctl volumes create wazuh_data --size 10 --app $appName --region syd
    Write-Host "✅ Volume created" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Volume may already exist, continuing..." -ForegroundColor Yellow
}

# Deploy
Write-Host "🚀 Deploying Wazuh..." -ForegroundColor Yellow
flyctl deploy --app $appName --config fly.toml

Write-Host ""
Write-Host "✅ Wazuh setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Get Wazuh URL: flyctl status -a $appName" -ForegroundColor White
Write-Host "   2. Access Wazuh Dashboard: https://$appName.fly.dev:55000" -ForegroundColor White
Write-Host "   3. Login with:" -ForegroundColor White
Write-Host "      User: $wazuhApiUser" -ForegroundColor Yellow
Write-Host "      Password: $wazuhApiPassword" -ForegroundColor Yellow
Write-Host "   4. Configure agents (see wazuh-agent-setup.md)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ IMPORTANT: Save these credentials securely!" -ForegroundColor Red

