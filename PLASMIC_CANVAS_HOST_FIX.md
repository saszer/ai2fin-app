# 🔧 Plasmic CanvasHost Not Loading - Complete Fix

## 🐛 Issues Found

### **1. PlasmicCanvasHost Implementation**
- Current: Wrapped in `<div>` with styling
- **Issue**: Plasmic docs state: "Do not include any other elements or content on the app-hosting page"
- **Fix**: Return `PLASMIC && <PlasmicCanvasHost />` directly

### **2. Component Registration**
- Components registered with `registerComponent` from `@plasmicapp/host`
- **Status**: ✅ Correct for codegen mode
- Components should appear in Studio component panel

### **3. Loader Initialization**
- Loader initialized with `initPlasmicLoader`
- **Status**: ✅ Correct
- Using `preview: true` for Studio connection

### **4. Missing Callbacks/Event Handlers**
- No explicit error handling for Studio connection
- **Potential Issue**: Studio might not be able to communicate with host

---

## ✅ Fixes Applied

### **Fix 1: Simplified PlasmicCanvasHost Rendering**

**File:** `src/pages/PlasmicHost.tsx`

**Before:**
```tsx
return (
  <div style={{ width: '100%', height: '100vh', position: 'relative', zIndex: 9999 }}>
    <PlasmicCanvasHost />
  </div>
);
```

**After:**
```tsx
// PlasmicCanvasHost must be the ONLY content on this page
// According to Plasmic docs: "Do not include any other elements or content"
return PLASMIC ? <PlasmicCanvasHost /> : null;
```

**Why:**
- Plasmic Studio expects a clean canvas
- Extra DOM elements can interfere with Studio's iframe communication
- Official docs explicitly state: "no other elements or content"

---

## 🔍 Additional Debugging Steps

### **1. Verify Host URL is Accessible**

Visit directly in browser:
```
http://localhost:3003/#/plasmic-host
```

**Expected:**
- Blank white page (this is correct - it's the canvas)
- No errors in console
- No redirects

**If you see:**
- Login page → Auth bypass not working
- Error message → Check credentials
- Loading spinner → Check PLASMIC initialization

### **2. Check Console Logs**

Look for:
- ✅ `Plasmic loader initialized for Studio connection`
- ✅ `Material-UI components registered for Plasmic Studio`
- ❌ Any CORS errors
- ❌ Any network errors
- ❌ Any React errors

### **3. Verify Plasmic Studio Configuration**

In Plasmic Studio:
1. Go to **Project Settings** (ellipsis menu)
2. Find **"App Host URL"** or **"Host URL"**
3. Should be: `http://localhost:3003/#/plasmic-host`
   - Or: `http://localhost:3000/#/plasmic-host` if using port 3000

### **4. Check Environment Variables**

Verify in `.env` file:
```bash
REACT_APP_PLASMIC_PROJECT_ID=your-project-id
REACT_APP_PLASMIC_API_TOKEN=your-api-token
```

**To get credentials:**
1. **Project ID**: From Plasmic Studio URL: `studio.plasmic.app/projects/PROJECT_ID`
2. **API Token**: Plasmic Studio → Toolbar → "Code" button → Copy token

### **5. Test Component Registration**

After fixes, components should appear in Plasmic Studio:
1. Open Plasmic Studio
2. Click **"+"** to add component
3. Look for **"Code Components"** section
4. Should see: `MUICard`, `MUITypography`, `MUIBox`, etc.

---

## 🎯 Common Issues & Solutions

### **Issue: Blank Screen in Studio**

**Causes:**
1. Host URL not accessible (CORS, auth redirect)
2. Loader not initialized (missing credentials)
3. Components not registered
4. Network errors

**Solutions:**
1. ✅ Verify auth bypass works (visit host URL directly)
2. ✅ Check console for initialization logs
3. ✅ Verify credentials are set
4. ✅ Check network tab for failed requests

### **Issue: "Host app is taking a while to load"**

**Causes:**
1. Host URL incorrect
2. Host not accessible (auth redirect, CORS)
3. Loader initialization failed
4. Network timeout

**Solutions:**
1. ✅ Verify host URL in Studio settings matches actual URL
2. ✅ Visit host URL directly - should see blank page
3. ✅ Check console for errors
4. ✅ Verify port matches (3000 vs 3003)

### **Issue: Components Not Appearing in Studio**

**Causes:**
1. Components not registered
2. Registration happens after Studio loads
3. Import path incorrect

**Solutions:**
1. ✅ Verify `plasmic-components.tsx` is imported in `PlasmicHost.tsx`
2. ✅ Check console for registration logs
3. ✅ Verify `importPath` in component registration

---

## 📝 Next Steps

1. **Apply the fix** (simplified PlasmicCanvasHost rendering)
2. **Restart dev server** to pick up changes
3. **Visit host URL directly** to verify it loads
4. **Check Plasmic Studio** - should connect automatically
5. **Verify components** appear in Studio component panel

---

## 🔗 Official Documentation References

- [Host Plasmic Studio in your app](https://docs.plasmic.app/learn/app-hosting)
- [Get started with plain React](https://docs.plasmic.app/learn/react-quickstart)
- [Common issues](https://docs.plasmic.app/learn/common-issues/)
- [Development troubleshooting](https://docs.plasmic.app/learn/development-troubleshooting)

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Fix applied, ready for testing
