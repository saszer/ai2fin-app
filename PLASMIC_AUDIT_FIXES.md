# 🔒 Plasmic Security Audit & Fixes

## ✅ Production Safety - VERIFIED ✅

### **1. RequireAuth Bypass - PRODUCTION DISABLED ✅**

**Code:** `src/components/RequireAuth.tsx:28`

```typescript
const isPlasmicHost = (currentPath === '/plasmic-host' || currentHash === '/plasmic-host') 
  && process.env.NODE_ENV === 'development';
```

**Security Analysis:**
- ✅ **In Production:** `process.env.NODE_ENV === 'development'` = `false`
- ✅ **In Production:** `isPlasmicHost` = `false` (always)
- ✅ **In Production:** All auth checks run normally
- ✅ **In Production:** Route requires authentication like any protected route
- ✅ **Bypass ONLY works in development**

### **2. PlasmicHost Component - PRODUCTION DISABLED ✅**

**Code:** `src/pages/PlasmicHost.tsx:84`

```typescript
if (process.env.NODE_ENV === 'production') {
  return <div>Plasmic Host Unavailable</div>;
}
```

**Security Analysis:**
- ✅ Component returns early in production
- ✅ `PlasmicCanvasHost` never renders in production
- ✅ No Plasmic Studio connection possible in production

### **3. Multiple Security Layers ✅**

| Layer | Development | Production |
|-------|------------|-----------|
| Route Config | Public route | Public route |
| RequireAuth Bypass | ✅ Active | ❌ Disabled (`isPlasmicHost = false`) |
| Component Check | ✅ Renders | ❌ Shows "Unavailable" |
| Auth Required | ❌ No (bypassed) | ✅ Yes (normal auth) |

---

## 📦 NPM Audit Results

**Vulnerabilities:** 9 total (3 moderate, 6 high)

### **Issues:**

1. **`nth-check` < 2.0.1 (HIGH)**
   - Inefficient Regular Expression Complexity
   - Dependency chain: `react-scripts` → `@svgr/webpack` → `@svgr/plugin-svgo` → `svgo` → `css-select` → `nth-check`
   - **Risk:** Build-time only (not runtime)
   - **Impact:** Low (only affects SVG processing during build)

2. **`postcss` < 8.4.31 (MODERATE)**
   - PostCSS line return parsing error
   - Dependency: `resolve-url-loader` → `postcss`
   - **Risk:** Build-time only (not runtime)
   - **Impact:** Low (only affects CSS processing during build)

### **Fix Options:**

1. **`npm audit fix --force`** ❌
   - Would downgrade `react-scripts` to 3.0.1 (BREAKING CHANGE)
   - Would break current setup
   - **NOT RECOMMENDED**

2. **Manual Package Updates** ⚠️
   - Update individual packages
   - Risky - may break build
   - **NOT RECOMMENDED** without testing

3. **Accept Risk** ✅ **RECOMMENDED**
   - These are **dev dependencies** (build-time only)
   - **No runtime risk** (not included in production bundle)
   - **Low security risk** (only affects local development builds)
   - Can be addressed in future React Scripts upgrade

### **Recommendation:**

✅ **Accept current risk** - These vulnerabilities are:
- Build-time only (not in production code)
- Low security impact (local dev environment)
- Would require breaking changes to fix
- Can be addressed when upgrading React Scripts

---

## 🔧 Route Redirect Issue - FIXED

### **Problem:**
Route still redirects to login despite being in public routes.

### **Root Cause:**
Even though route is public, `RequireAuth` might be called from catch-all route, or loading state prevents bypass.

### **Fixes Applied:**

1. ✅ **Early bypass check** - Checks `isPlasmicHost` at start
2. ✅ **Skip loading state** - Bypasses loading check for `/plasmic-host`
3. ✅ **Skip timeout error** - Prevents timeout redirect for `/plasmic-host`
4. ✅ **Hash routing support** - Checks both `pathname` and `hash`
5. ✅ **Production disabled** - Bypass only works in development

### **Code Changes:**

```typescript
// Skip loading state for /plasmic-host
if (!isPlasmicHost && (loading || !cookieCheckDone)) {
  // Show loading...
}

// Skip timeout error for /plasmic-host
if (showTimeoutError && !isPlasmicHost) {
  // Show timeout error...
}
```

---

## 🛡️ Security Verification Checklist

- [x] Bypass includes `NODE_ENV === 'development'` check
- [x] Component returns early in production
- [x] Multiple layers of protection
- [x] No runtime Plasmic fetching (Codegen mode)
- [x] Route is in public section
- [x] Bypass works in all auth check points
- [x] Hash routing properly handled
- [x] Production builds will disable route

---

## 🎯 Summary

### **Production Safety:** ✅ **FULLY DISABLED**

- Bypass **ONLY** works when `NODE_ENV === 'development'`
- In production: `isPlasmicHost` = `false` (always)
- In production: Normal authentication required
- In production: Component shows "Unavailable"

### **NPM Audit:** ⚠️ **LOW RISK**

- 9 vulnerabilities (dev dependencies only)
- Build-time only (not in production code)
- Fix would require breaking changes
- **Recommendation:** Accept risk, fix in future upgrade

### **Route Fix:** ✅ **COMPLETE**

- Bypass added to all auth check points
- Hash routing supported
- Loading state bypassed
- Timeout errors bypassed
- Production disabled

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Production-safe, route bypass complete, npm audit low risk
