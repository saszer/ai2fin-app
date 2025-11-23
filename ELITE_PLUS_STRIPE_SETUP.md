# 🚀 ELITE+ & Premium Stripe Setup Guide

**Complete step-by-step guide to set up ELITE+ and Premium subscriptions on Stripe**

**⚠️ IMPORTANT: Users can only have ONE active subscription at a time.**

---

## 📋 **STEP 1: Create Products in Stripe Dashboard**

### **1.1 Create ELITE+ Product**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** for testing, or **Live mode** for production
3. Navigate to **Products** → Click **"+ Add product"**
4. Enter Product Details:
   ```
   Product name: AI2 ELITE+
   Description: Full access to AI2 Platform with connectors, advanced analytics, and premium features
   ```
5. Add Product Metadata (Recommended):
   - `plan_tier`: `elite+`
   - `feature_set`: `all_features`
   - `includes_connectors`: `true`
   - `max_users`: `unlimited`
6. Click **"Save product"**
7. **Copy the Product ID** (e.g., `prod_xxxxxxxxxxxxx`) - **YOU'LL NEED THIS!**

### **1.2 Create Premium Product**

1. In Stripe Dashboard → **Products** → Click **"+ Add product"**
2. Enter Product Details:
   ```
   Product name: AI2 Premium
   Description: Full access to AI2 Platform features
   ```
3. Add Product Metadata (Recommended):
   - `plan_tier`: `premium`
   - `feature_set`: `standard_features`
   - `includes_connectors`: `false`
   - `max_users`: `1`
4. Click **"Save product"**
5. **Copy the Product ID** (e.g., `prod_yyyyyyyyyyyyy`) - **YOU'LL NEED THIS!**

---

## 💰 **STEP 2: Create Recurring Prices**

### **2.1 Create ELITE+ Monthly Price**

1. In the **ELITE+** product page, click **"Add price"**
2. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: `49.00` (or your desired price)
   - **Currency**: `USD` (or your currency)
   - **Billing period**: Monthly
   - **Recurring**: Yes
3. Click **"Save price"**
4. **Copy the Price ID** (e.g., `price_1RzZSRLs39ChsYkALp8dR8zl`) - **YOU'LL NEED THIS!**

### **2.2 Create ELITE+ Yearly Price**

1. In the same **ELITE+** product, click **"Add another price"**
2. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: `490.00` (or your desired price - typically 2 months free)
   - **Currency**: `USD` (or your currency)
   - **Billing period**: Yearly
   - **Recurring**: Yes
3. Click **"Save price"**
4. **Copy the Price ID** (e.g., `price_1RzZSRLs39ChsYkALp8dR9zl`) - **YOU'LL NEED THIS!**

### **2.3 Create Premium Monthly Price**

1. In the **Premium** product page, click **"Add price"**
2. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: `23.00` (or your desired price)
   - **Currency**: `USD` (or your currency)
   - **Billing period**: Monthly
   - **Recurring**: Yes
3. Click **"Save price"**
4. **Copy the Price ID** (e.g., `price_1RzZSRLs39ChsYkALp8dR7zl`) - **YOU'LL NEED THIS!**

### **2.4 Create Premium Yearly Price**

1. In the same **Premium** product, click **"Add another price"**
2. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: `222.00` (or your desired price - typically 2 months free)
   - **Currency**: `USD` (or your currency)
   - **Billing period**: Yearly
   - **Recurring**: Yes
3. Click **"Save price"**
4. **Copy the Price ID** (e.g., `price_1RzZSRLs39ChsYkALp8dR6zl`) - **YOU'LL NEED THIS!**

---

## 🔐 **STEP 3: Configure Environment Variables**

### **3.1 Edit `.env` File**

Navigate to: `ai2-subscription-service/.env`

### **3.2 Add Stripe Configuration**

