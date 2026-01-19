#!/bin/bash
# Runtime script to create index pattern in OpenSearch Dashboards
# Can be run via fly ssh console to fix the 404 error immediately
# embracingearth.space

set +e

echo "🔧 Creating index pattern in OpenSearch Dashboards..."

DASHBOARD_URL="http://localhost:5601"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
INDEX_PATTERN="wazuh-alerts-*"

# Check if Dashboard is ready
if ! curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL/api/status" 2>/dev/null | grep -q "200"; then
    echo "  ❌ Dashboard not ready yet"
    exit 1
fi

# Check if index pattern already exists
EXISTS=$(curl -s -u "admin:$OPENSEARCH_PASSWORD" \
    "$DASHBOARD_URL/api/saved_objects/index-pattern/$INDEX_PATTERN" 2>/dev/null | \
    grep -q "index-pattern" && echo "yes" || echo "no")

if [ "$EXISTS" = "yes" ]; then
    echo "  ✅ Index pattern '$INDEX_PATTERN' already exists"
    exit 0
fi

# Check if any indices exist
INDICES=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
    "https://localhost:9200/_cat/indices/$INDEX_PATTERN?h=index" 2>/dev/null | wc -l)

if [ "$INDICES" -eq 0 ]; then
    echo "  Creating dummy index to trigger template..."
    curl -s -X PUT -k -u "admin:$OPENSEARCH_PASSWORD" \
        "https://localhost:9200/wazuh-alerts-$(date +%Y.%m.%d)" \
        -H "Content-Type: application/json" \
        -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}' >/dev/null 2>&1
    sleep 2
fi

# Create index pattern
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

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "  ✅ Index pattern created successfully"
    echo ""
    echo "  Refresh the Dashboard page to see the index pattern"
else
    echo "  ⚠️ Failed to create index pattern (HTTP $HTTP_CODE)"
    echo "  Response: $BODY" | head -5
    echo ""
    echo "  You can also create it manually:"
    echo "  1. Go to Stack Management > Index Patterns"
    echo "  2. Click 'Create index pattern'"
    echo "  3. Enter: wazuh-alerts-*"
    echo "  4. Select 'timestamp' as time field"
fi

