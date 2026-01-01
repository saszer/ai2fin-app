#!/bin/sh
# Wazuh Agent Installation Script for Alpine Linux (Fly.io)
# Usage: Add to your startup script or supervisord
# embracingearth.space

set -e

echo "Installing Wazuh Agent for Alpine..."

# Install dependencies for Ubuntu-based agent (we'll use a sidecar container approach)
# OR use filebeat to forward logs to Wazuh

# For Alpine, we'll use a log forwarder approach since Wazuh agent is Ubuntu/Debian/RPM only
# Install filebeat
apk add --no-cache curl

# Download and install filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-linux-x86_64.tar.gz
tar xzvf filebeat-8.11.0-linux-x86_64.tar.gz -C /opt/
mv /opt/filebeat-8.11.0-linux-x86_64 /opt/filebeat

# Configure filebeat to send logs to Wazuh
cat > /opt/filebeat/filebeat.yml <<'EOF'
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log
    - /app/logs/*.log
  fields:
    app: ai2-core-app
  fields_under_root: true

output.logstash:
  hosts: ["ai2-wazuh.internal:5000"]
  
logging.level: info
EOF

echo "✓ Filebeat configured to forward logs to Wazuh"
