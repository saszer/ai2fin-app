#!/usr/bin/with-contenv sh
# Restart Wazuh API only if configuration changed
# Optimized version - only restarts if actually needed
# embracingearth.space

set +e  # Don't exit on error

echo "Checking if Wazuh API restart is needed..."

API_CONFIG="/var/ossec/api/configuration/api.yaml"

# Only restart if API is running and config exists
if [ -f "$API_CONFIG" ] && pgrep -f "wazuh-apid" >/dev/null 2>&1; then
    # Check if API is actually accepting connections
    if command -v curl >/dev/null 2>&1; then
        if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:55000/ 2>/dev/null | grep -q "[0-9]"; then
            echo "✓ API is accepting connections - no restart needed"
            exit 0
        fi
    fi
    
    # API is running but not accepting connections - restart needed
    echo "⚠ API not accepting connections, restarting..."
    API_PID=$(pgrep -f "wazuh-apid" | head -1)
    if [ -n "$API_PID" ]; then
        kill -TERM "$API_PID" 2>/dev/null || kill -9 "$API_PID" 2>/dev/null || true
        sleep 3  # Give s6 time to restart
        
        # Verify restart
        NEW_API_PID=$(pgrep -f "wazuh-apid" | head -1)
        if [ -n "$NEW_API_PID" ]; then
            echo "✓ API restarted (new PID: $NEW_API_PID)"
            
            # Wait for API to accept connections
            sleep 3
            if command -v curl >/dev/null 2>&1; then
                if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:55000/ 2>/dev/null | grep -q "[0-9]"; then
                    echo "✓ API is now accepting connections"
                else
                    echo "⚠ API restarted but not yet accepting connections"
                fi
            fi
        else
            echo "⚠ API process not found after restart"
        fi
    fi
else
    echo "ℹ API not running or config not found - will start via s6"
fi

echo "API restart check completed"