```env
# ================================
# STRIPE CONFIGURATION
# ================================

# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Your Stripe secret key (use sk_test_... for test mode)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Webhook endpoint secret (see Step 4)

# ================================
# PREMIUM PRICE IDs (EXISTING - DO NOT CHANGE)
# ================================
# These were previously configured for Premium plan
# Replace with your actual Price IDs from Step 2.3 and 2.4
STRIPE_PRICE_ID_MONTHLY=price_1RzZSRLs39ChsYkALp8dR7zl  # Premium monthly price ID ($23/month)
STRIPE_PRICE_ID_YEARLY=price_1RzZSRLs39ChsYkALp8dR6zl   # Premium yearly price ID ($222/year)

# ================================
# ELITE+ PRICE IDs (NEW - ADD THESE)
# ================================
# Replace with your actual Price IDs from Step 2.1 and 2.2
STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS=price_1RzZSRLs39ChsYkALp8dR8zl  # ELITE+ monthly price ID ($49/month)
STRIPE_PRICE_ID_YEARLY_ELITE_PLUS=price_1RzZSRLs39ChsYkALp8dR9zl   # ELITE+ yearly price ID ($490/year)

# ================================
# PRODUCT IDs (OPTIONAL - for validation)
# ================================
STRIPE_PRODUCT_ID_ELITE_PLUS=prod_xxxxxxxxxxxxx  # ELITE+ product ID from Step 1.1
STRIPE_PRODUCT_ID_PREMIUM=prod_yyyyyyyyyyyyy      # Premium product ID from Step 1.2
STRIPE_PRODUCT_ID_ENTERPRISE=prod_xxxxxxxxxxxxx  # Alias for ELITE+ (for backward compatibility)

# ================================
# NOTE: SINGLE SUBSCRIPTION CONSTRAINT
# ================================
# The system enforces that users can only have ONE active subscription at a time.
# If a user tries to subscribe to a new plan while having an active subscription,
# they will receive an error: "You already have an active subscription. Please manage your existing subscription first."
# Users must cancel their current subscription before subscribing to a different plan.
```

### **3.3 Get Stripe API Keys**

1. Go to Stripe Dashboard → **Developers** → **API keys**
2. Copy:
   - **Secret key** (starts with `sk_live_` or `sk_test_`)
   - **Publishable key** (starts with `pk_live_` or `pk_test_`)

---

## 🔔 **STEP 4: Configure Webhook**

### **4.1 Create Webhook Endpoint**

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"+ Add endpoint"**
3. Enter:
   - **Endpoint URL**: `https://your-domain.com/api/payment/webhook/stripe`
     - For local testing: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) or ngrok
   - **Description**: `AI2 Subscription Service - ELITE+`
4. Click **"Add endpoint"**

### **4.2 Select Events to Listen For**

