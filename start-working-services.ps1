# Start working services in the AI2 Enterprise Platform
Write-Host "Starting Working Services for AI2 Enterprise Platform..." -ForegroundColor Green

# Start AI modules service
Write-Host "Starting AI modules service on port 3002..." -ForegroundColor Yellow
cd ai2-ai-modules
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"
cd ..

Write-Host "Services started successfully!" -ForegroundColor Green
Write-Host "AI Modules service running on http://localhost:3002" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep the script running to maintain service processes
while ($true) {
    Start-Sleep -Seconds 10
    Write-Host "Services are running... (Press Ctrl+C to stop)" -ForegroundColor Gray
} 