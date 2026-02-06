# 🔒 Plasmic Studio Localhost - Security & Privacy

## ❓ Your Question: "Will Plasmic see user data or other code?"

**Short Answer:** 
- ✅ **Component code**: Yes (what you register)
- ⚠️ **Rendered data**: Yes (if previewing with real data)
- ❌ **Backend/API**: No (unless exposed in components)
- ❌ **Database**: No (never directly accessed)

---

## 🔍 What Plasmic Studio Actually Sees

### When Connected to Localhost:

#### ✅ What Plasmic CAN See:

1. **Registered Components**
   - Component code structure
   - Props definitions
   - Component exports
   - File structure (for registered files)

2. **Rendered UI (If Previewing)**
   - What's displayed in browser
   - Data rendered in components
   - User data if shown in preview
   - API responses if rendered in UI

3. **Component Metadata**
   - Prop types and defaults
   - Component names
   - Import paths

#### ❌ What Plasmic CANNOT See:

1. **Backend Code**
   - Server-side code
   - API routes
   - Database queries
   - Business logic (unless in registered components)

2. **Unregistered Components**
   - Components not exported/registered
   - Private/internal code
   - Business pages (if not registered)

3. **Environment Variables**
   - `.env` files
   - Secrets
   - API keys (unless exposed in UI)

4. **Database**
   - Never directly accessed
   - Only sees data if rendered in UI

---

## 🎯 Current Setup (Safe)

### What's Registered:

**File**: `src/plasmic-components.tsx`

**Only Material-UI components:**
- ✅ Card, Typography, Box, Grid, Button, etc.
- ✅ Generic UI components
- ❌ NO business pages
- ❌ NO user data components
- ❌ NO transaction components

### What Plasmic Sees:

**Safe:**
- ✅ Material-UI component exports
- ✅ Component prop definitions
- ✅ Generic UI structure

**Protected:**
- ❌ Dashboard page (not registered)
- ❌ Transaction pages (not registered)
- ❌ User data (not in registered components)
- ❌ Business logic (not registered)

---

## ⚠️ Security Risks & Mitigation

### Risk 1: Previewing with Real Data

**What happens:**
- Plasmic Studio can preview components
- If components render user data, Plasmic sees it
- Example: If you preview a component that shows transactions

**Mitigation:**
- ✅ Don't register components that render user data
- ✅ Use mock data for preview
- ✅ Don't preview sensitive components
- ✅ Only register generic UI components (current setup)

### Risk 2: Registering Business Components

**What happens:**
- If you register Dashboard, Transactions, etc.
- Plasmic sees component structure
- May see data if previewing

**Mitigation:**
- ✅ **Current setup**: Only Material-UI registered ✅
- ✅ Don't register business pages
- ✅ Keep sensitive components private

### Risk 3: Exposed API Calls

**What happens:**
- If components make API calls during preview
- Plasmic might see API responses
- User data in responses visible

**Mitigation:**
- ✅ Don't preview components with API calls
- ✅ Use mock data for preview
- ✅ Register only presentational components

---

## 🔒 Best Practices for Financial App

### ✅ DO Register:

- ✅ Generic UI components (Material-UI)
- ✅ Presentational components
- ✅ Reusable UI elements
- ✅ Components without business logic

### ❌ DON'T Register:

- ❌ Dashboard page
- ❌ Transaction pages
- ❌ User data components
- ❌ Components with API calls
- ❌ Components rendering sensitive data
- ❌ Business logic components

### ✅ Current Setup Status:

**Registered:**
- ✅ Only Material-UI components (safe)
- ✅ Generic UI components (safe)

**NOT Registered:**
- ✅ Dashboard (protected)
- ✅ Transactions (protected)
- ✅ Bills (protected)
- ✅ User data components (protected)

---

## 🎯 What Happens During Registration

### When You Register a Component:

1. **Plasmic reads component code**
   - Sees component structure
   - Reads props definitions
   - Understands component API

2. **Plasmic may preview component**
   - Renders component in preview
   - Sees rendered output
   - May see data if component renders it

3. **Plasmic stores metadata**
   - Component name
   - Props structure
   - Import path

### What Plasmic Does NOT Do:

