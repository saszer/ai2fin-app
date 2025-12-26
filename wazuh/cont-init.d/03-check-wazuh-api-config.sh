#!/usr/bin/with-contenv sh
# Check and verify Wazuh API configuration
# The API in Wazuh 4.x is a separate service, not a wodle
# embracingearth.space

set +e  # Don't exit on error

echo "Checking Wazuh API configuration..."

# Check if API configuration file exists
API_CONFIG="/var/ossec/api/configuration/api.yaml"
if [ -f "$API_CONFIG" ]; then
    echo "✓ API configuration file found: $API_CONFIG"
    
    # Check if host is set to 0.0.0.0
    if grep -q "host:.*0.0.0.0" "$API_CONFIG" 2>/dev/null || \
       grep -q "host:.*\[\"0.0.0.0\"" "$API_CONFIG" 2>/dev/null; then
        echo "✓ API configured to listen on 0.0.0.0"
    else
        echo "⚠ API host configuration may need adjustment"
        echo "  Current config:"
        grep -A 2 "host:" "$API_CONFIG" 2>/dev/null | head -5 || echo "  (could not read host config)"
    fi
    
    # Check port configuration
    if grep -q "port:.*55000" "$API_CONFIG" 2>/dev/null; then
        echo "✓ API configured for port 55000"
    else
        echo "⚠ API port may not be set to 55000"
    fi
else
    echo "⚠ API configuration file not found: $API_CONFIG"
    echo "  API may use default configuration from Docker image"
fi

# Check if API service is enabled in s6
if [ -d "/etc/s6/services/wazuh-api" ] || [ -d "/etc/s6-overlay/s6-rc.d/wazuh-api" ]; then
    echo "✓ Wazuh API service directory found"
else
    echo "ℹ Wazuh API service managed by s6-overlay"
fi

# Check if API process will start
if command -v wazuh-apid >/dev/null 2>&1; then
    echo "✓ wazuh-apid binary found"
else
    echo "⚠ wazuh-apid binary not found in PATH"
fi

echo "Wazuh API configuration check completed."

