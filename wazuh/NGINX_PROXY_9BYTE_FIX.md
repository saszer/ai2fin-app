# 🔧 Nginx Proxy 9-Byte Response Fix

**Date:** 2026-01-08  
**Issue:** Static assets (`/ui/` paths) returning 200 status but only 9 bytes of content  
**Error:** `[PU05] could not finish reading HTTP body from instance: error reading a body from connection`  
**Root Cause:** Missing proxy buffering, HTTP version, and keepalive configuration

---

## 🎯 **Problem Analysis**

The logs showed:
- All `/ui/` requests (fonts, logos, JS bundles) returning 200 status
- But only 9 bytes of content (should be much larger)
- Connection errors: `[PU05] could not finish reading HTTP body`

**Root Causes Identified:**
1. **Missing HTTP/1.1 configuration** - Nginx defaulting to HTTP/1.0, causing connection issues
2. **Insufficient buffering** - Small buffer sizes causing truncated responses
3. **Short timeouts** - 10s read timeout too short for large static files
4. **No keepalive connections** - Each request creating new connection, increasing failure rate
5. **Missing Connection header** - Required for HTTP/1.1 keepalive to work

---

## ✅ **Fixes Applied**

### **1. Added Keepalive to Upstream**
```nginx
upstream dashboard {
    server 127.0.0.1:5602;
    keepalive 32;  # Maintain persistent connections
    keepalive_requests 100;
    keepalive_timeout 60s;
}
```

### **2. HTTP/1.1 Configuration**
```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```

### **3. Proper Buffering Settings**
```nginx
proxy_buffering on;
proxy_buffer_size 8k;  # Increased from default 4k
proxy_buffers 16 8k;   # Increased buffers for large files
proxy_busy_buffers_size 16k;
proxy_max_temp_file_size 0;  # Disable temp files
```

### **4. Increased Timeouts**
```nginx
proxy_connect_timeout 30s;  # Increased from 5s
proxy_send_timeout 90s;      # Increased from default
proxy_read_timeout 90s;      # Increased from 10s
```

### **5. Specific `/ui/` Location Block**
Added optimized handling for UI static assets with:
- Larger buffers (8k base, 16 buffers)
- Longer timeouts (90s)
- Proper cache headers
- Better error handling

### **6. Enhanced Error Handling**
```nginx
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 10s;
```

### **7. Added Logging**
```nginx
log_format proxy_debug '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      'upstream: $upstream_addr response_time: $upstream_response_time';
access_log /var/log/nginx/access.log proxy_debug;
error_log /var/log/nginx/error.log warn;
```

---

## 🚀 **Deployment Steps**

1. **Rebuild Docker Image:**
   ```bash
   cd embracingearthspace/wazuh
   fly deploy
   ```

2. **Verify Nginx Config:**
   ```bash
   fly ssh console -a ai2-wazuh
   nginx -t -c /etc/nginx/nginx.conf
   ```

3. **Monitor Logs:**
   ```bash
   fly logs -a ai2-wazuh | grep -i "ui/"
   ```

4. **Test Static Assets:**
   ```bash
   curl -I https://ai2-wazuh.fly.dev/ui/logos/opensearch_spinner_on_light.svg
   curl -I https://ai2-wazuh.fly.dev/ui/fonts/source_sans_3/SourceSans3-Regular.ttf.woff2
   ```

---

## 🔍 **Expected Results**

After deployment:
- ✅ Static assets should return full content (not 9 bytes)
- ✅ No more `[PU05]` connection errors
- ✅ Faster response times due to keepalive connections
- ✅ Better handling of large files (fonts, JS bundles)
- ✅ Improved error recovery with retry logic

---

## 📊 **Monitoring**

Check these metrics after deployment:
1. **Response sizes** - Should match file sizes, not 9 bytes
2. **Connection errors** - Should decrease significantly
3. **Response times** - Should improve due to keepalive
4. **Error rates** - Should decrease for `/ui/` paths

---

## 🐛 **Troubleshooting**

If issues persist:

1. **Check Dashboard is running:**
   ```bash
   fly ssh console -a ai2-wazuh
   curl -I http://127.0.0.1:5602/ui/favicons/favicon.ico
   ```

2. **Check nginx logs:**
   ```bash
   fly ssh console -a ai2-wazuh
   tail -f /var/log/nginx/error.log
   tail -f /var/log/nginx/access.log
   ```

3. **Verify upstream connection:**
   ```bash
   fly ssh console -a ai2-wazuh
   curl -v http://127.0.0.1:5602/ui/favicons/favicon.ico
   ```

4. **Check Dashboard logs:**
   ```bash
   fly logs -a ai2-wazuh | grep -i dashboard
   ```

---

## 📝 **Files Modified**

- `embracingearthspace/wazuh/scripts/nginx-health-proxy.conf`
  - Added keepalive to upstream
  - Added HTTP/1.1 configuration
  - Enhanced buffering settings
  - Increased timeouts
  - Added specific `/ui/` location block
  - Added logging configuration

---

**embracingearth.space** - Enterprise-grade security monitoring


