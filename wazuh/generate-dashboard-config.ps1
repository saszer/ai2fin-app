# Generate Wazuh Dashboard configuration file for local development
# embracingearth.space

Write-Host "🔧 Generating Wazuh Dashboard configuration..." -ForegroundColor Cyan

# Load environment variables from .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -and $value -ne "") {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
}

$wazuhUser = $env:WAZUH_API_USER
if (-not $wazuhUser) {
    $wazuhUser = "szsah"
}

$wazuhPass = $env:WAZUH_API_PASSWORD
if (-not $wazuhPass) {
    Write-Host "❌ WAZUH_API_PASSWORD not set in .env file" -ForegroundColor Red
    exit 1
}

# Create config directory
$configDir = "config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir | Out-Null
}

# Generate config file
$configContent = @"
# Wazuh Dashboard - API Configuration
# Generated for local development
# embracingearth.space

hosts:
  - default:
      url: https://wazuh-manager
      port: 55000
      username: $wazuhUser
      password: $wazuhPass
      run_as: false

customization.logo.app: "custom/images/customization.logo.app.png?v=1767320479282"
"@

$configFile = "$configDir/wazuh.yml.local"
Set-Content -Path $configFile -Value $configContent -Encoding UTF8

Write-Host "✅ Dashboard configuration generated: $configFile" -ForegroundColor Green
Write-Host "   User: $wazuhUser" -ForegroundColor Gray
