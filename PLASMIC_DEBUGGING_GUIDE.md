# 🔍 Plasmic Studio Connection - Debugging Guide

## ✅ **Current Status**

From console logs:
- ✅ **Auth bypass working:** `✅ RequireAuth: Bypassing auth for /plasmic-host (development only)`
- ❌ **Missing Plasmic logs:** No initialization or component registration logs
- ❌ **Missing render log:** No `✅ PlasmicCanvasHost: Rendering canvas host for Studio connection`

## 🎯 **What This Means**

The route is being accessed and auth is bypassed, but:
1. **PLASMIC loader is not initialized** (credentials missing)
2. **Components are not registered** (because loader is null)
3. **PlasmicCanvasHost is not rendering** (because PLASMIC is null)

---

## 🔧 **Required Setup**

### **1. Environment Variables**

Create or update `.env` file in `ai2-core-app/client/`:

```bash
REACT_APP_PLASMIC_PROJECT_ID=your-project-id-here
REACT_APP_PLASMIC_API_TOKEN=your-api-token-here
```

### **2. How to Get Credentials**

**Project ID:**
1. Open Plasmic Studio: https://studio.plasmic.app
2. Open your project
3. Look at the URL: `studio.plasmic.app/projects/PROJECT_ID`
4. Copy the `PROJECT_ID` part

**API Token:**
1. In Plasmic Studio, click the **"Code"** button in the toolbar (top right)
2. Copy the API token shown
3. Paste into `.env` file

### **3. Restart Dev Server**

**CRITICAL:** After adding environment variables, you MUST restart the dev server:
```bash
# Stop current server (Ctrl+C)
# Then restart
npm start
```

Environment variables are only loaded when the server starts.

---

## 🔍 **Expected Console Logs (After Setup)**

After adding credentials and restarting, you should see:

```
✅ Plasmic loader initialized for Studio connection
   Project ID: abc12345...
   API Token: SET
   Preview mode: true
🔒 Codegen mode: Production uses static components (no runtime fetching)

✅ Material-UI components registered with PLASMIC loader for Studio
💡 Components available in Studio: ['MUICard', 'MUITypography', ...]
💡 These components will appear in Plasmic Studio component panel
🔒 Codegen mode: Components are static code (no runtime fetching)

🔍 PlasmicHost: Component mounted
   PLASMIC initialized: true
   Current URL: http://localhost:3003/#/plasmic-host?origin=...
   Pathname: /
   Hash: #/plasmic-host?origin=...

✅ PlasmicCanvasHost: Rendering canvas host for Studio connection
```

---

## 🐛 **Troubleshooting**

### **Issue: No Plasmic logs at all**

**Cause:** Credentials not set or server not restarted

**Solution:**
1. Check `.env` file exists in `ai2-core-app/client/`
2. Verify variables are named correctly (must start with `REACT_APP_`)
3. Restart dev server completely

### **Issue: "PLASMIC loader not initialized"**

**Cause:** One or both credentials missing

**Solution:**
1. Check `.env` file has both variables
2. Verify no typos in variable names
3. Check for extra spaces or quotes
4. Restart dev server

### **Issue: Auth bypass working but blank screen**

**Cause:** PLASMIC is null, so PlasmicCanvasHost doesn't render

**Solution:**
1. Add credentials to `.env`
2. Restart dev server
3. Check console for initialization logs

### **Issue: URL not normalizing**

**Cause:** URL normalization logic might not be running

**Solution:**
1. Check console for: `🔧 PlasmicHost: Detected malformed URL, normalizing...`
2. If not appearing, the route might not be matching
3. Verify `RequireAuth` is bypassing correctly

---

## 📝 **Next Steps**

1. **Add credentials** to `.env` file
2. **Restart dev server**
3. **Check console** for initialization logs
4. **Visit host URL** directly to verify it loads
5. **Check Plasmic Studio** - should connect automatically

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Auth bypass working, waiting for credentials setup
