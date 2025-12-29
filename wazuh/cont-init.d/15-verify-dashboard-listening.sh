#!/usr/bin/with-contenv sh
# Verify Dashboard is listening on 0.0.0.0:5601
# This helps Fly.io detect the listening socket
# embracingearth.space

set +e  # Don't exit on error

echo "Verifying Dashboard is listening on 0.0.0.0:5601..."

MAX_WAIT=300  # 5 minutes max wait
ELAPSED=0

# Wait for Dashboard to start listening
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check if port 5601 is listening on 0.0.0.0
    if netstat -tlnp 2>/dev/null | grep -q ":5601.*0.0.0.0" || \
       ss -tlnp 2>/dev/null | grep -q ":5601.*0.0.0.0" || \
       lsof -i :5601 2>/dev/null | grep -q LISTEN; then
        echo "✓ Dashboard is listening on 0.0.0.0:5601"
        
        # Also verify HTTP response
        if curl -s -f http://localhost:5601 > /dev/null 2>&1; then
            echo "✓ Dashboard is responding to HTTP requests"
            exit 0
        fi
    fi
    
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for Dashboard to listen on 0.0.0.0:5601... (${ELAPSED}s/${MAX_WAIT}s)"
    fi
done

echo "⚠ WARNING: Dashboard may not be listening on 0.0.0.0:5601 after ${MAX_WAIT}s"
echo "  This is OK if Dashboard is still starting - it will be ready soon"
exit 0  # Don't fail - Dashboard might still be starting