Select these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.trial_will_end`

### **4.3 Copy Webhook Secret**

1. After creating the endpoint, click on it
2. Find **"Signing secret"** (starts with `whsec_`)
3. Click **"Reveal"** and copy it
4. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 🔒 **SINGLE SUBSCRIPTION CONSTRAINT**

### **How It Works**

The system **enforces that users can only have ONE active subscription at a time**:

1. **Database Constraint**: `userId String @unique` in Subscription model prevents multiple subscriptions per user
2. **Code Check**: Before creating checkout, system checks for existing active subscriptions
3. **Error Message**: If user has active subscription, they receive: *"You already have an active subscription. Please manage your existing subscription first."*

### **Subscription Switching**

To switch from Premium to ELITE+ (or vice versa):
1. User must **cancel** their current subscription first
2. Wait for cancellation to process
3. Then subscribe to the new plan

**Future Enhancement**: Upgrade/downgrade logic could be added to automatically cancel old subscription when subscribing to new plan.

---

## 🗄️ **STEP 5: Create Plans in Database**

### **5.1 Create ELITE+ Plan (Monthly)**

**Using Prisma Studio:**
1. Navigate to `ai2-subscription-service/`
2. Run: `npx prisma studio`
3. Open `SubscriptionPlan` table → Click **"Add record"**
4. Fill in:
   ```
   name: AI2 ELITE+
   description: Full access with connectors and premium features
   price: 49.00
   currency: USD
   interval: month
   intervalCount: 1
   trialPeriodDays: 0
   features: ["dashboard","category_management","ai_classification","connectors","admin_panel","advanced_analytics","real_time_sync","unlimited_transactions","priority_support"]
   isActive: true
   stripePriceId: price_1RzZSRLs39ChsYkALp8dR8zl  # Your ELITE+ monthly price ID
   ```
5. Click **"Save 1 change"**

**Using SQL:**
```sql
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "stripePriceId"
) VALUES (
  'AI2 ELITE+',
  'Full access with connectors and premium features',
  49.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management","ai_classification","connectors","admin_panel","advanced_analytics","real_time_sync","unlimited_transactions","priority_support"]'::TEXT,
  true,
  'price_1RzZSRLs39ChsYkALp8dR8zl'  -- Your ELITE+ monthly price ID
);
```

### **5.2 Create ELITE+ Plan (Yearly) - Optional**

If you want a separate yearly plan entry:

```sql
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "stripePriceId"
) VALUES (
  'AI2 ELITE+ (Yearly)',
  'Full access with connectors and premium features - Yearly',
  490.00,
  'USD',
  'year',
  1,
  0,
  '["dashboard","category_management","ai_classification","connectors","admin_panel","advanced_analytics","real_time_sync","unlimited_transactions","priority_support"]'::TEXT,
  true,
  'price_1RzZSRLs39ChsYkALp8dR9zl'  -- Your ELITE+ yearly price ID
);
```

### **5.3 Create Premium Plan (Monthly)**

**Using Prisma Studio:**
1. In Prisma Studio, click **"Add record"** again
2. Fill in:
   ```
   name: AI2 Premium
   description: Full access to AI2 Platform features
   price: 23.00
   currency: USD
   interval: month
   intervalCount: 1
   trialPeriodDays: 0
   features: ["dashboard","category_management","ai_classification","basic_analytics","csv_upload","email_support"]
   isActive: true
   stripePriceId: price_1RzZSRLs39ChsYkALp8dR7zl  # Your Premium monthly price ID
   ```
3. Click **"Save 1 change"**

**Using SQL:**
```sql
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "stripePriceId"
) VALUES (
  'AI2 Premium',
  'Full access to AI2 Platform features',
  23.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management","ai_classification","basic_analytics","csv_upload","email_support"]'::TEXT,
  true,
  'price_1RzZSRLs39ChsYkALp8dR7zl'  -- Your Premium monthly price ID
);
```

### **5.4 Create Premium Plan (Yearly) - Optional**

```sql
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  "intervalCount",
  "trialPeriodDays",
  features,
  "isActive",
  "stripePriceId"
) VALUES (
  'AI2 Premium (Yearly)',
  'Full access to AI2 Platform features - Yearly',
  222.00,
  'USD',
  'year',
  1,
  0,
  '["dashboard","category_management","ai_classification","basic_analytics","csv_upload","email_support"]'::TEXT,
  true,
  'price_1RzZSRLs39ChsYkALp8dR6zl'  -- Your Premium yearly price ID
);
```

---

## ✅ **STEP 6: Verify Configuration**

### **6.1 Check Environment Variables**

```bash
# In ai2-subscription-service/
cat .env | grep STRIPE
```

Should show:
- ✅ `STRIPE_SECRET_KEY` is set
- ✅ `STRIPE_PRICE_ID_MONTHLY` is set (ELITE+ monthly)
- ✅ `STRIPE_PRICE_ID_YEARLY` is set (ELITE+ yearly)
- ✅ `STRIPE_WEBHOOK_SECRET` is set

### **6.2 Verify Code References**

**⚠️ IMPORTANT**: The current code in `paymentCheckout.ts` (lines 392-395) uses generic environment variables:

```typescript
// Current implementation (needs update for multiple plans)
const priceId = request.interval === 'year'
  ? process.env.STRIPE_PRICE_ID_YEARLY   // Currently for Premium
  : process.env.STRIPE_PRICE_ID_MONTHLY;  // Currently for Premium
