# 🎯 Tier Mapping Quick Reference

**Quick lookup table for tier name correspondences**

---

## 📊 **TIER CORRESPONDENCE TABLE**

| **Display Name** | **Shared Enum** | **Subscription Enum** | **Core Normalized** | **Database Name** | **Access Control** |
|------------------|-----------------|------------------------|---------------------|-------------------|---------------------|
| Trial / Free Trial | `FREE_TRIAL` | `FREE_TRIAL` / `free_trial` | `'trial'` | `'Trial'` | `'trial'` |
| Lite / Basic | `LITE` | `BASIC` / `basic` | `'basic'` | `'Lite'` / `'Basic'` | `'basic'` |
| Pro / Professional | `PRO` | `PROFESSIONAL` / `professional` | `'pro'` | `'Pro'` / `'Professional'` | `'pro'` |
| Premium+ / AI2 Premium | `PRO` | `PROFESSIONAL` / `professional` | `'pro'` | `'premium+'` / `'AI2 Premium'` | `'pro'` |
| Elite / Enterprise | `ELITE` | `ENTERPRISE` / `enterprise` | `'elite+'` | `'Elite'` / `'Enterprise'` | `'elite+'` |
| Elite+ / AI2 Elite | `ELITE` | `ENTERPRISE` / `enterprise` | `'elite+'` | `'Elite+'` / `'AI2 Elite'` | `'elite+'` |
| Free / None | - | - | `'free'` | `null` / `''` | `'free'` |

---

## 🔄 **NORMALIZATION FLOW**

```
Database Plan Name
    ↓
mapPlanToTier() / mapPlanNameToTier()
    ↓
Normalized Tier String ('free' | 'trial' | 'basic' | 'pro' | 'elite+')
    ↓
Feature Gating Check
    ↓
Access Granted/Denied
```

---

## 🗺️ **MAPPING FUNCTIONS**

### **1. Middleware (`src/middleware/subscription.ts`)**
```typescript
'premium+' → 'pro'
'AI2 Premium' → 'pro'
'Pro' → 'pro'
'elite' → 'elite+'
'Elite+' → 'elite+'
'Enterprise' → 'elite+' (via accessControl)
```

### **2. Access Control (`src/services/accessControl/index.ts`)**
```typescript
'ai2 premium' → 'pro'
'premium' → 'pro'
'enterprise' → 'elite+'
'elite' → 'elite+'
'elite+' → 'elite+'
```

### **3. Chat Orchestrator (`src/services/chat/ChatOrchestrator.ts`)**
```typescript
'elite' / 'enterprise' → 'elite+'
'premium' / 'professional' → 'pro'
'basic' / 'starter' → 'basic'
'trial' → 'trial'
```

---

## ✅ **FEATURE ACCESS BY TIER**

| **Feature** | **Required Tier** |
|------------|-------------------|
| `chat_file_upload` | `'pro'` or `'elite+'` |
| `ato_export` | `'pro'` or `'elite+'` |
| `smart_categorization` | `'pro'` or `'elite+'` |
| `tax_analysis` | `'pro'` or `'elite+'` |
| `ai_assistant` | `'pro'` or `'elite+'` |
| `email_processing` | `'elite+'` only |
| `tax_reports` | `'elite+'` only |
| `budget_allocations` | `'pro'` or `'elite+'` |
| `admin_panel` | `'elite+'` only |

---

## ⚠️ **COMMON ISSUES**

1. **Case Sensitivity:** Always lowercase when normalizing
2. **Legacy Names:** `'premium+'` maps to `'pro'`, not a separate tier
3. **Missing Enum:** `'elite+'` used in code but not in enum definitions
4. **Multiple Sources:** Different enums in different files cause type mismatches

---

## 🔧 **FIXES NEEDED**

1. ✅ Consolidate enum definitions to single source
2. ✅ Add `ELITE_PLUS` or `AUTO_PLUS` to enum definitions
3. ✅ Standardize normalization function across all services
4. ✅ Update database plan names to match normalized tiers










