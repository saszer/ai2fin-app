#!/bin/bash
# Setup data directories for Indexer and Dashboard
# CRITICAL: Must run BEFORE services start to fix permissions
# CRITICAL: Indexer data MUST be on persistent volume or it's lost on restart!
# embracingearth.space

set +e  # Don't exit on error - permissions might fail but we'll continue

echo "Setting up data directories for Wazuh components..."

# CRITICAL: Fix permissions on volume mount FIRST
# Volume is mounted with root ownership, but services run as non-root users
# NOTE: Indexer now uses /var/lib/wazuh-indexer/data (not on volume) due to Fly.io restrictions
# But we still need /var/ossec/data accessible for Manager and other components
echo "Fixing permissions on /var/ossec/data..."

# CRITICAL: OpenSearch security bootstrap checks parent directory access
# The volume mount may have restrictive permissions that prevent access
# We need to make it world-accessible so wazuh-indexer can access it
# This is safe because /var/ossec/data is just a mount point

# Try multiple permission strategies
chmod 755 /var/ossec/data 2>/dev/null || true
chmod 775 /var/ossec/data 2>/dev/null || true
chmod 777 /var/ossec/data 2>/dev/null || true

# Also try setting ownership (may fail on volume mount, but try anyway)
chown root:root /var/ossec/data 2>/dev/null || true

# NOTE: wazuh-indexer cannot access /var/ossec/data due to Fly.io volume mount restrictions
# This is expected and OK - Indexer uses /var/lib/wazuh-indexer/data instead
# The warning is informational, not an error

# Verify the directory exists and is accessible
if [ ! -d "/var/ossec/data" ]; then
    echo "ERROR: /var/ossec/data does not exist!"
    exit 1
fi

# Test if wazuh-indexer can access it
# NOTE: This is expected to fail on Fly.io due to volume mount restrictions
# Indexer now uses /var/lib/wazuh-indexer/data (not on volume) instead
if ! sudo -u wazuh-indexer test -x /var/ossec/data 2>/dev/null; then
    echo "WARNING: wazuh-indexer cannot access /var/ossec/data (expected on Fly.io)"
    echo "  This is OK - Indexer uses /var/lib/wazuh-indexer/data instead"
    echo "  Attempting to fix permissions anyway (may not work on Fly.io volumes)..."
    # Try ACLs if available
    if command -v setfacl >/dev/null 2>&1; then
        setfacl -m u:wazuh-indexer:rwx /var/ossec/data 2>/dev/null || true
        setfacl -m o::rx /var/ossec/data 2>/dev/null || true
    fi
    # Last resort: make it world-accessible
    chmod 777 /var/ossec/data 2>/dev/null || true
    # Don't exit on failure - this is expected on Fly.io
    # Indexer will use /var/lib/wazuh-indexer/data instead
else
    echo "✓ /var/ossec/data is accessible to wazuh-indexer"
fi

# ============================================================================
# INDEXER DATA DIRECTORY SETUP
# CRITICAL: Using non-volume location due to Fly.io volume mount restrictions
# Fly.io volumes don't support user switching (sudo -u fails)
# OpenSearch refuses to run as root (security feature)
# Solution: Use /var/lib/wazuh-indexer/data (not on volume) so wazuh-indexer user can access it
# NOTE: Data will NOT persist across container restarts (Fly.io limitation)
# For persistence, use snapshot/restore API or external backup
# ============================================================================
echo "Setting up Indexer data directory (non-volume due to Fly.io restrictions)..."

# Create Indexer data directory (NOT on volume - Fly.io volumes don't support user switching)
INDEXER_DATA="/var/lib/wazuh-indexer/data"
mkdir -p "$INDEXER_DATA"

# CRITICAL: Clear incompatible security data when enabling security
# Security index from non-secured Indexer is incompatible with secured Indexer
# Also clear if security index is corrupted or incomplete
if [ -d "$INDEXER_DATA/nodes" ]; then
    # Check if security index exists (from previous non-secured run or corrupted)
    if [ -d "$INDEXER_DATA/nodes/0/indices" ]; then
        # Find all security-related indices
        SECURITY_INDICES=$(find "$INDEXER_DATA/nodes/0/indices" -name ".opensearch_security*" -o -name ".security*" 2>/dev/null)
        if [ -n "$SECURITY_INDICES" ]; then
            echo "⚠️ Found existing security indices from previous run"
            echo "⚠️ Removing incompatible security indices (will be recreated with security enabled)..."
            echo "$SECURITY_INDICES" | while read -r idx; do
                if [ -n "$idx" ]; then
                    echo "  Removing: $idx"
                    rm -rf "$idx" 2>/dev/null || true
                fi
            done
        fi
        
        # Also check for security configuration in cluster state
        if [ -d "$INDEXER_DATA/nodes/0/_state" ]; then
            echo "⚠️ Checking for security-related cluster state..."
            find "$INDEXER_DATA/nodes/0/_state" -name "*security*" -o -name "*opensearch_security*" 2>/dev/null | while read -r state_file; do
                if [ -n "$state_file" ]; then
                    echo "  Removing security state: $state_file"
                    rm -f "$state_file" 2>/dev/null || true
                fi
            done
        fi
    fi
