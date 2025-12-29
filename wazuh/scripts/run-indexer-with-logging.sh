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

# CRITICAL: Fix parent directory permissions BEFORE switching users
# Fly.io volume mounts don't support user switching, so we need to ensure
# the wazuh-indexer user can access the parent directory
echo "Fixing /var/ossec/data permissions..."
chmod 777 /var/ossec/data 2>/dev/null || true
chown root:root /var/ossec/data 2>/dev/null || true

# Try ACLs if available (better for volume mounts)
if command -v setfacl >/dev/null 2>&1; then
    setfacl -m u:wazuh-indexer:rwx /var/ossec/data 2>/dev/null || true
    setfacl -m g:wazuh-indexer:rwx /var/ossec/data 2>/dev/null || true
    setfacl -m o::rwx /var/ossec/data 2>/dev/null || true
    setfacl -m d:u:wazuh-indexer:rwx /var/ossec/data 2>/dev/null || true
    setfacl -m d:g:wazuh-indexer:rwx /var/ossec/data 2>/dev/null || true
fi

# CRITICAL: Test if wazuh-indexer can access parent directory
# If not, we may need to run as root or use a different approach
if ! sudo -u wazuh-indexer test -x /var/ossec/data 2>/dev/null; then
    echo "⚠ WARNING: wazuh-indexer cannot access /var/ossec/data"
    echo "  This is a Fly.io volume mount restriction"
    echo "  Attempting to fix by ensuring all parent directories are accessible..."
    
    # Ensure all parent directories exist and are accessible
    mkdir -p /var/ossec/data 2>/dev/null || true
    chmod 777 /var/ossec/data 2>/dev/null || true
    
    # If still can't access, we may need to run indexer as root
    # But first, let's try one more thing - ensure the directory is world-accessible
    chmod a+rwx /var/ossec/data 2>/dev/null || true
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

# CRITICAL: OpenSearch REFUSES to run as root (security feature)
# We MUST run as wazuh-indexer user, but Fly.io volumes don't support user switching
# Solution: Use non-volume location for data directory (/var/lib/wazuh-indexer/data)
# This loses persistence but allows indexer to start

# Set temp directory environment variable (overrides JVM options if needed)
export TMPDIR="/tmp/wazuh-indexer-tmp"
export OPENSEARCH_JAVA_OPTS="-Djava.io.tmpdir=/tmp/wazuh-indexer-tmp"

# CRITICAL: Fly.io volume mounts don't support user switching
# Even with 777 permissions, wazuh-indexer can't access /var/ossec/data
# Solution: Use /var/lib/wazuh-indexer/data (not on volume) for data directory
echo "⚠ WARNING: Using non-volume data directory due to Fly.io volume mount restrictions"
echo "  Data directory: /var/lib/wazuh-indexer/data (not persistent across restarts)"
echo "  This is necessary because volumes don't support user switching"

# Update opensearch.yml to use non-volume location
if [ -f /etc/wazuh-indexer/opensearch.yml ]; then
    # Check if already using non-volume location
    if ! grep -q "path.data: /var/lib/wazuh-indexer/data" /etc/wazuh-indexer/opensearch.yml; then
        # Backup original
        cp /etc/wazuh-indexer/opensearch.yml /etc/wazuh-indexer/opensearch.yml.backup
        
        # Change path.data to non-volume location
        sed -i 's|path.data: /var/ossec/data/wazuh-indexer-data|path.data: /var/lib/wazuh-indexer/data|' /etc/wazuh-indexer/opensearch.yml
        
        echo "✓ Updated opensearch.yml to use /var/lib/wazuh-indexer/data"
    fi
    
    # Create the directory (not on volume - supports user switching)
    mkdir -p /var/lib/wazuh-indexer/data
    chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer/data
    chmod -R 755 /var/lib/wazuh-indexer/data
    
    echo "✓ Data directory created: /var/lib/wazuh-indexer/data"
fi

# Run as wazuh-indexer user (OpenSearch requires this - won't run as root)
# Use su to switch user (supervisord runs this as root)
cd /usr/share/wazuh-indexer
exec su -s /bin/bash wazuh-indexer -c "export TMPDIR=\"/tmp/wazuh-indexer-tmp\" && export OPENSEARCH_JAVA_OPTS=\"-Djava.io.tmpdir=/tmp/wazuh-indexer-tmp\" && exec $INDEXER_BIN" 2>&1

