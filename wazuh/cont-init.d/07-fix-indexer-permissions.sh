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
INDEXER_TMP="/var/ossec/data/wazuh-indexer-tmp"
INDEXER_DATA="/var/ossec/data/wazuh-indexer-data"

# Ensure parent directory is writable
chmod 777 /var/ossec/data 2>/dev/null || true

# Create and fix temp directory
if [ ! -d "$INDEXER_TMP" ]; then
    mkdir -p "$INDEXER_TMP"
fi

# Use multiple methods to fix permissions
chmod -R 777 "$INDEXER_TMP" 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_TMP" 2>/dev/null || true

# Try using setfacl if available (better for volume mounts)
if command -v setfacl >/dev/null 2>&1; then
    setfacl -R -m u:wazuh-indexer:rwx "$INDEXER_TMP" 2>/dev/null || true
    setfacl -R -m g:wazuh-indexer:rwx "$INDEXER_TMP" 2>/dev/null || true
fi

# Create and fix data directory
if [ ! -d "$INDEXER_DATA" ]; then
    mkdir -p "$INDEXER_DATA"
fi
chmod -R 777 "$INDEXER_DATA" 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true

# Fix parent directory permissions (critical for volume mounts)
chmod 777 /var/ossec/data 2>/dev/null || true
chown root:root /var/ossec/data 2>/dev/null || true

# Remove and recreate temp directory to clear any mount issues
if [ -d "$INDEXER_TMP" ]; then
    rm -rf "$INDEXER_TMP" 2>/dev/null || true
fi
mkdir -p "$INDEXER_TMP"
chmod 777 "$INDEXER_TMP"
chown wazuh-indexer:wazuh-indexer "$INDEXER_TMP"

# Use ACLs if available (better for volume mounts)
if command -v setfacl >/dev/null 2>&1; then
    setfacl -R -m u:wazuh-indexer:rwx "$INDEXER_TMP" 2>/dev/null || true
    setfacl -R -m g:wazuh-indexer:rwx "$INDEXER_TMP" 2>/dev/null || true
    setfacl -R -m d:u:wazuh-indexer:rwx "$INDEXER_TMP" 2>/dev/null || true
    setfacl -R -m d:g:wazuh-indexer:rwx "$INDEXER_TMP" 2>/dev/null || true
fi

# Verify write access
if sudo -u wazuh-indexer test -w "$INDEXER_TMP" 2>/dev/null; then
    echo "✓ wazuh-indexer can write to temp directory"
    # Create a test file to verify
    sudo -u wazuh-indexer touch "$INDEXER_TMP/.test-write" 2>/dev/null && \
        rm -f "$INDEXER_TMP/.test-write" 2>/dev/null && \
        echo "✓ Write test successful"
else
    echo "⚠ wazuh-indexer still cannot write to temp directory"
    echo "  Directory exists: $([ -d "$INDEXER_TMP" ] && echo 'yes' || echo 'no')"
    echo "  Permissions: $(ls -ld "$INDEXER_TMP" 2>/dev/null | awk '{print $1, $3, $4}')"
    echo "  This may be a volume mount restriction"
    echo "  Indexer service may fail to start"
fi

echo "Indexer permission fix completed."

