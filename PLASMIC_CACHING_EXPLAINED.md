# 🔄 How Plasmic Caching Works

## ❓ Your Question: "Does it fetch from cloud every time?"

**Short Answer:** No! Designs are **cached** after the first fetch.

---

## 🎯 How It Actually Works

### Headless API Approach (What We're Using):

```
First Load:
┌─────────────────────────────────────┐
│  Your App Starts                     │
│  → Fetches design from Plasmic CDN   │
│  → Caches in memory                  │
│  → Renders component                │
└─────────────────────────────────────┘

Subsequent Renders:
┌─────────────────────────────────────┐
│  Your App Renders                   │
│  → Uses cached design (no fetch!)   │
│  → Renders immediately              │
└─────────────────────────────────────┘

Page Refresh:
┌─────────────────────────────────────┐
│  User Refreshes Page                 │
│  → Fetches again (new session)       │
│  → Caches again                      │
└─────────────────────────────────────┘
```

---

## 📊 Caching Details

### What Gets Cached:

1. **Component Data** - Cached for the **lifetime of the application**
   - First render: Fetches from Plasmic CDN
   - Subsequent renders: Uses cache (no network call)
   - Page refresh: Fetches again (new session)

2. **CDN Caching** - Plasmic uses AWS CloudFront CDN
   - Globally replicated
   - Fast delivery
   - Edge caching

3. **Browser Caching** - Your browser may also cache
   - HTTP cache headers
   - Service worker (if you have one)

### Cache Duration:

- **In-memory cache**: Lifetime of your React app (until page refresh)
- **CDN cache**: Managed by Plasmic (typically hours/days)
- **Browser cache**: Standard HTTP caching rules

---

## 🔍 When Does It Fetch?

### Fetches from Cloud:

1. ✅ **First render** of a component
2. ✅ **Page refresh** (new session)
3. ✅ **New component** not yet loaded
4. ✅ **Preview mode** (if `preview: true` in config)

### Uses Cache (No Fetch):

1. ✅ **Subsequent renders** of same component
2. ✅ **Navigation** between pages (same session)
3. ✅ **Re-renders** due to state changes
4. ✅ **Component updates** (React re-renders)

---

## ⚙️ Your Current Configuration

Looking at your `plasmic-init.ts`:

```typescript
export const PLASMIC = initPlasmicLoader({
  projects: [...],
  preview: process.env.NODE_ENV === 'development', // ⚠️ This affects caching
});
```

### Preview Mode:

- **Development** (`preview: true`):
  - Fetches latest designs (even unpublished)
  - More network calls
  - Good for development

- **Production** (`preview: false`):
  - Only fetches published designs
  - Better caching
  - More stable

---

## 🚀 Performance Impact

### Network Calls:

**First Load:**
- 1-2 HTTP requests to Plasmic CDN
- ~100-500ms (depending on design size)
- Then cached

**Subsequent Renders:**
- 0 network requests
- Instant render (from cache)
- No performance impact

**Page Refresh:**
- 1-2 HTTP requests again
- New session = new cache

### Typical Usage:

```
User visits page:
├─ First visit: 1 fetch (cached)
├─ Navigate around: 0 fetches (uses cache)
├─ Refresh page: 1 fetch (new cache)
└─ Close/reopen: 1 fetch (new session)
```

---

## 🔒 Privacy & Security

### What Gets Sent to Plasmic:

**On Fetch:**
- ✅ Project ID (public)
- ✅ API Token (public, read-only)
- ✅ Component name/route
- ❌ NO user data
- ❌ NO business logic
- ❌ NO sensitive information

**What Plasmic Returns:**
- ✅ Design data (layout, styles, structure)
- ✅ Component tree
- ❌ NO user data
- ❌ NO business logic

**Your Data:**
- ✅ Stays in your app
- ✅ Never sent to Plasmic
- ✅ API calls go directly to your backend

---

## 💡 Optimization Options

### Option 1: Production Mode (Recommended)

```typescript
preview: process.env.NODE_ENV === 'production' ? false : true
```

**Benefits:**
- Only fetches published designs
- Better CDN caching
- More stable

### Option 2: Manual Cache Control

```typescript
// Pre-fetch components on app start
useEffect(() => {
  PLASMIC.maybeFetchComponentData('/your-page');
}, []);
```

