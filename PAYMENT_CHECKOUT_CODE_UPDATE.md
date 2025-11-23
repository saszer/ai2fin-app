# 🔧 Payment Checkout Code Update for Multiple Plans

**Update required to support both Premium and ELITE+ plans**

---

## 🎯 **CURRENT ISSUE**

The current code in `paymentCheckout.ts` uses generic environment variables that were configured for **Premium**:

```typescript
// Current code (lines 392-395)
const priceId = request.interval === 'year'
  ? process.env.STRIPE_PRICE_ID_YEARLY   // Premium yearly
  : process.env.STRIPE_PRICE_ID_MONTHLY; // Premium monthly
```

**Problem**: This doesn't differentiate between Premium and ELITE+ plans. It always uses the same price IDs regardless of which plan the user selects.

---

## ✅ **RECOMMENDED FIX**

Update the code to use the plan's `stripePriceId` from the database, with fallback to environment variables:

### **File**: `ai2-subscription-service/src/services/paymentCheckout.ts`

### **Current Code** (around line 392):

```typescript
// Get the correct price ID based on interval
const priceId = request.interval === 'year'
  ? process.env.STRIPE_PRICE_ID_YEARLY
  : process.env.STRIPE_PRICE_ID_MONTHLY;
```

### **Updated Code**:

```typescript
// Get the correct price ID from plan's stripePriceId (preferred) or fallback to env vars
let priceId: string | undefined;

// First, try to use the plan's stored stripePriceId
if (plan.stripePriceId) {
  priceId = plan.stripePriceId;
  console.log(`✅ Using plan's stripePriceId: ${priceId} for plan: ${plan.name}`);
} else {
  // Fallback to environment variables (for backward compatibility)
  priceId = request.interval === 'year'
    ? process.env.STRIPE_PRICE_ID_YEARLY
    : process.env.STRIPE_PRICE_ID_MONTHLY;
  console.log(`⚠️ Plan ${plan.name} has no stripePriceId, using env var fallback: ${priceId}`);
}

if (!priceId) {
  console.error('❌ Stripe price ID not configured for', request.interval);
  throw new Error(`Stripe price ID not configured for ${request.interval} billing`);
}
```

---

## 📋 **ALTERNATIVE: Support Yearly/Monthly Variants**

If you want separate monthly and yearly plans in the database:

### **Option 1: Separate Plans (Recommended)**

Create separate plan entries:
- `AI2 ELITE+` (monthly) → `stripePriceId: price_xxxxx_monthly`
- `AI2 ELITE+ (Yearly)` (yearly) → `stripePriceId: price_xxxxx_yearly`
- `AI2 Premium` (monthly) → `stripePriceId: price_yyyyy_monthly`
- `AI2 Premium (Yearly)` (yearly) → `stripePriceId: price_yyyyy_yearly`

Then the code becomes simpler:
```typescript
// Plan already has the correct stripePriceId (monthly or yearly)
const priceId = plan.stripePriceId;
```

### **Option 2: Single Plan with Interval Logic**

Keep one plan entry but store both price IDs in metadata or use interval to select:

```typescript
// Store price IDs in plan metadata or separate fields
const priceId = request.interval === 'year'
  ? plan.stripePriceIdYearly || plan.stripePriceId  // If separate field
  : plan.stripePriceId;
```

---

## 🔍 **VERIFICATION**

After updating:

1. **Test Premium checkout**:
   - Select Premium plan
   - Verify it uses Premium price ID from database
   - Complete payment
   - Verify subscription created correctly

2. **Test ELITE+ checkout**:
   - Select ELITE+ plan
   - Verify it uses ELITE+ price ID from database
   - Complete payment
   - Verify subscription created correctly

3. **Test single subscription constraint**:
   - User with active Premium subscription
   - Try to subscribe to ELITE+
   - Should receive error: "You already have an active subscription"

---

## 📊 **ENVIRONMENT VARIABLES**

**Keep existing** (for Premium fallback):
```env
STRIPE_PRICE_ID_MONTHLY=price_xxxxx  # Premium monthly
STRIPE_PRICE_ID_YEARLY=price_yyyyy   # Premium yearly
```

**Add new** (for ELITE+ validation):
```env
STRIPE_PRICE_ID_MONTHLY_ELITE_PLUS=price_zzzzz  # ELITE+ monthly
STRIPE_PRICE_ID_YEARLY_ELITE_PLUS=price_aaaaa   # ELITE+ yearly
```

**Note**: These new variables are for validation in `subscription.ts` `VALID_PRICE_IDS` set, not for checkout (checkout uses database `stripePriceId`).

---

## ✅ **SUMMARY**

1. ✅ **Update `paymentCheckout.ts`** to use `plan.stripePriceId` from database
2. ✅ **Store price IDs** in database plan records (`stripePriceId` field)
3. ✅ **Keep env vars** for backward compatibility and validation
4. ✅ **Test both plans** to ensure correct price IDs are used

---

**Built with ❤️ for [embracingearth.space](https://embracingearth.space)**

*Enterprise-grade subscription management*

