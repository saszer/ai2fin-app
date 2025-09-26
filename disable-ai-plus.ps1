# AI+ Service Disable Configuration
# This script disables AI+ services while keeping core and analytics running

# Set environment variables to disable AI features
$env:ENABLE_AI = "false"
$env:ENABLE_AI_CATEGORIES = "false" 
$env:ENABLE_AI_TAX_DEDUCTION = "false"
$env:ENABLE_AI_INSIGHTS = "false"
$env:ENABLE_AI_REPORTING = "false"

# Keep analytics enabled
$env:ENABLE_ANALYTICS = "true"

# Keep core features enabled
$env:ENABLE_CORE = "true"

Write-Host "AI+ services disabled. Core and Analytics remain enabled."
Write-Host "ENABLE_AI: $env:ENABLE_AI"
Write-Host "ENABLE_ANALYTICS: $env:ENABLE_ANALYTICS"
