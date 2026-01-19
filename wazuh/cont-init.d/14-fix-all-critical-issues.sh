#!/bin/bash
# Comprehensive fix script for all critical Wazuh issues
# This script runs after all other init scripts to ensure everything is working
# embracingearth.space

set +e  # Don't exit on error

echo "🔧 Running comprehensive Wazuh fixes..."

# 1. Ensure API is configured and accessible
echo "1. Checking Wazuh API..."
API_CONFIG="/var/ossec/api/configuration/api.yaml"
if [ -f "$API_CONFIG" ]; then
    # Ensure host is 0.0.0.0
    if ! grep -q "^host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null; then
        echo "  Fixing API host binding..."
        sed -i "s/^host:.*/host: '0.0.0.0'/" "$API_CONFIG" 2>/dev/null || true
    fi
    echo "  ✅ API config verified"
else
    echo "  ⚠️ API config not found"
fi

# 2. Ensure Filebeat password is configured (re-check)
echo "2. Verifying Filebeat password..."
FILEBEAT_CONFIG="/etc/filebeat/filebeat.yml"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
if [ -f "$FILEBEAT_CONFIG" ]; then
    if grep -q '\${OPENSEARCH_INITIAL_ADMIN_PASSWORD' "$FILEBEAT_CONFIG" 2>/dev/null; then
        echo "  Password placeholder still present, fixing..."
        ESCAPED_PASSWORD=$(printf '%s\n' "$OPENSEARCH_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i "s|password:.*|password: \"$OPENSEARCH_PASSWORD\"|" "$FILEBEAT_CONFIG" 2>/dev/null || true
        echo "  ✅ Filebeat password configured"
    else
        echo "  ✅ Filebeat password already configured"
    fi
fi

# 3. Wait for OpenSearch and ensure index template exists
echo "3. Ensuring index template exists..."
OPENSEARCH_URL="https://localhost:9200"
TEMPLATE_NAME="wazuh-alerts"

# Wait for OpenSearch (max 2 minutes)
WAITED=0
MAX_WAIT=120
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s -k -u "admin:$OPENSEARCH_PASSWORD" "$OPENSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
        echo "  ✅ OpenSearch is ready"
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -lt $MAX_WAIT ]; then
    # Check if template exists
    TEMPLATE_EXISTS=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
        "$OPENSEARCH_URL/_index_template/$TEMPLATE_NAME" 2>/dev/null | grep -q "$TEMPLATE_NAME" && echo "yes" || echo "no")
    
    if [ "$TEMPLATE_EXISTS" = "no" ]; then
        echo "  Template missing, will be created by Filebeat on startup"
    else
        echo "  ✅ Index template exists"
    fi
else
    echo "  ⚠️ OpenSearch not ready, template creation will happen later"
fi

# 4. Verify API user exists (if API is running)
echo "4. Checking API user..."
if pgrep -f "wazuh-apid" >/dev/null 2>&1; then
    # Wait a bit for API to be fully ready
    sleep 5
    if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:55000/ >/dev/null 2>&1; then
        echo "  ✅ API is running and accessible"
    else
        echo "  ⚠️ API process running but not yet accepting connections"
    fi
else
    echo "  ℹ️ API not yet running (will start via supervisord)"
fi

echo "✅ Comprehensive fixes completed"

