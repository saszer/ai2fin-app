#!/usr/bin/with-contenv sh
# Setup data directories for Indexer and Dashboard
# embracingearth.space

set +e  # Don't exit on error - permissions might fail but we'll continue

echo "Setting up data directories for Wazuh components..."

# Create Indexer data directories
# CRITICAL: Fix permissions for volume mount - Indexer needs access to /var/ossec/data
mkdir -p /var/ossec/data/wazuh-indexer/data
mkdir -p /var/ossec/data/wazuh-indexer/logs
mkdir -p /var/lib/wazuh-indexer
# Fix permissions on the parent directory first
chmod 755 /var/ossec/data 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer /var/ossec/data/wazuh-indexer 2>/dev/null || true
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer 2>/dev/null || true
chmod -R 755 /var/ossec/data/wazuh-indexer 2>/dev/null || true
# Ensure wazuh-indexer user can access the parent directory
chmod 755 /var/ossec/data 2>/dev/null || true

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

