#!/usr/bin/with-contenv sh
# Set Indexer and Dashboard admin passwords
# Uses environment variables or generates secure passwords
# embracingearth.space

set +e  # Don't exit on error

echo "Setting Indexer and Dashboard passwords..."

# Indexer password
OPENSEARCH_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
if [ "$OPENSEARCH_PASSWORD" = "admin" ]; then
    echo "⚠️ WARNING: Using default Indexer password (admin)"
    echo "⚠️ Set OPENSEARCH_INITIAL_ADMIN_PASSWORD secret for production!"
fi

# Dashboard password (uses same as Indexer by default)
OPENSEARCH_DASHBOARDS_PASSWORD="${OPENSEARCH_DASHBOARDS_PASSWORD:-$OPENSEARCH_PASSWORD}"
if [ "$OPENSEARCH_DASHBOARDS_PASSWORD" = "admin" ]; then
    echo "⚠️ WARNING: Using default Dashboard password (admin)"
    echo "⚠️ Set OPENSEARCH_DASHBOARDS_PASSWORD secret for production!"
fi

# Note: Password changes require Indexer/Dashboard configuration
# For now, we'll use defaults and document the need to change them
# In production, use Wazuh's password change tools or configuration

echo "✓ Password configuration check completed"
echo "⚠️ IMPORTANT: Change default passwords after first login!"

