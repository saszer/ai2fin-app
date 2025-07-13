# Build AI DataBuckets Implementation
Write-Host "Building AI DataBuckets Implementation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Build AI Modules
Write-Host "`nBuilding AI Modules service..." -ForegroundColor Yellow
Set-Location -Path "ai2-ai-modules"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ AI Modules build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ AI Modules built successfully" -ForegroundColor Green

# Build Core App Backend
Write-Host "`nBuilding Core App backend..." -ForegroundColor Yellow
Set-Location -Path "../ai2-core-app"

# Run Prisma migration
Write-Host "Running database migration..." -ForegroundColor Yellow
npx prisma migrate deploy --preview-feature
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Migration failed - you may need to run it manually" -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Build backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Core App backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Core App backend built successfully" -ForegroundColor Green

# Build Frontend
Write-Host "`nBuilding Core App frontend..." -ForegroundColor Yellow
Set-Location -Path "client"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

Set-Location -Path "../../.."

Write-Host "`n✅ All components built successfully!" -ForegroundColor Green
Write-Host "`nTo start the services, run:" -ForegroundColor Yellow
Write-Host "  1. cd ai2-ai-modules && npm start" -ForegroundColor White
Write-Host "  2. cd ai2-core-app && npm start" -ForegroundColor White
Write-Host "  3. cd ai2-core-app/client && npm start" -ForegroundColor White
Write-Host "`nThen test using: .\test-ai-databuckets.ps1" -ForegroundColor Yellow 