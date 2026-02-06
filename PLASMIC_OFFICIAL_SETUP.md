# ✅ Plasmic Setup - Updated to Match Official Docs

## 📚 Based on Official Documentation

Following: https://docs.plasmic.app/learn/react-quickstart/

---

## 🔄 What Changed

### Before (Our Initial Setup):
- Used `@plasmicapp/react-web` (Codegen approach)
- Direct `PLASMIC` import

### After (Official Approach):
- Using `@plasmicapp/loader-react` (Headless API - recommended)
- Using `initPlasmicLoader` to initialize
- Proper environment variable support

---

## ✅ Current Setup (Updated)

### 1. Packages Installed:
- ✅ `@plasmicapp/loader-react` - For Headless API (recommended)
- ✅ `@plasmicapp/loader-nextjs` - Already installed (includes loader-react)

### 2. Initialization (`plasmic-init.ts`):
```typescript
import { initPlasmicLoader } from '@plasmicapp/loader-react';

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: process.env.REACT_APP_PLASMIC_PROJECT_ID || '',
      token: process.env.REACT_APP_PLASMIC_PROJECT_API_TOKEN || '',
    },
  ],
  preview: process.env.NODE_ENV === 'development',
});
```

### 3. Component Registration:
- ✅ Material-UI components registered
- ✅ Uses `PLASMIC.registerComponent()` (same API)

### 4. Host Page:
- ✅ Uses `PlasmicCanvasHost` from `@plasmicapp/loader-react`
- ✅ Route: `/plasmic-host`

---

## 🔑 Environment Variables

### For Create React App:

Add to `ai2-core-app/client/.env`:

```env
# Required prefix for Create React App
REACT_APP_PLASMIC_PROJECT_ID=your-project-id-here
REACT_APP_PLASMIC_PROJECT_API_TOKEN=your-api-token-here
```

**Important:** Create React App requires `REACT_APP_` prefix for environment variables to be accessible in the browser!

---

## 🎯 How It Works Now

### Headless API Approach (What We're Using):

```
┌─────────────────────────────────────┐
│  Plasmic Studio (Cloud)             │
│  - Your designs stored here         │
│  - Visual editor                    │
└──────────────┬──────────────────────┘
               │
               │ Fetches designs
               │ at runtime
               ▼
┌─────────────────────────────────────┐
│  Your React App                     │
│  - Uses @plasmicapp/loader-react    │
│  - Fetches designs dynamically      │
│  - Renders with PlasmicComponent    │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Designs update without code changes
- ✅ Non-technical team can publish changes
- ✅ No generated code in repo
- ✅ Simpler workflow

---

## 📋 Complete Setup Checklist

### ✅ Already Done:
- [x] Installed `@plasmicapp/loader-react`
- [x] Created `plasmic-init.ts` with proper initialization
- [x] Registered Material-UI components
- [x] Created `PlasmicHost.tsx` page
- [x] Added route in `App.tsx`
- [x] Updated to use official API

### ⚠️ Still Need:
- [ ] Sign up at plasmic.app
- [ ] Create project
- [ ] Get Project ID (from URL)
- [ ] Get API Token (from "Code" button)
- [ ] Add to `.env` with `REACT_APP_` prefix
- [ ] Start app and visit `/plasmic-host`

---

## 🔧 Configuration in Plasmic Studio

After you add credentials and start your app:

1. **Open Plasmic Studio**: https://studio.plasmic.app
2. **Click project menu** (top-left)
3. **Select "Configure project"**
4. **Set host URL**: `http://localhost:3000/plasmic-host`
5. **Save**

This connects Plasmic Studio to your local app so it can see your registered components!

---

## 🎨 Usage

### Visual Editing:
1. Visit `/plasmic-host` in your running app
2. Plasmic Studio loads
3. Drag Material-UI components
4. Design visually
5. Use as reference for your code

### Rendering Plasmic Designs (Optional):

If you create designs in Plasmic and want to render them:

```typescript
import { PlasmicRootProvider, PlasmicComponent } from '@plasmicapp/loader-react';
import { PLASMIC } from './plasmic-init';

function MyPage() {
  return (
    <PlasmicRootProvider loader={PLASMIC}>
      <PlasmicComponent component="YourComponentName" />
    </PlasmicRootProvider>
  );
}
```

---

## 📚 Official Documentation

- **Quickstart**: https://docs.plasmic.app/learn/react-quickstart/
- **Code Components**: https://docs.plasmic.app/learn/code-components
- **Loader vs Codegen**: https://docs.plasmic.app/learn/loader-vs-codegen

---

## 🎯 Summary

**What We're Using:**
- ✅ `@plasmicapp/loader-react` (Headless API - recommended)
- ✅ `initPlasmicLoader` for initialization
- ✅ Environment variables with `REACT_APP_` prefix
- ✅ Material-UI components registered
- ✅ Visual editor at `/plasmic-host`

**Workflow:**
1. Design visually in Plasmic
2. Use as reference
3. Implement manually in your code
4. (Optional) Render Plasmic designs directly

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Updated to match official docs  
**Approach:** Headless API (recommended)
