#!/bin/bash
# Cleanup disk space on every container start
# Wazuh Manager accumulates temp files and queue data that fills disk
# embracingearth.space

set +e  # Don't exit on error

echo "Cleaning up disk space..."

# Clean Wazuh Manager temporary files (can be 5GB+)
if [ -d "/var/ossec/tmp" ]; then
    echo "Cleaning /var/ossec/tmp..."
    rm -rf /var/ossec/tmp/* 2>/dev/null || true
fi

# Clean old queue data (events older than 7 days)
if [ -d "/var/ossec/queue" ]; then
    echo "Cleaning old queue data..."
    find /var/ossec/queue -type f -mtime +7 -delete 2>/dev/null || true
fi

# Clean Indexer logs (keep last 3 days)
if [ -d "/var/log/wazuh-indexer" ]; then
    echo "Cleaning old Indexer logs..."
    find /var/log/wazuh-indexer -name "*.log*" -mtime +3 -delete 2>/dev/null || true
    find /var/log/wazuh-indexer -name "*.gz" -delete 2>/dev/null || true
fi

# Clean Dashboard logs (keep last 3 days)
if [ -d "/var/log/wazuh-dashboard" ]; then
    echo "Cleaning old Dashboard logs..."
    find /var/log/wazuh-dashboard -name "*.log*" -mtime +3 -delete 2>/dev/null || true
fi

# Clean supervisor logs (keep last 1 day)
if [ -d "/var/log/supervisor" ]; then
    echo "Cleaning old supervisor logs..."
    find /var/log/supervisor -name "*.log*" -mtime +1 -delete 2>/dev/null || true
fi

# Clean apt cache
apt-get clean 2>/dev/null || true
rm -rf /var/lib/apt/lists/* 2>/dev/null || true

# Report disk usage
echo "Current disk usage:"
df -h / 2>/dev/null | grep -v Filesystem

echo "✓ Disk cleanup complete"