```

**This means**: Currently, `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` are used for **Premium** plan.

**To support both Premium and ELITE+**, the code should be updated to use the plan's `stripePriceId` from the database:

```typescript
// Recommended update in paymentCheckout.ts
const plan = await prisma.subscriptionPlan.findUnique({ where: { id: request.planId } });
const priceId = plan?.stripePriceId || (request.interval === 'year'
  ? process.env.STRIPE_PRICE_ID_YEARLY
  : process.env.STRIPE_PRICE_ID_MONTHLY);
```

**For now**: 
- Keep `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` for **Premium**
- Store ELITE+ price IDs in the database plan's `stripePriceId` field
- Update code to use `plan.stripePriceId` when available

**`ai2-subscription-service/src/services/subscription.ts`** (lines 58-68):
```typescript
private readonly VALID_PRODUCT_IDS = new Set([
  process.env.STRIPE_PRODUCT_ID_MONTHLY,
  process.env.STRIPE_PRODUCT_ID_YEARLY,
  process.env.STRIPE_PRODUCT_ID_ENTERPRISE,  // ELITE+ uses this
  process.env.STRIPE_PRODUCT_ID_PREMIUM     // Premium uses this
].filter(Boolean));

private readonly VALID_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_ID_MONTHLY,      // Premium monthly (existing)
  process.env.STRIPE_PRICE_ID_YEARLY,       // Premium yearly (existing)
  process.env.STRIPE_PRICE_ID_ENTERPRISE,   // ELITE+ (alias, if used)
  process.env.STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS,  // ELITE+ monthly (new)
  process.env.STRIPE_PRICE_ID_YEARLY_ELITE_PLUS    // ELITE+ yearly (new)
].filter(Boolean));
```

**Single subscription constraint** (`paymentCheckout.ts` lines 196-208):
```typescript
// Single subscription constraint enforcement
const existingActiveSubscription = await prisma.subscription.findFirst({
  where: {
    userId: request.userId,
    status: { in: ['active', 'trialing'] }
  }
});

if (existingActiveSubscription) {
  throw new Error('You already have an active subscription. Please manage your existing subscription first.');
}
```

---

## 🧪 **STEP 7: Test the Setup**

### **7.1 Test Checkout Flow**

1. **Start subscription service**:
   ```bash
   cd ai2-subscription-service
   npm run dev
   ```

2. **Initiate checkout** (via API or frontend):
   ```bash
   curl -X POST http://localhost:3000/api/payment/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "planId": "YOUR_ELITE_PLUS_PLAN_ID",
       "interval": "month"
     }'
   ```

3. **Complete payment** using Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

### **7.2 Verify Webhook Processing**

1. Check Stripe Dashboard → **Webhooks** → **Event log**
2. Look for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `invoice.payment_succeeded`

3. Check subscription service logs:
   ```bash
   # Should see:
   ✅ Subscription created successfully
   ✅ Webhook processed: checkout.session.completed
   ```

### **7.3 Verify Database**

```sql
-- Check subscription was created
SELECT 
  id,
  user_id,
  status,
  stripe_subscription_id,
  current_period_end
FROM subscription
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Should show:
-- status: 'active'
-- stripe_subscription_id: 'sub_xxxxx'
```

---

## 🚨 **TROUBLESHOOTING**

### **Issue: "Invalid price ID" error**

**Cause**: Price ID not in environment variables or not in `VALID_PRICE_IDS`

**Fix**:
1. Verify `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` in `.env`
2. Restart subscription service
3. Check `subscription.ts` includes your price IDs in `VALID_PRICE_IDS`

---

### **Issue: Webhook not receiving events**

**Cause**: Webhook URL incorrect or secret mismatch

**Fix**:
1. Check webhook URL in Stripe Dashboard matches your endpoint
2. Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/payment/webhook/stripe
   ```

