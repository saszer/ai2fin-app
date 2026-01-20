#!/bin/bash
# Check Indexer status and diagnose issues
# Can be run via: fly ssh console -a ai2-wazuh -C "bash /etc/cont-init.d/scripts/check-indexer-status.sh"
# embracingearth.space

set +e

echo "🔍 Checking Indexer status..."

# 1. Check if Indexer process is running
echo "1. Checking Indexer process..."
if pgrep -f "opensearch" > /dev/null; then
    echo "  ✅ Indexer process is running"
    ps aux | grep -E "opensearch|wazuh-indexer" | grep -v grep
else
    echo "  ❌ Indexer process is NOT running"
fi

# 2. Check if port 9200 is listening
echo ""
echo "2. Checking port 9200..."
if netstat -tuln 2>/dev/null | grep -q ":9200" || ss -tuln 2>/dev/null | grep -q ":9200"; then
    echo "  ✅ Port 9200 is listening"
    netstat -tuln 2>/dev/null | grep ":9200" || ss -tuln 2>/dev/null | grep ":9200"
else
    echo "  ❌ Port 9200 is NOT listening"
fi

# 3. Check data directory
echo ""
echo "3. Checking data directory..."
INDEXER_DATA="/var/ossec/data/wazuh-indexer-data"
if [ -d "$INDEXER_DATA" ]; then
    echo "  ✅ Data directory exists: $INDEXER_DATA"
    ls -ld "$INDEXER_DATA"
    echo "  Directory contents:"
    ls -la "$INDEXER_DATA" 2>/dev/null | head -5
else
    echo "  ❌ Data directory does not exist: $INDEXER_DATA"
fi

# 4. Check permissions
echo ""
echo "4. Checking permissions..."
if [ -d "$INDEXER_DATA" ]; then
    if sudo -u wazuh-indexer test -r "$INDEXER_DATA" 2>/dev/null; then
        echo "  ✅ wazuh-indexer can read data directory"
    else
        echo "  ❌ wazuh-indexer CANNOT read data directory"
        echo "  Fixing permissions..."
        chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true
        chmod -R 775 "$INDEXER_DATA" 2>/dev/null || true
    fi
fi

# 5. Check temp directory
echo ""
echo "5. Checking temp directory..."
TEMP_DIR="/tmp/wazuh-indexer-tmp"
if [ -d "$TEMP_DIR" ]; then
    echo "  ✅ Temp directory exists: $TEMP_DIR"
    ls -ld "$TEMP_DIR"
else
    echo "  ❌ Temp directory does not exist: $TEMP_DIR"
    echo "  Creating temp directory..."
    mkdir -p "$TEMP_DIR"
    chown -R wazuh-indexer:wazuh-indexer "$TEMP_DIR" 2>/dev/null || true
    chmod -R 777 "$TEMP_DIR" 2>/dev/null || true
fi

# 6. Check certificates
echo ""
echo "6. Checking certificates..."
if [ -f "/etc/wazuh-indexer/certs/wazuh-indexer.pem" ]; then
    echo "  ✅ Indexer certificate exists"
else
    echo "  ❌ Indexer certificate NOT found"
fi

# 7. Check config file
echo ""
echo "7. Checking config file..."
if [ -f "/etc/wazuh-indexer/opensearch.yml" ]; then
    echo "  ✅ Config file exists"
    echo "  Data path: $(grep '^path.data:' /etc/wazuh-indexer/opensearch.yml 2>/dev/null || echo 'NOT FOUND')"
else
    echo "  ❌ Config file NOT found"
fi

# 8. Check supervisord status
echo ""
echo "8. Checking supervisord status..."
if command -v supervisorctl >/dev/null 2>&1; then
    if [ -S /var/run/supervisor.sock ] 2>/dev/null || [ -S /tmp/supervisor.sock ] 2>/dev/null; then
        echo "  ✅ Supervisord is running"
        supervisorctl status wazuh-indexer 2>/dev/null || echo "  ⚠️ Cannot get Indexer status from supervisord"
    else
        echo "  ❌ Supervisord socket not found"
    fi
else
    echo "  ⚠️ supervisorctl not available"
fi

# 9. Try to connect to Indexer
echo ""
echo "9. Testing Indexer connection..."
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" -u "admin:$OPENSEARCH_PASSWORD" "https://localhost:9200" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "  ✅ Indexer is responding (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "  ❌ Indexer is NOT responding (connection refused)"
else
    echo "  ⚠️ Indexer returned HTTP $HTTP_CODE"
fi

# 10. Check recent logs
echo ""
echo "10. Recent Indexer logs (last 20 lines):"
if [ -f "/var/log/supervisor/wazuh-indexer.log" ]; then
    tail -20 /var/log/supervisor/wazuh-indexer.log 2>/dev/null || echo "  Cannot read log file"
elif [ -f "/var/log/wazuh-indexer/wazuh-indexer.log" ]; then
    tail -20 /var/log/wazuh-indexer/wazuh-indexer.log 2>/dev/null || echo "  Cannot read log file"
else
    echo "  ⚠️ Log file not found"
fi

echo ""
echo "✅ Diagnostic complete"

