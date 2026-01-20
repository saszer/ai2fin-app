#!/bin/bash
# Automatic disk cleanup on startup to prevent disk space issues
# embracingearth.space

set +e

echo "🧹 Running automatic disk cleanup..."

# Clean up old logs (keep last 3 days)
find /var/ossec/logs -name "*.log.*" -type f -mtime +3 -delete 2>/dev/null || true
find /var/log/supervisor -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true
find /var/log/supervisor -name "*.err" -type f -mtime +3 -delete 2>/dev/null || true
find /var/log/filebeat -name "*.log" -type f -mtime +3 -delete 2>/dev/null || true

# Clean up temporary files
rm -rf /tmp/* 2>/dev/null || true
rm -rf /var/tmp/* 2>/dev/null || true

# Keep temp directory structure but clean contents
if [ -d "/tmp/wazuh-indexer-tmp" ]; then
    find /tmp/wazuh-indexer-tmp -type f -mtime +1 -delete 2>/dev/null || true
fi

echo "✅ Disk cleanup completed"

