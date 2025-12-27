#!/usr/bin/with-contenv sh
# Fix permissions for Wazuh directories
# Also creates missing log file to prevent restart loop
# embracingearth.space

set +e  # Don't exit on error

echo "Fixing Wazuh directory permissions..."

# Create logs directory and log file (prevents restart loop from tail command)
# The tail command in services.d tries to tail this file, and if it doesn't exist,
# the service exits, causing s6-overlay to restart the container
mkdir -p /var/ossec/logs 2>/dev/null || true
if [ ! -f "/var/ossec/logs/ossec.log" ]; then
    touch /var/ossec/logs/ossec.log 2>/dev/null || true
    echo "✓ Created missing ossec.log file (prevents restart loop)"
fi

# Fix permissions for logs directory
chown -R wazuh:wazuh /var/ossec/logs 2>/dev/null || true
chmod -R 755 /var/ossec/logs 2>/dev/null || true

# Fix lists directory permissions (for audit-keys.tmp)
mkdir -p /var/ossec/etc/lists
chown -R wazuh:wazuh /var/ossec/etc/lists
chmod 755 /var/ossec/etc/lists

# Fix API configuration permissions (for database)
chown -R wazuh:wazuh /var/ossec/api/configuration
chmod 755 /var/ossec/api/configuration
mkdir -p /var/ossec/api/configuration/security
chown -R wazuh:wazuh /var/ossec/api/configuration/security
chmod 755 /var/ossec/api/configuration/security

echo "✓ Permissions fixed"

