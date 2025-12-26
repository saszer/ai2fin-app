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

# Expose Wazuh API port (standard port per official docs)
EXPOSE 55000

# Health check - Wazuh API endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD /var/ossec/bin/wazuh-control status || exit 1

# Start Wazuh (container's default CMD handles initialization)
# The official image already has the correct CMD, but we can override if needed

