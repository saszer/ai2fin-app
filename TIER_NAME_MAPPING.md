# 📊 Tier Name Correspondence Mapping

**Documentation of tier name mappings across Frontend, Subscription Service, and Core App**

**Last Updated:** 2025-01-27  
**Purpose:** Central reference for tier name normalization and mapping across all services

---

## 🎯 **TIER HIERARCHY OVERVIEW**

```
FREE_TRIAL → LITE/BASIC → PRO/PROFESSIONAL → ELITE/ENTERPRISE → [NEW: AUTO+/ELITE+]
```

---

## 📋 **TIER DEFINITIONS BY SERVICE**

### **1. Shared Config (`shared/src/config/plans.ts`)**
**Enum:** `SubscriptionTier`
```typescript
FREE_TRIAL = 'FREE_TRIAL'
LITE = 'LITE'           // $11/month, $111/year
PRO = 'PRO'             // $22/month, $222/year
ELITE = 'ELITE'         // $44/month, $444/year
```

**Plan Names:**
- `'Trial'` → `FREE_TRIAL`
- `'Lite'` → `LITE`
- `'Pro'` → `PRO`
- `'Elite'` → `ELITE`

---

### **2. Subscription Service (`ai2-subscription-service/shared/types/pricing.ts`)**
**Enum:** `SubscriptionTier`
```typescript
FREE_TRIAL = 'free_trial'
BASIC = 'basic'                    // $11/month, $111/year
PROFESSIONAL = 'professional'      // $22/month, $222/year
ENTERPRISE = 'enterprise'          // $44/month, $444/year
```

**Plan Names:**
- `'Free Trial'` → `FREE_TRIAL`
- `'Basic'` → `BASIC`
- `'Professional'` → `PROFESSIONAL`
- `'Enterprise'` → `ENTERPRISE`

---

### **3. Core App Access Control (`ai2-core-app/src/services/accessControl/config.ts`)**
**Uses lowercase string literals:**
```typescript
'free' | 'trial' | 'basic' | 'pro' | 'elite+'
```

**Route/Feature Gating:**
- Routes check: `subscription: ['free', 'trial', 'basic', 'pro', 'elite+']`
- Features check: `plans: ['free', 'trial', 'basic', 'pro', 'elite+']`

---

### **4. Core App Middleware (`ai2-core-app/src/middleware/subscription.ts`)**
**Normalization Function:** `mapPlanToTier()`
```typescript
const mapPlanToTier = (planName?: string): string => {
  const name = (planName || '').toString().trim().toLowerCase();
  if (!name) return 'free';
  if (name === 'premium+' || name.includes('premium') || name.includes('pro')) return 'pro';
  if (name === 'elite' || name.includes('elite')) return 'elite+';
  return name; // fall back to raw lower-cased name
};
```

**Mappings:**
- `'premium+'` → `'pro'`
- `'AI2 Premium'` → `'pro'`
- `'Pro'` → `'pro'`
- `'Premium Plus'` → `'pro'`
- `'elite'` → `'elite+'`
- `'Elite+'` → `'elite+'`
- `'AI2 Elite'` → `'elite+'`
- `'Enterprise'` → `'elite+'` (via accessControl mapping)

---

### **5. Core App Access Control Service (`ai2-core-app/src/services/accessControl/index.ts`)**
**Plan Aliases Mapping:**
```typescript
const planAliases: Record<string, string> = {
  'ai2 premium': 'pro',
  premium: 'pro',
  enterprise: 'elite+',
  elite: 'elite+',
  'elite+': 'elite+',
  pro: 'pro',
  basic: 'basic',
  trial: 'trial',
  free: 'free'
};
```

---

### **6. Chat Orchestrator (`ai2-core-app/src/services/chat/ChatOrchestrator.ts`)**
**Mapping Function:** `mapPlanNameToTier()`
```typescript
private mapPlanNameToTier(planName?: string | null): string {
  if (!planName) return 'free';
  const normalized = planName.toString().trim().toLowerCase();
  if (normalized.includes('elite') || normalized.includes('enterprise')) return 'elite+';
  if (normalized.includes('premium') || normalized.includes('pro')) return 'pro';
  return normalized;
}
```

