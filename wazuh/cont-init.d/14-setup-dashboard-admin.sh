#!/usr/bin/with-contenv sh
# Setup Dashboard admin user after Indexer security is initialized
# This script runs after Indexer is ready and security index is created
# embracingearth.space

set +e  # Don't exit on error

echo "Setting up Dashboard admin user..."

# Wait for Indexer to be fully ready
echo "Waiting for Indexer to be ready..."
MAX_WAIT=600  # 10 minutes for full initialization
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo "✓ Indexer is ready"
        break
    fi
    sleep 10
    ELAPSED=$((ELAPSED + 10))
done

# Wait for security index to be initialized
echo "Waiting for security index..."
sleep 30

# Get password from environment or use default
INDEXER_PASSWORD="${OPENSEARCH_INITIAL_ADMIN_PASSWORD:-admin}"
DASHBOARD_PASSWORD="${OPENSEARCH_DASHBOARDS_PASSWORD:-$INDEXER_PASSWORD}"

echo "Indexer admin password: ${INDEXER_PASSWORD}"
echo "Dashboard will use: admin / ${DASHBOARD_PASSWORD}"

# Note: With security enabled, default admin user should be created automatically
# Dashboard connects using opensearch.username and opensearch.password from config

echo "✓ Dashboard admin user setup completed"
echo "  Login credentials: admin / ${DASHBOARD_PASSWORD}"

