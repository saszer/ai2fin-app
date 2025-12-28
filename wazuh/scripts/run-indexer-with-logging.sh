#!/bin/bash
# Wrapper script to run Indexer with full error logging
# Captures all output before Indexer crashes
# embracingearth.space

set -e  # Exit on error to catch issues early
set -x  # Debug mode to see all commands

# Flush output immediately (no buffering)
exec > >(stdbuf -oL -eL tee -a /dev/stdout)
exec 2>&1

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

# Diagnostic output (flush immediately)
echo "=== Indexer Startup Diagnostics ===" | stdbuf -oL cat
echo "Binary: $INDEXER_BIN" | stdbuf -oL cat
echo "Working directory: $(pwd)" | stdbuf -oL cat
echo "User: $(whoami)" | stdbuf -oL cat
echo "Data directory check:" | stdbuf -oL cat
ls -la /var/lib/wazuh-indexer/data || echo "ERROR: Cannot access data directory" | stdbuf -oL cat
echo "Certificate check:" | stdbuf -oL cat
ls -la /etc/wazuh-indexer/certs/*.pem 2>&1 | head -5 || echo "ERROR: Cannot access certificates" | stdbuf -oL cat
echo "Security config check:" | stdbuf -oL cat
grep -E "plugins.security.disabled|plugins.security.allow_default_init_securityindex" /etc/wazuh-indexer/opensearch.yml 2>&1 || echo "WARNING: Cannot read security config" | stdbuf -oL cat
echo "JVM options check:" | stdbuf -oL cat
test -f /etc/wazuh-indexer/jvm.options && echo "✓ JVM options file found" || echo "⚠ JVM options file not found" | stdbuf -oL cat
echo "Starting Indexer..." | stdbuf -oL cat

# Trap errors to log before exit
trap 'echo "ERROR: Indexer exited with code $?" | stdbuf -oL cat' EXIT

# Run Indexer and capture all output (both stdout and stderr)
# Use unbuffered output
exec stdbuf -oL -eL "$INDEXER_BIN" 2>&1

