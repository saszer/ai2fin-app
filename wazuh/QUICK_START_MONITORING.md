# Monitoring Your Fly.io Apps with Wazuh
# Quick Start Guide
# embracingearth.space

## ✅ Step 1: Wazuh Manager Ready

Your Wazuh Manager now listens on:
- **Dashboard:** https://ai2-wazuh.fly.dev/ (port 443)
- **Agent Port:** ai2-wazuh.internal:1514 (internal network only)
- **API:** ai2-wazuh.internal:55000 (internal network only)

## 📦 Step 2: Add to Your Fly Apps

### For Ubuntu-based Containers (Node 18+)

Add to your `Dockerfile`:

```dockerfile
# Install Wazuh Agent
RUN curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring /usr/share/keyrings/wazuh.gpg --import && \
    echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" > /etc/apt/sources.list.d/wazuh.list && \
    apt-get update && \
    WAZUH_MANAGER='ai2-wazuh.internal' apt-get install -y wazuh-agent=4.8.0-1 && \
    rm -rf /var/lib/apt/lists/*

# Configure agent
RUN sed -i 's/<address>MANAGER_IP<\/address>/<address>ai2-wazuh.internal<\/address>/' /var/ossec/etc/ossec.conf && \
    sed -i 's/<protocol>udp<\/protocol>/<protocol>tcp<\/protocol>/' /var/ossec/etc/ossec.conf
```

Add to your startup script (or `CMD`):

```bash
# Start Wazuh agent
/var/ossec/bin/wazuh-control start

# Start your main app
exec node dist/index.js
```

### For Alpine Linux (Your Current Setup)

Alpine doesn't support Wazuh agent directly. Use Docker logging instead:

Add to `fly.toml`:

```toml
[experimental]
  auto_rollback = true

[[services]]
  # Your existing service config

[metrics]
  port = 9091  # Prometheus metrics
  path = "/metrics"
```

Then use Prometheus + Grafana or forward logs to Wazuh via API.

## 🚀 Quick Test - Monitor ai2-wazuh Itself

To test, let's install an agent on the Wazuh container itself:

```bash
# SSH into Wazuh
fly ssh console -a ai2-wazuh

# The agent should already be installed, just start it
/var/ossec/bin/wazuh-control start

# Check status
/var/ossec/bin/agent_control -l
```

## 📊 What You'll See

Once agents connect:
1. Go to **Endpoints** in Dashboard
2. See your Fly.io apps listed
3. Monitor:
   - Process activity
   - File integrity
   - Log events
   - Security alerts
   - Network connections

## 🔐 Next Steps

1. **Test with Wazuh Self-Monitoring** (easiest first step)
2. **Add to ai2-core-app** (if Ubuntu-based)
3. **Use Fly Metrics** for Alpine apps
4. **Set up Cloudflare Logpush** for frontend

Would you like me to help with step 1 (testing self-monitoring)?
