# 🔍 Stripe ELITE+ Subscription Flow - Comprehensive Audit

**Date**: 2025-01-20  
**Purpose**: Complete audit of ELITE+ subscription flow in Stripe, including product creation, environment variables, internal flow, single-plan constraint, and feature gating  
**embracingearth.space** - Enterprise subscription management

---

## 📋 **TABLE OF CONTENTS**

1. [Stripe Product Creation](#stripe-product-creation)
2. [Environment Variables](#environment-variables)
3. [Database Schema](#database-schema)
4. [Subscription Flow](#subscription-flow)
5. [Single-Plan Constraint](#single-plan-constraint)
6. [Feature Access Flow](#feature-access-flow)
7. [Checkout Process](#checkout-process)
8. [Webhook Handling](#webhook-handling)
9. [Migration Steps](#migration-steps)

---

## 🎯 **STRIPE PRODUCT CREATION**

### **Step 1: Create ELITE+ Product in Stripe Dashboard**

1. **Navigate to Stripe Dashboard**: https://dashboard.stripe.com → **Products**
2. **Click "+ Add product"**
3. **Enter Product Details**:
   ```
   Product name: AI2 ELITE+
   Description: Full access to AI2 Platform with connectors, advanced analytics, and premium features
   ```

### **Step 2: Create Recurring Prices for ELITE+**

#### **Monthly Price:**
1. In the ELITE+ product, click **"Add price"**
2. Select:
   - Pricing model: **Standard pricing**
   - Price: `[TBD] USD` (e.g., `49.00 USD` or your pricing)
   - Billing period: **Monthly**
3. **Save and copy the Price ID** (e.g., `price_xxxxxxxxxxxxx`)

#### **Yearly Price:**
1. Click **"Add another price"** in the same product
2. Select:
   - Pricing model: **Standard pricing**
   - Price: `[TBD] USD` (e.g., `490.00 USD` - typically 2 months free)
   - Billing period: **Yearly**
3. **Save and copy the Price ID** (e.g., `price_yyyyyyyyyyyyy`)

### **Step 3: Product Metadata (Recommended)**

Add metadata to Stripe product for tracking:
- `plan_tier`: `elite+`
- `feature_set`: `all_features`
- `includes_connectors`: `true`
- `max_users`: `unlimited`

---

## 🔐 **ENVIRONMENT VARIABLES**

### **Required Variables in `ai2-subscription-service/.env`:**

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Your Stripe secret key (live) or sk_test_... (test)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Webhook endpoint secret

# ELITE+ Price IDs (REQUIRED - from Step 2 above)
STRIPE_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx  # ELITE+ monthly price ID
STRIPE_PRICE_ID_YEARLY=price_yyyyyyyyyyyyy   # ELITE+ yearly price ID

# ELITE+ Product IDs (OPTIONAL - for validation)
STRIPE_PRODUCT_ID_ELITE_PLUS=prod_xxxxxxxxxxxxx  # ELITE+ product ID

# Existing Price IDs (for other tiers - if applicable)
STRIPE_PRICE_ID_MONTHLY_BASIC=price_zzzzzzzzzzzz  # Basic/Pro monthly (if separate)
STRIPE_PRICE_ID_YEARLY_BASIC=price_aaaaaaaaaaaa  # Basic/Pro yearly (if separate)

# Product Filtering (for subscription validation)
STRIPE_PRODUCT_ID_MONTHLY=prod_xxxxxxxxxxxxx  # Used in subscription.ts validation
STRIPE_PRODUCT_ID_YEARLY=prod_yyyyyyyyyyyyy   # Used in subscription.ts validation
STRIPE_PRODUCT_ID_ENTERPRISE=prod_zzzzzzzzzzzz # Alias for ELITE+ (for backward compatibility)
```

### **Environment Variable Usage in Code:**

**Location**: `ai2-subscription-service/src/services/subscription.ts`
```typescript
// Lines 58-68: Product filtering
private readonly VALID_PRODUCT_IDS = new Set([
  process.env.STRIPE_PRODUCT_ID_MONTHLY,
  process.env.STRIPE_PRODUCT_ID_YEARLY,
  process.env.STRIPE_PRODUCT_ID_ENTERPRISE  // ELITE+ uses this
].filter(Boolean));

private readonly VALID_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_ID_MONTHLY,
  process.env.STRIPE_PRICE_ID_YEARLY,
  process.env.STRIPE_PRICE_ID_ENTERPRISE  // ELITE+ price IDs
].filter(Boolean));
```

**Location**: `ai2-subscription-service/src/services/paymentCheckout.ts`
```typescript
// Lines 393-400: Price ID selection
const priceId = request.interval === 'year'
  ? process.env.STRIPE_PRICE_ID_YEARLY
  : process.env.STRIPE_PRICE_ID_MONTHLY;
```

---

## 🗄️ **DATABASE SCHEMA**

### **SubscriptionPlan Model** (Prisma)

**Location**: `ai2-subscription-service/prisma/schema.prisma`

```prisma
model SubscriptionPlan {
  id              String   @id @default(cuid())
  name            String   @unique  // 'AI2 ELITE+', 'AI2 Premium', etc.
  description     String?
  price           Float              // e.g., 49.00
  currency        String   @default("AUD")  // or "USD"
  interval        String   @default("month")  // 'month' or 'year'
  intervalCount   Int      @default(1)
  trialPeriodDays Int      @default(0)  // No trial for ELITE+
  features        String?  // JSON string of features
  isActive        Boolean  @default(true)
  
  // CRITICAL: Stripe Price ID mapping
  stripePriceId      String?  // Maps to STRIPE_PRICE_ID_MONTHLY or STRIPE_PRICE_ID_YEARLY
  
  // Other payment gateways (optional)
  gocardlessPlanCode String?
  iosProductId       String?
  androidSku         String?
  
  subscriptions   Subscription[]
  CheckoutSession CheckoutSession[]
}
```

### **Creating ELITE+ Plan in Database**

**Option 1: Via Prisma Seed** (`ai2-subscription-service/prisma/seed.ts`)
```typescript
await prisma.subscriptionPlan.upsert({
  where: { name: 'AI2 ELITE+' },
  update: {},
  create: {
    name: 'AI2 ELITE+',
    description: 'Full access with connectors, advanced analytics, and premium features',
    price: 49.00,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 0,
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || null,  // Map to monthly price
    features: JSON.stringify([
      'dashboard',
      'category_management',
      'travel_expenses',
      'patterns',
      'bank_import',
      'all_transactions',
      'expense_management',
      'custom_rules',
      'privacy_management',
      'email_processing',
      'ato_export',
      'ai_categorization',
      'ai_tax_analysis',
      'chat_file_upload',
      'budget_allocations',
      'tax_reports',
      'ai_assistant',
      'transactions_bills_analytics',
      'connectors',  // ELITE+ exclusive
      'admin_panel'
    ]),
    isActive: true
  }
});
```

**Option 2: Via SQL**
```sql
INSERT INTO subscription_plans (
  id, name, description, price, currency, interval, "intervalCount", 
  "trialPeriodDays", features, "isActive", "stripePriceId", "createdAt", "updatedAt"
) VALUES (
  'plan_elite_plus',
  'AI2 ELITE+',
  'Full access with connectors and premium features',
  49.00,
  'USD',
  'month',
  1,
  0,
  '["dashboard","category_management",...,"connectors","admin_panel"]'::TEXT,
  true,
  'price_xxxxxxxxxxxxx',  -- Your STRIPE_PRICE_ID_MONTHLY
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  "stripePriceId" = EXCLUDED."stripePriceId",
  "updatedAt" = NOW();
```

---

## 🔄 **SUBSCRIPTION FLOW**

### **1. User Initiates Checkout**

**Frontend**: `ai2-core-app/client/src/pages/Subscription.tsx`
```typescript
// User clicks "Subscribe to ELITE+" button
const startCheckout = async (plan: Plan) => {
  const resp = await api.post('/api/payment/checkout', {
    planId: plan.id,  // ELITE+ plan ID from database
    email: user?.email,
    name: `${user?.firstName} ${user?.lastName}`,
    interval: 'month' | 'year',
    paymentMethod: 'stripe',
    referralCode: optionalReferralCode
  });
};
```

### **2. Backend Creates Checkout Session**

**Location**: `ai2-subscription-service/src/services/paymentCheckout.ts`

**Flow**:
1. **Validate user doesn't have active subscription** (lines 196-208)
   - Checks for existing `active` or `trialing` subscriptions
   - **CRITICAL**: Users can only have ONE active subscription
   - Throws error if active subscription exists

2. **Get plan from database** (line 192)
   ```typescript
   const plan = await prisma.subscriptionPlan.findUnique({ 
     where: { id: request.planId } 
   });
   ```

3. **Determine Stripe Price ID** (lines 393-400)
   ```typescript
   const priceId = request.interval === 'year'
     ? process.env.STRIPE_PRICE_ID_YEARLY  // ELITE+ yearly
     : process.env.STRIPE_PRICE_ID_MONTHLY; // ELITE+ monthly
   ```

4. **Create Stripe Customer** (via `stripeService.createCustomer`)

5. **Create Stripe Subscription** (via `stripeService.createSubscriptionAndExtractInvoicePI`)
   ```typescript
   // Location: ai2-subscription-service/src/services/stripe.ts
   // Creates subscription with:
   // - customer: customerId
   // - items: [{ price: priceId }]  // ELITE+ price ID
   // - payment_behavior: 'default_incomplete'
   // - trial_period_days: 0  // No trial for ELITE+
   // - metadata: { source: 'ai2_platform', ...referralMetadata }
   ```

6. **Save Checkout Session to Database** (lines 265-280)

### **3. Payment Confirmation**

**Frontend**: User completes payment via Stripe Payment Element
```typescript
const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {},
  redirect: 'if_required'
});
```

### **4. Webhook Processing**

**Location**: `ai2-subscription-service/src/routes/payment.ts` (webhook handler)

**Events Handled**:
- `checkout.session.completed` → Creates subscription record
- `customer.subscription.created` → Activates subscription
- `customer.subscription.updated` → Updates subscription status
- `invoice.payment_succeeded` → Confirms payment
- `invoice.payment_failed` → Marks as past_due

**Flow** (lines 700-795):
1. **Extract Stripe subscription** from webhook
2. **Map Stripe price ID to database plan**:
   ```typescript
   // Try to find plan by stripePriceId
   mappedPlan = await prisma.subscriptionPlan.findFirst({
     where: { stripePriceId, isActive: true }
   });
   ```
3. **Create/Update subscription in database**:
   ```typescript
   await prisma.subscription.upsert({
     where: { userId },
     create: {
       userId,
       planId: mappedPlan.id,  // ELITE+ plan ID
       status: 'active',
       stripeSubscriptionId: stripeSubscription.id,
       stripeCustomerId: customerId,
       paymentGateway: 'stripe',
       currentPeriodStart: new Date(),
       currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
     }
   });
   ```

---

## 🔒 **SINGLE-PLAN CONSTRAINT**

### **Enforcement Points**

#### **1. Checkout Service** (`paymentCheckout.ts:196-208`)
```typescript
// Check for existing ACTIVE subscription
const existingActiveSubscription = await prisma.subscription.findFirst({
  where: {
    userId: request.userId,
    status: {
      in: ['active', 'trialing']  // Only block for truly active subscriptions
    }
  }
});

if (existingActiveSubscription) {
  throw new Error('You already have an active subscription. Please manage your existing subscription first.');
}
```

#### **2. Email Validation** (`paymentCheckout.ts:224-246`)
```typescript
// Also check by email to prevent duplicates
const existingCustomer = await prisma.stripeCustomer.findFirst({
  where: { email: request.email.toLowerCase() }
});

if (existingCustomer && existingCustomer.userId !== request.userId) {
  // Check if this customer has ACTIVE subscriptions
  const customerActiveSubscription = await prisma.subscription.findFirst({
    where: {
      userId: existingCustomer.userId,
      status: { in: ['active', 'trialing'] }
    }
  });
  
  if (customerActiveSubscription) {
    throw new Error('This email already has an active subscription.');
  }
}
```

#### **3. Database Constraint**
```prisma
model Subscription {
  userId String @unique  // ENFORCES one subscription per user
  // ...
}
```

### **Upgrade/Downgrade Flow**

**Current Implementation**: Users must **cancel** existing subscription before subscribing to a new plan.

**Recommended Enhancement**: Add upgrade/downgrade logic:
```typescript
// In paymentCheckout.ts, before blocking:
if (existingActiveSubscription) {
  // Check if user is upgrading/downgrading
  const existingPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: existingActiveSubscription.planId }
  });
  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: request.planId }
  });
  
  // If upgrading (e.g., from Pro to ELITE+), allow
  if (isUpgrade(existingPlan, newPlan)) {
    // Cancel old subscription and create new one
    await cancelSubscription(existingActiveSubscription.id);
    // Continue with new subscription...
  } else {
    throw new Error('Cancel existing subscription first');
  }
}
```

---

## 🎯 **FEATURE ACCESS FLOW**

### **1. Access Control Config**

**Location**: `ai2-core-app/src/services/accessControl/config.ts`

**ELITE+ Features** (lines 468-490):
```typescript
'elite+': [
  'dashboard',
  'category_management',
  'travel_expenses',
  'patterns',
  'bank_import',
  'all_transactions',
  'expense_management',
  'custom_rules',
  'privacy_management',
  'email_processing',
  'ato_export',
  'ai_categorization',
  'ai_tax_analysis',
  'chat_file_upload',
  'budget_allocations',
  'tax_reports',
  'ai_assistant',
  'transactions_bills_analytics',
  'connectors',  // ELITE+ EXCLUSIVE
  'admin_panel'
]
```

**Connectors Route** (lines 148-152):
```typescript
'/connectors': {
  auth: true,
  subscription: ['elite+'],  // ONLY elite+
  features: ['connectors']
}
```

### **2. Subscription Status Check**

**Location**: `ai2-subscription-service/src/services/subscription.ts`

**getUserSubscription()** (lines 196-400):
1. **Fetches subscription from database**
2. **Normalizes plan name** to 'elite+' (via `normalizeTierName()`)
3. **Returns subscription status**:
   ```typescript
   {
     isActive: true,
     planId: plan.id,
     planName: 'elite+',  // Normalized
     status: 'active',
     features: [...]
   }
   ```

### **3. Frontend Permission Check**

**Location**: `ai2-core-app/client/src/hooks/usePermissions.ts`

**Flow**:
1. **Calls `/api/subscription/status`** to get user subscription
2. **Checks plan name** against required tiers:
   ```typescript
   const hasAccess = (planName: string) => {
     return requiredTiers.includes(planName);  // e.g., ['elite+'].includes('elite+')
   };
   ```

### **4. Route Protection**

**Location**: `ai2-core-app/src/middleware/subscription.ts`

**enforceAccess()** middleware:
1. **Extracts user subscription** from request
2. **Checks route access config**:
   ```typescript
   const routeAccess = ACCESS_CONFIG.routes[routePath];
   if (routeAccess.subscription && !routeAccess.subscription.includes(userPlan)) {
     return res.status(403).json({ error: 'Subscription required' });
   }
   ```

---

## 💳 **CHECKOUT PROCESS**

### **Complete Flow Diagram**

```
User clicks "Subscribe to ELITE+"
         ↓
