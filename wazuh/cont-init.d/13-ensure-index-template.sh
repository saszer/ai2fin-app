#!/bin/bash
# Ensure Wazuh alerts index template exists in OpenSearch
# This script waits for OpenSearch to be ready, then creates the template if missing
# embracingearth.space

set +e  # Don't exit on error

echo "🔧 Ensuring Wazuh alerts index template exists..."

OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
OPENSEARCH_URL="https://localhost:9200"
TEMPLATE_NAME="wazuh-alerts"
TEMPLATE_FILE="/etc/filebeat/wazuh-template.json"

# Wait for OpenSearch to be ready (max 5 minutes)
MAX_WAIT=300
WAITED=0
echo "  Waiting for OpenSearch to be ready..."
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s -k -u "admin:$OPENSEARCH_PASSWORD" "$OPENSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
        echo "  ✅ OpenSearch is ready"
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
    if [ $((WAITED % 30)) -eq 0 ]; then
        echo "  Still waiting for OpenSearch... (${WAITED}s/${MAX_WAIT}s)"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "  ⚠️ OpenSearch not ready after ${MAX_WAIT}s, skipping template creation"
    exit 0
fi

# Check if template already exists
TEMPLATE_EXISTS=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
    "$OPENSEARCH_URL/_index_template/$TEMPLATE_NAME" 2>/dev/null | grep -q "$TEMPLATE_NAME" && echo "yes" || echo "no")

if [ "$TEMPLATE_EXISTS" = "yes" ]; then
    echo "  ✅ Index template '$TEMPLATE_NAME' already exists"
    exit 0
fi

echo "  Template missing, creating..."

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "  ⚠️ Template file not found: $TEMPLATE_FILE"
    echo "  Downloading template from Wazuh repository..."
    mkdir -p "$(dirname "$TEMPLATE_FILE")"
    curl -s "https://raw.githubusercontent.com/wazuh/wazuh/v4.8.0/extensions/elasticsearch/7.x/wazuh-template.json" \
        -o "$TEMPLATE_FILE" 2>/dev/null || {
        echo "  ❌ Failed to download template file"
        exit 0  # Not critical, Filebeat will try to create it
    }
fi

# Create template in OpenSearch
echo "  Creating template in OpenSearch..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$OPENSEARCH_URL/_index_template/$TEMPLATE_NAME" \
    -k -u "admin:$OPENSEARCH_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @"$TEMPLATE_FILE" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "  ✅ Index template created successfully"
elif echo "$BODY" | grep -q "already_exists" 2>/dev/null; then
    echo "  ✅ Index template already exists (race condition)"
else
    echo "  ⚠️ Failed to create template (HTTP $HTTP_CODE)"
    echo "  Response: $BODY" | head -5
    # Not critical - Filebeat will try to create it when it starts
fi

