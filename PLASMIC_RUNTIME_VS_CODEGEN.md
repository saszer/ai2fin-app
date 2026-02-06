# ⚠️ Critical: Runtime Fetching vs Codegen

## ❓ Your Question: "Does each user make a call to Plasmic?"

**Short Answer:** 
- **Headless API (current setup)**: ✅ YES - Each user's browser fetches from Plasmic CDN
- **Codegen approach**: ❌ NO - Designs are static code, zero runtime fetching

---

## 🎯 The Two Approaches

### Approach 1: Headless API (What You Have Now)

**How it works:**
```
Every User's Browser:
┌─────────────────────────────────────┐
│  User visits your app               │
│  → Browser fetches from Plasmic CDN │
│  → Caches in browser memory         │
│  → Renders component                │
└─────────────────────────────────────┘
```

**Who makes the call:**
- ✅ **Every user's browser** (first load)
- ✅ **Production users** (not just dev)
- ✅ **All environments** (dev, staging, prod)

**Network activity:**
- Each user's first page load: 1-2 requests to Plasmic CDN
- After that: Cached (no more requests for that session)
- Page refresh: 1-2 requests again

**Privacy implications:**
- Each user's browser contacts Plasmic's servers
- Plasmic sees: Project ID, API token, component name
- Plasmic does NOT see: User data, business logic, sensitive info

---

### Approach 2: Codegen (Alternative - Zero Runtime Fetching)

**How it works:**
```
Development:
┌─────────────────────────────────────┐
│  You design in Plasmic Studio       │
│  → Run: npx plasmic sync            │
│  → Generates React code files       │
│  → Code committed to your repo      │
└─────────────────────────────────────┘

Production:
┌─────────────────────────────────────┐
│  User visits your app               │
│  → Loads static React code           │
│  → NO calls to Plasmic              │
│  → Zero external dependencies       │
└─────────────────────────────────────┘
```

**Who makes the call:**
- ❌ **NO user browsers** (zero runtime fetching)
- ✅ **Only YOU** (during development, when syncing)
- ✅ **Static code** in your repo

**Network activity:**
- Users: 0 requests to Plasmic (ever)
- You: Only when running `npx plasmic sync`
- Production: Completely offline-capable

**Privacy implications:**
- Users never contact Plasmic
- Designs are static code in your repo
- Maximum privacy and control

---

## 🔍 Current Setup Analysis

### Your Current Configuration:

```typescript
// ai2-core-app/client/src/plasmic-init.ts
export const PLASMIC = initPlasmicLoader({
  projects: [...],
  preview: process.env.NODE_ENV === 'development',
});
```

**What `preview: true/false` means:**
- `preview: true` (dev): Fetches latest designs (even unpublished)
- `preview: false` (prod): Fetches only published designs
- **Both still fetch at runtime** - just different versions!

**Current behavior:**
- ✅ Development: Each page load fetches from Plasmic
- ✅ Production: Each user's first page load fetches from Plasmic
- ✅ All users: Make network calls to Plasmic CDN

---

## 📊 Comparison Table

| Aspect | Headless API (Current) | Codegen (Alternative) |
|--------|------------------------|----------------------|
| **User fetches?** | ✅ Yes (first load) | ❌ No (never) |
| **Production calls?** | ✅ Yes | ❌ No |
| **Network dependency?** | ⚠️ Yes (first load) | ❌ No |
| **Offline capable?** | ❌ No (needs network) | ✅ Yes |
| **Privacy (users)?** | ⚠️ Users contact Plasmic | ✅ No contact |
| **Update workflow** | Auto (publish in Plasmic) | Manual (`npx plasmic sync`) |
| **Generated files?** | ❌ No | ✅ Yes (in repo) |

---

## 🚨 For Your Financial App

### Current Setup (Headless API):

**What happens:**
1. User opens your app
2. User's browser fetches design from Plasmic CDN
3. Design cached in browser
4. User sees your app

**Privacy concerns:**
- ⚠️ Each user's browser contacts Plasmic
- ⚠️ Plasmic sees: Project ID, API token, component names
- ✅ Plasmic does NOT see: User data, transactions, business logic
- ✅ Your backend API calls stay private

**Performance:**
- ✅ Fast after first load (cached)
- ⚠️ Requires network on first load
- ⚠️ ~100-500ms delay on first page load