---

## 🔄 **COMPLETE MAPPING TABLE**

| **Database Plan Name** | **Shared Enum** | **Subscription Service Enum** | **Core App Tier (Normalized)** | **Access Control String** |
|------------------------|-----------------|-------------------------------|--------------------------------|----------------------------|
| `'Trial'` / `'Free Trial'` | `FREE_TRIAL` | `FREE_TRIAL` / `free_trial` | `'trial'` | `'trial'` |
| `'Lite'` / `'Basic'` | `LITE` | `BASIC` / `basic` | `'basic'` | `'basic'` |
| `'Pro'` / `'Professional'` | `PRO` | `PROFESSIONAL` / `professional` | `'pro'` | `'pro'` |
| `'Premium+'` / `'AI2 Premium'` | `PRO` | `PROFESSIONAL` / `professional` | `'pro'` | `'pro'` |
| `'Elite'` / `'Enterprise'` | `ELITE` | `ENTERPRISE` / `enterprise` | `'elite+'` | `'elite+'` |
| `'Elite+'` / `'AI2 Elite'` | `ELITE` | `ENTERPRISE` / `enterprise` | `'elite+'` | `'elite+'` |
| `null` / `''` / `'free'` | - | - | `'free'` | `'free'` |

---

## 🎨 **FRONTEND DISPLAY NAMES**

### **Subscription Page (`client/src/pages/Subscription.tsx`)**
- Displays: `plan.name` from API response
- Examples: `'Premium+'`, `'Pro'`, `'Elite'`, `'Basic'`

### **Plans Page (`client/src/pages/Plans.tsx`)**
- Displays: `plan.name` from `SUBSCRIPTION_PLANS` config
- Examples: `'Lite'`, `'Pro'`, `'Elite'`

### **Website Frontend (`Website Front/components/sections/Pricing.tsx`)**
- Displays: `'FREE'`, `'PREMIUM'`, `'AUTO+'` (coming soon)

---

## 🔐 **FEATURE GATING LOGIC**

### **Middleware Feature Plans (`src/middleware/subscription.ts`)**
```typescript
const FEATURE_PLANS: Record<string, string[]> = {
  'chat_file_upload': ['pro', 'elite+'],
  'ato_export': ['pro', 'elite+'],
  'smart_categorization': ['pro', 'elite+'],
  'tax_analysis': ['pro', 'elite+'],
  'ai_assistant': ['pro', 'elite+']
};
```

### **Access Control Feature Plans (`src/services/accessControl/config.ts`)**
```typescript
features: {
  'ato_export': { plans: ['pro', 'elite+'] },
  'ai_categorization': { plans: ['pro', 'elite+'] },
  'email_processing': { plans: ['elite+'] },
  'tax_reports': { plans: ['elite+'] },
  'ai_assistant': { plans: ['elite+'] }
}
```

---

## 🗄️ **DATABASE PLAN NAMES**

**Common Database Values (`subscription_plans.name`):**
- `'premium+'` (legacy)
- `'Pro'`
- `'AI2 Premium'`
- `'Elite'`
- `'Enterprise'`
- `'Basic'`
- `'Lite'`

**All normalized to:**
- `'free'` / `'trial'` / `'basic'` / `'pro'` / `'elite+'`

---

## ⚠️ **INCONSISTENCIES & ISSUES**

### **1. Multiple Enum Definitions**
- ❌ `shared/src/config/plans.ts`: `LITE`, `PRO`, `ELITE`
- ❌ `shared/src/types/pricing.ts`: `BASIC`, `PROFESSIONAL`, `ENTERPRISE`
- ❌ `ai2-subscription-service/shared/types/pricing.ts`: `BASIC`, `PROFESSIONAL`, `ENTERPRISE`

