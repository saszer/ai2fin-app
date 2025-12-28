# 🔧 Exit Status 64 - Root Cause: Invalid Wazuh Plugin Config

**Date:** 2025-12-28  
**Issue:** Dashboard crashes with exit status 64 after ~2.5 minutes  
**Root Cause:** Unknown configuration keys for Wazuh plugin  
**Status:** ✅ **FIXING NOW**

---

## 🚨 **Actual Error**

```
FATAL  Error: Unknown configuration key(s): 
  "wazuh.monitoring.enabled"
  "wazuh.monitoring.frequency"
  "wazuh.monitoring.shards"
  "wazuh.monitoring.replicas"
Check for spelling errors and ensure that expected plugins are installed.
```

---

## 🔍 **Why Dashboard Runs Then Crashes**

1. **04:24:20** - Dashboard starts
2. **04:25:50** - Supervisord marks it RUNNING (90s passed)
3. **Dashboard initializes**, reads config, loads plugins
4. **04:28:25** - Dashboard validates config **AFTER** full initialization
5. **Config validation fails** → Dashboard exits with status 64
6. **Supervisord restarts it** → same crash loop

---

## ✅ **Fix: Minimal Valid Configuration**

**Removed ALL invalid plugin config:**
- ❌ `wazuh.monitoring.enabled`
- ❌ `wazuh.monitoring.frequency`
- ❌ `wazuh.monitoring.shards`
- ❌ `wazuh.monitoring.replicas`

**Keeping ONLY valid OpenSearch Dashboards settings:**
```yaml
server.host: 0.0.0.0
server.port: 5601
opensearch.hosts: ["http://localhost:9200"]
opensearch.ssl.verificationMode: none
opensearch.shardTimeout: 60000
opensearch.requestTimeout: 60000
opensearch.pingTimeout: 30000
opensearch.requestHeadersWhitelist: ["securitytenant","Authorization"]
```

---

## 🎯 **Why This Will Work**

1. **Minimal config** = fewer validation errors
2. **Wazuh plugin uses defaults** or internal config
3. **Dashboard stays running** (no config validation failures)
4. **Health checks pass** → 503 fixed

---

## 🚀 **Deploying Fix Now**

```powershell
fly deploy -a ai2-wazuh --strategy immediate
```

Using `--strategy immediate` to skip health checks during deployment.

---

## ⏱️ **Expected Timeline**

- **0-15s:** Manager starts
- **15-90s:** Indexer starts
- **90-180s:** Dashboard starts
- **~3-4 min:** Dashboard fully initialized (NO EXIT!)
- **~4-5 min:** Health checks start passing

---

## 📊 **Monitoring**

Watch logs:
```powershell
fly logs -a ai2-wazuh
```

**Success indicators:**
- ✅ No "FATAL Error: Unknown configuration key" in logs
- ✅ Dashboard stays RUNNING past 4 minutes
- ✅ No "exit status 64"
- ✅ Health check passes
- ✅ https://ai2-wazuh.fly.dev loads

---

**Status:** Deployment in progress with minimal valid config
**embracingearth.space**

