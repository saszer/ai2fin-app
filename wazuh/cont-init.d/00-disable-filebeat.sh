#!/usr/bin/with-contenv sh
# Disable problematic services to prevent crashes and restart loops
# Filebeat: Not needed (no Elasticsearch)
# ossec-logs: Causing s6-supervise warnings and restarts
# embracingearth.space

set +e  # Don't exit on error

echo "Disabling problematic services..."

# Disable Filebeat service (not needed - no Elasticsearch indexer)
if [ -d "/etc/services.d/filebeat" ]; then
    touch /etc/services.d/filebeat/down 2>/dev/null || true
    echo "✓ Filebeat service disabled"
fi

# Disable ossec-logs service (causing s6-supervise warnings and restarts)
# We already create the log file in script 08, so this service is not needed
if [ -d "/etc/services.d/ossec-logs" ]; then
    touch /etc/services.d/ossec-logs/down 2>/dev/null || true
    echo "✓ ossec-logs service disabled (prevents restart loop)"
fi

# Clean up Filebeat lock files
FILEBEAT_LOCK_FILE="/var/lib/filebeat/.filebeat.lock"
if [ -f "$FILEBEAT_LOCK_FILE" ]; then
    rm -f "$FILEBEAT_LOCK_FILE" 2>/dev/null || true
    echo "✓ Removed Filebeat lock file"
fi

mkdir -p /var/lib/filebeat 2>/dev/null || true

echo "✓ Problematic services disabled successfully"

