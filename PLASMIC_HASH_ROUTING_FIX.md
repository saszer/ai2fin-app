# 🔧 Plasmic Hash Routing Fix

## ❓ Problem

The app uses **`HashRouter`** from React Router, which means all routes are accessed via hash (`#/path`), not direct paths (`/path`).

**Symptoms:**
- URL shows `http://localhost:3000/#/plasmic-host` (with `#`)
- Plasmic Studio can't connect properly
- Redirect prevention code doesn't work correctly
- Route keeps redirecting to login

---

## ✅ Root Cause

The app uses `HashRouter` in `src/index.tsx`:

```typescript
<HashRouter>
  <App />
</HashRouter>
```

With `HashRouter`:
- Routes are in the **hash** portion: `#/plasmic-host`
- `window.location.pathname` is always `/` (not `/plasmic-host`)
- `window.location.hash` contains the actual route: `#/plasmic-host`

The redirect prevention code was checking `pathname`, which doesn't work with hash routing!

---

## 🔧 What I Fixed

### **1. Updated Redirect Prevention Logic**

Changed from checking `pathname` to checking both `pathname` and `hash`:

```typescript
// OLD (doesn't work with HashRouter):
if (window.location.pathname !== '/plasmic-host') {
  window.history.replaceState(null, '', '/plasmic-host');
}

// NEW (works with HashRouter):
const currentHash = window.location.hash.replace('#', '');
const isCorrectRoute = currentPath === '/plasmic-host' || currentHash === '/plasmic-host';
if (!isCorrectRoute) {
  window.location.hash = '#/plasmic-host';
}
```

### **2. Updated URL Documentation**

Changed the documented URL from:
- `http://localhost:3000/plasmic-host` ❌

To:
- `http://localhost:3000/#/plasmic-host` ✅

---

## 📋 Correct Setup

### **Step 1: Use Hash URL in Plasmic Studio**

In Plasmic Studio settings, set Host URL to:

```
http://localhost:3000/#/plasmic-host
```

**Important:** Include the `#` (hash) in the URL!

### **Step 2: Test Direct Access**

Open in browser:
```
http://localhost:3000/#/plasmic-host
```

Should see Plasmic Studio interface (not login page).

### **Step 3: Verify Route Works**

1. Make sure dev server is running: `npm start`
2. Access: `http://localhost:3000/#/plasmic-host`
3. Should NOT redirect to login
4. Should show Plasmic Studio or configuration message

---

## 🔍 Why Hash Routing?

The app uses `HashRouter` because:
- Works without server configuration
- No need for server-side routing setup
- Compatible with static hosting
- Routes are client-side only

**Trade-off:** URLs include `#` (hash), which is fine for this use case.

---

## 🎯 Expected Behavior

### **With HashRouter:**

- ✅ URL: `http://localhost:3000/#/plasmic-host`
- ✅ `window.location.pathname` = `/`
- ✅ `window.location.hash` = `#/plasmic-host`
- ✅ Route matches: `/plasmic-host` (from hash)

### **Redirect Prevention:**

- ✅ Checks both `pathname` and `hash`
- ✅ Uses `window.location.hash` to set route
- ✅ Prevents navigation away from `/plasmic-host`

---

## 🔧 Troubleshooting

### **"Still redirects to login"**

**Check:**
1. Are you using the hash URL? (`#/plasmic-host`)
2. Is the route in public routes section? (Yes ✅)
3. Are ChatContext and PostHogRouteTracker skipping this route? (Yes ✅)

**Try:**
- Clear browser cache
- Try incognito mode
- Check browser console for errors

### **"Plasmic Studio can't connect"**

**Check:**
1. Host URL in Plasmic Studio includes `#`: `http://localhost:3000/#/plasmic-host`
2. Dev server is running on port 3000
3. No firewall blocking localhost

**Try:**
- Test direct access: `http://localhost:3000/#/plasmic-host`
- Check browser console for connection errors
- Verify credentials are set in `.env`

---

## 📚 References

- [React Router HashRouter Docs](https://reactrouter.com/api/declarative-routers/HashRouter)
- [Plasmic App Hosting Docs](https://docs.plasmic.app/learn/app-hosting)

---

## 🎯 Summary

**The Issue:** App uses `HashRouter`, so routes are in hash (`#/path`), not pathname.

**The Fix:** Updated redirect prevention to check hash instead of pathname.

**The URL:** Use `http://localhost:3000/#/plasmic-host` (with `#`) in Plasmic Studio settings.

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Fixed - Hash routing support added
