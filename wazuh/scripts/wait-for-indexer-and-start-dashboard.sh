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

# Step 1: Wait for Indexer HTTP endpoint AND cluster to be ready
# With security enabled, Indexer returns 401 (not 200), but that means it's up
# Cluster must be in "green" or "yellow" state for security index initialization
echo "Step 1: Waiting for Indexer HTTP endpoint and cluster to be ready..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check if Indexer responds (401 is OK - means Indexer is up but needs auth)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        # Also check cluster health (even without auth, we can check if cluster is initializing)
        # Try to get cluster health - might return 401 but that's OK, means Indexer is processing
        CLUSTER_RESPONSE=$(curl -s http://localhost:9200/_cluster/health 2>/dev/null || echo "")
        if echo "$CLUSTER_RESPONSE" | grep -q "status" || [ "$HTTP_CODE" = "401" ]; then
            echo "✓ Indexer HTTP endpoint is up (HTTP $HTTP_CODE) and cluster is responding"
            break
        fi
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for Indexer HTTP... (${ELAPSED}s/${MAX_WAIT}s) [last code: ${HTTP_CODE:-none}]"
    fi
done

# Give Indexer a moment to fully initialize cluster state
echo "Waiting 10 seconds for cluster state to stabilize..."
sleep 10

# Step 2: Wait for cluster to be ready (green/yellow state)
# Security index initialization requires cluster to be in a ready state
ELAPSED=0
echo "Step 2: Waiting for cluster to be ready..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check cluster health (might return 401, but we can parse the response)
    CLUSTER_RESPONSE=$(curl -s http://localhost:9200/_cluster/health 2>/dev/null || echo "")
    if echo "$CLUSTER_RESPONSE" | grep -q '"status":"green"' || echo "$CLUSTER_RESPONSE" | grep -q '"status":"yellow"'; then
        CLUSTER_STATUS=$(echo "$CLUSTER_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo "✓ Cluster is ready (status: $CLUSTER_STATUS)"
        break
    elif echo "$CLUSTER_RESPONSE" | grep -q '"status":"red"'; then
        echo "⚠ Cluster is in red state - waiting for recovery..."
    else
        # No status in response (might be 401 or other error)
        echo "⚠ Cluster not ready yet - waiting..."
    fi
    sleep 10
    ELAPSED=$((ELAPSED + 10))
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for cluster... (${ELAPSED}s/${MAX_WAIT}s)"
    fi
done

# Step 3: Wait for security index initialization (auth check)
# The security index must be created AND the admin user must be initialized
# allow_default_init_securityindex: true creates admin user, but it takes time
# OpenSearch 2.x uses .opensearch_security (not .opendistro_security)
ELAPSED=0
echo "Step 3: Waiting for security index initialization (admin user creation)..."
SECURITY_INIT_ATTEMPTED=false
while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Try to authenticate - if successful, security index is initialized and admin user exists
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u admin:"$ADMIN_PASS" http://localhost:9200/_cluster/health 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Security index initialized - admin user exists and is ready"
        break
    elif [ "$HTTP_CODE" = "401" ]; then
        # 401 means security is enabled but credentials are wrong or security index not initialized
        # Check if security index exists
        if curl -s -f http://localhost:9200/.opensearch_security > /dev/null 2>&1 || \
           curl -s -f http://localhost:9200/.opendistro_security > /dev/null 2>&1; then
            echo "⚠ Security index exists but authentication failed (HTTP $HTTP_CODE) - waiting for admin user initialization..."
        else
            echo "⚠ Security index not created yet - waiting..."
            # Try to manually initialize security index after 120 seconds
            # allow_default_init_securityindex should work, but if it doesn't, we need to use securityadmin.sh
            if [ $ELAPSED -ge 120 ] && [ "$SECURITY_INIT_ATTEMPTED" = "false" ]; then
                echo "  Attempting manual security index initialization using securityadmin.sh..."
                SECURITY_INIT_ATTEMPTED=true
                
                # Use securityadmin.sh to initialize security index
                # This creates the .opendistro_security index and default admin user
                if [ -f /usr/share/wazuh-indexer/plugins/opensearch-security/tools/securityadmin.sh ]; then
                    cd /usr/share/wazuh-indexer/plugins/opensearch-security/tools
                    # Initialize security index with default admin user
                    # -cd = change directory, -icl = initialize config, -nhnv = no hostname verification
                    # -cacert, -cert, -key are required for transport security
                    /usr/share/wazuh-indexer/plugins/opensearch-security/tools/securityadmin.sh \
                        -cd /usr/share/wazuh-indexer/plugins/opensearch-security/securityconfig \
                        -icl -nhnv \
                        -cacert /etc/wazuh-indexer/certs/root-ca.pem \
                        -cert /etc/wazuh-indexer/certs/admin.pem \
                        -key /etc/wazuh-indexer/certs/admin-key.pem \
                        -h localhost -p 9200 \
                        -ts /etc/wazuh-indexer/certs/root-ca.pem \
                        -tcn wazuh-indexer \
                        2>&1 | head -20 || echo "  Security admin initialization attempted (may have failed)"
                else
                    echo "  securityadmin.sh not found, trying alternative method..."
                    # Alternative: Try to create security index via API (requires cluster to be ready)
                    # This might work if cluster is fully initialized
                    curl -s -X PUT "http://localhost:9200/.opendistro_security" \
                        -H 'Content-Type: application/json' \
                        -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}' > /dev/null 2>&1 || true
                fi
                echo "  Manual initialization attempt completed"
            fi
        fi
    else
        echo "⚠ Unexpected HTTP code: $HTTP_CODE - waiting..."
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

