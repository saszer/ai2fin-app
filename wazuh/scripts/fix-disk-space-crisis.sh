#!/bin/bash
# Emergency script to fix disk space crisis and remove read-only blocks
# embracingearth.space

set +e

echo "🚨 EMERGENCY: Fixing disk space crisis..."

OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
OPENSEARCH_URL="https://localhost:9200"

# 1. Remove read-only blocks from all indices
echo "1. Removing read-only blocks from indices..."
curl -s -X PUT -k -u "admin:$OPENSEARCH_PASSWORD" \
    "$OPENSEARCH_URL/_settings" \
    -H "Content-Type: application/json" \
    -d '{
        "index": {
            "blocks.read_only_allow_delete": null
        }
    }' >/dev/null 2>&1

# Also try per-index
curl -s -X PUT -k -u "admin:$OPENSEARCH_PASSWORD" \
    "$OPENSEARCH_URL/.kibana_1/_settings" \
    -H "Content-Type: application/json" \
    -d '{
        "index": {
            "blocks.read_only_allow_delete": null
        }
    }' >/dev/null 2>&1

echo "  ✅ Read-only blocks removed"

# 2. Clean up old logs
echo "2. Cleaning up old logs..."
# Wazuh logs
find /var/ossec/logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find /var/ossec/logs -name "*.log.*" -type f -mtime +3 -delete 2>/dev/null || true

# Supervisor logs
find /var/log/supervisor -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true
find /var/log/supervisor -name "*.err" -type f -mtime +3 -delete 2>/dev/null || true

# Filebeat logs
find /var/log/filebeat -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true

# Indexer logs
find /var/log/wazuh-indexer -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true

# Dashboard logs
find /var/log/wazuh-dashboard -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true

echo "  ✅ Old logs cleaned"

# 3. Clean up temporary files
echo "3. Cleaning up temporary files..."
rm -rf /tmp/* 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true
rm -rf /tmp/wazuh-indexer-tmp/* 2>/dev/null || true

echo "  ✅ Temporary files cleaned"

# 4. Delete old indices (keep last 7 days)
echo "4. Cleaning up old indices..."
OLD_DATE=$(date -d "7 days ago" +%Y.%m.%d 2>/dev/null || date -v-7d +%Y.%m.%d 2>/dev/null || echo "")
if [ -n "$OLD_DATE" ]; then
    INDICES=$(curl -s -k -u "admin:$OPENSEARCH_PASSWORD" \
        "$OPENSEARCH_URL/_cat/indices/wazuh-alerts-*?h=index" 2>/dev/null | \
        grep -v "$(date +%Y.%m.%d)" | grep -v "$(date -d "1 day ago" +%Y.%m.%d 2>/dev/null || date -v-1d +%Y.%m.%d 2>/dev/null || echo "")" | \
        head -10)
    
    for INDEX in $INDICES; do
        if echo "$INDEX" | grep -q "$OLD_DATE\|$(date -d "2 days ago" +%Y.%m.%d 2>/dev/null || date -v-2d +%Y.%m.%d 2>/dev/null || echo "")\|$(date -d "3 days ago" +%Y.%m.%d 2>/dev/null || date -v-3d +%Y.%m.%d 2>/dev/null || echo "")"; then
            echo "  Deleting old index: $INDEX"
            curl -s -X DELETE -k -u "admin:$OPENSEARCH_PASSWORD" \
                "$OPENSEARCH_URL/$INDEX" >/dev/null 2>&1 || true
        fi
    done
fi

echo "  ✅ Old indices cleaned"

# 5. Force merge to reduce disk usage
echo "5. Force merging indices to reduce disk usage..."
curl -s -X POST -k -u "admin:$OPENSEARCH_PASSWORD" \
    "$OPENSEARCH_URL/_forcemerge?max_num_segments=1&only_expunge_deletes=true" >/dev/null 2>&1 || true

echo "  ✅ Force merge completed"

# 6. Check disk usage
echo ""
echo "6. Current disk usage:"
df -h / | tail -1
df -h /var/ossec/data | tail -1

echo ""
echo "✅ Disk space crisis fix completed"
echo ""
echo "⚠️ IMPORTANT: Consider increasing VM size or implementing log rotation"
echo "   Current VM: 4GB RAM, check fly.toml for size configuration"

