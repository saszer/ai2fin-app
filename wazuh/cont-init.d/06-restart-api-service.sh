#!/usr/bin/with-contenv sh
# Restart Wazuh API service to ensure it picks up config changes
# This runs after config is fixed to force API to reload
# embracingearth.space

set +e  # Don't exit on error

echo "Attempting to restart Wazuh API service to apply config..."

# Wait for Wazuh to be fully initialized
sleep 15

# Check if API config has correct binding
API_CONFIG="/var/ossec/api/configuration/api.yaml"
if [ -f "$API_CONFIG" ] && grep -q "0.0.0.0" "$API_CONFIG" 2>/dev/null; then
    echo "✓ API config has correct binding"
    
    # Try to restart API service using wazuh-control
    if command -v /var/ossec/bin/wazuh-control >/dev/null 2>&1; then
        echo "Restarting Wazuh API via wazuh-control..."
        /var/ossec/bin/wazuh-control restart wazuh-api 2>&1 || {
            echo "⚠ wazuh-control restart failed, trying stop/start..."
            /var/ossec/bin/wazuh-control stop wazuh-api 2>&1 || true
            sleep 2
            /var/ossec/bin/wazuh-control start wazuh-api 2>&1 || true
        }
    else
        echo "⚠ wazuh-control not found"
    fi
    
    # Alternative: Kill and let s6 restart it
    API_PID=$(pgrep -f "wazuh-apid" | head -1)
    if [ -n "$API_PID" ]; then
        echo "Found API process (PID: $API_PID)"
        echo "Sending SIGTERM to force restart..."
        kill -TERM "$API_PID" 2>/dev/null || true
        sleep 3
        # s6-overlay should automatically restart it
    else
        echo "⚠ API process not found, may not be running yet"
    fi
    
    echo "API restart attempt completed"
else
    echo "⚠ API config not found or incorrect, skipping restart"
fi