Frontend: Subscription.tsx → POST /api/payment/checkout
         ↓
Backend: paymentCheckout.ts → createCheckoutSession()
         ↓
1. Validate no active subscription
2. Get plan from database (ELITE+)
3. Select Stripe price ID (STRIPE_PRICE_ID_MONTHLY/YEARLY)
4. Create/get Stripe customer
5. Create Stripe subscription with price ID
6. Save checkout session to database
         ↓
Return clientSecret to frontend
         ↓
Frontend: Stripe Payment Element
         ↓
User completes payment
         ↓
Stripe Webhook: checkout.session.completed
         ↓
Backend: payment.ts → webhook handler
         ↓
1. Map Stripe price ID → database plan (ELITE+)
2. Create/update subscription record
3. Set status: 'active'
         ↓
User now has ELITE+ subscription
```

---

## 🔔 **WEBHOOK HANDLING**

### **Webhook Endpoint Configuration**

**Stripe Dashboard** → **Developers** → **Webhooks**

**Endpoint URL**: `https://[your-domain]/api/payment/webhook/stripe`

**Events to Listen For**:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**Signing Secret**: Copy from webhook details → Set as `STRIPE_WEBHOOK_SECRET`

### **Webhook Processing** (`payment.ts:webhook handler`)

**Flow**:
1. **Verify webhook signature** (line ~500)
2. **Extract event type** and subscription data
3. **Map Stripe price ID to database plan**:
   ```typescript
   // Find plan by stripePriceId
   const mappedPlan = await prisma.subscriptionPlan.findFirst({
     where: { stripePriceId: priceId, isActive: true }
   });
   ```
