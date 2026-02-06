# 🔧 Plasmic Malformed URL Fix - Pathname Detection

## 🐛 **CRITICAL ISSUE FOUND**

### **Problem:**
Plasmic Studio sends malformed URLs where query parameters end up in the **pathname** instead of the hash:
- **Expected:** `http://localhost:3003/#/plasmic-host?origin=...`
- **Actual:** `http://localhost:3003/#origin=...` (no `/plasmic-host` route)
- **React Router parses as:**
  - `pathname: '/origin=https%3A%2F%2Fstudio.plasmic.app...'`
  - `hash: ''` (empty!)

### **Why This Breaks:**
1. `RequireAuth` checks `currentHash` for Plasmic params, but hash is empty
2. `RequireAuth` checks `currentPath === '/plasmic-host'`, but pathname is `/origin=...`
3. Route bypass fails → redirects to login
4. `PlasmicHost` component never renders

---

## ✅ **FIX APPLIED**

### **Fix 1: Enhanced Detection in RequireAuth**

**File:** `src/components/RequireAuth.tsx`

**Added pathname check:**
```typescript
// Check BOTH pathname and hash for Plasmic Studio params
const pathContainsPlasmicParams = currentPath.includes('origin=') || 
                                   currentPath.includes('studio.plasmic.app');
const hashContainsPlasmicParams = currentHash.includes('origin=') || 
                                   currentHash.includes('studio.plasmic.app');
const isPlasmicHost = (
  currentPath === '/plasmic-host' || 
  currentHash === '/plasmic-host' || 
  currentHash.startsWith('/plasmic-host') ||
  pathContainsPlasmicParams ||  // ✅ NEW: Check pathname
  hashContainsPlasmicParams
) && process.env.NODE_ENV === 'development';
```

### **Fix 2: Enhanced URL Normalization in PlasmicHost**

**File:** `src/pages/PlasmicHost.tsx`

**Added pathname extraction:**
```typescript
// Check if pathname OR hash contains Plasmic Studio query params
const pathContainsPlasmicParams = currentPath.includes('origin=') || 
                                   currentPath.includes('studio.plasmic.app');
const hashContainsPlasmicParams = currentHash.includes('origin=') || 
                                   currentHash.includes('studio.plasmic.app');

// Extract query params from pathname (if malformed) or hash
if (pathContainsPlasmicParams && currentPath.includes('?')) {
  const pathParams = currentPath.split('?')[1];
  // Parse and preserve all params
}

// Normalize to: #/plasmic-host?origin=...
window.location.hash = `#/plasmic-host${queryString ? '?' + queryString : ''}`;
// Clear malformed pathname
if (pathContainsPlasmicParams && currentPath !== '/') {
  window.history.replaceState(null, '', '/');
}
```

---

## 🔍 **What This Fixes**

### **Before:**
- ❌ `RequireAuth` doesn't detect Plasmic host (pathname check missing)
- ❌ Route redirects to login
- ❌ `PlasmicHost` never renders
- ❌ Studio shows blank screen

### **After:**
- ✅ `RequireAuth` detects Plasmic host from pathname
- ✅ Route bypass works correctly
- ✅ `PlasmicHost` renders and normalizes URL
- ✅ Studio can connect

---

## 🎯 **Root Cause**

**HashRouter Parsing Bug:**
When Plasmic Studio sends: `http://localhost:3003/#origin=...` (no route before query params), React Router's HashRouter incorrectly parses:
- Query params go into `pathname` instead of `hash`
- Hash becomes empty
- Route matching fails

**Solution:**
Check **both** `pathname` and `hash` for Plasmic Studio query parameters, then normalize to correct format.

---

## ✅ **Status**

- [x] Enhanced `RequireAuth` to check pathname for Plasmic params
- [x] Enhanced `PlasmicHost` to normalize pathname-based malformed URLs
- [x] URL normalization extracts params from pathname
- [x] Clears malformed pathname after normalization
- [ ] **Next:** Test with actual Plasmic Studio connection

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Fix applied - pathname detection added
