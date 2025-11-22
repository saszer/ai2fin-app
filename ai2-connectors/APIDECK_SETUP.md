# 🔗 Apideck Integration Setup Guide

**Complete setup guide for Apideck Unified API integration in AI2 Connectors**

## Overview

Apideck provides a Unified API that allows you to connect to 100+ accounting platforms (QuickBooks, Xero, NetSuite, etc.) through a single integration. This eliminates the need to build separate connectors for each platform.

## Key Features

- ✅ **100+ Accounting Platforms** - QuickBooks, Xero, NetSuite, Exact Online, Sage, FreshBooks, Wave, and more
- ✅ **OAuth Management** - Apideck Vault handles all OAuth flows automatically
- ✅ **Unified API** - Single API interface for all platforms
- ✅ **Webhook Support** - Real-time connection status updates
- ✅ **Token Management** - Automatic token refresh and management

## Architecture

```
User → Frontend → Apideck Vault (OAuth) → Apideck Unified API → Accounting Platform
                ↓
         Connection Stored
                ↓
         Transactions Synced
```

## Setup Steps

### 1. Create Apideck Account

1. Go to [Apideck Signup](https://app.apideck.com/signup)
2. Create an account and choose an application name
3. Note your **App ID** and **API Key** from the dashboard

### 2. Enable Unified APIs and Connectors

1. Go to **Configuration** in Apideck dashboard
2. Enable **Accounting** Unified API
3. Select connectors you want to support (e.g., QuickBooks, Xero, NetSuite)
4. By default, Apideck provides sandbox OAuth apps (good for testing)

### 3. Configure Environment Variables

Add these to your `.env` file or environment configuration:

```bash
# Required: Apideck API credentials
APIDECK_API_KEY=your_apideck_api_key_here
APIDECK_APP_ID=your_apideck_app_id_here

# Optional: Webhook secret (if you enable webhooks)
APIDECK_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Frontend URL for OAuth redirects
FRONTEND_URL=https://yourapp.com
```

### 4. Configure OAuth Redirect URI

In your Apideck dashboard:
1. Go to **Configuration** → **OAuth Apps**
2. For each connector (QuickBooks, Xero, etc.), add redirect URI:
   ```
   https://yourapp.com/api/connectors/apideck/vault/callback
   ```
   Or for local development:
   ```
   http://localhost:3000/api/connectors/apideck/vault/callback
   ```

### 5. Enable Webhooks (Optional)

1. Go to **Webhooks** in Apideck dashboard
2. Add webhook endpoint:
   ```
   https://yourapp.com/api/connectors/apideck/webhook
   ```
3. Select events to subscribe to:
   - `vault.connection.created`
   - `vault.connection.updated`
   - `vault.connection.deleted`
   - `vault.connection.callable`
   - `vault.connection.invalid_credentials`

## Usage

### Connecting an Accounting Platform

1. User goes to **Connectors** page in frontend
2. Clicks **Connect** on **Apideck Unified API** connector
3. Selects accounting platform (QuickBooks, Xero, etc.)
4. User is redirected to Apideck Vault for OAuth authorization
5. After authorization, user is redirected back
6. Connection is automatically established

### API Endpoints

#### Create Vault Session
```http
POST /api/connectors/apideck/vault/session
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "serviceId": "quickbooks",
  "redirectUri": "https://yourapp.com/connectors/apideck/callback"
}
```

#### Get Connections
```http
GET /api/connectors/apideck/connections
Authorization: Bearer <jwt_token>
```

#### Delete Connection
```http
DELETE /api/connectors/apideck/connections/:connectionId
Authorization: Bearer <jwt_token>
```

#### Webhook Endpoint (Public)
```http
POST /api/connectors/apideck/webhook
x-apideck-signature: <signature>
Content-Type: application/json

{
  "event_type": "vault.connection.callable",
  "data": { ... }
}
```

## Supported Accounting Platforms

The following platforms are supported via Apideck (and more):

- **QuickBooks Online** (`quickbooks`)
- **Xero** (`xero`)
- **NetSuite** (`netsuite`)
- **Exact Online** (`exact-online`)
- **Sage** (`sage`)
- **FreshBooks** (`freshbooks`)
- **Wave** (`wave`)
- **Zoho Books** (`zoho-books`)
- **MYOB** (`myob`)
- And 90+ more...

See [Apideck Connectors](https://developers.apideck.com/connectors) for full list.

## Custom OAuth Apps (Production)

For production, you should use your own OAuth apps:

1. Create OAuth app in each platform's developer portal
2. Configure OAuth app in Apideck dashboard
3. Users will see **your brand** instead of Apideck during OAuth

## Testing

### Test Connection Flow

1. Set environment variables
2. Start connectors service: `npm run dev`
3. In frontend, go to Connectors page
4. Click Connect on Apideck connector
5. Select QuickBooks (or other platform)
6. Complete OAuth flow in Apideck Vault
7. Verify connection appears in Active Connections

### Test Transaction Sync

```bash
# Sync transactions for a connection
curl -X POST \
  http://localhost:3003/api/connectors/bank/connections/:connectionId/sync \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Connection Not Appearing

- Check environment variables are set correctly
- Verify OAuth redirect URI matches Apideck configuration
- Check webhook endpoint is accessible (if using webhooks)

### OAuth Flow Fails

- Verify redirect URI in Apideck dashboard matches your app
- Check that connector is enabled in Apideck dashboard
- Ensure user has permissions in the accounting platform

### Transactions Not Syncing

- Verify connection state is `callable` or `authorized`
- Check connection has valid credentials
- Verify accounting platform API access is granted

## Security Notes

- ✅ **API Keys** - Store in environment variables, never commit to code
- ✅ **Webhook Signatures** - Verify webhook signatures in production
- ✅ **OAuth Redirects** - Use HTTPS in production
- ✅ **Token Storage** - Credentials are encrypted via CredentialManager

## Resources

- [Apideck Documentation](https://developers.apideck.com)
- [Apideck API Reference](https://developers.apideck.com/api-reference)
- [Apideck Connectors List](https://developers.apideck.com/connectors)
- [Apideck Vault Guide](https://developers.apideck.com/vault)

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Enterprise-grade integrations • Secure and scalable • Powering financial automation*

