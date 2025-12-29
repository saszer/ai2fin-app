# Dashboard Diagnostics

**Current Issue:** Health check shows `0/1` - Dashboard not responding on port 5601

---

## Quick Status Check

**From your logs:**
- ✅ Indexer running (started at 04:41:16)
- ✅ Security index initialized (at 04:41:32)
- ❌ Dashboard not responding (health check failing)

---

## Why Dashboard Logs Don't Show in `flyctl logs`

**Problem:** Dashboard logs are configured to go to files (`/var/log/supervisor/wazuh-dashboard.log`), not stdout/stderr, so they don't appear in `flyctl logs`.

**Fix Applied:** Updated `supervisord.conf` to log Dashboard to stdout/stderr so logs appear in `flyctl logs`.

**Next Step:** Redeploy to see Dashboard logs in real-time.

---

## Manual Check (Before Redeploy)

**SSH into container:**
```bash
flyctl ssh console -a ai2-wazuh
```

**Inside container, check:**
```bash
# Check if Dashboard process is running
ps aux | grep dashboard

# Check supervisord status
supervisorctl status

# Check Dashboard logs
cat /var/log/supervisor/wazuh-dashboard.log
cat /var/log/supervisor/wazuh-dashboard.err

# Check if Dashboard is listening
netstat -tlnp | grep 5601
# or
ss -tlnp | grep 5601

# Check wait script output
grep -i "waiting\|security\|dashboard\|Step" /var/log/supervisor/wazuh-dashboard.log
```

---

## Expected Timeline

1. **Indexer starts** (~2-3 min) ✅ Done at 04:41:16
2. **Security index initializes** (~30s) ✅ Done at 04:41:32
3. **Wait script detects readiness** (~10-30s) ⏳ Should happen soon
4. **Dashboard starts** (~1-2 min) ⏳ Waiting
5. **Dashboard ready** (~1-2 min) ⏳ Waiting

**Total from Indexer start: ~5-8 minutes**

---

## What to Look For

**In wait script logs, you should see:**
```
Step 1: Waiting for Indexer HTTP endpoint...
✓ Indexer HTTP endpoint is up
Step 2: Waiting for security index initialization...
✓ Security index initialized - admin user exists and is ready
✓ Indexer is ready - security index initialized
Starting Wazuh Dashboard...
```

**If Dashboard starts, you'll see:**
- Dashboard Node.js process starting
- Dashboard connecting to Indexer
- Dashboard binding to 0.0.0.0:5601

**If Dashboard fails, you'll see:**
- Authentication errors
- Connection errors
- Port binding errors

---

## After Redeploy

**With the fix, you'll see Dashboard logs in:**
```bash
flyctl logs -a ai2-wazuh | grep -i dashboard
```

**Or watch all logs:**
```bash
flyctl logs -a ai2-wazuh
```

---

**embracingearth.space**

