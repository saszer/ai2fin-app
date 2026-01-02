# Wazuh Dashboard Setup Guide

## Dashboard API Configuration (UI)

The Dashboard web interface needs its own connection to the Wazuh Manager API to display alerts and data.

### Steps:

1. **Open Dashboard Settings**:
   - Navigate to `https://ai2-wazuh.fly.dev/`
   - Click the gear icon (⚙️) in the left sidebar
   - Or click "Go to Settings" button

2. **Add API Connection**:
   - Scroll to **"API connection"** section
   - Click **"edit"** button
   - Fill in the form:

   ```
   URL:      https://localhost
   Port:     55000
   Username: wazuh
   Password: <from WAZUH_API_PASSWORD secret>
   ```

3. **Save and Test**:
   - Click "Save"
   - The Dashboard will test the connection
   - You should see a green checkmark ✅

4. **Return to Overview**:
   - Click "Overview" in the left sidebar
   - The connection error should be gone
   - You should see security event dashboards

---

## Two Separate Configurations Explained

### 1. ai2-core-app Environment Variables
**Purpose**: Allow your Node.js app to **send** security events to Wazuh Manager

**Location**: Fly.io secrets for `ai2-core-api`

**Variables**:
```bash
WAZUH_ENABLED=true
WAZUH_MANAGER_URL=https://ai2-wazuh.internal
WAZUH_API_USER=wazuh
WAZUH_API_PASSWORD=<password>
```

**Used by**: `ai2-core-app/src/lib/wazuh.ts` → WazuhClient

### 2. Dashboard UI Configuration
**Purpose**: Allow the Dashboard web interface to **query** and **display** alerts from Wazuh Manager

**Location**: Browser-based configuration (stored in OpenSearch)

**Settings**: Added via Settings → API connection form

**Used by**: Dashboard UI JavaScript code

---

## Why Two Configs?

```
┌─────────────────┐
│  ai2-core-api   │
│  (Node.js app)  │ ← Uses .env WAZUH_API_PASSWORD
└────────┬────────┘
         │ Sends events via API
         ↓
┌─────────────────┐
│  Wazuh Manager  │ ← Receives events, stores in Indexer
│   (Port 55000)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Wazuh Dashboard │ ← Uses UI config to query Manager
│   (Web UI)      │    and display alerts
└─────────────────┘
```

---

## Testing Event Flow

### Step 1: Configure Dashboard (Manual)
Follow steps above to add API connection in UI

### Step 2: Verify ai2-core-api is Sending Events

```bash
# Check ai2-core-api logs for Wazuh initialization
fly logs -a ai2-core-api | grep Wazuh

# Look for:
# ✅ Wazuh API client initialized
# ✅ Sent X events to Wazuh
```

### Step 3: Verify Events in Dashboard
1. Open `https://ai2-wazuh.fly.dev/`
2. Click "Overview" → "Security events"
3. Look for events with:
   - Agent: `ai2-core-app`
   - Rule group: `financial_app`, `security`

### Step 4: Trigger Test Event

Run this in ai2-core-api to trigger a test event:

```bash
fly ssh console -a ai2-core-api

# Inside the container
node -e "
const { wazuhClient } = require('./dist/lib/wazuh');
wazuhClient.sendSecurityEvent({
  type: 'integration_test',
  severity: 'low',
  message: 'Test event from ai2-core-api',
  metadata: { test: true, timestamp: new Date().toISOString() }
});
console.log('✅ Test event sent');
"
```

---

## Troubleshooting

### Dashboard shows "Unauthorized" error
→ Wrong password in UI config. Check `fly secrets list -a ai2-wazuh`

### Events not appearing in Dashboard
→ Check ai2-core-api logs for `Wazuh circuit breaker` warnings
→ Verify `WAZUH_ENABLED=true` in ai2-core-api

### Dashboard loads but no data
→ No events sent yet. Trigger some activity in ai2-core-api
→ Or run the test event script above

---

**Next**: After configuring Dashboard UI, all your application events (auth, API calls, errors) will automatically flow to Wazuh for security monitoring. 🎉

**embracingearth.space** - Enterprise Security Monitoring
