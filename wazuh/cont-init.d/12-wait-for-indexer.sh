#!/usr/bin/with-contenv sh
# Wait for Indexer to be ready before starting Dashboard
# embracingearth.space

set +e  # Don't exit on error

echo "Waiting for Wazuh Indexer to be ready..."

MAX_WAIT=180
WAIT_INTERVAL=5
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo "✓ Wazuh Indexer is ready"
        exit 0
    fi
    echo "Waiting for Indexer... (${ELAPSED}s/${MAX_WAIT}s)"
    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

echo "⚠ Indexer not ready after ${MAX_WAIT}s, continuing anyway..."
exit 0

