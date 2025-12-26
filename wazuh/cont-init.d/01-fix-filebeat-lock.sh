#!/usr/bin/with-contenv sh
# Fix Filebeat data path lock conflict
# This script runs before services start to clean up stale lock files
# embracingearth.space

set -e

# Filebeat data directory
FILEBEAT_DATA_DIR="/var/lib/filebeat"
FILEBEAT_LOCK_FILE="${FILEBEAT_DATA_DIR}/.filebeat.lock"

# Clean up stale lock file if it exists and no process is using it
if [ -f "$FILEBEAT_LOCK_FILE" ]; then
    # Check if any filebeat process is actually running
    if ! pgrep -f "filebeat" > /dev/null 2>&1; then
        echo "Cleaning up stale Filebeat lock file..."
        rm -f "$FILEBEAT_LOCK_FILE"
    else
        echo "Filebeat process detected, keeping lock file..."
    fi
fi

# Ensure data directory exists and has correct permissions
mkdir -p "$FILEBEAT_DATA_DIR"
chmod 755 "$FILEBEAT_DATA_DIR"

echo "Filebeat lock cleanup completed."

