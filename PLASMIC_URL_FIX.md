# 🔧 Plasmic Studio URL & CORS Fix

## 🐛 Issues Found

### **1. Port Mismatch**
- App running on `localhost:3003` instead of `3000`
- Plasmic Studio configured for `localhost:3000`

### **2. Malformed URL Structure**
- Plasmic Studio loading: `localhost:3003/#origin=https%3A%2F%2Fstudio.plasmic.app...`
- Query parameters in hash instead of route
- React Router parsing `/origin=https%3A%2F%2Fstudio.plasmic.app...` as pathname
- Hash is empty when it should contain `/plasmic-host`

### **3. CORS Issue**
- Backend CORS doesn't allow `localhost:3003`
- API calls from `3003` to `3001` blocked

---

## ✅ Fixes Applied

### **Fix 1: Enhanced Route Matching for Malformed URLs**

**File:** `src/components/RequireAuth.tsx`

```typescript
// Handle malformed URLs from Plasmic Studio
const hashContainsPlasmicParams = currentHash.includes('origin=') || 
                                   currentHash.includes('studio.plasmic.app');
const isPlasmicHost = (
  currentPath === '/plasmic-host' || 
  currentHash === '/plasmic-host' || 
  currentHash.startsWith('/plasmic-host') ||
  hashContainsPlasmicParams  // ✅ NEW: Detect Plasmic Studio query params
) && process.env.NODE_ENV === 'development';
```

**What it does:**
- Detects when Plasmic Studio query params are in the hash
- Bypasses auth even if URL structure is malformed
- Works with both correct and malformed URLs

### **Fix 2: URL Normalization in PlasmicHost**

**File:** `src/pages/PlasmicHost.tsx`

```typescript
// If URL is malformed (Plasmic Studio query params in hash), normalize it
if (hashContainsPlasmicParams && !currentHash.startsWith('/plasmic-host')) {
  // Extract query params and preserve them
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = currentHash.includes('?') ? currentHash.split('?')[1] : '';
  if (hashParams) {
    const hashParamsObj = new URLSearchParams(hashParams);
    hashParamsObj.forEach((value, key) => urlParams.set(key, value));
  }
  // Normalize to proper hash route format
  const queryString = urlParams.toString();
  window.location.hash = `#/plasmic-host${queryString ? '?' + queryString : ''}`;
  return;
}
```

**What it does:**
- Detects malformed URLs from Plasmic Studio
- Extracts query parameters from hash
- Normalizes to proper format: `#/plasmic-host?origin=...`
- Preserves all query parameters

### **Fix 3: Added Port 3003 to CORS Whitelist**

**File:** `src/middleware/security.ts`

```typescript
const defaultDevOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3003', // ✅ NEW: Plasmic Studio alternate port
  'http://localhost:6274',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3003', // ✅ NEW: Plasmic Studio alternative
  'http://127.0.0.1:6274'
];
```

**What it does:**
- Allows CORS requests from `localhost:3003`
- Fixes API call blocking
- Works for both `localhost` and `127.0.0.1`

---

## 🎯 Root Cause Analysis

### **Why Port 3003?**

Port `3000` might be in use by another process, causing React dev server to auto-select `3003`. This is normal behavior for Create React App.

### **Why Malformed URL?**

Plasmic Studio embeds the host app in an iframe and appends query parameters. When the app uses HashRouter, these params can end up in the hash instead of as proper query params.

### **Why CORS Error?**

Backend CORS whitelist didn not include `3003`, so API calls from that port were blocked.

---

## 🔍 Testing

1. **Check Port:**
   ```bash
   # Kill process on 3000 if needed
   netstat -ano | findstr :3000
   
   # Start app (should use 3000, or 3003 if 3000 is busy)
   npm start
   ```

2. **Verify URL Normalization:**
   - Open browser console
   - Navigate to `http://localhost:3003/#origin=...`
   - Should auto-redirect to `http://localhost:3003/#/plasmic-host?origin=...`

3. **Verify CORS:**
   - Check network tab for API calls
   - Should see `Access-Control-Allow-Origin: http://localhost:3003`
   - No CORS errors

---

## 📝 Recommendations

### **Option 1: Use Port 3000 (Recommended)**
```bash
# Kill process on 3000
# Then start app
npm start
```

### **Option 2: Update Plasmic Studio Host URL**
If using port 3003:
- Plasmic Studio → Settings → Host URL
- Change to: `http://localhost:3003/#/plasmic-host`

### **Option 3: Set PORT Environment Variable**
```bash
# .env file
PORT=3000
```

---

## ✅ Status

- [x] Route matching handles malformed URLs
- [x] URL normalization in PlasmicHost
- [x] CORS whitelist includes port 3003
- [x] Auth bypass works with malformed URLs
- [ ] Port should be standardized to 3000 (recommended)

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Fixes applied, ready for testing
