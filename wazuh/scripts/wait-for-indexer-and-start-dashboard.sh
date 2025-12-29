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

# Step 1: Wait for Indexer HTTP endpoint
# With security enabled, Indexer returns 401 (not 200), but that means it's up
echo "Step 1: Waiting for Indexer HTTP endpoint..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check if Indexer responds (401 is OK - means Indexer is up but needs auth)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo "✓ Indexer HTTP endpoint is up (HTTP $HTTP_CODE)"
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for Indexer HTTP... (${ELAPSED}s/${MAX_WAIT}s) [last code: ${HTTP_CODE:-none}]"
    fi
done

# Step 2: Wait for security index initialization (auth check)
# The security index must be created AND the admin user must be initialized
# allow_default_init_securityindex: true creates admin user, but it takes time
ELAPSED=0
echo "Step 2: Waiting for security index initialization (admin user creation)..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Try to authenticate - if successful (200), admin user exists and security index is ready
    # 401 means security is enabled but credentials might be wrong or user not ready yet
    # Other codes mean Indexer might still be starting
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u admin:"$ADMIN_PASS" http://localhost:9200/_cluster/health 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Security index initialized - admin user exists and is ready"
        break
    elif [ "$HTTP_CODE" = "401" ]; then
        # 401 means security is enabled but authentication failed
        # This could mean:
        # 1. Security index exists but admin user not created yet (still initializing)
        # 2. Password is wrong (shouldn't happen with default)
        # Check if security index exists (401 on index check means it exists)
        INDEX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200/.opendistro_security 2>/dev/null)
        if [ "$INDEX_CHECK" = "401" ] || [ "$INDEX_CHECK" = "200" ]; then
            # Security index exists (401 or 200 both mean it exists)
            echo "⚠ Security index exists but admin user not ready yet (HTTP $HTTP_CODE) - waiting..."
        else
            # Security index doesn't exist yet
            echo "⚠ Security index not created yet (index check: $INDEX_CHECK) - waiting..."
        fi
    else
        # Other errors - Indexer might still be starting
        echo "⚠ Indexer not ready yet (HTTP $HTTP_CODE) - waiting..."
    fi
    sleep 10
    ELAPSED=$((ELAPSED + 10))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for security index... (${ELAPSED}s/${MAX_WAIT}s) [auth: $HTTP_CODE]"
    fi
done

# Give Indexer a moment to fully initialize after security index is ready
sleep 5
echo "✓ Indexer is ready - security index initialized"
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

