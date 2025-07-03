# Initialize git repositories for all AI2 Enterprise Platform packages
Write-Host "Initializing Git Repositories for AI2 Enterprise Platform..." -ForegroundColor Green

# Initialize root repository
Write-Host "Initializing root repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: AI2 Enterprise Platform monorepo structure"
    Write-Host "Root repository initialized" -ForegroundColor Green
} else {
    Write-Host "Root repository already exists" -ForegroundColor Yellow
}

# Initialize shared package
Write-Host "Initializing shared package repository..." -ForegroundColor Yellow
cd shared
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/shared package"
    Write-Host "Shared package repository initialized" -ForegroundColor Green
} else {
    Write-Host "Shared package repository already exists" -ForegroundColor Yellow
}
cd ..

# Initialize AI modules package
Write-Host "Initializing AI modules package repository..." -ForegroundColor Yellow
cd ai2-ai-modules
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/ai-modules package"
    Write-Host "AI modules package repository initialized" -ForegroundColor Green
} else {
    Write-Host "AI modules package repository already exists" -ForegroundColor Yellow
}
cd ..

# Initialize connectors package
Write-Host "Initializing connectors package repository..." -ForegroundColor Yellow
cd ai2-connectors
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/connectors package"
    Write-Host "Connectors package repository initialized" -ForegroundColor Green
} else {
    Write-Host "Connectors package repository already exists" -ForegroundColor Yellow
}
cd ..

# Initialize analytics package
Write-Host "Initializing analytics package repository..." -ForegroundColor Yellow
cd ai2-analytics
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/analytics package"
    Write-Host "Analytics package repository initialized" -ForegroundColor Green
} else {
    Write-Host "Analytics package repository already exists" -ForegroundColor Yellow
}
cd ..

# Initialize notifications package
Write-Host "Initializing notifications package repository..." -ForegroundColor Yellow
cd ai2-notifications
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/notifications package"
    Write-Host "Notifications package repository initialized" -ForegroundColor Green
} else {
    Write-Host "Notifications package repository already exists" -ForegroundColor Yellow
}
cd ..

# Initialize subscription service package
Write-Host "Initializing subscription service package repository..." -ForegroundColor Yellow
cd ai2-subscription-service
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/subscription-service package"
    Write-Host "Subscription service package repository initialized" -ForegroundColor Green
} else {
    Write-Host "Subscription service package repository already exists" -ForegroundColor Yellow
}
cd ..

# Initialize core app package
Write-Host "Initializing core app package repository..." -ForegroundColor Yellow
cd ai2-core-app
if (-not (Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit: @ai2/core-app package"
    Write-Host "Core app package repository initialized" -ForegroundColor Green
} else {
    Write-Host "Core app package repository already exists" -ForegroundColor Yellow
}
cd ..

Write-Host "All Git repositories initialized successfully!" -ForegroundColor Green
Write-Host "Each package now has its own git repository" -ForegroundColor Green 