# 🔍 Plasmic Environment Variables - Diagnostic Guide

## ✅ **Enhanced Error Logging Added**

I've added comprehensive error logging and diagnostics to help identify why Plasmic isn't initializing even when environment variables are set.

---

## 🔧 **What Was Added**

### **1. Enhanced Logging in `plasmic-init.ts`**
- Detailed credential checks with character counts
- Try-catch error handling around initialization
- Lists all PLASMIC-related environment variables
- Shows exact error messages and stack traces if initialization fails

### **2. New Diagnostic Utility (`utils/plasmic-diagnostics.ts`)**
- Comprehensive diagnostic function that checks:
  - Environment variable existence
  - Empty values
  - Placeholder values
  - Whitespace issues
  - All REACT_APP_ variables
- Provides actionable recommendations
- Logs formatted diagnostic report

### **3. Enhanced Logging in `PlasmicHost.tsx`**
- Checks environment variables directly at component mount
- Shows PLASMIC loader state and type
- Compares env vars from different sources

---

## 📋 **What to Check Now**

### **1. Restart Dev Server**
Environment variables are only loaded when the server starts:
```bash
# Stop current server (Ctrl+C)
npm start
```

### **2. Check Console Logs**
After restart, you should see:
```
🔍 Plasmic Init: Starting initialization check...
   REACT_APP_PLASMIC_PROJECT_ID: abc12345... (24 chars)
   REACT_APP_PLASMIC_API_TOKEN: SET (64 chars)
   All PLASMIC env vars: ['REACT_APP_PLASMIC_PROJECT_ID=SET', 'REACT_APP_PLASMIC_API_TOKEN=SET']

🔍 Plasmic Diagnostics
  Environment Variables
    REACT_APP_PLASMIC_PROJECT_ID: { exists: true, length: 24, preview: 'abc12345...' }
    REACT_APP_PLASMIC_API_TOKEN: { exists: true, length: 64, preview: 'SET (hidden)' }
  ...
```

### **3. Common Issues to Look For**

#### **Issue: Variables show as "MISSING"**
**Cause:** Variables not in correct file or server not restarted

**Solution:**
- Check `.env` or `.env.local` in `ai2-core-app/client/`
- Variables must start with `REACT_APP_`
- No spaces around `=`
- Restart dev server

#### **Issue: Variables show but length is 0**
**Cause:** Empty values or whitespace-only values

**Solution:**
- Check for quotes around values (should be: `REACT_APP_PLASMIC_PROJECT_ID=abc123`, not `REACT_APP_PLASMIC_PROJECT_ID="abc123"`)
- Remove leading/trailing whitespace
- Ensure no empty lines between variable name and value

#### **Issue: "Failed to initialize loader" error**
**Cause:** Invalid credentials or network issue

**Solution:**
- Check error message in console
- Verify Project ID format (should be alphanumeric, no spaces)
- Verify API Token format (should be long string, no spaces)
- Check network connectivity

#### **Issue: Variables exist but PLASMIC is still null**
**Cause:** Initialization error caught in try-catch

**Solution:**
- Check console for error message and stack trace
- Verify credentials are valid in Plasmic Studio
- Check if `initPlasmicLoader` is throwing an error

---

## 🔍 **Diagnostic Output Explained**

The diagnostic utility will show:

1. **Environment Variables Section:**
   - `exists`: Whether variable is defined
   - `length`: Character count (0 = empty)
   - `preview`: First 8 chars (for Project ID) or "SET (hidden)" (for token)

2. **Errors Section:**
   - Lists all detected problems
   - Specific issues like "missing", "empty", "placeholder", "whitespace"

3. **Recommendations Section:**
   - Actionable steps to fix issues
   - Reminders about server restart

---

## 📝 **Next Steps**

1. **Restart dev server** (required for env vars to load)
2. **Check console** for diagnostic output
3. **Review errors** section for specific issues
4. **Follow recommendations** to fix any problems
5. **Verify initialization** - should see `✅ Plasmic Init: Loader initialized successfully`

---

## 🐛 **If Still Not Working**

If diagnostics show variables are set but initialization still fails:

1. **Check error message** in console (from try-catch)
2. **Verify credentials** in Plasmic Studio:
   - Project ID: From URL (`studio.plasmic.app/projects/PROJECT_ID`)
   - API Token: From "Code" button in toolbar
3. **Check network** - initialization might fail if can't reach Plasmic servers
4. **Check browser console** for any CORS or network errors

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Enhanced error logging and diagnostics added
