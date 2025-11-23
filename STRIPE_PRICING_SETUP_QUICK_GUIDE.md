# 💰 Stripe Pricing Setup - Quick Guide

**How to structure products and prices in Stripe**

---

## ✅ **YES: Create Multiple Prices in Same Product**

**Stripe Structure**:
```
Product: "AI2 Premium"
  ├── Price 1: Monthly ($23/month) → price_xxxxx
  └── Price 2: Yearly ($222/year) → price_yyyyy

Product: "AI2 ELITE+"
  ├── Price 1: Monthly ($49/month) → price_aaaaa
  └── Price 2: Yearly ($490/year) → price_bbbbb
```

**Why**: Stripe allows multiple prices per product. This is the standard approach.

---

## 📋 **STEP-BY-STEP SETUP**

### **1. Create Products in Stripe**

#### **Product 1: AI2 Premium**
- Product name: `AI2 Premium`
- Description: `Full access to AI2 Platform features`
- **Copy Product ID**: `prod_xxxxxxxxxxxxx`

#### **Product 2: AI2 ELITE+**
- Product name: `AI2 ELITE+`
- Description: `Full access with connectors and advanced features`
- **Copy Product ID**: `prod_yyyyyyyyyyyyy`

---

### **2. Add Prices to Each Product**

#### **In "AI2 Premium" Product**:

**Price 1: Monthly**
- Click **"Add price"** (or **"Add another price"** if product already exists)
- Price: `23.00`
- Currency: `USD`
- Billing period: **Monthly**
- Recurring: **Yes**
- **Copy Price ID**: `price_xxxxxxxxxxxxx` → This is `STRIPE_PRICE_ID_MONTHLY`

**Price 2: Yearly**
- Click **"Add another price"** (in the same product)
- Price: `222.00`
- Currency: `USD`
- Billing period: **Yearly**
- Recurring: **Yes**
- **Copy Price ID**: `price_yyyyyyyyyyyyy` → This is `STRIPE_PRICE_ID_YEARLY`

#### **In "AI2 ELITE+" Product**:

**Price 1: Monthly**
- Click **"Add price"**
- Price: `49.00`
- Currency: `USD`
- Billing period: **Monthly**
- Recurring: **Yes**
- **Copy Price ID**: `price_aaaaaaaaaaaaa` → This is `STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS`

**Price 2: Yearly**
- Click **"Add another price"** (in the same product)
- Price: `490.00`
- Currency: `USD`
- Billing period: **Yearly**
- Recurring: **Yes**
- **Copy Price ID**: `price_bbbbbbbbbbbb` → This is `STRIPE_PRICE_ID_YEARLY_ELITE_PLUS`

---

## 🔐 **ENVIRONMENT VARIABLES**

**File**: `ai2-subscription-service/.env`

```env
# ================================
# STRIPE API KEYS
# ================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # or sk_test_... for test mode
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# ================================
# PREMIUM PRICE IDs
# ================================
STRIPE_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx      # Premium monthly ($23/month)
STRIPE_PRICE_ID_YEARLY=price_yyyyyyyyyyyyy       # Premium yearly ($222/year)

# ================================
# ELITE+ PRICE IDs
# ================================
STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS=price_aaaaaaaaaaaaa  # ELITE+ monthly ($49/month)
STRIPE_PRICE_ID_YEARLY_ELITE_PLUS=price_bbbbbbbbbbbb    # ELITE+ yearly ($490/year)

# ================================
# PRODUCT IDs (Optional - for validation)
# ================================
STRIPE_PRODUCT_ID_PREMIUM=prod_xxxxxxxxxxxxx     # Premium product ID
STRIPE_PRODUCT_ID_ELITE_PLUS=prod_yyyyyyyyyyyyy  # ELITE+ product ID
STRIPE_PRODUCT_ID_ENTERPRISE=prod_yyyyyyyyyyyyy  # Alias (same as ELITE+)
```

---

## 🎯 **HOW IT WORKS**

### **Preferred Method: Database `stripePriceId`**

The system **prefers** using `stripePriceId` stored in the database plan record:

```sql
-- Update plan records with Stripe Price IDs
UPDATE subscription_plans 
SET stripePriceId = 'price_xxxxxxxxxxxxx'  -- Monthly price ID
WHERE name = 'AI2 Premium' AND interval = 'month';

UPDATE subscription_plans 
SET stripePriceId = 'price_yyyyyyyyyyyyy'  -- Yearly price ID
WHERE name = 'AI2 Premium' AND interval = 'year';

UPDATE subscription_plans 
SET stripePriceId = 'price_aaaaaaaaaaaaa'  -- Monthly price ID
WHERE name = 'AI2 ELITE+' AND interval = 'month';

UPDATE subscription_plans 
SET stripePriceId = 'price_bbbbbbbbbbbb'  -- Yearly price ID
WHERE name = 'AI2 ELITE+' AND interval = 'year';
```

**Why**: This allows each plan variant (monthly/yearly) to have its own price ID.

### **Fallback: Environment Variables**

If `stripePriceId` is not set in database, the system falls back to:
- `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` (for Premium)
- `STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS` / `STRIPE_PRICE_ID_YEARLY_ELITE_PLUS` (for ELITE+)

---

## ✅ **CHECKLIST**

- [ ] Created "AI2 Premium" product in Stripe
- [ ] Added monthly price to Premium product → Copied Price ID
- [ ] Added yearly price to Premium product → Copied Price ID
- [ ] Created "AI2 ELITE+" product in Stripe
- [ ] Added monthly price to ELITE+ product → Copied Price ID
- [ ] Added yearly price to ELITE+ product → Copied Price ID
- [ ] Set `STRIPE_PRICE_ID_MONTHLY` in `.env`
- [ ] Set `STRIPE_PRICE_ID_YEARLY` in `.env`
- [ ] Set `STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS` in `.env`
- [ ] Set `STRIPE_PRICE_ID_YEARLY_ELITE_PLUS` in `.env`
- [ ] (Optional) Set product IDs for validation
- [ ] (Recommended) Update database plan records with `stripePriceId`

---

## 📊 **VISUAL STRUCTURE**

```
Stripe Dashboard
├── Products
│   ├── AI2 Premium (prod_xxxxx)
│   │   ├── Price: Monthly $23 → price_xxxxx (STRIPE_PRICE_ID_MONTHLY)
│   │   └── Price: Yearly $222 → price_yyyyy (STRIPE_PRICE_ID_YEARLY)
│   │
│   └── AI2 ELITE+ (prod_yyyyy)
│       ├── Price: Monthly $49 → price_aaaaa (STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS)
│       └── Price: Yearly $490 → price_bbbbb (STRIPE_PRICE_ID_YEARLY_ELITE_PLUS)
```

---

## 🎯 **KEY POINTS**

1. ✅ **Multiple prices per product** - This is standard Stripe practice
2. ✅ **Database `stripePriceId` is preferred** - More flexible
3. ✅ **Environment variables are fallback** - For backward compatibility
4. ✅ **Separate products** - Premium and ELITE+ are different products
5. ✅ **Each product has 2 prices** - Monthly and Yearly

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Enterprise-grade subscription management*

