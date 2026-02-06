# 🧪 Plasmic Setup Test & Verification

## ✅ **Test Script Created**

A comprehensive test utility has been added at `ai2-core-app/client/src/utils/test-plasmic-setup.ts`.

### **How to Run Tests**

#### **Option 1: Browser Console (Recommended)**
1. Start dev server: `npm start`
2. Open browser console (F12)
3. Run one of these commands:

```javascript
// Quick test (fast check)
window.quickPlasmicTest()

// Full test suite (comprehensive)
window.testPlasmicSetup()
```

#### **Option 2: Navigate to Host Route**
1. Navigate to: `http://localhost:3000/#/plasmic-host`
2. Check console for:
   - `🔍 PlasmicHost: Component mounted`
   - `✅ PlasmicCanvasHost: Rendering canvas host for Studio connection`
   - `✅ Plasmic loader initialized for Studio connection`

---

## 📋 **Test Checklist**

### **Test 1: Environment Variables** ✅
- [ ] `REACT_APP_PLASMIC_PROJECT_ID` is set
- [ ] `REACT_APP_PLASMIC_API_TOKEN` is set
- [ ] Both variables are non-empty
- [ ] No placeholder values (e.g., "your-project-id")

### **Test 2: PLASMIC Loader Initialization** ✅
- [ ] `PLASMIC` object is not null
- [ ] Loader has `registerComponent` method
- [ ] Initialization logs appear in console

### **Test 3: Component Registration** ✅
- [ ] Components are registered with PLASMIC loader
- [ ] Registration logs appear: `✅ Material-UI components registered`
- [ ] 11 components registered (Card, Typography, Box, Grid, Button, TextField, Paper, Container, Stack, Chip, Alert)

### **Test 4: Host Route** ✅
- [ ] Route `/plasmic-host` is accessible
- [ ] No authentication redirects
- [ ] `PlasmicCanvasHost` component renders
- [ ] URL normalization works (handles malformed URLs)

### **Test 5: Plasmic Studio Connection** ✅
- [ ] Studio can connect to `http://localhost:3000/#/plasmic-host`
- [ ] Components appear in Studio component panel
- [ ] No CORS errors
- [ ] Canvas loads successfully

---

## 🔍 **Verification Against Plasmic Docs**

### **✅ Setup Matches Official Documentation**

According to [Plasmic App Hosting Docs](https://docs.plasmic.app/learn/app-hosting):

1. **✅ Host Page Created**
   - Route: `/plasmic-host` ✅
   - Component: `<PlasmicCanvasHost />` ✅
   - Location: `ai2-core-app/client/src/pages/PlasmicHost.tsx` ✅

2. **✅ Loader Initialized**
   - Using `initPlasmicLoader` from `@plasmicapp/loader-react` ✅
   - Preview mode enabled for Studio connection ✅
   - Location: `ai2-core-app/client/src/plasmic-init.ts` ✅

3. **✅ Components Registered**
   - Using `PLASMIC.registerComponent()` ✅
   - Components registered before host page loads ✅
   - Location: `ai2-core-app/client/src/plasmic-components.tsx` ✅

4. **✅ Codegen Mode**
   - No runtime fetching ✅
   - Static components only ✅
   - Safeguards in place ✅

---

## 🚀 **Running the Test**

### **Step 1: Ensure Dev Server is Running**
```bash
cd ai2-core-app/client
npm start
```

### **Step 2: Open Browser Console**
- Press F12 or right-click → Inspect → Console

### **Step 3: Run Test**
```javascript
// Quick check
window.quickPlasmicTest()

// Full test
window.testPlasmicSetup()
```

### **Step 4: Check Results**
Look for:
- ✅ Green checkmarks = Pass
- ❌ Red X = Fail
- ⚠️ Yellow warning = Info/Skip

---

## 📊 **Expected Test Results**

### **If Setup is Correct:**
```
🧪 Plasmic Setup Test
  ✅ Test 1: Environment Variables - PASS
  ✅ Test 2: PLASMIC Loader Initialization - PASS
  ✅ Test 3: Loader Instance Validity - PASS
  ✅ Test 4: Component Registration - PASS
  ⚠️ Test 5: Host Route Accessibility - INFO (if not on route)

📊 Test Summary
  Total Tests: 5
  ✅ Passed: 4
  ❌ Failed: 0
  ⚠️ Skipped: 1

✅ Plasmic Setup: READY
   You can now connect Plasmic Studio to: http://localhost:3000/#/plasmic-host
```

### **If Setup Has Issues:**
```
❌ Plasmic Setup: ISSUES DETECTED
   Please fix the issues above before connecting Plasmic Studio

💡 Recommendations:
  - Add REACT_APP_PLASMIC_PROJECT_ID to .env or .env.local file
  - Add REACT_APP_PLASMIC_API_TOKEN to .env or .env.local file
  - Restart dev server after adding variables
```

---

## 🔗 **Plasmic Studio Connection Steps**

After tests pass:

1. **Open Plasmic Studio**: https://studio.plasmic.app
2. **Open Your Project**
3. **Configure Host URL**:
   - Click project menu (ellipsis) → "Configure project"
   - Enter: `http://localhost:3000/#/plasmic-host`
   - Click "Confirm"
4. **Verify Connection**:
   - Project should reload
   - Components should appear in component panel
   - Canvas should load your app

---

## 🐛 **Troubleshooting**

### **Test Fails: Environment Variables**
**Solution:**
1. Check `.env` or `.env.local` in `ai2-core-app/client/`
2. Verify variables are set (no quotes needed)
3. Restart dev server

### **Test Fails: PLASMIC Loader**
**Solution:**
1. Check console for initialization errors
2. Verify credentials are correct
3. Check `plasmic-init.ts` for errors

### **Test Fails: Component Registration**
**Solution:**
1. Check `plasmic-components.tsx` is imported
2. Verify `PLASMIC` is not null when components register
3. Check console for registration errors

### **CORS Errors**
**Solution:**
1. Backend already configured for `localhost:3003`
2. Check backend logs for CORS origin checks
3. Set `DEBUG_CORS=true` in backend `.env` for detailed logs

---

## 📝 **Next Steps After Tests Pass**

1. ✅ Connect Plasmic Studio to localhost
2. ✅ Verify components appear in Studio
3. ✅ Test visual editing
4. ✅ Sync changes: `npx plasmic sync` (when ready)

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Test utility created, ready for verification