4. **Create/Update subscription**:
   ```typescript
   await prisma.subscription.upsert({
     where: { userId },
     create: { /* ... */ },
     update: { status: 'active', planId: mappedPlan.id }
   });
   ```
5. **Invalidate cache** (`invalidateCoreSubsCache(userId)`)

---

## 🚀 **MIGRATION STEPS**

### **Step 1: Create ELITE+ Product in Stripe**
1. Go to Stripe Dashboard → Products
2. Create product: "AI2 ELITE+"
3. Create monthly price (e.g., $49/month)
4. Create yearly price (e.g., $490/year)
5. **Copy Price IDs**

### **Step 2: Update Environment Variables**
```env
# Add to ai2-subscription-service/.env
STRIPE_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx  # ELITE+ monthly
STRIPE_PRICE_ID_YEARLY=price_yyyyyyyyyyyyy   # ELITE+ yearly
STRIPE_PRODUCT_ID_ENTERPRISE=prod_xxxxxxxxxxxxx  # ELITE+ product ID
```

### **Step 3: Create ELITE+ Plan in Database**
```sql
-- Run this SQL in your database
INSERT INTO subscription_plans (
  name, description, price, currency, interval, 
  "trialPeriodDays", features, "isActive", "stripePriceId"
) VALUES (
  'AI2 ELITE+',
  'Full access with connectors and premium features',
  49.00,
  'USD',
  'month',
  0,
  '["dashboard","category_management",...,"connectors","admin_panel"]'::TEXT,
  true,
  'price_xxxxxxxxxxxxx'  -- Your STRIPE_PRICE_ID_MONTHLY
);
```

