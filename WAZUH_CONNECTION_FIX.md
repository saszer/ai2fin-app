# Wazuh API Connection Fix - IPv6 Resolution Issue

## Issue
The Wazuh Dashboard reported "[API connection] No API available to connect" and "Could not select any API entry".
The Dashboard also showed "No matching indices found" indicating Filebeat was not successfully shipping data to the Indexer.

## Symptoms
- Dashboard loads but shows API connection error
- "Check Wazuh API connection" health check fails
- "Check alerts index pattern" shows no matching indices
- API and Indexer configured to listen on `0.0.0.0` (IPv4)
- Multiple scripts configured to connect to `localhost`

## Root Cause
On Fly.io, the container environment often prefers IPv6. `localhost` may resolve to `::1` (IPv6 loopback).
All Wazuh services (Manager API on port 55000, Indexer on port 9200) were bound to `0.0.0.0` (IPv4 only), 
so they were listening on `127.0.0.1` but not `::1`.

Multiple scripts attempted to connect via `localhost`, which resolved to IPv6, resulting in connection failures:
- Dashboard → Manager API connection
- Filebeat → Indexer connection
- Dashboard wait script → Indexer health checks
- API user creation script → Manager API

## Fix
Modified the following files to explicitly use `127.0.0.1` instead of `localhost`:

1. **config/wazuh.yml.template** - Dashboard API connection URL
2. **filebeat.yml** - Filebeat to Indexer connection
3. **scripts/wait-for-indexer-and-start-dashboard.sh** - Indexer health checks (3 instances)
4. **scripts/create-api-user-bg.sh** - Manager API authentication and user management (5 instances)
5. **cont-init.d/10-configure-dashboard.sh** - Fallback Dashboard config

This forces all internal connections to use IPv4 loopback, which matches the services' listeners.

## Required Action
Re-deploy the application to apply the configuration changes:
```powershell
cd "z:\ai2fin graphigxs\MAIN\embracingearthspace\wazuh"
.\deploy.ps1
```

After deployment (allow 15-20 minutes for full startup), verify:
- Dashboard accessible at https://ai2-wazuh.fly.dev
- "Check Wazuh API connection" shows green checkmark
- "Check alerts index pattern" shows green checkmark
- No "Could not select any API entry" error
