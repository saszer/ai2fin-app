# 🔧 Plasmic Studio Setup Fix

## ❓ Problem

Plasmic Studio fails to connect to the host app. The issue is that **even in Codegen mode**, you need to initialize the Plasmic loader for Studio to work.

---

## ✅ Solution

According to the [official Plasmic docs](https://docs.plasmic.app/learn/registering-code-components/), you need:

1. **`initPlasmicLoader`** - Initialize Plasmic with your project credentials
2. **`PlasmicCanvasHost`** - Render this component on the host page
3. **Component registration** - Register components using `registerComponent`

---

## 🔧 What I Fixed

### **1. Created `plasmic-init.ts`**

This file initializes the Plasmic loader **ONLY for Studio connection** (development). Production code uses static generated components.

**Location:** `ai2-core-app/client/src/plasmic-init.ts`

**Key points:**
- Only initializes if credentials are provided
- Uses `preview: true` for Studio connection
- Logs helpful messages in development

### **2. Updated `PlasmicHost.tsx`**

- Imports `PLASMIC` from `plasmic-init.ts`
- Conditionally renders `PlasmicCanvasHost` only if `PLASMIC` is initialized
- Shows helpful error message if credentials are missing

### **3. Component Registration**

Already correct - using `registerComponent` from `@plasmicapp/host` ✅

---

## 📋 Next Steps

### **Step 1: Get Your Credentials**

1. **Project ID:**
   - Go to: https://studio.plasmic.app
   - Open your project
   - Look at the URL: `https://studio.plasmic.app/projects/YOUR_PROJECT_ID`
   - Copy `YOUR_PROJECT_ID`

2. **API Token:**
   - In Plasmic Studio, click **"Code"** button (top toolbar)
   - Copy the **"Public API Token"**

### **Step 2: Set Environment Variables**

Create or update `.env` file in `ai2-core-app/client/`:

```bash
REACT_APP_PLASMIC_PROJECT_ID=your_project_id_here
REACT_APP_PLASMIC_API_TOKEN=your_api_token_here
```

**Important:** Add `.env` to `.gitignore` to keep credentials secure!

### **Step 3: Restart Dev Server**

```bash
cd ai2-core-app/client
npm start
```

### **Step 4: Test Host Page**

1. Open: `http://localhost:3000/plasmic-host`
2. Should see Plasmic Studio interface (not error message)

### **Step 5: Configure Plasmic Studio**

1. Go to: https://studio.plasmic.app
2. Open your project
3. Go to **Settings** → **Host URL**
4. Set to: `http://localhost:3000/plasmic-host`
5. Save

### **Step 6: Register Components**

1. In Plasmic Studio, go to **"Code Components"** panel
2. Click **"Register"** or **"From localhost"**
3. Components from `src/plasmic-components.tsx` should appear
4. Select and register the components you want to use

---

## 🔒 Security Notes

### **Codegen Mode (What We're Using):**

- ✅ **Production:** Uses static generated components (no runtime fetching)
- ✅ **Development:** Uses loader ONLY for Studio connection
- ✅ **Credentials:** Only needed for Studio (development)
- ✅ **No user data:** Studio connection is development-only

### **Environment Variables:**

- ✅ Only set in `.env` (not committed to git)
- ✅ Only used for Studio connection
- ✅ Not needed in production builds

---

## 🎯 Expected Behavior

### **With Credentials:**
- `/plasmic-host` shows Plasmic Studio interface
- Studio can connect and discover components
- Components appear in Studio's component panel

### **Without Credentials:**
- `/plasmic-host` shows helpful error message
- Lists required environment variables
- Explains that credentials are only for Studio

---

## 🔍 Troubleshooting

### **"Plasmic Studio Not Configured"**

**Cause:** Missing environment variables

**Fix:**
1. Check `.env` file exists in `ai2-core-app/client/`
2. Verify `REACT_APP_PLASMIC_PROJECT_ID` is set
3. Verify `REACT_APP_PLASMIC_API_TOKEN` is set
4. Restart dev server (`npm start`)

### **"Can't connect to localhost"**

**Cause:** Dev server not running or wrong URL

**Fix:**
1. Make sure `npm start` is running
2. Verify app is at `http://localhost:3000`
3. Check Plasmic Studio Host URL setting

### **"No components found"**

**Cause:** Components not registered or not imported

**Fix:**
1. Verify `src/plasmic-components.tsx` exists
2. Check that it's imported in `PlasmicHost.tsx`
3. Make sure `registerComponent` calls are correct
4. Refresh Plasmic Studio

---

## 📚 References

- [Official Docs: Registering Code Components](https://docs.plasmic.app/learn/registering-code-components/)
- [Official Docs: App Hosting](https://docs.plasmic.app/learn/app-hosting)
- [Official Docs: Codegen Guide](https://docs.plasmic.app/learn/codegen-guide)

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Fixed - Proper initialization for Codegen mode