---

### Codegen Approach (Recommended for Financial Apps):

**What happens:**
1. You design in Plasmic Studio
2. You run `npx plasmic sync` (generates code)
3. Code committed to your repo
4. Users load static code (zero Plasmic calls)

**Privacy benefits:**
- ✅ Users never contact Plasmic
- ✅ Zero external dependencies
- ✅ Maximum privacy
- ✅ Works offline

**Performance:**
- ✅ Instant (no network calls)
- ✅ No external dependencies
- ✅ Better for financial apps

**Trade-off:**
- ⚠️ Need to sync manually when designs change
- ⚠️ Generated files in repo (but manageable)

---

## 🔄 How to Switch to Codegen

### Step 1: Install Codegen Package

```bash
cd ai2-core-app/client
npm install @plasmicapp/cli --save-dev
```

### Step 2: Initialize Codegen

```bash
npx plasmic init
```

This will:
- Ask for your Project ID and API Token
- Create a `plasmic.json` config file
- Set up codegen workflow

### Step 3: Sync Designs to Code

```bash
npx plasmic sync
```

This generates:
- `src/plasmic/` folder with React components
- Static code files (no runtime fetching)

### Step 4: Update Your Code

**Remove Headless API:**
```typescript
// Remove this:
import { initPlasmicLoader } from '@plasmicapp/loader-react';
export const PLASMIC = initPlasmicLoader({...});
```

**Use Generated Components:**
```typescript
// Instead, import generated components:
import { PlasmicYourComponent } from './plasmic/your_component';
```

### Step 5: Update Routes

```typescript
// Instead of PlasmicHost with loader:
import { PlasmicYourPage } from './plasmic/your_page';

<Route path="/your-page" element={<PlasmicYourPage />} />
```

---

## 🎯 Recommendation for Financial App

### For Maximum Privacy & Control:

**Switch to Codegen** because:
1. ✅ Users never contact Plasmic
2. ✅ Zero runtime dependencies
3. ✅ Better for financial/regulated apps
4. ✅ Works offline
5. ✅ Full control over code

**Workflow:**
1. Design in Plasmic Studio (visual editing)
2. Run `npx plasmic sync` (generates code)
3. Review generated code
4. Commit to repo
5. Deploy (users get static code)

---

## 📋 Decision Matrix

### Use Headless API if:
- ✅ Non-technical team needs to publish designs
- ✅ Designs change frequently
- ✅ You want designs to update without code changes
- ⚠️ Privacy is less critical

### Use Codegen if:
- ✅ Maximum privacy required (financial apps)
- ✅ Users shouldn't contact external services
- ✅ Offline capability needed
- ✅ You want full control over generated code
- ✅ You're okay with manual sync workflow

---

## 🔧 Quick Fix: Keep Headless but Optimize

If you want to keep Headless API but minimize calls:

### Option 1: Pre-fetch on Server

```typescript
// Server-side rendering or pre-fetch
// Fetch designs once, serve to all users
```

### Option 2: Service Worker Cache

```typescript
// Cache Plasmic responses aggressively
// Users fetch once, cache forever
```

### Option 3: Hybrid Approach

```typescript
// Use Codegen for production
// Use Headless for development
```

---

## 🎯 Summary

### Your Current Setup (Headless API):

**Answer:** ✅ YES - Each user's browser fetches from Plasmic CDN

- **Development**: You fetch on each page load
- **Production**: Each user fetches on first page load
- **Cached**: After first fetch, no more calls (until refresh)

### If You Want Zero User Calls:

**Switch to Codegen:**
- Users: Never contact Plasmic
- You: Only sync during development
- Production: Static code, zero external calls

---

## 💡 My Recommendation

For a **financial app**, I recommend **Codegen** because:
1. Users never contact Plasmic (better privacy)
2. Zero runtime dependencies (more secure)
3. Works offline (better reliability)
4. Full control over code (better for audits)

The trade-off (manual sync) is worth it for financial apps.

---

**Would you like me to switch your setup to Codegen?** It's a straightforward change that gives you zero runtime fetching for users.

---

**Last Updated:** 2026-01-24  
**Current Setup:** Headless API (runtime fetching)  
**Recommended:** Codegen (zero runtime fetching)
