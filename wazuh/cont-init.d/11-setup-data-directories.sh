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
chown -R wazuh-indexer:wazuh-indexer "$INDEXER_PERSISTENT_DATA" 2>/dev/null || true
chmod -R 755 "$INDEXER_PERSISTENT_DATA"

# Create /var/lib/wazuh-indexer structure with symlink to persistent storage
# Remove existing directory if it's not a symlink
if [ -d "/var/lib/wazuh-indexer/data" ] && [ ! -L "/var/lib/wazuh-indexer/data" ]; then
    echo "Migrating existing Indexer data to persistent storage..."
    # If there's existing data, copy it to persistent storage
    if [ "$(ls -A /var/lib/wazuh-indexer/data 2>/dev/null)" ]; then
        cp -rp /var/lib/wazuh-indexer/data/* "$INDEXER_PERSISTENT_DATA/" 2>/dev/null || true
    fi
    rm -rf /var/lib/wazuh-indexer/data
fi

# Create parent directory and symlink
mkdir -p /var/lib/wazuh-indexer
if [ ! -L "/var/lib/wazuh-indexer/data" ]; then
    ln -sf "$INDEXER_PERSISTENT_DATA" /var/lib/wazuh-indexer/data
    echo "✓ Indexer data directory symlinked to persistent volume"
fi

# Create logs directory (logs don't need persistence)
mkdir -p /var/lib/wazuh-indexer/logs
mkdir -p /var/log/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer
chmod -R 755 /var/lib/wazuh-indexer
chmod -R 755 /var/log/wazuh-indexer

# Verify symlink
if [ -L "/var/lib/wazuh-indexer/data" ]; then
    LINK_TARGET=$(readlink -f /var/lib/wazuh-indexer/data)
    echo "✓ Indexer data persisted at: $LINK_TARGET"
else
    echo "⚠️ Warning: Indexer data symlink not created - data may not persist!"
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

