#!/bin/bash
# Wazuh Agent Installation Script for Fly.io Containers
# Usage: Add this to your Dockerfile's cont-init.d or startup script
# embracingearth.space

set -e

echo "Installing Wazuh Agent..."

# Install dependencies
apt-get update && apt-get install -y curl gnupg apt-transport-https

# Add Wazuh repository
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring /usr/share/keyrings/wazuh.gpg --import
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" > /etc/apt/sources.list.d/wazuh.list

# Install Wazuh agent
apt-get update
WAZUH_MANAGER='ai2-wazuh.internal' apt-get install -y wazuh-agent=4.8.0-1

# Configure agent to use Fly.io internal network (6PN)
cat > /var/ossec/etc/ossec.conf <<EOF
<ossec_config>
  <client>
    <server>
      <address>ai2-wazuh.internal</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
    <config-profile>ubuntu, ubuntu22, ubuntu22.04</config-profile>
    <notify_time>10</notify_time>
    <time-reconnect>60</time-reconnect>
    <auto_restart>yes</auto_restart>
  </client>

  <logging>
    <log_format>plain</log_format>
  </logging>
</ossec_config>
EOF

# Set permissions
chmod 640 /var/ossec/etc/ossec.conf
chown root:wazuh /var/ossec/etc/ossec.conf

# Enable and start agent
systemctl daemon-reload
systemctl enable wazuh-agent
systemctl start wazuh-agent

echo "✓ Wazuh agent installed and configured"