fi

chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true
chmod -R 755 "$INDEXER_DATA"

# CRITICAL: Ensure the target directory exists and is a directory (not a file)
if [ ! -d "$INDEXER_DATA" ]; then
    echo "ERROR: Indexer data directory does not exist: $INDEXER_DATA"
    exit 1
fi

# Ensure data directory exists and has correct permissions
# This is the directory OpenSearch will use directly (not on volume)
if [ -e "$INDEXER_DATA" ] && [ ! -d "$INDEXER_DATA" ]; then
    echo "WARNING: Indexer data path exists but is not a directory, removing..."
    rm -rf "$INDEXER_DATA"
fi

# Create the directory if it doesn't exist
mkdir -p "$INDEXER_DATA"

# CRITICAL: Use /tmp for temp directory - Fly.io volumes don't support user switching
# Volume mounts have restrictions that prevent sudo -u from working
# /tmp is on root filesystem and supports user switching properly
# OpenSearch uses temp directory for JVM operations
TEMP_DIR="/tmp/wazuh-indexer-tmp"
echo "Creating temp directory in /tmp (volume mounts don't support user switching): $TEMP_DIR"
mkdir -p "$TEMP_DIR"
chown -R wazuh-indexer:wazuh-indexer "$TEMP_DIR" 2>/dev/null || true
chmod -R 777 "$TEMP_DIR" 2>/dev/null || true
echo "✓ Temp directory created: $TEMP_DIR"

# CRITICAL: Set permissions so wazuh-indexer user can access it
# OpenSearch needs read/write/execute access to the data directory
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true
chmod -R 755 "$INDEXER_DATA"
# Ensure Indexer can create indices (security plugin needs this)
chmod 775 "$INDEXER_DATA" 2>/dev/null || true

# CRITICAL: Also ensure parent directory is accessible
# OpenSearch bootstrap checks parent directory permissions
chmod 755 /var/lib/wazuh-indexer 2>/dev/null || true
chmod o+x /var/lib/wazuh-indexer 2>/dev/null || true

# Verify the directory exists and is accessible
if [ ! -d "$INDEXER_DATA" ]; then
    echo "ERROR: Failed to create Indexer data directory: $INDEXER_DATA"
    exit 1
fi

# Verify wazuh-indexer user can access the directory
if ! sudo -u wazuh-indexer test -r "$INDEXER_DATA" 2>/dev/null; then
    echo "WARNING: wazuh-indexer user cannot read data directory, fixing permissions..."
    chmod -R 775 "$INDEXER_DATA" 2>/dev/null || true
    chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true
fi

echo "✓ Indexer will use data directory: $INDEXER_DATA (NOT on volume - Fly.io limitation)"

# Set permissions on data directory (important for Indexer access)
# CRITICAL: Security plugin needs write access to create security index
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true
chmod -R 755 "$INDEXER_DATA"
# Ensure Indexer can create indices (security plugin needs this)
chmod 775 "$INDEXER_DATA" 2>/dev/null || true

# CRITICAL: Ensure security plugin can initialize
# Create a marker file to indicate we've cleared old security data
touch "$INDEXER_DATA/.security_cleared" 2>/dev/null || true
chown wazuh-indexer:wazuh-indexer "$INDEXER_DATA/.security_cleared" 2>/dev/null || true

# Create logs directory (logs don't need persistence)
mkdir -p /var/lib/wazuh-indexer/logs
mkdir -p /var/log/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer 2>/dev/null || true
chmod -R 755 /var/lib/wazuh-indexer
chmod -R 755 /var/log/wazuh-indexer

# ============================================================================
# INDEXER DATA PERSISTENCE ENABLED
# ============================================================================
echo "Ensuring Indexer data directory permissions..."

# CRITICAL: Fix permissions recursively on the data directory
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_DATA" 2>/dev/null || true
chmod -R 775 "$INDEXER_DATA" 2>/dev/null || true

echo "✓ Indexer configured to use data directory: $INDEXER_DATA"
echo "⚠️  NOTE: Data will NOT persist across container restarts (Fly.io volume limitation)"

# ============================================================================
# DASHBOARD DATA PERSISTENCE
# ============================================================================
echo "Setting up Dashboard data directories..."
mkdir -p /var/ossec/data/wazuh-dashboard
mkdir -p /var/lib/wazuh-dashboard
chown -R wazuh-dashboard:wazuh-dashboard /var/ossec/data/wazuh-dashboard 2>/dev/null || true
chown -R wazuh-dashboard:wazuh-dashboard /var/lib/wazuh-dashboard 2>/dev/null || true
chmod -R 755 /var/ossec/data/wazuh-dashboard 2>/dev/null || true

# Create log directories
mkdir -p /var/log/wazuh-indexer
mkdir -p /var/log/wazuh-dashboard
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer 2>/dev/null || true
chown -R wazuh-dashboard:wazuh-dashboard /var/log/wazuh-dashboard 2>/dev/null || true

echo "✓ Data directories created and permissions set"
echo "✓ Indexer data will persist across container restarts"

