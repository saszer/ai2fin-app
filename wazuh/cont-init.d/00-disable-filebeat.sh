#!/usr/bin/with-contenv sh
# Disable Filebeat service to prevent lock conflicts and crashes
# We don't use Elasticsearch, so Filebeat is not needed
# embracingearth.space

set +e  # Don't exit on error

echo "Disabling Filebeat service (not needed - no Elasticsearch indexer)..."

# Disable Filebeat service by creating a down file
# This prevents s6 from starting Filebeat
if [ -d "/etc/s6-overlay/s6-rc.d/filebeat" ]; then
    touch /etc/s6-overlay/s6-rc.d/filebeat/down 2>/dev/null || true
    echo "✓ Filebeat service disabled"
elif [ -d "/etc/s6-rc.d/filebeat" ]; then
    touch /etc/s6-rc.d/filebeat/down 2>/dev/null || true
    echo "✓ Filebeat service disabled"
else
    echo "⚠ Filebeat service directory not found (may already be disabled)"
fi

# Also clean up any existing lock files
FILEBEAT_LOCK_FILE="/var/lib/filebeat/.filebeat.lock"
if [ -f "$FILEBEAT_LOCK_FILE" ]; then
    rm -f "$FILEBEAT_LOCK_FILE" 2>/dev/null || true
    echo "✓ Removed Filebeat lock file"
fi

# Kill any running Filebeat processes
pkill -f "filebeat" 2>/dev/null || true

echo "Filebeat disabled successfully."