### Option 3: Static Generation (Advanced)

If you want zero runtime fetches:
- Use Codegen approach (generates code)
- Designs become static code
- No cloud fetching at all

---

## 🆚 Comparison: Headless vs Codegen

### Headless API (Current Setup):

**Fetches:**
- ✅ First load: Yes (from CDN)
- ✅ Subsequent: No (cached)
- ✅ Refresh: Yes (new session)

**Pros:**
- ✅ Designs update without code changes
- ✅ Non-technical team can publish
- ✅ No generated files

**Cons:**
- ⚠️ Requires network on first load
- ⚠️ Cache cleared on refresh

### Codegen Approach (Alternative):

**Fetches:**
- ❌ Never (code is in your repo)
- ✅ Static files
- ✅ No runtime fetching

**Pros:**
- ✅ Zero network calls
- ✅ Works offline
- ✅ Full control

**Cons:**
- ⚠️ Need to sync code manually
- ⚠️ Generated files to manage

---

## 🎯 For Your Financial App

### Current Setup (Headless API):

**Network Activity:**
- First page load: 1-2 requests to Plasmic CDN
- After that: 0 requests (cached)
- Page refresh: 1-2 requests (new session)

**Performance:**
- ✅ Fast after first load (cached)
- ✅ CDN is fast (AWS CloudFront)
- ✅ Minimal impact

**Privacy:**
- ✅ Only design data fetched
- ✅ No user data sent
- ✅ No business logic exposed

### If You Want Zero Cloud Fetches:

Switch to **Codegen approach**:
1. Design in Plasmic
2. Run `npx plasmic sync`
3. Generated code in your repo
4. No runtime fetching

---

## 📊 Real-World Example

### Typical User Session:

```
User opens app:
├─ Loads Dashboard: 1 fetch (cached)
├─ Navigates to Transactions: 0 fetches (if already loaded)
├─ Navigates to Bills: 0 fetches (if already loaded)
├─ Refreshes page: 1 fetch (new session)
└─ Closes app: Cache cleared
```

**Total fetches per session:** 1-3 (depending on pages visited)

---

## 🔧 How to Verify Caching

### Check Network Tab:

1. Open browser DevTools
2. Go to Network tab
3. Visit your app
4. Look for requests to `plasmic.app` or `cloudfront.net`
5. Refresh page
6. See: First load = requests, subsequent = cached

### Expected Behavior:

```
First Load:
  GET https://...cloudfront.net/... 200 OK (fetched)

Navigate (same session):
  (no requests - using cache)

Refresh Page:
  GET https://...cloudfront.net/... 200 OK (fetched again)
```

---

## 💡 Best Practices

### 1. Use Production Mode in Production

```typescript
preview: process.env.NODE_ENV === 'production' ? false : true
```

### 2. Pre-fetch Critical Components

```typescript
// On app start, pre-fetch main pages
useEffect(() => {
  PLASMIC.maybeFetchComponentData('/dashboard');
  PLASMIC.maybeFetchComponentData('/transactions');
}, []);
```

### 3. Monitor Performance

- Check Network tab
- Verify caching works
- Monitor load times

---

## 🎯 Summary

### Does it fetch every time?

**No!** Here's when it fetches:

| Scenario | Fetches? | Why |
|----------|----------|-----|
| First render | ✅ Yes | Need to get design |
| Subsequent renders | ❌ No | Uses cache |
| Page refresh | ✅ Yes | New session |
| Navigation | ❌ No | Uses cache |
| Component update | ❌ No | Uses cache |

### Cache Duration:

- **In-memory**: Lifetime of app session
- **CDN**: Hours/days (managed by Plasmic)
- **Browser**: Standard HTTP cache

### Performance:

- ✅ Fast after first load (cached)
- ✅ Minimal network impact
- ✅ CDN is fast (AWS CloudFront)

### Privacy:

- ✅ Only design data fetched
- ✅ No user data sent
- ✅ Your data stays private

---

**Bottom Line:** Designs are cached after first fetch. You're not hitting the cloud on every render - only on first load and page refresh!

---

**Last Updated:** 2026-01-24  
**Caching:** In-memory for app lifetime, CDN for longer-term
