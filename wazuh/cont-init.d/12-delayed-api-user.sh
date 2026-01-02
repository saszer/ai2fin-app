#!/bin/bash
# Create Wazuh API user AFTER manager starts (runs in background)
# This script launches a background task that waits for the API
# embracingearth.space

set +e

# Only start the background job, don't block container init
nohup /etc/cont-init.d/scripts/create-api-user-bg.sh > /var/log/create-api-user.log 2>&1 &

echo "✅ API user creation scheduled (will run after Manager starts)"
