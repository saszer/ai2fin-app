# Build all fixed packages in AI2 Enterprise Platform
Write-Host "Building All Fixed Packages..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Build shared package
Write-Host "Building @ai2/shared..." -ForegroundColor Yellow
cd shared
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/shared built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/shared build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Build AI modules package
Write-Host "Building @ai2/ai-modules..." -ForegroundColor Yellow
cd ai2-ai-modules
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/ai-modules built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/ai-modules build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Build connectors package
Write-Host "Building @ai2/connectors..." -ForegroundColor Yellow
cd ai2-connectors
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/connectors built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/connectors build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Build analytics package
Write-Host "Building @ai2/analytics..." -ForegroundColor Yellow
cd ai2-analytics
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/analytics built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/analytics build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Build notifications package
Write-Host "Building @ai2/notifications..." -ForegroundColor Yellow
cd ai2-notifications
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/notifications built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/notifications build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Build subscription service package
Write-Host "Building @ai2/subscription-service..." -ForegroundColor Yellow
cd ai2-subscription-service
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/subscription-service built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/subscription-service build failed" -ForegroundColor Red
    exit 1
}
cd ..

# Build core app package
Write-Host "Building @ai2/core-app..." -ForegroundColor Yellow
cd ai2-core-app
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "PASS: @ai2/core-app built successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: @ai2/core-app build failed" -ForegroundColor Red
    exit 1
}
cd ..

Write-Host ""
Write-Host "All packages built successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "PASS: @ai2/shared" -ForegroundColor Green
Write-Host "PASS: @ai2/ai-modules" -ForegroundColor Green
Write-Host "PASS: @ai2/connectors" -ForegroundColor Green
Write-Host "PASS: @ai2/analytics" -ForegroundColor Green
Write-Host "PASS: @ai2/notifications" -ForegroundColor Green
Write-Host "PASS: @ai2/subscription-service" -ForegroundColor Green
Write-Host "PASS: @ai2/core-app" -ForegroundColor Green
Write-Host ""
Write-Host "All packages are ready to run!" -ForegroundColor Green 