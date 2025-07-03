# Start all services in AI2 Enterprise Platform
Write-Host "Starting All Services..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Start Core App (port 3001)
Write-Host "Starting Core App on port 3001..." -ForegroundColor Yellow
cd ai2-core-app
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Minimized
cd ..

# Start AI Modules (port 3002)  
Write-Host "Starting AI Modules on port 3002..." -ForegroundColor Yellow
cd ai2-ai-modules
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Minimized
cd ..

# Start Connectors (port 3003)
Write-Host "Starting Connectors on port 3003..." -ForegroundColor Yellow
cd ai2-connectors
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Minimized
cd ..

# Start Analytics (port 3004)
Write-Host "Starting Analytics on port 3004..." -ForegroundColor Yellow
cd ai2-analytics
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Minimized
cd ..

# Start Notifications (port 3005)
Write-Host "Starting Notifications on port 3005..." -ForegroundColor Yellow
cd ai2-notifications
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Minimized
cd ..

# Start Subscription Service (port 3010)
Write-Host "Starting Subscription Service on port 3010..." -ForegroundColor Yellow
cd ai2-subscription-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Minimized
cd ..

Write-Host ""
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Core App:          http://localhost:3001" -ForegroundColor Cyan
Write-Host "AI Modules:        http://localhost:3002" -ForegroundColor Cyan
Write-Host "Connectors:        http://localhost:3003" -ForegroundColor Cyan
Write-Host "Analytics:         http://localhost:3004" -ForegroundColor Cyan
Write-Host "Notifications:     http://localhost:3005" -ForegroundColor Cyan
Write-Host "Subscription:      http://localhost:3010" -ForegroundColor Cyan
Write-Host ""
Write-Host "Waiting 10 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10 