**Impact:** Type mismatches when importing from different sources

### **2. Case Sensitivity**
- Database: `'Premium+'` (capitalized)
- Normalized: `'pro'` (lowercase)
- Frontend: Mixed case display names

### **3. Legacy Plan Names**
- `'premium+'` still exists in database
- Mapped to `'pro'` but causes confusion

### **4. Missing Tier**
- `'elite+'` used in access control but not in enum definitions
- Should be `ELITE_PLUS` or `AUTO_PLUS` in enums

---

## ✅ **RECOMMENDED STANDARDIZATION**

### **Proposed Unified Tier Enum:**
```typescript
export enum SubscriptionTier {
  FREE_TRIAL = 'FREE_TRIAL',
  LITE = 'LITE',              // or BASIC
  PRO = 'PRO',                // or PROFESSIONAL
  ELITE = 'ELITE',            // or ENTERPRISE
  ELITE_PLUS = 'ELITE_PLUS',  // or AUTO_PLUS (new tier)
}
```

### **Proposed Normalized Tier Strings:**
```typescript
type NormalizedTier = 'free' | 'trial' | 'basic' | 'pro' | 'elite' | 'elite+';
```

### **Proposed Mapping Function:**
```typescript
function normalizeTier(
  planName: string | null | undefined,
  source: 'database' | 'api' | 'enum'
): NormalizedTier {
  if (!planName) return 'free';
  
  const normalized = planName.toString().trim().toLowerCase();
  
  // Handle enum values
  if (normalized === 'free_trial' || normalized === 'trial') return 'trial';
  if (normalized === 'lite' || normalized === 'basic') return 'basic';
  if (normalized === 'pro' || normalized === 'professional') return 'pro';
  if (normalized === 'elite' || normalized === 'enterprise') return 'elite';
  if (normalized === 'elite_plus' || normalized === 'elite+' || normalized === 'auto_plus' || normalized === 'auto+') return 'elite+';
  
  // Handle legacy/display names
  if (normalized.includes('premium') || normalized.includes('pro')) return 'pro';
  if (normalized.includes('elite') || normalized.includes('enterprise')) return 'elite+';
  
  return 'free';
}
```

---

## 📝 **USAGE EXAMPLES**

### **Backend Middleware:**
```typescript
const planTier = mapPlanToTier(dbUser.subscription.plan?.name);
// 'premium+' → 'pro'
// 'Elite' → 'elite+'
```

### **Access Control:**
```typescript
const plan = planAliases[rawPlan] || 'free';
// 'enterprise' → 'elite+'
// 'AI2 Premium' → 'pro'
```

### **Frontend:**
```typescript
const userPlan = permissions?.plan || 'free';
// Uses normalized tier from backend
```

---

## 🔗 **RELATED FILES**

1. **Tier Definitions:**
   - `embracingearthspace/shared/src/config/plans.ts`
   - `embracingearthspace/shared/src/types/pricing.ts`
   - `embracingearthspace/ai2-subscription-service/shared/types/pricing.ts`

2. **Normalization Logic:**
   - `embracingearthspace/ai2-core-app/src/middleware/subscription.ts` (line 40-46)
   - `embracingearthspace/ai2-core-app/src/services/accessControl/index.ts` (line 521-532)
   - `embracingearthspace/ai2-core-app/src/services/chat/ChatOrchestrator.ts` (line 944-950)

3. **Feature Gating:**
   - `embracingearthspace/ai2-core-app/src/services/accessControl/config.ts`
   - `embracingearthspace/ai2-core-app/src/middleware/subscription.ts` (line 303-309, 362-368)

4. **Frontend Display:**
   - `embracingearthspace/ai2-core-app/client/src/pages/Subscription.tsx`
   - `embracingearthspace/ai2-core-app/client/src/pages/Plans.tsx`
   - `Website Front/Website Front/components/sections/Pricing.tsx`

---

**Note:** This mapping document should be updated whenever tier names or normalization logic changes. All developers should reference this document when working with subscription tiers.




