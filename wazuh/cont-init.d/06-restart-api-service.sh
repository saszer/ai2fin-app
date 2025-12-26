#!/usr/bin/with-contenv sh
# Force restart Wazuh API service to ensure it picks up config changes
# This runs after config is fixed to force API to reload
# embracingearth.space

set +e  # Don't exit on error

echo "Force restarting Wazuh API service to apply 0.0.0.0 binding..."

# Wait for Wazuh to be fully initialized
echo "Waiting for Wazuh initialization..."
sleep 20

# Check if API config has correct binding
API_CONFIG="/var/ossec/api/configuration/api.yaml"
if [ -f "$API_CONFIG" ] && grep -q "0.0.0.0" "$API_CONFIG" 2>/dev/null; then
    echo "✓ API config has correct binding (0.0.0.0)"
    
    # Method 1: Use wazuh-control to restart
    if command -v /var/ossec/bin/wazuh-control >/dev/null 2>&1; then
        echo "Method 1: Restarting via wazuh-control..."
        /var/ossec/bin/wazuh-control stop wazuh-api 2>&1
        sleep 3
        /var/ossec/bin/wazuh-control start wazuh-api 2>&1
        sleep 5
    fi
    
    # Method 2: Kill API process and let s6 restart it
    API_PID=$(pgrep -f "wazuh-apid" | head -1)
    if [ -n "$API_PID" ]; then
        echo "Method 2: Killing API process (PID: $API_PID) to force s6 restart..."
        kill -9 "$API_PID" 2>/dev/null || kill -TERM "$API_PID" 2>/dev/null || true
        sleep 5
        echo "s6-overlay should restart API automatically"
    fi
    
    # Method 3: Use s6 service control directly
    if [ -f "/etc/s6-overlay/s6-rc.d/wazuh-api/down" ]; then
        echo "Method 3: Using s6-rc to restart API..."
        s6-rc -u change wazuh-api 2>&1 || true
        sleep 3
    fi
    
    # Wait a bit and check if API restarted
    sleep 5
    NEW_API_PID=$(pgrep -f "wazuh-apid" | head -1)
    if [ -n "$NEW_API_PID" ]; then
        echo "✓ API process restarted (new PID: $NEW_API_PID)"
    else
        echo "⚠ API process not found after restart attempt"
    fi
    
    # Check if port is now listening
    sleep 3
    if netstat -tuln 2>/dev/null | grep -q ":55000.*LISTEN" || \
       ss -tuln 2>/dev/null | grep -q ":55000.*LISTEN"; then
        echo "✓ Port 55000 is now listening!"
    else
        echo "⚠ Port 55000 still not listening"
        echo "  Checking API logs for errors..."
        tail -20 /var/ossec/logs/api.log 2>/dev/null | grep -i "error\|bind\|listen" || echo "  (no errors in recent logs)"
    fi
    
    echo "API restart attempt completed"
else
    echo "⚠ API config not found or missing 0.0.0.0 binding"
    if [ -f "$API_CONFIG" ]; then
        echo "  Current config:"
        grep -A 3 "host:" "$API_CONFIG" 2>/dev/null | head -5
    fi
fi

