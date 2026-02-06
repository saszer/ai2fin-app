# Wazuh Cloudflare Tunnel Setup

This guide documents the setup for securing Wazuh behind a Cloudflare Tunnel, removing the need for direct public exposure of the Fly.io application.

## Overview

- **Ingress**: Handled by `cloudflared` (Cloudflare Tunnel Daemon) running inside the container.
- **Security**: Public internet access blocked at Fly.io edge (no `http_service`). Tunnel authenticates outbound to Cloudflare.
- **Connectivity**: `cloudflared` proxies traffic to `localhost:5601` (Dashboard).

## Prerequisites

1.  **Cloudflare Account**: Active account with a domain configured.
2.  **Tunnel Created**: A tunnel created via Cloudflare Zero Trust Dashboard or CLI.
    *   **Public Hostname**: Assign a hostname (e.g., `wazuh.embracingearth.space`) pointing to the tunnel.
    *   **Service**: `http://localhost:5601`

## Configuration Steps

### 1. Get the Tunnel Token
From the Cloudflare Dashboard:
1.  Go to Zero Trust > Access > Tunnels.
2.  Select your tunnel.
3.  Click **Configure**.
4.  Copy the token (it's usually a long base64 string).

### 2. Set the Secret on Fly.io
Run the following command in your terminal (or use the GitHub Action secret):

```powershell
fly secrets set TUNNEL_TOKEN="eyJhIjoi..." --app ai2-wazuh
```

### 3. Deploy
Run the deployment script:

```powershell
.\deploy.ps1
```

## How It Works

*   **Dockerfile**: Installs `cloudflared` binary.
*   **Supervisord**: Runs `cloudflared tunnel run` as a background process.
*   **Fly.toml**: Removed `[http_service]` to block Fly.io public proxy.

## Troubleshooting

### Tunnel Not Connecting
Check the logs:
```powershell
fly logs -a ai2-wazuh | Select-String "cloudflared"
```
Look for "Registered tunnel connection".

### Dashboard Not Accessible
1.  Verify the Tunnel Service configuration in Cloudflare points to `http://localhost:5601`.
2.  Check if Dashboard is running:
    ```powershell
    fly logs -a ai2-wazuh | Select-String "wazuh-dashboard"
    ```
