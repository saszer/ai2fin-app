#!/bin/bash
# Setup data directories for Indexer and Dashboard
# CRITICAL: Must run BEFORE services start to fix permissions
# embracingearth.space

set +e  # Don't exit on error - permissions might fail but we'll continue

echo "Setting up data directories for Wazuh components..."

# CRITICAL: Fix permissions on volume mount FIRST
# Volume is mounted with root ownership, but services run as non-root users
# We need to ensure the parent directory is accessible
echo "Fixing permissions on /var/ossec/data..."
chmod 755 /var/ossec/data
chown root:root /var/ossec/data 2>/dev/null || true

# Create Indexer data directories
# Use /var/lib/wazuh-indexer (not volume) to avoid permission issues
# We'll sync data to volume for persistence if needed
echo "Creating Indexer data directories..."
mkdir -p /var/lib/wazuh-indexer/data
mkdir -p /var/lib/wazuh-indexer/logs
mkdir -p /var/log/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer
chmod -R 755 /var/lib/wazuh-indexer
chmod -R 755 /var/log/wazuh-indexer

# Create Dashboard data directories
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

