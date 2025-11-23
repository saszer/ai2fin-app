# 🔍 Subscription Access Logic Audit

**Date:** 2025-01-27  
**Status:** ❌ **CRITICAL ISSUES FOUND**

---

## 🚨 **CRITICAL ISSUES**

### **1. Feature Name Mismatch (BREAKING)**

**Problem:** Feature names in `ACCESS_CONFIG` don't match feature names used in routes.

**ACCESS_CONFIG uses:**
- `'ai_categorization'`
- `'ai_tax_analysis'`

**Routes use:**
- `'smart_categorization'` (intelligent-categorization.ts)
- `'tax_analysis'` (intelligent-tax-deduction.ts)

**Impact:** Routes checking for `'smart_categorization'` will NEVER find it in `ACCESS_CONFIG.features`, causing access to be denied even for Premium users.

**Files affected:**
- `routes/intelligent-categorization.ts` - uses `'smart_categorization'`
- `routes/intelligent-tax-deduction.ts` - uses `'tax_analysis'`
- `middleware/subscription.ts` - hardcoded `PREMIUM_FEATURES` uses `'smart_categorization'`

---

### **2. Plan Tier Name Inconsistency (BREAKING)**

**Problem:** Multiple conflicting plan normalization functions with different logic.

**ACCESS_CONFIG uses:**
- `'pro'` for Premium tier (line 448)

**But normalization functions:**
- `mapPlanToTier` (subscription.ts:44) maps `'premium'` → `'pro'` ✅
- `planAliases` (accessControl/index.ts:529) maps `'pro'` → `'premium'` ❌ **BACKWARDS!**
- `mapPlanNameToTier` (ChatOrchestrator.ts:951) maps `'premium'` → `'pro'` ✅

**Impact:** When subscription service returns `'AI2 Premium'`, it gets normalized to `'premium'`, but ACCESS_CONFIG expects `'pro'`. This causes Premium users to be denied access to Premium features.

---

### **3. Deprecated Arrays Still in Use**

**Problem:** `FREE_FEATURES` and `SUBSCRIPTION_FEATURES` marked as `@deprecated` but still used.

**Files:**
- `middleware/subscription.ts:236` - uses `FREE_FEATURES.includes(feature)`
- `middleware/feature-gating.ts` - entire file uses deprecated arrays

**Impact:** These arrays don't match `ACCESS_CONFIG`, causing inconsistent access decisions.

---

### **4. Hardcoded Feature Lists**

**Problem:** Hardcoded feature arrays that don't reference `ACCESS_CONFIG`.

**Found in:**
- `middleware/subscription.ts:404` - `PREMIUM_FEATURES = ['chat_file_upload', 'ato_export', 'smart_categorization', 'tax_analysis']`
- Uses `'smart_categorization'` instead of `'ai_categorization'`

**Impact:** Cold start logic uses wrong feature names.

---

### **5. Multiple Plan Normalization Functions**

**Problem:** Three different functions normalize plan names differently.

1. **`mapPlanToTier`** (subscription.ts:41-47)
   - Maps: `'premium'` → `'pro'`, `'elite'` → `'elite+'`

2. **`planAliases`** (accessControl/index.ts:523-533)
   - Maps: `'pro'` → `'premium'` ❌ **BACKWARDS!**
   - Maps: `'premium'` → `'premium'` ✅

3. **`mapPlanNameToTier`** (ChatOrchestrator.ts:944-956)
   - Maps: `'premium'` → `'pro'` ✅
   - Maps: `'pro'` → `'pro'` ✅

**Impact:** Same plan name gets normalized differently depending on which function is called.

---

## ✅ **WHAT'S CORRECT**

1. **ACCESS_CONFIG is the single source of truth** - correctly defined
2. **Feature definitions** - correctly list which plans have which features
3. **Route definitions** - correctly reference features from ACCESS_CONFIG
4. **accessControl/index.ts** - correctly uses `ACCESS_CONFIG.features[feature]?.plans`

---

## 🔧 **REQUIRED FIXES**

### **Fix 1: Standardize Feature Names**

**Option A (Recommended):** Update routes to use `ACCESS_CONFIG` feature names:
- `'smart_categorization'` → `'ai_categorization'`
- `'tax_analysis'` → `'ai_tax_analysis'`

**Option B:** Update `ACCESS_CONFIG` to include aliases:
- Add `'smart_categorization'` as alias for `'ai_categorization'`
- Add `'tax_analysis'` as alias for `'ai_tax_analysis'`

### **Fix 2: Standardize Plan Tier Names**

**Decision needed:** Should we use `'pro'` or `'premium'` as the tier name?

**Current state:**
- `ACCESS_CONFIG.plans` uses `'pro'`
- `ACCESS_CONFIG.features[].plans` uses `'pro'`
- But normalization sometimes produces `'premium'`

**Recommendation:** Use `'premium'` everywhere (more intuitive) OR use `'pro'` everywhere (shorter). But be consistent!

### **Fix 3: Remove Deprecated Arrays**

- Remove `FREE_FEATURES` and `SUBSCRIPTION_FEATURES` from `subscription.ts`
- Update all references to use `ACCESS_CONFIG`
- Remove or update `feature-gating.ts` to use `ACCESS_CONFIG`

### **Fix 4: Create Single Plan Normalization Function**

- Create one shared function in `accessControl/utils.ts`
- All other files import and use this function
- Ensures consistent normalization everywhere

---

## 📊 **CONFLICT MATRIX**

| Location | Feature Name | Plan Tier | Uses ACCESS_CONFIG |
|----------|-------------|-----------|-------------------|
| `ACCESS_CONFIG` | `'ai_categorization'` | `'pro'` | ✅ Source of truth |
| `routes/intelligent-categorization.ts` | `'smart_categorization'` ❌ | N/A | ❌ |
| `middleware/subscription.ts` | `'smart_categorization'` ❌ | `'pro'` | ⚠️ Partial |
| `accessControl/index.ts` | `'ai_categorization'` ✅ | `'premium'` ❌ | ✅ |
| `ChatOrchestrator.ts` | N/A | `'pro'` ✅ | ⚠️ Partial |

---

## 🎯 **RECOMMENDED SOLUTION**

1. **Standardize on `'premium'` tier name** (more intuitive than `'pro'`)
2. **Update ACCESS_CONFIG** to use `'premium'` instead of `'pro'`
3. **Fix feature name aliases** - add both `'ai_categorization'` and `'smart_categorization'` to ACCESS_CONFIG
4. **Create shared normalization function** - single source of truth for plan name mapping
5. **Remove all deprecated arrays** - replace with ACCESS_CONFIG lookups

---

**embracingearth.space - Enterprise access control audit**

