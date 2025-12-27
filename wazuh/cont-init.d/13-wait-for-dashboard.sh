#!/usr/bin/with-contenv sh
# Wait for Dashboard to be ready before health checks start
# This ensures Dashboard is listening on port 5601 before Fly.io health checks begin
# embracingearth.space

set +e  # Don't exit on error

echo "Waiting for Wazuh Dashboard to be ready on port 5601..."

MAX_WAIT=240  # 4 minutes total (Dashboard takes 2-3 min after Indexer)
WAIT_INTERVAL=5
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check if port 5601 is listening
    if netstat -tln 2>/dev/null | grep -q ":5601 " || ss -tln 2>/dev/null | grep -q ":5601 "; then
        # Port is listening, verify it responds
        if curl -s -f http://localhost:5601/api/status > /dev/null 2>&1; then
            echo "✓ Wazuh Dashboard is ready and responding on port 5601"
            exit 0
        else
            echo "Port 5601 is listening but not responding yet... (${ELAPSED}s/${MAX_WAIT}s)"
        fi
    else
        echo "Waiting for Dashboard to start... (${ELAPSED}s/${MAX_WAIT}s)"
    fi
    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

echo "⚠ Dashboard not fully ready after ${MAX_WAIT}s, but continuing..."
# Don't exit with error - let health checks handle it
exit 0

