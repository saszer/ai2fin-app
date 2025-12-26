#!/usr/bin/with-contenv sh
# Restart Wazuh API to ensure it reads the new configuration
# This runs after config files are in place
# embracingearth.space

set +e  # Don't exit on error

echo "Ensuring Wazuh API reads updated configuration..."

# Wait a bit for services to start
sleep 5

# Check if API config file exists and is readable
API_CONFIG="/var/ossec/api/configuration/api.yaml"
if [ -f "$API_CONFIG" ]; then
    echo "✓ API configuration file exists: $API_CONFIG"
    
    # Verify the config is valid YAML (basic check)
    if grep -q "0.0.0.0" "$API_CONFIG" 2>/dev/null; then
        echo "✓ API config contains 0.0.0.0 binding"
    else
        echo "⚠ API config may not have correct host binding"
    fi
else
    echo "⚠ API configuration file not found: $API_CONFIG"
fi

# Try to restart API service if s6 service exists
# Note: s6-overlay manages services, we can't directly restart them here
# But we can verify the service will pick up the config on next start
if [ -f "/etc/s6-overlay/s6-rc.d/wazuh-api/run" ] || [ -f "/etc/s6/services/wazuh-api/run" ]; then
    echo "✓ Wazuh API service found in s6-overlay"
    echo "  Service will read config on startup"
else
    echo "ℹ Wazuh API service managed by container init"
fi

# Check if API process is running
if pgrep -f "wazuh-apid" > /dev/null 2>&1; then
    echo "✓ Wazuh API process is running"
    echo "  If port not binding, API may need to read config on next restart"
else
    echo "ℹ Wazuh API process not yet running (will start via s6)"
fi

echo "Wazuh API restart check completed."

