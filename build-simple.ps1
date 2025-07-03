# Build working packages in the AI2 Enterprise Platform
Write-Host "Building AI2 Enterprise Platform (Simple Mode)..." -ForegroundColor Green

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

# Build connectors (simple)
Write-Host "Building connectors..." -ForegroundColor Yellow
cd ai2-connectors
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build connectors" -ForegroundColor Red
    exit 1
}
cd ..

# Build analytics (simple)
Write-Host "Building analytics..." -ForegroundColor Yellow
cd ai2-analytics
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build analytics" -ForegroundColor Red
    exit 1
}
cd ..

# Build notifications (simple)
Write-Host "Building notifications..." -ForegroundColor Yellow
cd ai2-notifications
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build notifications" -ForegroundColor Red
    exit 1
}
cd ..

Write-Host "All working packages built successfully!" -ForegroundColor Green
Write-Host "Ready to start services" -ForegroundColor Green 