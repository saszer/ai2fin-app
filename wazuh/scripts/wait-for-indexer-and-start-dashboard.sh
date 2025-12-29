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
# OpenSearch 2.x uses .opensearch_security (not .opendistro_security)
ELAPSED=0
echo "Step 2: Waiting for security index initialization (admin user creation)..."
SECURITY_INIT_ATTEMPTED=false
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check for both old and new security index names
    SECURITY_INDEX_EXISTS=false
    if curl -s -f http://localhost:9200/.opensearch_security > /dev/null 2>&1; then
        SECURITY_INDEX_EXISTS=true
        echo "✓ Found .opensearch_security index"
    elif curl -s -f http://localhost:9200/.opendistro_security > /dev/null 2>&1; then
        SECURITY_INDEX_EXISTS=true
        echo "✓ Found .opendistro_security index"
    fi
    
    if [ "$SECURITY_INDEX_EXISTS" = "true" ]; then
        # Security index exists, now check if admin user is ready
        # Try to authenticate - if successful, admin user exists
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u admin:"$ADMIN_PASS" http://localhost:9200/_cluster/health 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✓ Security index initialized - admin user exists and is ready"
            break
        elif [ "$HTTP_CODE" = "401" ]; then
            # 401 means security is enabled but credentials are wrong
            # This shouldn't happen with default password, but log it
            echo "⚠ Security enabled but authentication failed (HTTP $HTTP_CODE) - waiting..."
        else
            # Other errors - security might still be initializing
            echo "⚠ Security index exists but not ready yet (HTTP $HTTP_CODE) - waiting..."
        fi
    else
        # Security index doesn't exist yet
        # Try to manually initialize if we've waited long enough (60 seconds)
        if [ $ELAPSED -ge 60 ] && [ "$SECURITY_INIT_ATTEMPTED" = "false" ]; then
            echo "⚠ Security index not found after 60s - attempting manual initialization..."
            # Try to trigger security index initialization by accessing a protected endpoint
            # This might trigger the auto-initialization
            curl -s -X PUT "http://localhost:9200/.opensearch_security/_doc/1" -H 'Content-Type: application/json' -d '{"init":"trigger"}' > /dev/null 2>&1 || true
            SECURITY_INIT_ATTEMPTED=true
            echo "  Manual initialization attempt completed"
        else
            echo "⚠ Security index not created yet - waiting..."
        fi
    fi
    sleep 10
    ELAPSED=$((ELAPSED + 10))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for security index... (${ELAPSED}s/${MAX_WAIT}s)"
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

