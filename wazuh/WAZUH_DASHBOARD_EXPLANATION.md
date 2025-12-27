# 📊 Wazuh Dashboard - Architecture Explanation

**Date:** 2025-12-27  
**Status:** ✅ **CLARIFICATION**

---

## 🏗️ **Wazuh Architecture**

Wazuh consists of **3 main components**:

### **1. Wazuh Manager** ✅ (What We Deployed)

- **What it is:** Core security engine and REST API
- **Port:** 55000
- **Purpose:** 
  - Security event processing
  - Rule engine
  - Agent management
  - REST API for programmatic access
- **Status:** ✅ Deployed at `https://ai2-wazuh.fly.dev`

---

### **2. Wazuh Indexer** ❌ (Not Deployed)

- **What it is:** Elasticsearch-based data storage
- **Purpose:**
  - Stores security events
  - Indexes logs and alerts
  - Required for Dashboard
- **Status:** ❌ Not deployed (we disabled it)
- **Why:** We're using API integration, not full SIEM stack

---

### **3. Wazuh Dashboard** ❌ (Not Deployed)

- **What it is:** Web-based UI (Kibana-based)
- **Purpose:**
  - Visualize security events
  - Manage alerts
  - Configure agents
  - Real-time monitoring dashboards
- **Requirements:**
  - ✅ Wazuh Manager (we have this)
  - ❌ Wazuh Indexer (we don't have this)
- **Status:** ❌ Not deployed (requires Indexer)
- **Access:** Would be at `https://ai2-wazuh-dashboard.fly.dev` (if deployed)

---

## 🎯 **Why We Don't Have Dashboard**

### **Our Deployment:**
- ✅ Wazuh Manager (API only)
- ❌ Wazuh Indexer (disabled - no Elasticsearch)
- ❌ Wazuh Dashboard (requires Indexer)

### **Why We Disabled Indexer:**
- ✅ **Simpler deployment** (no Elasticsearch cluster needed)
- ✅ **Lower resource usage** (Indexer needs significant memory)
- ✅ **API integration** (we use REST API, not full SIEM)
- ✅ **Focused use case** (application security events, not system monitoring)

---

## 📊 **How to Get Wazuh Dashboard**

### **Option 1: Deploy Full Wazuh Stack** (Recommended for Full SIEM)

**Components Needed:**
1. Wazuh Manager ✅ (already deployed)
2. Wazuh Indexer (Elasticsearch) - needs deployment
3. Wazuh Dashboard (Kibana) - needs deployment

**Deployment:**
```powershell
# Would need to deploy:
# 1. Wazuh Indexer (Elasticsearch cluster)
# 2. Wazuh Dashboard (Kibana with Wazuh plugin)
```

**Resource Requirements:**
- Indexer: ~2GB RAM minimum
- Dashboard: ~1GB RAM minimum
- Total: ~4GB+ RAM for full stack

**Access:**
- Dashboard: `https://ai2-wazuh-dashboard.fly.dev`
- Manager: `https://ai2-wazuh.fly.dev` (API)

---

### **Option 2: Use Wazuh Cloud Dashboard** (Easier)

**What it is:**
- Managed Wazuh Dashboard service
- Connects to your self-hosted Manager
- No need to deploy Indexer/Dashboard

**How it works:**
1. Sign up for Wazuh Cloud
2. Connect your Manager: `https://ai2-wazuh.fly.dev`
3. Access dashboard via Wazuh Cloud

**Pros:**
- ✅ No deployment needed
- ✅ Managed service
- ✅ Always up-to-date

**Cons:**
- ⚠️ Requires Wazuh Cloud account
- ⚠️ Data goes through Wazuh Cloud

---

### **Option 3: Build Custom Dashboard** (What We're Doing)

**Current Approach:**
- ✅ Use Wazuh API directly
- ✅ Build custom dashboards in your app
- ✅ Integrate security events into your app

**How it works:**
```typescript
// Already integrated in ai2-core-app/src/lib/wazuh.ts
const wazuhClient = new WazuhClient({
  managerUrl: 'https://ai2-wazuh.fly.dev',
  username: process.env.WAZUH_API_USER,
  password: process.env.WAZUH_API_PASSWORD
});

// Query security events
const events = await wazuhClient.getEvents({
  query: 'rule.id:100001',
  limit: 100
});
```

**Pros:**
- ✅ Full control
- ✅ Customized to your needs
- ✅ Integrated into your app
- ✅ No additional deployment

**Cons:**
- ⚠️ Need to build UI yourself
- ⚠️ No pre-built visualizations

---

## 🎯 **Summary**

### **✅ What We Have:**
- ✅ Wazuh Manager (API server)
- ✅ REST API access
- ✅ Programmatic integration

### **❌ What We Don't Have:**
- ❌ Wazuh Dashboard (web UI)
- ❌ Wazuh Indexer (Elasticsearch)

### **📊 Dashboard Options:**

1. **Deploy Full Stack** (Indexer + Dashboard)
   - Most features
   - Requires more resources
   - Full SIEM capabilities

2. **Use Wazuh Cloud** (Managed Dashboard)
   - Easiest option
   - Requires account
   - Managed service

3. **Custom Dashboard** (Current Approach)
   - Full control
   - Integrated into app
   - Need to build UI

---

## 🔧 **If You Want Wazuh Dashboard**

**To deploy Wazuh Dashboard, you need:**

1. **Deploy Wazuh Indexer:**
   - Elasticsearch cluster
   - ~2GB+ RAM
   - Connects to Manager

2. **Deploy Wazuh Dashboard:**
   - Kibana with Wazuh plugin
   - ~1GB+ RAM
   - Connects to Indexer

3. **Configure Manager:**
   - Enable Indexer connection
   - Point to Indexer URL

**Or use Wazuh Cloud for easier setup!**

---

**Current Status:** ✅ Manager deployed, Dashboard not needed for API integration use case.

