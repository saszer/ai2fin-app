#!/usr/bin/with-contenv sh
# Wait for Wazuh API to be ready before marking container as healthy
# This ensures the API is listening before health checks start
# embracingearth.space

set +e  # Don't exit on error - we want to continue even if API takes time

MAX_WAIT=180  # Maximum wait time in seconds (3 minutes)
WAIT_INTERVAL=5  # Check every 5 seconds
ELAPSED=0

echo "Waiting for Wazuh API to be ready on 0.0.0.0:55000..."

# Wait for Wazuh API to start listening
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check if port 55000 is listening (multiple methods for compatibility)
    PORT_READY=false
    
    # Method 1: netstat
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":55000.*LISTEN"; then
            PORT_READY=true
        fi
    fi
    
    # Method 2: ss
    if [ "$PORT_READY" = false ] && command -v ss >/dev/null 2>&1; then
        if ss -tuln 2>/dev/null | grep -q ":55000.*LISTEN"; then
            PORT_READY=true
        fi
    fi
    
    # Method 3: Check if we can connect to the port
    if [ "$PORT_READY" = false ]; then
        if command -v nc >/dev/null 2>&1 && nc -z localhost 55000 2>/dev/null; then
            PORT_READY=true
        fi
    fi
    
    if [ "$PORT_READY" = true ]; then
        echo "✓ Wazuh API is ready and listening on port 55000"
        exit 0
    fi
    
    # Check if wazuh-api or wazuh-apid process is running
    if pgrep -f "wazuh-api" > /dev/null 2>&1 || pgrep -f "wazuh-apid" > /dev/null 2>&1; then
        echo "Wazuh API process detected, waiting for port to be ready... (${ELAPSED}s)"
    else
        echo "Wazuh API process not yet started, waiting... (${ELAPSED}s)"
    fi
    
    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

echo "⚠ WARNING: Wazuh API did not become ready within ${MAX_WAIT} seconds"
echo "Container will continue - API may start later or there may be a configuration issue"
echo "Check logs: /var/ossec/logs/ossec.log"

