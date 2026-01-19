# Wazuh API Connection Fix - IPv6 Resolution Issue

## Issue
The Wazuh Dashboard reported "[API connection] No API available to connect" and showed the API status as "Offline".

## Symptoms
- Dashboard loads but shows API connection error.
- "Check Wazuh API connection" health check fails.
- API configured to listen on `0.0.0.0` (IPv4).
- Dashboard configured to connect to `localhost`.

## Root Cause
On Fly.io, the container environment often prefers IPv6. `localhost` may resolve to `::1` (IPv6 loopback).
The Wazuh Manager API was bound to `0.0.0.0` (IPv4 only), so it was listening on `127.0.0.1` but not `::1`.
The Dashboard attempted to connect via `::1`, resulting in a connection failure.

## Fix
Modified `config/wazuh.yml.template` to explicitly use `127.0.0.1` instead of `localhost`.
 This forces the Dashboard to use IPv4 loopback, which matches the Manager API's listener.

## Required Action
Re-deploy the application to apply the configuration change:
```powershell
.\deploy.ps1
```
