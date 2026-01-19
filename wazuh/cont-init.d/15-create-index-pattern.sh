#!/bin/bash
# Create index pattern in OpenSearch Dashboards for wazuh-alerts-*
# This is a saved object in Dashboards, separate from the index template
# embracingearth.space

set +e  # Don't exit on error

echo "🔧 Creating index pattern in OpenSearch Dashboards..."

DASHBOARD_URL="http://localhost:5601"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
INDEX_PATTERN="wazuh-alerts-*"
MAX_WAIT=600  # 10 minutes for Dashboard to be ready
WAITED=0

# Wait for Dashboard to be ready
echo "  Waiting for Dashboard to be ready..."
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL/api/status" 2>/dev/null | grep -q "200"; then
        echo "  ✅ Dashboard is ready"
        break
    fi
    sleep 10
    WAITED=$((WAITED + 10))
    if [ $((WAITED % 60)) -eq 0 ]; then
        echo "  Still waiting for Dashboard... (${WAITED}s/${MAX_WAIT}s)"
    fi
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "  ⚠️ Dashboard not ready after ${MAX_WAIT}s, skipping index pattern creation"
    exit 0
fi

# Wait a bit more for Dashboard to be fully initialized
sleep 10

# Check if index pattern already exists
echo "  Checking if index pattern exists..."
EXISTS=$(curl -s -u "admin:$OPENSEARCH_PASSWORD" \
    "$DASHBOARD_URL/api/saved_objects/index-pattern/$INDEX_PATTERN" 2>/dev/null | \
    grep -q "index-pattern" && echo "yes" || echo "no")

if [ "$EXISTS" = "yes" ]; then
    echo "  ✅ Index pattern '$INDEX_PATTERN' already exists"
    exit 0
fi

# Check if any indices exist (template might exist but no indices yet)
echo "  Checking if indices exist..."
INDICES=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
    "https://localhost:9200/_cat/indices/$INDEX_PATTERN?h=index" 2>/dev/null | wc -l)

if [ "$INDICES" -eq 0 ]; then
    echo "  ⚠️ No indices found yet, creating dummy index to trigger template..."
    # Create a dummy index to trigger the template
    curl -s -X PUT -k -u "admin:$OPENSEARCH_PASSWORD" \
        "https://localhost:9200/wazuh-alerts-$(date +%Y.%m.%d)" \
        -H "Content-Type: application/json" \
        -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}' >/dev/null 2>&1
    sleep 2
fi

# Create index pattern via Dashboard API
echo "  Creating index pattern '$INDEX_PATTERN'..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -u "admin:$OPENSEARCH_PASSWORD" \
    "$DASHBOARD_URL/api/saved_objects/index-pattern/$INDEX_PATTERN" \
    -H "Content-Type: application/json" \
    -H "osd-xsrf: true" \
    -d "{
        \"attributes\": {
            \"title\": \"$INDEX_PATTERN\",
            \"timeFieldName\": \"timestamp\"
        }
    }" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
    if [ "$HTTP_CODE" = "409" ]; then
        echo "  ✅ Index pattern already exists"
    else
        echo "  ✅ Index pattern created successfully"
    fi
    
    # Try to set as default (optional, may fail if already set)
    curl -s -X POST \
        -u "admin:$OPENSEARCH_PASSWORD" \
        "$DASHBOARD_URL/api/saved_objects/index-pattern/$INDEX_PATTERN" \
        -H "Content-Type: application/json" \
        -H "osd-xsrf: true" \
        -d '{"attributes":{"title":"wazuh-alerts-*"}}' >/dev/null 2>&1 || true
else
    echo "  ⚠️ Failed to create index pattern (HTTP $HTTP_CODE)"
    echo "  Response: $BODY" | head -3
    # Not critical - user can create it manually via UI
fi

echo "✅ Index pattern creation completed"

