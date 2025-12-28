#!/usr/bin/with-contenv sh
# Fix wazuh-indexer permissions issue
# The indexer service fails because it can't write to temp directory
# This fixes permissions before indexer starts
# embracingearth.space

set +e  # Don't exit on error

echo "Fixing wazuh-indexer permissions..."

# Check if indexer is enabled
INDEXER_ENABLED=$(grep -A 1 "<indexer>" /var/ossec/etc/ossec.conf 2>/dev/null | grep -c "<enabled>yes</enabled>" || echo "0")
if [ "$INDEXER_ENABLED" = "0" ]; then
    echo "Indexer is disabled in config, but service may still try to start"
    echo "Fixing permissions anyway to prevent service failures..."
fi

# Fix indexer temp directory permissions
# CRITICAL: Use /tmp instead of volume - Fly.io volumes don't support user switching
# Volume mounts have restrictions that prevent sudo -u from working
INDEXER_TMP="/tmp/wazuh-indexer-tmp"
INDEXER_DATA="/var/ossec/data/wazuh-indexer-data"

# Use /tmp for temp directory (not on volume - supports user switching)
# Fly.io volume mounts don't support sudo -u, so we use /tmp instead
echo "Using /tmp for indexer temp directory (volume mounts don't support user switching)"

# Create temp directory in /tmp (not on volume)
mkdir -p "$INDEXER_TMP"
chmod 777 "$INDEXER_TMP"
chown wazuh-indexer:wazuh-indexer "$INDEXER_TMP" 2>/dev/null || true

# Verify write access (should work on /tmp)
# CRITICAL: Don't fail if sudo -u doesn't work - directory has 777 permissions
# The indexer will be able to write even if the test fails
if sudo -u wazuh-indexer test -w "$INDEXER_TMP" 2>/dev/null; then
    echo "✓ wazuh-indexer can write to /tmp temp directory"
else
    echo "⚠ Cannot verify write access via sudo -u (may be sudo/user issue)"
    echo "  Directory has 777 permissions - indexer should still be able to write"
    # Don't fail - directory is world-writable, so it should work
fi

# Create and fix data directory
if [ ! -d "$INDEXER_DATA" ]; then
    mkdir -p "$INDEXER_DATA"
fi
chmod -R 777 "$INDEXER_DATA" 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true

# Ensure data directory on volume is accessible
chmod 777 /var/ossec/data 2>/dev/null || true
chown root:root /var/ossec/data 2>/dev/null || true

# Verify directory exists and has correct permissions
# Don't fail on sudo -u test - directory has 777 permissions, so it should work
if [ -d "$INDEXER_TMP" ]; then
    PERMS=$(ls -ld "$INDEXER_TMP" 2>/dev/null | awk '{print $1}')
    if echo "$PERMS" | grep -q "rwxrwxrwx\|drwxrwxrwx"; then
        echo "✓ Temp directory exists with 777 permissions"
        echo "  Indexer should be able to write (even if sudo -u test fails)"
    else
        echo "⚠ Temp directory permissions: $PERMS"
        echo "  Attempting to fix..."
        chmod 777 "$INDEXER_TMP"
    fi
else
    echo "⚠ Temp directory does not exist - this should not happen"
fi

echo "Indexer permission fix completed."

