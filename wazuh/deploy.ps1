# Wazuh Deployment Script
# embracingearth.space - Quick deployment to Fly.io

Write-Host "🚀 Deploying Wazuh to Fly.io" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Find flyctl
$flyctl = $null
$possiblePaths = @(
    "flyctl",
    "fly",
    "$env:USERPROFILE\.fly\bin\flyctl.exe",
    "$env:LOCALAPPDATA\fly\bin\flyctl.exe",
    "C:\Program Files\fly\bin\flyctl.exe"
)

foreach ($path in $possiblePaths) {
    try {
        if (Get-Command $path -ErrorAction SilentlyContinue) {
            $flyctl = $path
            break
        }
    } catch {
        # Continue searching
    }
}

if (-not $flyctl) {
    Write-Host "❌ Fly CLI not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Fly CLI:" -ForegroundColor Yellow
    Write-Host "  PowerShell: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or run manually:" -ForegroundColor Yellow
    Write-Host "  flyctl deploy -a ai2-wazuh" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Found Fly CLI: $flyctl" -ForegroundColor Green
Write-Host ""

# Check status first
Write-Host "📊 Checking current status..." -ForegroundColor Yellow
try {
    & $flyctl status -a ai2-wazuh 2>&1 | Out-Null
} catch {
    Write-Host "⚠️  App may not exist yet, will create during deploy" -ForegroundColor Yellow
}
Write-Host ""

# Deploy
Write-Host "🚀 Starting deployment..." -ForegroundColor Yellow
Write-Host "⚠️  Using --detach to prevent deployment timeout" -ForegroundColor Yellow
Write-Host "   (Returns immediately - health checks still run and pass once Dashboard is ready)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔒 CLOUDFLARE TUNNEL CHECK:" -ForegroundColor Cyan
Write-Host "   Ensure you have set the TUNNEL_TOKEN secret:" -ForegroundColor White
Write-Host "   fly secrets set TUNNEL_TOKEN=..." -ForegroundColor White
Write-Host ""


& $flyctl deploy -a ai2-wazuh --config fly.toml --detach

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Check status: flyctl status -a ai2-wazuh" -ForegroundColor White
    Write-Host "  2. View logs: flyctl logs -a ai2-wazuh" -ForegroundColor White
    Write-Host "  3. Check health: flyctl checks list -a ai2-wazuh" -ForegroundColor White
    Write-Host "  4. Health checks will pass once Dashboard is ready (12-17 min)" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check logs above." -ForegroundColor Red
    exit 1
}
