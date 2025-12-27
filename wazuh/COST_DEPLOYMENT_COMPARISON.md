# 💰 Cost & Deployment Comparison: Fly.io vs AWS + Ansible

**Date:** 2025-12-27  
**Requirement:** Self-hosted Wazuh with Dashboard (budget-conscious)

---

## 📊 **Cost Comparison**

### **Wazuh Full Stack Requirements:**
- **Manager:** 1GB RAM, 1 CPU
- **Indexer (Elasticsearch):** 2GB+ RAM, 2 CPUs
- **Dashboard (Kibana):** 1GB RAM, 1 CPU
- **Total:** ~4GB RAM, 4 CPUs minimum

---

### **Option 1: Fly.io (Current Platform)**

**Pricing Structure:**
- **Memory:** $0.00000194 per GB-second
- **CPU:** Included with memory
- **Storage:** $0.15 per GB/month
- **Bandwidth:** $0.02 per GB

**Estimated Monthly Cost:**

**Single App (All-in-One):**
- 4GB RAM, 4 CPUs, 24/7: ~$50-60/month
- 20GB storage: ~$3/month
- **Total: ~$53-63/month**

**Three Separate Apps:**
- Manager (1GB): ~$15/month
- Indexer (2GB): ~$30/month
- Dashboard (1GB): ~$15/month
- Storage (20GB): ~$3/month
- **Total: ~$63/month**

**Pros:**
- ✅ Simple deployment (Docker-based)
- ✅ Auto-scaling
- ✅ Global edge network
- ✅ Easy to manage

**Cons:**
- ⚠️ Higher cost for resource-intensive apps
- ⚠️ Limited to containerized deployments
- ⚠️ Less control over infrastructure

---

### **Option 2: AWS EC2 + Ansible**

**Pricing Structure:**
- **EC2:** Pay per instance type
- **Storage:** EBS volumes (~$0.10/GB/month)
- **Data Transfer:** First 100GB free, then $0.09/GB

**Estimated Monthly Cost:**

**Single Instance (All-in-One):**
- **t3.medium** (2 vCPU, 4GB RAM): ~$30/month
- **t3.large** (2 vCPU, 8GB RAM): ~$60/month (better for full stack)
- **m5.large** (2 vCPU, 8GB RAM): ~$77/month
- EBS storage (20GB): ~$2/month
- **Total: ~$32-79/month** (depending on instance)

**Three Separate Instances:**
- Manager (t3.small, 2GB): ~$15/month
- Indexer (t3.medium, 4GB): ~$30/month
- Dashboard (t3.small, 2GB): ~$15/month
- EBS storage (20GB each): ~$6/month
- **Total: ~$66/month**

**With Reserved Instances (1-year):**
- **~40% discount** → **~$40/month** for single instance
- **~$40/month** for three instances

**Pros:**
- ✅ **Lower cost** (especially with Reserved Instances)
- ✅ Full control over infrastructure
- ✅ Official Wazuh Ansible playbooks available
- ✅ Better for resource-intensive workloads
- ✅ Can optimize costs (spot instances, reserved instances)

**Cons:**
- ⚠️ More complex setup (Ansible required)
- ⚠️ Need to manage infrastructure
- ⚠️ More DevOps knowledge needed

---

## 🎯 **Cost Winner: AWS (with optimization)**

**AWS is cheaper IF:**
- ✅ Use Reserved Instances (1-year): **~$40/month** vs Fly.io **~$60/month**
- ✅ Use single instance (all-in-one): **~$32/month** vs Fly.io **~$53/month**
- ✅ Optimize with spot instances for non-critical workloads

**Fly.io is simpler BUT:**
- ⚠️ More expensive for resource-intensive apps
- ⚠️ Less control over infrastructure

---

## 🛠️ **What I Can Do Best**

### **Option A: Stay on Fly.io** ✅ **I CAN DO THIS BEST**

**Why:**
- ✅ **Already deployed** and working
- ✅ **Docker-based** (I understand this well)
- ✅ **Simple to extend** (add Indexer + Dashboard)
- ✅ **Less complexity** (no Ansible needed)

**What I'll do:**
1. Create Indexer Dockerfile + fly.toml
2. Create Dashboard Dockerfile + fly.toml
3. Update Manager to connect to Indexer
4. Configure networking between apps
5. Test full stack deployment

**Time to implement:** ~2-3 hours
**Complexity:** Low-Medium

