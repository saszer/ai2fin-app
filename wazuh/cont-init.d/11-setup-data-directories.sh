#!/bin/bash
# Setup data directories for Indexer and Dashboard
# CRITICAL: Must run BEFORE services start to fix permissions
# CRITICAL: Indexer data MUST be on persistent volume or it's lost on restart!
# embracingearth.space

set +e  # Don't exit on error - permissions might fail but we'll continue

echo "Setting up data directories for Wazuh components..."

# CRITICAL: Fix permissions on volume mount FIRST
# Volume is mounted with root ownership, but services run as non-root users
# We need to ensure the parent directory is accessible
echo "Fixing permissions on /var/ossec/data..."
chmod 755 /var/ossec/data
chown root:root /var/ossec/data 2>/dev/null || true

# ============================================================================
# INDEXER DATA PERSISTENCE (CRITICAL!)
# The Indexer stores all security events, alerts, and logs in its data dir.
# Without persistence, ALL DATA IS LOST on container restart!
# Solution: Create data directories on the persistent volume and symlink
# ============================================================================
echo "Setting up Indexer data persistence..."

# Create persistent Indexer data directory on volume
INDEXER_PERSISTENT_DATA="/var/ossec/data/wazuh-indexer-data"
mkdir -p "$INDEXER_PERSISTENT_DATA"

# CRITICAL: If security was previously disabled and now enabled, clear security index
# Security index from non-secured Indexer is incompatible with secured Indexer
if [ -d "$INDEXER_PERSISTENT_DATA/nodes" ]; then
    # Check if security index exists (from previous non-secured run)
    if [ -d "$INDEXER_PERSISTENT_DATA/nodes/0/indices" ]; then
        SECURITY_INDEX=$(find "$INDEXER_PERSISTENT_DATA/nodes/0/indices" -name ".opensearch_security" -type d 2>/dev/null | head -1)
        if [ -n "$SECURITY_INDEX" ]; then
            echo "⚠️ Found existing security index from previous run"
            echo "⚠️ Removing incompatible security index (will be recreated with security enabled)..."
            rm -rf "$SECURITY_INDEX" 2>/dev/null || true
        fi
    fi
fi

chown -R wazuh-indexer:wazuh-indexer "$INDEXER_PERSISTENT_DATA" 2>/dev/null || true
chmod -R 755 "$INDEXER_PERSISTENT_DATA"

# CRITICAL: Ensure the target directory exists and is a directory (not a file)
if [ ! -d "$INDEXER_PERSISTENT_DATA" ]; then
    echo "ERROR: Persistent data directory does not exist: $INDEXER_PERSISTENT_DATA"
    exit 1
fi

# Create /var/lib/wazuh-indexer structure with symlink to persistent storage
# Remove existing directory/file if it's not a symlink
if [ -e "/var/lib/wazuh-indexer/data" ] && [ ! -L "/var/lib/wazuh-indexer/data" ]; then
    echo "Migrating existing Indexer data to persistent storage..."
    # If there's existing data, copy it to persistent storage
    if [ -d "/var/lib/wazuh-indexer/data" ] && [ "$(ls -A /var/lib/wazuh-indexer/data 2>/dev/null)" ]; then
        cp -rp /var/lib/wazuh-indexer/data/* "$INDEXER_PERSISTENT_DATA/" 2>/dev/null || true
    fi
    rm -rf /var/lib/wazuh-indexer/data
fi

# Create parent directory
mkdir -p /var/lib/wazuh-indexer

# Remove broken symlink if it exists
if [ -L "/var/lib/wazuh-indexer/data" ] && [ ! -e "/var/lib/wazuh-indexer/data" ]; then
    echo "Removing broken symlink..."
    rm -f /var/lib/wazuh-indexer/data
fi

# Create symlink only if it doesn't exist
if [ ! -e "/var/lib/wazuh-indexer/data" ]; then
    ln -sf "$INDEXER_PERSISTENT_DATA" /var/lib/wazuh-indexer/data
    echo "✓ Indexer data directory symlinked to persistent volume"
fi

# CRITICAL: Verify symlink is valid and points to a directory
if [ -L "/var/lib/wazuh-indexer/data" ]; then
    LINK_TARGET=$(readlink -f /var/lib/wazuh-indexer/data 2>/dev/null || readlink /var/lib/wazuh-indexer/data)
    if [ ! -d "$LINK_TARGET" ]; then
        echo "ERROR: Symlink target is not a directory: $LINK_TARGET"
        echo "Removing broken symlink and creating directory..."
        rm -f /var/lib/wazuh-indexer/data
        mkdir -p "$INDEXER_PERSISTENT_DATA"
        ln -sf "$INDEXER_PERSISTENT_DATA" /var/lib/wazuh-indexer/data
    fi
fi

# Set permissions on symlink target (important for Indexer access)
# CRITICAL: Security plugin needs write access to create security index
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_PERSISTENT_DATA" 2>/dev/null || true
chmod -R 755 "$INDEXER_PERSISTENT_DATA"
# Ensure Indexer can create indices (security plugin needs this)
chmod 775 "$INDEXER_PERSISTENT_DATA" 2>/dev/null || true

# Create logs directory (logs don't need persistence)
mkdir -p /var/lib/wazuh-indexer/logs
mkdir -p /var/log/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer 2>/dev/null || true
chmod -R 755 /var/lib/wazuh-indexer
chmod -R 755 /var/log/wazuh-indexer

# Verify symlink is valid and points to a directory
if [ -L "/var/lib/wazuh-indexer/data" ]; then
    LINK_TARGET=$(readlink -f /var/lib/wazuh-indexer/data 2>/dev/null || readlink /var/lib/wazuh-indexer/data)
    if [ -d "$LINK_TARGET" ]; then
        echo "✓ Indexer data persisted at: $LINK_TARGET"
    else
        echo "ERROR: Symlink target is not a directory: $LINK_TARGET"
        exit 1
    fi
elif [ -d "/var/lib/wazuh-indexer/data" ]; then
    echo "⚠️ Warning: Indexer data is a directory, not a symlink - data may not persist!"
else
    echo "ERROR: Indexer data directory does not exist!"
    exit 1
fi

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

