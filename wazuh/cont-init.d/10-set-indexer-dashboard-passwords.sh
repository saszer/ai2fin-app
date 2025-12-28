#!/usr/bin/with-contenv sh
# Configure Indexer and Dashboard admin passwords
# Injects environment variables into Dashboard config
# embracingearth.space

set +e  # Don't exit on error

echo "Configuring Indexer and Dashboard passwords..."

# Get admin password from environment or use default
ADMIN_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
DASHBOARD_PASSWORD="${OPENSEARCH_DASHBOARDS_PASSWORD:-$ADMIN_PASSWORD}"

if [ "$ADMIN_PASSWORD" = "admin" ]; then
    echo "⚠️ WARNING: Using default Indexer password (admin)"
    echo "⚠️ Set OPENSEARCH_INITIAL_ADMIN_PASSWORD secret for production!"
fi

# Update Dashboard config with actual password
DASHBOARD_CONFIG="/etc/wazuh-dashboard/opensearch_dashboards.yml"
if [ -f "$DASHBOARD_CONFIG" ]; then
    # Replace password placeholder with actual value
    sed -i "s/\${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}/$DASHBOARD_PASSWORD/g" "$DASHBOARD_CONFIG"
    echo "✓ Dashboard config updated with password"
fi

echo "✓ Password configuration completed"
echo "  Indexer admin password: ${ADMIN_PASSWORD}"
echo "  Dashboard login password: ${DASHBOARD_PASSWORD}"
echo ""
echo "⚠️ IMPORTANT: Change default passwords after first login!"