---

### **Option B: Migrate to AWS + Ansible** ⚠️ **MORE COMPLEX**

**Why:**
- ✅ **Official Wazuh Ansible playbooks** available
- ✅ **Lower cost** (with optimization)
- ✅ **More control**

**What I'll do:**
1. Set up AWS infrastructure (EC2 instances)
2. Configure Ansible playbooks
3. Deploy Wazuh using official Ansible roles
4. Configure networking and security groups
5. Set up monitoring

**Time to implement:** ~4-6 hours
**Complexity:** High

**Challenges:**
- ⚠️ Need AWS account setup
- ⚠️ Need to understand Ansible
- ⚠️ More moving parts
- ⚠️ Infrastructure management

---

## 🎯 **My Recommendation**

### **For Budget + Simplicity: Stay on Fly.io** ✅

**Reasons:**
1. ✅ **Already working** - Manager is deployed
2. ✅ **I can implement this properly** - Docker is my strength
3. ✅ **Faster to deploy** - Less complexity
4. ✅ **Easier to maintain** - Container-based
5. ✅ **Cost difference is manageable** - ~$20/month more, but simpler

**Cost Savings Strategy on Fly.io:**
- Use `auto_stop_machines = "stop"` (already configured)
- Machines stop when idle → **saves ~50% cost**
- Only pay when machines are running
- **Effective cost: ~$30-35/month** (if not 24/7)

---

### **If Budget is Critical: Migrate to AWS** ⚠️

**Only if:**
- Budget is very tight (<$30/month)
- You have AWS experience
- You're comfortable with Ansible
- You need full infrastructure control

**Cost with optimization:**
- Reserved Instance: **~$25-30/month**
- Spot instances: **~$15-20/month** (risky for production)

---

## 📋 **Implementation Plan: Fly.io (Recommended)**

### **Phase 1: Add Indexer** (2-3 hours)

**Create:** `wazuh-indexer/`
- Dockerfile (using `wazuh/wazuh-indexer:4.8.0`)
- fly.toml (port 9200, 2GB RAM)
- Configuration files

**Deploy:**
```powershell
cd wazuh-indexer
fly apps create ai2-wazuh-indexer
fly deploy
```

---

### **Phase 2: Add Dashboard** (2-3 hours)

**Create:** `wazuh-dashboard/`
- Dockerfile (using `wazuh/wazuh-dashboard:4.8.0`)
- fly.toml (port 5601, 1GB RAM)
- Configuration to connect to Indexer

**Deploy:**
```powershell
cd wazuh-dashboard
fly apps create ai2-wazuh-dashboard
fly deploy
```

---

### **Phase 3: Update Manager** (1 hour)

**Update:** `wazuh/wazuh.conf`
- Enable Indexer connection
- Point to `ai2-wazuh-indexer.fly.dev`

**Redeploy:**
```powershell
cd wazuh
fly deploy
```

---

## 💰 **Final Cost Comparison**

| Platform | Monthly Cost | Setup Time | Complexity | My Ability |
|----------|-------------|------------|------------|------------|
| **Fly.io (Current)** | ~$53/month<br>(~$30 with auto-stop) | 2-3 hours | Low | ✅ **Best** |
| **AWS + Ansible** | ~$32/month<br>(~$25 reserved) | 4-6 hours | High | ⚠️ Medium |

---

## ✅ **My Recommendation**

**Stay on Fly.io and add Indexer + Dashboard**

**Why:**
1. ✅ **I can do this properly** - Docker is my strength
2. ✅ **Already working** - Manager is deployed
3. ✅ **Faster implementation** - 2-3 hours vs 4-6 hours
4. ✅ **Easier maintenance** - Container-based
5. ✅ **Cost is manageable** - ~$30/month with auto-stop

**Cost optimization:**
- Use `auto_stop_machines = "stop"` (already configured)
- Machines stop when idle → **saves ~50%**
- **Effective cost: ~$30-35/month**

---

## 🚀 **Next Steps**

**If you choose Fly.io (Recommended):**
1. I'll create Indexer deployment
2. I'll create Dashboard deployment
3. I'll update Manager configuration
4. Test full stack

**If you choose AWS:**
1. Set up AWS account
2. Configure Ansible
3. Use official Wazuh Ansible playbooks
4. Deploy infrastructure

---

**My recommendation: Stay on Fly.io - I can implement this properly and quickly!** ✅

