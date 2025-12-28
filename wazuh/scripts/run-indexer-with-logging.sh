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

# Diagnostic output (to both stdout and stderr for visibility)
echo "=== Indexer Startup Diagnostics ==="
echo "Binary: $INDEXER_BIN"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"
echo "Data directory check:"
ls -la /var/lib/wazuh-indexer/data || echo "ERROR: Cannot access data directory"
echo "Certificate check:"
ls -la /etc/wazuh-indexer/certs/*.pem 2>&1 | head -5 || echo "ERROR: Cannot access certificates"
echo "Security config check:"
grep -E "plugins.security.disabled|plugins.security.allow_default_init_securityindex" /etc/wazuh-indexer/opensearch.yml 2>&1 || echo "WARNING: Cannot read security config"
echo "Starting Indexer..."

# Run Indexer and capture all output (both stdout and stderr)
# Redirect stderr to stdout so supervisord captures everything
exec "$INDEXER_BIN" 2>&1

