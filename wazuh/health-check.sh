#!/bin/bash
# Simple health check script for Fly.io
# Checks if Dashboard is listening on port 5601
# embracingearth.space

PORT=5601
TIMEOUT=2

# Check if port is listening
if timeout $TIMEOUT bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
    echo "✓ Port $PORT is listening"
    exit 0
else
    echo "✗ Port $PORT is not listening"
    exit 1
fi

