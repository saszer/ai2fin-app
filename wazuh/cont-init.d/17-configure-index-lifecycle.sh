#!/bin/bash
# Configure Index Lifecycle Management (ILM) to prevent disk space issues
# Automatically deletes old indices to prevent disk from filling up
# embracingearth.space

set +e

echo "🔧 Configuring Index Lifecycle Management..."

OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
OPENSEARCH_URL="https://localhost:9200"

# Wait for OpenSearch to be ready
MAX_WAIT=300
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s -k -u "admin:$OPENSEARCH_PASSWORD" "$OPENSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
        echo "  ✅ OpenSearch is ready"
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "  ⚠️ OpenSearch not ready, skipping ILM configuration"
    exit 0
fi

# Create ILM policy to delete indices older than 30 days
echo "  Creating ILM policy for wazuh-alerts indices..."
POLICY_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    -k -u "admin:$OPENSEARCH_PASSWORD" \
    "$OPENSEARCH_URL/_ilm/policy/wazuh-alerts-policy" \
    -H "Content-Type: application/json" \
    -d '{
        "policy": {
            "phases": {
                "hot": {
                    "actions": {
                        "rollover": {
                            "max_size": "10GB",
                            "max_age": "7d"
                        }
                    }
                },
                "delete": {
                    "min_age": "30d",
                    "actions": {
                        "delete": {}
                    }
                }
            }
        }
    }' 2>/dev/null)

HTTP_CODE=$(echo "$POLICY_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "  ✅ ILM policy created"
else
    echo "  ⚠️ Failed to create ILM policy (HTTP $HTTP_CODE)"
fi

# Create index template with ILM policy
echo "  Updating index template with ILM policy..."
TEMPLATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    -k -u "admin:$OPENSEARCH_PASSWORD" \
    "$OPENSEARCH_URL/_index_template/wazuh-alerts" \
    -H "Content-Type: application/json" \
    -d '{
        "index_patterns": ["wazuh-alerts-*"],
        "template": {
            "settings": {
                "index.lifecycle.name": "wazuh-alerts-policy",
                "index.lifecycle.rollover_alias": "wazuh-alerts"
            }
        },
        "priority": 200
    }' 2>/dev/null)

HTTP_CODE=$(echo "$TEMPLATE_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "  ✅ Index template updated with ILM"
else
    echo "  ⚠️ Failed to update template (HTTP $HTTP_CODE) - may already exist"
fi

echo "✅ ILM configuration completed"

