#!/bin/bash
# Wrapper script to run Indexer with full error logging
# Captures all output before Indexer crashes
# embracingearth.space

set +e  # Don't exit on error - we need to fix permissions first
set -x  # Debug mode to see all commands

# CRITICAL: Fix permissions before starting Indexer
# OpenSearch security bootstrap needs access to parent directories
# Volume mounts may have restrictive permissions - we need to ensure access
echo "=== Pre-startup Permission Fix ==="
echo "Current user: $(whoami)"

# Ensure parent directory is accessible (volume mount may have restrictive permissions)
echo "Fixing /var/ossec/data permissions..."
chmod 777 /var/ossec/data 2>/dev/null || true
# Try ACLs if available
if command -v setfacl >/dev/null 2>&1; then
    setfacl -m u:wazuh-indexer:rwx /var/ossec/data 2>/dev/null || true
    setfacl -m o::rwx /var/ossec/data 2>/dev/null || true
fi

# Ensure data directory exists and is accessible
echo "Creating and fixing /var/ossec/data/wazuh-indexer-data permissions..."
mkdir -p /var/ossec/data/wazuh-indexer-data
chmod -R 777 /var/ossec/data/wazuh-indexer-data 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer /var/ossec/data/wazuh-indexer-data 2>/dev/null || true

# CRITICAL: Use /tmp for temp directory - Fly.io volumes don't support user switching
# Volume mounts have restrictions that prevent sudo -u from working
# /tmp is on root filesystem and supports user switching properly
# OpenSearch uses temp directory for JVM and other operations
# Must be created BEFORE OpenSearch starts, and must be accessible to wazuh-indexer user
TEMP_DIR="/tmp/wazuh-indexer-tmp"
echo "Creating/verifying temp directory in /tmp (volume mounts don't support user switching): $TEMP_DIR"
mkdir -p "$TEMP_DIR"
chmod -R 777 "$TEMP_DIR" 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer "$TEMP_DIR" 2>/dev/null || true

# Verify the directory exists and is accessible to wazuh-indexer
if [ ! -d "$TEMP_DIR" ]; then
    echo "ERROR: Failed to create temp directory: $TEMP_DIR"
    exit 1
fi

# Test access as wazuh-indexer user
# CRITICAL: Don't fail if sudo -u doesn't work - directory has 777 permissions
# The indexer will be able to write even if the test fails
if sudo -u wazuh-indexer test -w "$TEMP_DIR" 2>/dev/null; then
    echo "✓ Temp directory is accessible to wazuh-indexer"
else
    echo "⚠ WARNING: Cannot verify write access via sudo -u (may be sudo/user issue)"
    echo "  Directory has 777 permissions - indexer should still be able to write"
    echo "  Continuing anyway - indexer will attempt to start"
    # Don't exit - let indexer try to start
    # Directory has 777 permissions, so it should work
fi

# Verify permissions
echo "Verifying permissions..."
ls -ld /var/ossec/data
ls -ld /var/ossec/data/wazuh-indexer-data 2>/dev/null || echo "WARNING: Data directory does not exist"

# Test access as wazuh-indexer user
if sudo -u wazuh-indexer test -x /var/ossec/data 2>/dev/null; then
    echo "✓ wazuh-indexer can access /var/ossec/data"
else
    echo "⚠ WARNING: wazuh-indexer cannot access /var/ossec/data (volume mount restrictions?)"
fi

if sudo -u wazuh-indexer test -w /var/ossec/data/wazuh-indexer-data 2>/dev/null; then
    echo "✓ wazuh-indexer can write to data directory"
else
    echo "⚠ WARNING: wazuh-indexer cannot write to data directory"
fi

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
# CRITICAL: Set temp directory environment variable (overrides JVM options if needed)
export TMPDIR="/tmp/wazuh-indexer-tmp"
export OPENSEARCH_JAVA_OPTS="-Djava.io.tmpdir=/tmp/wazuh-indexer-tmp"
exec su -s /bin/bash wazuh-indexer -c "cd /usr/share/wazuh-indexer && export TMPDIR=\"/tmp/wazuh-indexer-tmp\" && export OPENSEARCH_JAVA_OPTS=\"-Djava.io.tmpdir=/tmp/wazuh-indexer-tmp\" && exec $INDEXER_BIN" 2>&1

