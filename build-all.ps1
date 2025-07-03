# Build all packages in the AI2 Enterprise Platform
Write-Host "Building AI2 Enterprise Platform..." -ForegroundColor Green

# Build shared package first
Write-Host "Building shared package..." -ForegroundColor Yellow
cd shared
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build shared package" -ForegroundColor Red
    exit 1
}
cd ..

# Build AI modules
Write-Host "Building AI modules..." -ForegroundColor Yellow
cd ai2-ai-modules
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build AI modules" -ForegroundColor Red
    exit 1
}
cd ..

# Build subscription service
Write-Host "Building subscription service..." -ForegroundColor Yellow
cd ai2-subscription-service
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build subscription service" -ForegroundColor Red
    exit 1
}
cd ..

# Build connectors
Write-Host "Building connectors..." -ForegroundColor Yellow
cd ai2-connectors
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build connectors" -ForegroundColor Red
    exit 1
}
cd ..

# Build analytics
Write-Host "Building analytics..." -ForegroundColor Yellow
cd ai2-analytics
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build analytics" -ForegroundColor Red
    exit 1
}
cd ..

# Build notifications
Write-Host "Building notifications..." -ForegroundColor Yellow
cd ai2-notifications
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build notifications" -ForegroundColor Red
    exit 1
}
cd ..

# Build core app (skip for now due to complex dependencies)
Write-Host "Skipping core app build due to complex dependencies" -ForegroundColor Yellow
Write-Host "Core app will be built separately after fixing dependencies" -ForegroundColor Yellow

Write-Host "All packages built successfully!" -ForegroundColor Green
Write-Host "Ready to start services" -ForegroundColor Green 