### **Step 4: Update Subscription Service Validation**
Ensure `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` include ELITE+ price IDs in `subscription.ts:VALID_PRICE_IDS`.

### **Step 5: Test Flow**
1. **Create test user**
2. **Initiate checkout** with ELITE+ plan ID
3. **Complete payment** (use Stripe test cards)
4. **Verify webhook** creates subscription
5. **Check feature access** (connectors should be unlocked)

---

## ✅ **CHECKLIST**

### **Stripe Configuration**
- [ ] ELITE+ product created in Stripe Dashboard
- [ ] Monthly price created and Price ID copied
- [ ] Yearly price created and Price ID copied
- [ ] Webhook endpoint configured
- [ ] Webhook signing secret copied

### **Environment Variables**
- [ ] `STRIPE_SECRET_KEY` set (live or test)
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `STRIPE_PRICE_ID_MONTHLY` = ELITE+ monthly price ID
- [ ] `STRIPE_PRICE_ID_YEARLY` = ELITE+ yearly price ID
- [ ] `STRIPE_PRODUCT_ID_ENTERPRISE` = ELITE+ product ID (optional)

### **Database**
- [ ] ELITE+ plan created in `subscription_plans` table
- [ ] `stripePriceId` mapped to monthly price ID
- [ ] Features JSON includes all ELITE+ features including `connectors`
- [ ] `isActive` = true

