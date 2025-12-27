#!/usr/bin/with-contenv sh
# Disable Filebeat service to prevent lock conflicts and crashes
# We don't use Elasticsearch, so Filebeat is not needed
# embracingearth.space

set +e  # Don't exit on error

echo "Disabling Filebeat service (not needed - no Elasticsearch indexer)..."

# Method 1: Disable via s6-overlay service directory (most common)
# s6-overlay uses /etc/services.d/ for service definitions
if [ -d "/etc/services.d/filebeat" ]; then
    # Create 'down' file to disable service
    touch /etc/services.d/filebeat/down 2>/dev/null || true
    echo "✓ Filebeat service disabled via /etc/services.d/filebeat/down"
fi

# Method 2: Disable via s6-rc.d (alternative location)
if [ -d "/etc/s6-rc.d/filebeat" ]; then
    touch /etc/s6-rc.d/filebeat/down 2>/dev/null || true
    echo "✓ Filebeat service disabled via /etc/s6-rc.d/filebeat/down"
fi

# Method 3: Disable via s6-overlay/s6-rc.d (older versions)
if [ -d "/etc/s6-overlay/s6-rc.d/filebeat" ]; then
    touch /etc/s6-overlay/s6-rc.d/filebeat/down 2>/dev/null || true
    echo "✓ Filebeat service disabled via /etc/s6-overlay/s6-rc.d/filebeat/down"
fi

# Clean up any existing lock files (prevents crashes if service tries to start)
FILEBEAT_LOCK_FILE="/var/lib/filebeat/.filebeat.lock"
if [ -f "$FILEBEAT_LOCK_FILE" ]; then
    rm -f "$FILEBEAT_LOCK_FILE" 2>/dev/null || true
    echo "✓ Removed Filebeat lock file"
fi

# Ensure lock directory exists (prevents errors)
mkdir -p /var/lib/filebeat 2>/dev/null || true

# Note: We don't kill Filebeat processes here because:
# 1. The service is disabled via 'down' file, so it won't start
# 2. pkill can cause issues with shell script execution
# 3. Any existing processes will be cleaned up by s6-overlay

echo "✓ Filebeat disabled successfully (service will not start)"

