# Wazuh Manager Dockerfile for Fly.io
# Self-hosted Wazuh SIEM/XDR platform
FROM wazuh/wazuh-manager:4.8.0

# Install additional tools
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Configure Wazuh
COPY wazuh.conf /var/ossec/etc/ossec.conf
COPY local_internal_options.conf /var/ossec/etc/local_internal_options.conf

# Expose Wazuh API port
EXPOSE 55000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:55000/ || exit 1

# Start Wazuh
CMD ["/var/ossec/bin/wazuh-control", "start"]

