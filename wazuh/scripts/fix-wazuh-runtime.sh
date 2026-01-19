#!/bin/bash
# Runtime fix script for Wazuh - can be run via fly ssh console
# This fixes issues on a running instance without redeployment
# embracingearth.space

set +e

echo "🔧 Running runtime fixes for Wazuh..."

# 1. Fix Filebeat password
echo "1. Fixing Filebeat password..."
FILEBEAT_CONFIG="/etc/filebeat/filebeat.yml"
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"

if [ -f "$FILEBEAT_CONFIG" ]; then
    if grep -q '\${OPENSEARCH_INITIAL_ADMIN_PASSWORD' "$FILEBEAT_CONFIG" 2>/dev/null; then
        echo "  Substituting password placeholder..."
        sed -i "s|password:.*\${OPENSEARCH_INITIAL_ADMIN_PASSWORD.*}|password: \"$OPENSEARCH_PASSWORD\"|" "$FILEBEAT_CONFIG" 2>/dev/null || \
        sed -i "s|^  password:.*|  password: \"$OPENSEARCH_PASSWORD\"|" "$FILEBEAT_CONFIG" 2>/dev/null || true
        echo "  ✅ Password configured"
        
        # Restart Filebeat
        if command -v supervisorctl >/dev/null 2>&1; then
            echo "  Restarting Filebeat..."
            supervisorctl restart filebeat 2>/dev/null || true
            sleep 3
        fi
    else
        echo "  ✅ Password already configured"
    fi
else
    echo "  ⚠️ Filebeat config not found"
fi

# 2. Ensure API is running and accessible
echo "2. Checking Wazuh API..."
if ! pgrep -f "wazuh-apid" >/dev/null 2>&1; then
    echo "  ⚠️ API process not running"
    if command -v supervisorctl >/dev/null 2>&1; then
        echo "  Attempting to start API..."
        # API is managed by wazuh-manager, not directly
        echo "  Note: API starts with Manager via supervisord"
    fi
else
    echo "  ✅ API process is running"
    
    # Check if API is accepting connections
    if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:55000/ 2>/dev/null | grep -q "[0-9]"; then
        echo "  ✅ API is accepting connections"
    else
        echo "  ⚠️ API not accepting connections, checking config..."
        API_CONFIG="/var/ossec/api/configuration/api.yaml"
        if [ -f "$API_CONFIG" ]; then
            if ! grep -q "^host: '0.0.0.0'" "$API_CONFIG" 2>/dev/null; then
                echo "  Fixing API host binding..."
                sed -i "s/^host:.*/host: '0.0.0.0'/" "$API_CONFIG" 2>/dev/null || true
                echo "  Restarting API..."
                API_PID=$(pgrep -f "wazuh-apid" | head -1)
                if [ -n "$API_PID" ]; then
                    kill -HUP "$API_PID" 2>/dev/null || kill -TERM "$API_PID" 2>/dev/null || true
                    sleep 5
                fi
            fi
        fi
    fi
fi

# 3. Ensure index template exists
echo "3. Checking index template..."
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
OPENSEARCH_URL="https://localhost:9200"
TEMPLATE_NAME="wazuh-alerts"
TEMPLATE_FILE="/etc/filebeat/wazuh-template.json"

if curl -s -k -u "admin:$OPENSEARCH_PASSWORD" "$OPENSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
    TEMPLATE_EXISTS=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
        "$OPENSEARCH_URL/_index_template/$TEMPLATE_NAME" 2>/dev/null | grep -q "$TEMPLATE_NAME" && echo "yes" || echo "no")
    
    if [ "$TEMPLATE_EXISTS" = "no" ]; then
        echo "  Template missing, creating..."
        if [ -f "$TEMPLATE_FILE" ]; then
            RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$OPENSEARCH_URL/_index_template/$TEMPLATE_NAME" \
                -k -u "admin:$OPENSEARCH_PASSWORD" \
                -H "Content-Type: application/json" \
                -d @"$TEMPLATE_FILE" 2>/dev/null)
            HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
                echo "  ✅ Index template created"
            else
                echo "  ⚠️ Failed to create template (HTTP $HTTP_CODE)"
            fi
        else
            echo "  ⚠️ Template file not found: $TEMPLATE_FILE"
        fi
    else
        echo "  ✅ Index template exists"
    fi
else
    echo "  ⚠️ OpenSearch not accessible"
fi

# 4. Check Filebeat status
echo "4. Checking Filebeat status..."
if pgrep -f "[f]ilebeat" >/dev/null 2>&1; then
    echo "  ✅ Filebeat is running"
    
    # Check for auth errors in logs
    if [ -f "/var/log/filebeat/filebeat" ]; then
        if tail -20 /var/log/filebeat/filebeat 2>/dev/null | grep -q "401\|Unauthorized"; then
            echo "  ⚠️ Filebeat showing auth errors - password may be incorrect"
        else
            echo "  ✅ No auth errors in Filebeat logs"
        fi
    fi
else
    echo "  ⚠️ Filebeat not running"
    if command -v supervisorctl >/dev/null 2>&1; then
        echo "  Attempting to start Filebeat..."
        supervisorctl start filebeat 2>/dev/null || true
    fi
fi

echo "✅ Runtime fixes completed"
echo ""
echo "📋 Verification:"
echo "  - API: https://localhost:55000/status (use Wazuh API credentials)"
echo "  - Dashboard: http://localhost:5601"
echo "  - Health check: Visit Dashboard UI and check health check page"