- ❌ Access your database
- ❌ Read unregistered files
- ❌ See backend code
- ❌ Access environment variables
- ❌ Make API calls (unless component does)

---

## 📊 Data Flow Analysis

### Safe Scenario (Current Setup):

```
Plasmic Studio
    ↓
Connects to localhost:3000
    ↓
Reads: src/plasmic-components.tsx
    ↓
Sees: Material-UI component exports
    ↓
Registers: Generic UI components
    ↓
✅ NO user data
✅ NO business logic
✅ NO sensitive information
```

### Risky Scenario (If You Register Business Components):

```
Plasmic Studio
    ↓
Connects to localhost:3000
    ↓
Registers: Dashboard component
    ↓
Preview: Renders Dashboard
    ↓
Sees: User data, transactions, etc.
    ↓
⚠️ User data exposed
⚠️ Business logic visible
```

---

## 🛡️ Protection Measures

### 1. Component Registration Filter

**Current**: Only Material-UI registered
- ✅ Safe generic components
- ✅ No business logic
- ✅ No user data

### 2. Preview Protection

**Recommendation:**
- ✅ Don't preview components with real data
- ✅ Use mock data for preview
- ✅ Disable preview for sensitive components

### 3. Code Organization

**Current Structure:**
```
src/
├── plasmic-components.tsx  ← Only Material-UI (safe)
├── pages/
│   ├── Dashboard.tsx        ← NOT registered (protected)
│   ├── AllTransactions.tsx  ← NOT registered (protected)
│   └── ...
└── components/
    └── [business components] ← NOT registered (protected)
```

---

## 🔍 Verification Checklist

### What Plasmic Can See:

- [x] Material-UI component exports ✅ (safe)
- [x] Component prop definitions ✅ (safe)
- [ ] Dashboard page ❌ (not registered - protected)
- [ ] Transaction pages ❌ (not registered - protected)
- [ ] User data ❌ (not in registered components - protected)
- [ ] Business logic ❌ (not registered - protected)

### Security Status:

- ✅ **Component code**: Only generic UI (safe)
- ✅ **User data**: Not exposed (protected)
- ✅ **Business logic**: Not registered (protected)
- ✅ **Backend code**: Never accessed (protected)

---

## 💡 Recommendations

### For Maximum Security:

1. **Keep Current Setup** ✅
   - Only register Material-UI components
   - Don't register business pages
   - Keep sensitive components private

2. **If You Need to Preview:**
   - Use mock data
   - Don't preview with real user data
   - Test with dummy data only

3. **Monitor What's Registered:**
   - Review `src/plasmic-components.tsx`
   - Don't add business components
   - Keep registration minimal

4. **Codegen Mode Benefits:**
   - ✅ No runtime fetching
   - ✅ Components are static code
   - ✅ Full control over what's registered

---

## 🎯 Summary

### What Plasmic Sees (Current Setup):

**Safe:**
- ✅ Material-UI component exports
- ✅ Generic UI component structure
- ✅ Component prop definitions

**Protected:**
- ❌ User data (not in registered components)
- ❌ Business pages (not registered)
- ❌ Backend code (never accessed)
- ❌ Database (never accessed)
- ❌ API calls (unless in preview)

### Security Level: ✅ **SAFE**

**Why:**
- Only generic UI components registered
- No business logic exposed
- No user data in registered components
- Codegen mode (no runtime fetching)

---

## ⚠️ Important Notes

### If You Register Business Components:

**Risk:**
- Plasmic sees component structure
- May see data if previewing
- Business logic exposed

**Recommendation:**
- ❌ Don't register business pages
- ❌ Don't register components with user data
- ✅ Keep current safe setup

### If You Preview Components:

**Risk:**
- Plasmic sees rendered output
- May see user data if rendered
- API responses visible if rendered

**Recommendation:**
- ✅ Use mock data for preview
- ✅ Don't preview sensitive components
- ✅ Test with dummy data only

---

**Security Status:** ✅ **SAFE** (current setup)

**What's Protected:**
- ✅ User data
- ✅ Business logic
- ✅ Backend code
- ✅ Database

**What's Visible:**
- ✅ Generic Material-UI components only

---

**Last Updated:** 2026-01-24  
**Security Level:** ✅ Safe (only generic UI registered)  
**Recommendation:** Keep current setup - don't register business components
