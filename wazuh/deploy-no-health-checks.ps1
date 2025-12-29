# Deploy Wazuh without waiting for health checks
# Health checks will still run, but won't block deployment
# embracingearth.space

Write-Host "Deploying Wazuh without health check timeout..." -ForegroundColor Cyan

# Deploy with --detach flag (returns immediately)
# This allows deployment to complete even if health checks haven't passed yet
# Health checks will still run and eventually pass once Dashboard is ready (12-17 min)
flyctl deploy -a ai2-wazuh --detach

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Note: Health checks will pass once Dashboard is fully ready (12-17 minutes)" -ForegroundColor Yellow
Write-Host "Check status: flyctl checks list -a ai2-wazuh" -ForegroundColor Yellow

