#!/bin/bash
# Create all required Wazuh index patterns in OpenSearch Dashboards
# Handles version conflicts gracefully (patterns already exist)
# embracingearth.space

set +e  # Don't exit on error

echo "🔧 Creating all Wazuh index patterns..."

DASHBOARD_URL="http://localhost:5601"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
MAX_WAIT=600  # 10 minutes
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

sleep 10  # Wait for Dashboard to be fully initialized

# Function to create or update index pattern
create_index_pattern() {
    local PATTERN=$1
    local TIME_FIELD=${2:-timestamp}
    
    echo "  Processing index pattern: $PATTERN"
    
    # Check if pattern exists
    EXISTS=$(curl -s -u "admin:$OPENSEARCH_PASSWORD" \
        "$DASHBOARD_URL/api/saved_objects/index-pattern/$PATTERN" 2>/dev/null | \
        grep -q "index-pattern" && echo "yes" || echo "no")
    
    if [ "$EXISTS" = "yes" ]; then
        echo "    ✅ Already exists, updating..."
        # Update existing pattern
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
            -u "admin:$OPENSEARCH_PASSWORD" \
            "$DASHBOARD_URL/api/saved_objects/index-pattern/$PATTERN" \
            -H "Content-Type: application/json" \
            -H "osd-xsrf: true" \
            -d "{
                \"attributes\": {
                    \"title\": \"$PATTERN\",
                    \"timeFieldName\": \"$TIME_FIELD\"
                }
            }" 2>/dev/null)
    else
        echo "    Creating new pattern..."
        # Create new pattern
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            -u "admin:$OPENSEARCH_PASSWORD" \
            "$DASHBOARD_URL/api/saved_objects/index-pattern/$PATTERN" \
            -H "Content-Type: application/json" \
            -H "osd-xsrf: true" \
            -d "{
                \"attributes\": {
                    \"title\": \"$PATTERN\",
                    \"timeFieldName\": \"$TIME_FIELD\"
                }
            }" 2>/dev/null)
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "    ✅ Success (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "409" ]; then
        echo "    ✅ Already exists (version conflict - OK)"
    else
        echo "    ⚠️ HTTP $HTTP_CODE (may need manual creation)"
    fi
}

# Create all required index patterns
create_index_pattern "wazuh-alerts-*" "timestamp"
create_index_pattern "wazuh-statistics-*" "timestamp"
create_index_pattern "wazuh-monitoring-*" "timestamp"

echo "✅ All index patterns processed"