### **Code Verification**
- [ ] `paymentCheckout.ts` uses `STRIPE_PRICE_ID_MONTHLY/YEARLY`
- [ ] `subscription.ts` validates ELITE+ price IDs in `VALID_PRICE_IDS`
- [ ] Webhook handler maps price ID to ELITE+ plan
- [ ] Access control config includes `connectors` in ELITE+ plan features
- [ ] Single-plan constraint enforced (userId unique in Subscription)

### **Testing**
- [ ] Checkout flow works for ELITE+
- [ ] Payment completion triggers webhook
- [ ] Subscription created in database
- [ ] User can access `/connectors` route
- [ ] ELITE+ badge shows in UI (blue styling)
- [ ] User cannot subscribe to multiple plans simultaneously

---

## 🐛 **TROUBLESHOOTING**

### **Issue: "Stripe price ID not configured"**
**Solution**: Ensure `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` are set in `.env`

### **Issue: "You already have an active subscription"**
**Solution**: This is expected behavior - users can only have one active plan. Cancel existing subscription first, or implement upgrade logic.

### **Issue: "Plan not found"**
**Solution**: Ensure ELITE+ plan exists in database and `stripePriceId` matches the price ID from Stripe.

### **Issue: "Connectors still locked for ELITE+ user"**
**Solution**: 
1. Check subscription status: `/api/subscription/status`
2. Verify plan name is normalized to `'elite+'`
3. Check access control config includes `connectors` in ELITE+ plan
4. Clear cache: `invalidateCoreSubsCache(userId)`

---

## 📝 **NOTES**

- **Single Plan Constraint**: Enforced at database level (`userId` unique) and application level (checkout validation)
- **Plan Mapping**: Stripe Price ID → Database Plan via `stripePriceId` field
- **Feature Gating**: Access control config (`config.ts`) is the source of truth
- **Webhook Critical**: Webhooks must be configured correctly for subscriptions to activate
- **No Trial**: ELITE+ has `trialPeriodDays: 0` - payment required immediately

---

**Last Updated**: 2025-01-20  
**embracingearth.space** - Enterprise subscription management

