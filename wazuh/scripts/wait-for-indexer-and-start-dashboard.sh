#!/bin/bash
# Wait for Indexer to be ready AND security index initialized, then start Dashboard
# With security enabled, Indexer requires admin credentials AND security index must be initialized
# allow_default_init_securityindex: true creates admin user, but it takes time
# embracingearth.space

set +e  # Don't exit on error

echo "Waiting for Indexer and security index..."

# Get admin password from environment or use default
ADMIN_PASS="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
MAX_WAIT=600
ELAPSED=0

# Step 1: Wait for Indexer HTTP endpoint (no auth needed)
echo "Step 1: Waiting for Indexer HTTP endpoint..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s -f http://localhost:9200 > /dev/null 2>&1; then
        echo "✓ Indexer HTTP endpoint is up"
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for Indexer HTTP... (${ELAPSED}s/${MAX_WAIT}s)"
    fi
done

# Step 2: Wait for security index initialization (auth check)
ELAPSED=0
echo "Step 2: Waiting for security index initialization (admin user creation)..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s -f -u admin:"$ADMIN_PASS" http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo "✓ Security index initialized - admin user exists"
        break
    fi
    sleep 10
    ELAPSED=$((ELAPSED + 10))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for security index... (${ELAPSED}s/${MAX_WAIT}s)"
    fi
done

sleep 5
echo "Starting Wazuh Dashboard..."

# Start Dashboard
if [ -f /usr/share/wazuh-dashboard/bin/opensearch-dashboards ]; then
    cd /usr/share/wazuh-dashboard && exec ./bin/opensearch-dashboards
elif [ -f /usr/bin/wazuh-dashboard ]; then
    exec /usr/bin/wazuh-dashboard
else
    echo "ERROR: Dashboard binary not found"
    exit 1
fi

