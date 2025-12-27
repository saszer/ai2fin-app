# ✅ Wazuh Access URL Confirmation

**Date:** 2025-12-27  
**Status:** ✅ **URL CONFIRMED**

---

## 🌐 **Wazuh API Access URL**

### **Base URL:**
```
https://ai2-wazuh.fly.dev
```

**Note:** Port 55000 is the internal port. Fly.io automatically routes:
- External: `https://ai2-wazuh.fly.dev` (port 443)
- Internal: `localhost:55000` (inside container)

**You do NOT need to specify port 55000 in the URL!**

---

## 🔐 **Authentication**

**Required for ALL endpoints:**
- Username: `wazuh` (default, or set via `WAZUH_API_USER` secret)
- Password: Set via `WAZUH_API_PASSWORD` secret

**Set credentials:**
```powershell
fly secrets set -a ai2-wazuh WAZUH_API_USER="wazuh"
fly secrets set -a ai2-wazuh WAZUH_API_PASSWORD="your-secure-password"
```

---

## 📋 **API Endpoints**

### **Common Endpoints:**

**1. API Status:**
```
GET https://ai2-wazuh.fly.dev/status
```

**2. List Agents:**
```
GET https://ai2-wazuh.fly.dev/agents
```

**3. Manager Status:**
```
GET https://ai2-wazuh.fly.dev/manager/status
```

**4. Manager Info:**
```
GET https://ai2-wazuh.fly.dev/manager/info
```

**5. Security Events:**
```
GET https://ai2-wazuh.fly.dev/events
```

**6. Vulnerability Data:**
```
GET https://ai2-wazuh.fly.dev/vulnerability
```

---

## 🧪 **Testing Access**

### **Test 1: Basic Connectivity (No Auth)**
```bash
curl -k https://ai2-wazuh.fly.dev/status
```

**Expected:** `401 Unauthorized` (API is working, needs auth)

### **Test 2: With Authentication**
```bash
curl -k -u wazuh:YOUR_PASSWORD https://ai2-wazuh.fly.dev/status
```

**Expected:** `200 OK` with JSON response

### **Test 3: Browser Test**
- ❌ **Cannot test in browser** (no web UI)
- ✅ **Use Postman/Insomnia** (API clients)
- ✅ **Use curl** (command line)

---

## ⚠️ **Important Notes**

### **1. No Web Dashboard**
- Wazuh Manager = API only
- No web UI/dashboard
- Use API clients or deploy Wazuh Dashboard separately

### **2. All Endpoints Require Auth**
- Every endpoint needs authentication
- No public/unauthenticated endpoints
- Returns 401 without credentials

### **3. HTTPS Only**
- API uses HTTPS (self-signed cert)
- Use `-k` flag with curl to skip cert verification
- Or configure proper SSL certificates

---

## 🔧 **Integration Examples**

### **JavaScript/TypeScript:**
```typescript
const response = await fetch('https://ai2-wazuh.fly.dev/status', {
  headers: {
    'Authorization': `Basic ${btoa('wazuh:password')}`
  }
});
```

### **Python:**
```python
import requests

response = requests.get(
    'https://ai2-wazuh.fly.dev/status',
    auth=('wazuh', 'password'),
    verify=False  # Skip SSL verification for self-signed cert
)
```

### **PowerShell:**
```powershell
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("wazuh:password"))
$headers = @{ Authorization = "Basic $cred" }
Invoke-RestMethod -Uri "https://ai2-wazuh.fly.dev/status" -Headers $headers -SkipCertificateCheck
```

---

## ✅ **Summary**

**Access URL:** `https://ai2-wazuh.fly.dev`  
**Port:** 443 (HTTPS, automatically handled by Fly.io)  
**Internal Port:** 55000 (inside container)  
**Authentication:** Required (Basic Auth)  
**Web UI:** ❌ Not available (API only)  
**Status:** ✅ Ready for API access

---

**Full API Documentation:**  
https://documentation.wazuh.com/4.8/user-manual/api/index.html

