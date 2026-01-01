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

# SSL options - skip verification for localhost self-signed certs
CURL_OPTS="-k"

# Step 1: Wait for Indexer HTTPS endpoint to be accepting connections
# Possible responses:
#   - 000: Connection refused (Indexer not yet started)
#   - 200: Indexer up and security working (unlikely on first boot)
#   - 401: Indexer up, security enabled, needs auth
#   - 503: Indexer up but security not initialized (need to run securityadmin)
echo "Step 1: Waiting for Indexer HTTPS endpoint..."
while [ $ELAPSED -lt $MAX_WAIT ]; do
    HTTP_CODE=$(curl -s $CURL_OPTS -o /dev/null -w "%{http_code}" https://localhost:9200 2>/dev/null)
    # Accept 200, 401, or 503 - all mean Indexer is up and responding
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "503" ]; then
        echo "✓ Indexer HTTPS endpoint is responding (HTTP $HTTP_CODE)"
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    # Log every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "Waiting for Indexer HTTPS... (${ELAPSED}s/${MAX_WAIT}s) [last code: ${HTTP_CODE:-none}]"
    fi
done

# Step 2: Run securityadmin to initialize security configuration
# This is REQUIRED when plugins.security.ssl.http.enabled: true
ELAPSED=0
echo "Step 2: Initializing security configuration with securityadmin..."
export JAVA_HOME=/usr/share/wazuh-indexer/jdk

# Check if security is already initialized
HTTP_CODE=$(curl -s $CURL_OPTS -o /dev/null -w "%{http_code}" -u admin:"$ADMIN_PASS" https://localhost:9200/_cluster/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Security already initialized - skipping securityadmin"
else
    # Run securityadmin to initialize security configuration
    echo "Running securityadmin to initialize security index..."
    SECURITYADMIN_PATH="/usr/share/wazuh-indexer/plugins/opensearch-security/tools/securityadmin.sh"
    
    # Check if securityadmin exists and is readable
    if [ ! -r "$SECURITYADMIN_PATH" ]; then
        echo "WARNING: securityadmin.sh not readable at $SECURITYADMIN_PATH, searching..."
        FOUND=$(find /usr/share -name "securityadmin.sh" 2>/dev/null | head -1)
        if [ -n "$FOUND" ]; then
            SECURITYADMIN_PATH="$FOUND"
            echo "Found securityadmin at: $SECURITYADMIN_PATH"
        else
            echo "ERROR: securityadmin.sh not found anywhere"
            exit 1
        fi
    fi
    
    # Retry securityadmin up to 5 times
    # Run as wazuh-indexer user to ensure proper permissions
    for i in 1 2 3 4 5; do
        echo "Attempt $i: Running securityadmin..."
        cd /usr/share/wazuh-indexer/plugins/opensearch-security/tools
        export JAVA_HOME=/usr/share/wazuh-indexer/jdk
        # Use su to run as wazuh-indexer user (file is owned by wazuh-indexer)
        su -s /bin/bash -c "bash $SECURITYADMIN_PATH \
            -cd /etc/wazuh-indexer/opensearch-security/ \
            -cacert /etc/wazuh-indexer/certs/root-ca.pem \
            -cert /etc/wazuh-indexer/certs/admin.pem \
            -key /etc/wazuh-indexer/certs/admin-key.pem \
            -icl -nhnv" wazuh-indexer
        
        if [ $? -eq 0 ]; then
            echo "✓ securityadmin completed successfully"
            break
        else
            echo "⚠ securityadmin failed (attempt $i/5) - waiting 30 seconds..."
            sleep 30
        fi
    done
fi

# Step 3: Verify security is now working
echo "Step 3: Verifying security configuration..."
ELAPSED=0
while [ $ELAPSED -lt 120 ]; do
    HTTP_CODE=$(curl -s $CURL_OPTS -o /dev/null -w "%{http_code}" -u admin:"$ADMIN_PASS" https://localhost:9200/_cluster/health 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Security verified - admin authentication working"
        break
    fi
    echo "⚠ Waiting for security to stabilize... (HTTP $HTTP_CODE)"
    sleep 10
    ELAPSED=$((ELAPSED + 10))
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

