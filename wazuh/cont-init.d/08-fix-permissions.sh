#!/usr/bin/with-contenv sh
# Fix permissions for Wazuh directories
# embracingearth.space

set +e  # Don't exit on error

echo "Fixing Wazuh directory permissions..."

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

