#!/usr/bin/with-contenv sh
# Copy SSL certificates from Manager to API location
# Wazuh Manager creates certificates in /var/ossec/etc/
# Wazuh API expects them in /var/ossec/api/configuration/ssl/
# embracingearth.space

set +e  # Don't exit on error

echo "Copying SSL certificates to API location..."

# Wait for Manager to generate certificates (up to 60 seconds)
MAX_WAIT=60
WAITED=0
while [ ! -f /var/ossec/etc/sslmanager.key ] && [ $WAITED -lt $MAX_WAIT ]; do
  sleep 2
  WAITED=$((WAITED + 2))
  if [ $((WAITED % 10)) -eq 0 ]; then
    echo "  Waiting for Manager certificates... (${WAITED}s)"
  fi
done

if [ -f /var/ossec/etc/sslmanager.key ] && [ -f /var/ossec/etc/sslmanager.cert ]; then
  mkdir -p /var/ossec/api/configuration/ssl
  cp /var/ossec/etc/sslmanager.key /var/ossec/api/configuration/ssl/sslmanager.key
  cp /var/ossec/etc/sslmanager.cert /var/ossec/api/configuration/ssl/sslmanager.cert
  chown -R wazuh:wazuh /var/ossec/api/configuration/ssl
  chmod 600 /var/ossec/api/configuration/ssl/sslmanager.key
  chmod 644 /var/ossec/api/configuration/ssl/sslmanager.cert
  echo "✓ SSL certificates copied to API location"
else
  echo "⚠ WARNING: Manager SSL certificates not found, API may fail to start"
fi