---

### **Issue: Subscription created but not active**

**Cause**: Webhook not processing or database sync issue

**Fix**:
1. Check webhook event log in Stripe Dashboard
2. Check subscription service logs for errors
3. Manually sync:
   ```bash
   curl -X POST http://localhost:3000/api/subscription/admin/sync-user \
     -H "X-Service-Token: YOUR_SERVICE_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"userId": "USER_ID"}'
   ```

---

## 📊 **QUICK REFERENCE CHECKLIST**

### **Stripe Dashboard**
- [ ] ELITE+ product created
- [ ] ELITE+ monthly price created (Price ID copied)
- [ ] ELITE+ yearly price created (Price ID copied)
- [ ] ELITE+ Product ID copied
- [ ] Premium product created
- [ ] Premium monthly price created (Price ID copied)
- [ ] Premium yearly price created (Price ID copied)
- [ ] Premium Product ID copied
- [ ] Webhook endpoint created
- [ ] Webhook secret copied

### **Environment Variables**
- [ ] `STRIPE_SECRET_KEY` set
- [ ] `STRIPE_PUBLISHABLE_KEY` set
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `STRIPE_PRICE_ID_MONTHLY` set (Premium monthly - **EXISTING, DO NOT CHANGE**)
- [ ] `STRIPE_PRICE_ID_YEARLY` set (Premium yearly - **EXISTING, DO NOT CHANGE**)
- [ ] `STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS` set (ELITE+ monthly - **NEW**)
- [ ] `STRIPE_PRICE_ID_YEARLY_ELITE_PLUS` set (ELITE+ yearly - **NEW**)
- [ ] `STRIPE_PRODUCT_ID_ELITE_PLUS` set (optional)
- [ ] `STRIPE_PRODUCT_ID_PREMIUM` set (optional)

### **Database**
- [ ] ELITE+ plan created in `subscription_plans` table
- [ ] ELITE+ `stripePriceId` matches monthly price ID (CRITICAL - code should use this)
- [ ] Premium plan created in `subscription_plans` table
- [ ] Premium `stripePriceId` matches monthly price ID
- [ ] Both plans have `isActive` = true
- [ ] Both plans have `trialPeriodDays` = 0

### **Code Update (Recommended)**
- [ ] Update `paymentCheckout.ts` to use `plan.stripePriceId` from database instead of generic env vars
- [ ] This allows each plan to have its own price ID stored in the database

### **Testing**
- [ ] ELITE+ checkout flow works
- [ ] Premium checkout flow works
- [ ] Payment processes successfully for both plans
- [ ] Webhook receives events
- [ ] Subscription created in database
- [ ] Subscription status = 'active'
- [ ] **Single subscription constraint tested**: User with active subscription cannot create new subscription

---

## 🎯 **SUMMARY**

1. ✅ **Create ELITE+ and Premium products** in Stripe Dashboard
2. ✅ **Create monthly and yearly prices for both** (copy Price IDs)
3. ✅ **Add environment variables** to `.env` (both ELITE+ and Premium)
4. ✅ **Configure webhook** endpoint
5. ✅ **Create plans** in database (both ELITE+ and Premium)
6. ✅ **Test checkout** flow for both plans
7. ✅ **Verify webhook** processing
8. ✅ **Test single subscription constraint**: Users can only have one active subscription

## 🔒 **SINGLE SUBSCRIPTION ENFORCEMENT**

The system automatically enforces that users can only have **ONE active subscription at a time**:

- ✅ **Database constraint**: `userId String @unique` prevents multiple subscriptions
- ✅ **Code check**: Blocks checkout if user has active subscription
- ✅ **Error message**: Clear error when attempting to create second subscription

**To switch plans**: User must cancel current subscription first, then subscribe to new plan.

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Enterprise-grade subscription management*

