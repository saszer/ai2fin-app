# 🔒 Plasmic Host Setup - Codegen Mode

## ✅ Setup Complete

The `/plasmic-host` route has been configured for Plasmic Studio connection in **Codegen mode**.

---

## 🎯 What URL to Use in Plasmic Studio

**Host URL:** `http://localhost:3000/plasmic-host`

### How to Configure:
1. Open **Plasmic Studio**: https://studio.plasmic.app
2. Open your project
3. Click **project menu** (top-left, project name)
4. Select **"Configure project"** or **"Settings"**
5. Find **"Host URL"** or **"Development URL"** setting
6. Set to: `http://localhost:3000/plasmic-host`
7. **Save**

---

## 🔒 Security Analysis

### ✅ Is It Safe? **YES** - Here's Why:

#### 1. **Development Only**
- Route is **disabled in production** (returns error message)
- Only accessible when `NODE_ENV === 'development'`
- Never exposed to end users

#### 2. **Codegen Mode Benefits**
- ✅ **Zero runtime fetching** - Users never contact Plasmic
- ✅ **Static code only** - Components generated in your repo
- ✅ **Offline capable** - No external dependencies
- ✅ **Maximum privacy** - Perfect for financial apps

#### 3. **What Plasmic Can See**
- ✅ **Only during development** - When you're designing
- ✅ **Only registered components** - What you explicitly export
- ✅ **Component structure** - Props, types, structure
- ❌ **NO user data** - Never sent to Plasmic
- ❌ **NO business logic** - Stays in your app
- ❌ **NO database access** - Never accessed

#### 4. **Component Registration**
- Only components in `src/plasmic-components.tsx` are registered
- Currently: **Only Material-UI components** (safe, generic UI)
- **NOT registered**: Dashboard, Transactions, Bills, User data components

#### 5. **Trust Model**
- Plasmic marks your host URL as "trusted" when you add it
- You control what components are registered
- You can view/modify trusted hosts in Plasmic Studio settings

---

## 📋 Complete Setup Steps

### Step 1: Start Your Dev Server

```bash
cd ai2-core-app/client
npm start
```

App runs at: `http://localhost:3000`

### Step 2: Configure Plasmic Studio

1. Open: https://studio.plasmic.app
2. Open your project
3. Settings → **Host URL**: `http://localhost:3000/plasmic-host`
4. Save

### Step 3: Register Components

1. In Plasmic Studio, go to **"Code Components"** (left sidebar)
2. Click **"Register"** → **"From localhost"**
3. Plasmic connects to `http://localhost:3000/plasmic-host`
4. Discovers components from `src/plasmic-components.tsx`
5. Click **"Register"** for each component you want to use

### Step 4: Start Designing!

- Drag components from left panel
- Edit properties visually
- Use AI to style
- Save designs

### Step 5: Sync to Code

```bash
cd ai2-core-app/client
npx plasmic sync
```

Generates static components in `src/plasmic/` (no runtime fetching!)

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Use `/plasmic-host` only in development
- ✅ Only register generic UI components (Material-UI)
- ✅ Keep business pages unregistered
- ✅ Review what's registered regularly
- ✅ Use Codegen mode (current setup)

### ❌ DON'T:
- ❌ Don't register components with user data
- ❌ Don't register business pages (Dashboard, Transactions, etc.)
- ❌ Don't preview components with real user data
- ❌ Don't expose sensitive API endpoints in registered components

---

## 🔍 What's Currently Registered

**File:** `src/plasmic-components.tsx`

**Registered Components:**
- ✅ Material-UI components only (Card, Typography, Box, Grid, Button, etc.)
- ✅ Generic UI components
- ✅ Presentational components

**NOT Registered (Protected):**
- ❌ Dashboard page
- ❌ Transaction pages
- ❌ Bills page
- ❌ User data components
- ❌ Business logic components

---

## 📊 Data Flow

### Safe Scenario (Current Setup):

```
Plasmic Studio (Cloud)
    ↓
Connects to: http://localhost:3000/plasmic-host
    ↓
Reads: src/plasmic-components.tsx
    ↓
Sees: Material-UI component exports only
    ↓
Registers: Generic UI components
    ↓
✅ NO user data
✅ NO business logic
✅ NO sensitive information
```

### When You Design:

```
1. Design in Plasmic Studio (cloud)
2. Save designs
3. Run: npx plasmic sync
4. Generates static code in src/plasmic/
5. Import and use in your app
6. ✅ Users never contact Plasmic
```

---

## 🎯 Summary

**URL to Use:** `http://localhost:3000/plasmic-host`

**Is It Safe?** ✅ **YES**
- Development only (disabled in production)
- Codegen mode (zero runtime fetching)
- Only generic UI components registered
- No user data exposed
- No business logic exposed

**Security Level:** ✅ **SAFE** for financial applications

---

## 📚 References

- **Plasmic Docs**: https://docs.plasmic.app/learn/app-hosting
- **Codegen Guide**: https://docs.plasmic.app/learn/codegen-guide
- **Component Registration**: https://docs.plasmic.app/learn/registering-code-components

---

**Last Updated:** 2026-01-24  
**Mode:** Codegen (zero runtime fetching)  
**Security Status:** ✅ Safe (development only, generic components)
