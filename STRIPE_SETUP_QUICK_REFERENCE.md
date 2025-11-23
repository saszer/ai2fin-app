# 🚀 Stripe Setup Quick Reference

**Service:** `ai2-subscription-service`  
**Location:** `embracingearthspace/ai2-subscription-service/.env`

---

## 📦 **STRIPE PRODUCTS TO CREATE**

### **1. AI2 Premium Product**
- **Product Name:** `AI2 Premium`
- **Description:** Full access to AI2 Platform features
- **Prices to Create:**
  - Monthly: `$23.00/month` → Copy **Price ID** (e.g., `price_xxxxx`)
  - Yearly: `$222.00/year` → Copy **Price ID** (e.g., `price_yyyyy`)
- **Product ID:** Copy Product ID (e.g., `prod_xxxxx`)

### **2. AI2 ELITE+ Product**
- **Product Name:** `AI2 ELITE+`
- **Description:** Full access with connectors and premium features
- **Prices to Create:**
  - Monthly: `$49.00/month` → Copy **Price ID** (e.g., `price_aaaaa`)
  - Yearly: `$490.00/year` → Copy **Price ID** (e.g., `price_bbbbb`)
- **Product ID:** Copy Product ID (e.g., `prod_aaaaa`)

---

## 🔐 **ENVIRONMENT VARIABLES**

**File:** `ai2-subscription-service/.env`

### **Required Variables:**

```env
# ================================
# STRIPE API KEYS (REQUIRED)
# ================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # or sk_test_... for test mode
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx  # or pk_test_... for test mode
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # From webhook endpoint

# ================================
# PREMIUM PRICE IDs (REQUIRED - EXISTING)
# ================================
# These are for Premium plan (backward compatibility)
STRIPE_PRICE_ID_MONTHLY=price_xxxxx  # Premium monthly ($23/month)
STRIPE_PRICE_ID_YEARLY=price_yyyyy   # Premium yearly ($222/year)

# ================================
# ELITE+ PRICE IDs (REQUIRED - NEW)
# ================================
STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS=price_aaaaa  # ELITE+ monthly ($49/month)
STRIPE_PRICE_ID_YEARLY_ELITE_PLUS=price_bbbbb   # ELITE+ yearly ($490/year)

# ================================
# PRODUCT IDs (OPTIONAL - for validation)
# ================================
STRIPE_PRODUCT_ID_PREMIUM=prod_xxxxx      # Premium product ID
STRIPE_PRODUCT_ID_ELITE_PLUS=prod_aaaaa   # ELITE+ product ID
STRIPE_PRODUCT_ID_ENTERPRISE=prod_aaaaa   # Alias for ELITE+ (backward compatibility)
```

---

## 🎯 **HOW IT WORKS**

### **Price ID Selection Priority:**

1. **Preferred:** Uses `plan.stripePriceId` from database (stored in `SubscriptionPlan` table)
2. **Fallback:** Uses environment variables (`STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`)

### **Code Flow:**

```typescript
// paymentCheckout.ts (line 448-458)
if (plan.stripePriceId) {
  // ✅ Uses database stripePriceId (recommended)
  priceId = plan.stripePriceId;
} else {
  // ⚠️ Falls back to env vars (for backward compatibility)
  priceId = request.interval === 'year'
    ? process.env.STRIPE_PRICE_ID_YEARLY
    : process.env.STRIPE_PRICE_ID_MONTHLY;
}
```

---

## 📊 **DATABASE SETUP**

**Important:** Store Price IDs in database for each plan:

### **SubscriptionPlan Table:**

```sql
-- Premium Monthly Plan
INSERT INTO subscription_plans (
  name, description, price, currency, interval, "intervalCount",
  "trialPeriodDays", features, "isActive", "stripePriceId"
) VALUES (
  'AI2 Premium',
  'Full access to AI2 Platform features',
  23.00, 'USD', 'month', 1, 0,
  '["dashboard","category_management",...]'::TEXT,
  true,
  'price_xxxxx'  -- Premium monthly price ID
);

-- ELITE+ Monthly Plan
INSERT INTO subscription_plans (
  name, description, price, currency, interval, "intervalCount",
  "trialPeriodDays", features, "isActive", "stripePriceId"
) VALUES (
  'AI2 ELITE+',
  'Full access with connectors and premium features',
  49.00, 'USD', 'month', 1, 0,
  '["dashboard","connectors","admin_panel",...]'::TEXT,
  true,
  'price_aaaaa'  -- ELITE+ monthly price ID
);
```

**Note:** For yearly plans, create separate plan entries with `interval: 'year'` and the yearly price ID.

---

## ✅ **CHECKLIST**

### **Stripe Dashboard:**
- [ ] Created "AI2 Premium" product
- [ ] Created Premium monthly price → Copied Price ID
- [ ] Created Premium yearly price → Copied Price ID
- [ ] Created "AI2 ELITE+" product
- [ ] Created ELITE+ monthly price → Copied Price ID
- [ ] Created ELITE+ yearly price → Copied Price ID
- [ ] Created webhook endpoint → Copied webhook secret

### **Environment Variables (`ai2-subscription-service/.env`):**
- [ ] `STRIPE_SECRET_KEY` set
- [ ] `STRIPE_PUBLISHABLE_KEY` set
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `STRIPE_PRICE_ID_MONTHLY` set (Premium monthly)
- [ ] `STRIPE_PRICE_ID_YEARLY` set (Premium yearly)
- [ ] `STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS` set (ELITE+ monthly)
- [ ] `STRIPE_PRICE_ID_YEARLY_ELITE_PLUS` set (ELITE+ yearly)
- [ ] `STRIPE_PRODUCT_ID_PREMIUM` set (optional)
- [ ] `STRIPE_PRODUCT_ID_ELITE_PLUS` set (optional)

### **Database:**
- [ ] Premium plan created with `stripePriceId` = Premium monthly price ID
- [ ] ELITE+ plan created with `stripePriceId` = ELITE+ monthly price ID
- [ ] Both plans have `isActive = true`

---

## 🔄 **UPGRADE/DOWNGRADE FLOW**

When user upgrades from Premium to ELITE+:
1. System detects upgrade using `compareTiers()`
2. Cancels old Premium subscription immediately
3. Creates new ELITE+ checkout session
4. Uses `plan.stripePriceId` from database (ELITE+ plan's price ID)
5. User completes payment → ELITE+ subscription activated

---

## 📝 **SUMMARY**

**Service:** `ai2-subscription-service`  
**Config File:** `.env` in `ai2-subscription-service/` directory

**Products:** 2 (Premium, ELITE+)  
**Prices:** 4 total (2 per product: monthly + yearly)  
**Environment Variables:** 9 total (3 API keys + 4 price IDs + 2 product IDs optional)

**Priority:** Database `stripePriceId` > Environment variables

---

**embracingearth.space - Enterprise subscription management**

