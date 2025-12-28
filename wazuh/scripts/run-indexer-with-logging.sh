#!/bin/bash
# Wrapper script to run Indexer with full error logging
# Captures all output before Indexer crashes
# embracingearth.space

set +e

INDEXER_BIN=""
if [ -f /usr/share/wazuh-indexer/bin/opensearch ]; then
    INDEXER_BIN="/usr/share/wazuh-indexer/bin/opensearch"
    cd /usr/share/wazuh-indexer
elif [ -f /usr/bin/wazuh-indexer ]; then
    INDEXER_BIN="/usr/bin/wazuh-indexer"
else
    echo "ERROR: Indexer binary not found" >&2
    exit 1
fi

# Diagnostic output
echo "=== Indexer Startup Diagnostics ===" >&2
echo "Binary: $INDEXER_BIN" >&2
echo "Working directory: $(pwd)" >&2
echo "User: $(whoami)" >&2
echo "Data directory check:" >&2
ls -la /var/lib/wazuh-indexer/data >&2 || echo "ERROR: Cannot access data directory" >&2
echo "Certificate check:" >&2
ls -la /etc/wazuh-indexer/certs/*.pem >&2 2>&1 | head -5 || echo "ERROR: Cannot access certificates" >&2
echo "Starting Indexer..." >&2

# Run Indexer and capture all output
exec "$INDEXER_BIN" 2>&1

