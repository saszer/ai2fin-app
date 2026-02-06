# 🔧 Plasmic Studio Connection Fix

## 🐛 **Issue: "Looks like the host app is taking a while to load"**

### **Root Causes Found:**

1. ✅ **Code is correct** - Implementation matches Plasmic docs
2. ⚠️ **Missing Studio Configuration** - Host must be trusted in Plasmic Studio
3. ⚠️ **Possible URL Mismatch** - Studio Host URL must match exactly

---

## ✅ **Fix 1: Verify Trusted Hosts**

**CRITICAL:** Plasmic Studio requires hosts to be in the "trusted hosts" list.

**Steps:**
1. Open Plasmic Studio: https://studio.plasmic.app
2. Open your project
3. Go to: **Project Settings** (ellipsis menu → "Configure project")
4. Find: **"Trusted Hosts"** section
5. Add: `http://localhost:3000` (or your dev server URL)
6. Save settings

**Without this, Studio will NOT connect to your host!**

---

## ✅ **Fix 2: Verify Host URL Configuration**

**In Plasmic Studio:**
1. Go to: **Project Settings** → **"Host URL"**
2. Set to: `http://localhost:3000/#/plasmic-host`
3. **Important:** Include the `#` if using HashRouter
4. **Important:** Use `http://` not `https://` for localhost
5. Save settings

---

## ✅ **Fix 3: Test Direct Access**

**Before connecting from Studio:**
1. Open browser: `http://localhost:3000/#/plasmic-host`
2. **Expected:** Blank white page (this is correct!)
3. **If you see:**
   - Login page → Auth bypass not working
   - Error message → Check credentials
   - Loading spinner → Check PLASMIC initialization

---

## ✅ **Fix 4: Code Updates Applied**

### **Updated PlasmicHost.tsx:**
- ✅ Match official docs pattern: `PLASMIC && <PlasmicCanvasHost />`
- ✅ Added explicit null check before render
- ✅ Enhanced logging for debugging

---

## 🔍 **Debugging Checklist**

### **1. Check Console Logs**

When accessing `/plasmic-host`, you should see:
```
✅ Plasmic loader initialized for Studio connection
✅ Material-UI components registered with PLASMIC loader
✅ PlasmicCanvasHost: Rendering canvas host for Studio connection
```

**If you see:**
- ❌ "PLASMIC loader not initialized" → Check env vars
- ❌ "Components will NOT be available" → Check registration
- ❌ "Not Configured" → Missing credentials

---

### **2. Verify Environment Variables**

**File:** `ai2-core-app/client/.env`

```env
REACT_APP_PLASMIC_PROJECT_ID=your-project-id
REACT_APP_PLASMIC_API_TOKEN=your-api-token
```

**After adding:**
- ✅ Restart dev server (`npm start`)
- ✅ Check console for initialization logs

---

### **3. Test Connection from Studio**

**Steps:**
1. Plasmic Studio → Project Settings → Host URL
2. Set: `http://localhost:3000/#/plasmic-host`
3. Click "Test Connection" (if available)
4. Open project in Studio
5. Should connect automatically

---

## 🎯 **Most Common Issues**

### **Issue 1: Host Not Trusted**
**Symptom:** "Looks like the host app is taking a while to load"
**Fix:** Add host to trusted hosts in Studio settings

### **Issue 2: URL Mismatch**
**Symptom:** Studio can't find host
**Fix:** Verify Host URL matches exactly (including `#` for HashRouter)

### **Issue 3: CORS/Network**
**Symptom:** Connection blocked
**Fix:** Check browser console for CORS errors, verify localhost:3000 is accessible

### **Issue 4: Missing Credentials**
**Symptom:** "Not Configured" message
**Fix:** Set env vars and restart dev server

---

## ✅ **Verification Steps**

1. ✅ Direct access works: `http://localhost:3000/#/plasmic-host` shows blank page
2. ✅ Console shows: "Plasmic loader initialized"
3. ✅ Console shows: "Components registered"
4. ✅ Studio settings: Host URL configured
5. ✅ Studio settings: Host is trusted
6. ✅ Studio connects successfully

---

## 📝 **Next Steps**

If still not working:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Try different browser
4. Try `?debug=true` in Studio URL
5. Check Plasmic Studio status page

---

**Last Updated:** 2026-01-25  
**Status:** Code is correct - likely Studio configuration issue
