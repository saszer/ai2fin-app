#!/bin/bash
# Wrapper script to run Indexer with full error logging
# Captures all output before Indexer crashes
# embracingearth.space

set +e  # Don't exit on error - we need to fix permissions first
set -x  # Debug mode to see all commands

# CRITICAL: Fix permissions before starting Indexer
# OpenSearch security bootstrap needs access to parent directories
echo "=== Pre-startup Permission Fix ==="
echo "Current user: $(whoami)"
echo "Fixing /var/ossec/data permissions..."
chmod 777 /var/ossec/data 2>/dev/null || true
chmod -R 777 /var/ossec/data/wazuh-indexer-data 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer /var/ossec/data/wazuh-indexer-data 2>/dev/null || true
echo "Verifying permissions..."
ls -ld /var/ossec/data
ls -ld /var/ossec/data/wazuh-indexer-data 2>/dev/null || echo "Data directory does not exist yet"

# Switch to wazuh-indexer user for running Indexer
# But ensure permissions are set first
INDEXER_BIN=""
if [ -f /usr/share/wazuh-indexer/bin/opensearch ]; then
    INDEXER_BIN="/usr/share/wazuh-indexer/bin/opensearch"
    cd /usr/share/wazuh-indexer
elif [ -f /usr/bin/wazuh-indexer ]; then
    INDEXER_BIN="/usr/bin/wazuh-indexer"
else
    echo "ERROR: Indexer binary not found" >&2
    exit 1
fi

# Diagnostic output
echo "=== Indexer Startup Diagnostics ==="
echo "Binary: $INDEXER_BIN"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"
echo "Data directory check:"
ls -la /var/ossec/data/wazuh-indexer-data 2>/dev/null || echo "WARNING: Data directory not found at expected path"
echo "Certificate check:"
ls -la /etc/wazuh-indexer/certs/*.pem 2>&1 | head -5 || echo "ERROR: Cannot access certificates"
echo "Security config check:"
grep -E "plugins.security.disabled|plugins.security.allow_default_init_securityindex" /etc/wazuh-indexer/opensearch.yml 2>&1 || echo "WARNING: Cannot read security config"
echo "JVM options check:"
test -f /etc/wazuh-indexer/jvm.options && echo "✓ JVM options file found" || echo "⚠ JVM options file not found"
echo "Starting Indexer as wazuh-indexer user..."

# Trap errors to log before exit
trap 'echo "ERROR: Indexer exited with code $?"' EXIT

# Run Indexer as wazuh-indexer user
# Use su to switch user (supervisord runs this as root)
exec su -s /bin/bash wazuh-indexer -c "cd /usr/share/wazuh-indexer && exec $INDEXER_BIN" 2>&1

