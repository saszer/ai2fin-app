# Wazuh Manager Dockerfile for Fly.io
# Self-hosted Wazuh SIEM/XDR platform
# Official image: https://hub.docker.com/r/wazuh/wazuh-manager
FROM wazuh/wazuh-manager:4.8.0

# Note: Wazuh container handles initialization automatically
# We just need to provide configuration files

# Configure Wazuh (container will merge with defaults)
COPY wazuh.conf /var/ossec/etc/ossec.conf
COPY local_internal_options.conf /var/ossec/etc/local_internal_options.conf

# Copy custom rules and decoders for financial app
COPY custom_rules/ /var/ossec/etc/custom_rules/
COPY custom_decoders/ /var/ossec/etc/custom_decoders/

# Create required shared directory and copy ar.conf file (prevents config error)
# Wazuh requires this file even if active response is disabled
RUN mkdir -p /var/ossec/etc/shared
COPY etc/shared/ar.conf /var/ossec/etc/shared/ar.conf

# Expose Wazuh API port (standard port per official docs)
EXPOSE 55000

# Health check - Check if Wazuh API is responding
# Wazuh API uses HTTPS on port 55000
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD (curl -k -f https://localhost:55000/ || wget -q --no-check-certificate --spider https://localhost:55000/ || /var/ossec/bin/wazuh-control status) || exit 1

# Note: Wazuh Docker image uses s6-overlay (/init) as entrypoint
# This automatically manages all Wazuh processes and keeps them running
# We don't need to override CMD - the image handles it

