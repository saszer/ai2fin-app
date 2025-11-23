# 🚨 Upgrade Access Gap Audit

**Date:** 2025-01-27  
**Issue:** User loses access during Premium → ELITE+ upgrade transition  
**Status:** ❌ **CRITICAL BUG FOUND**

---

## 🔍 **PROBLEM SCENARIO**

### **Current Flow:**
1. User has **active Premium** subscription
2. User clicks "Upgrade to ELITE+"
3. System **immediately cancels** Premium subscription (line 230-246)
4. System creates **new ELITE+ subscription** with status `'incomplete'` or `'pending'`
5. User completes payment in Stripe
6. Webhook confirms payment → status becomes `'active'`

### **The Gap:**
```
Time 0: Premium active ✅
Time 1: Premium canceled ❌ + ELITE+ incomplete ❌
Time 2: Payment processing... ❌
Time 3: Payment confirmed → ELITE+ active ✅
```

**Result:** User has **NO ACCESS** between Time 1 and Time 3 (payment processing window)

---

## 📊 **CODE ANALYSIS**

### **1. Old Subscription Cancellation (paymentCheckout.ts:227-246)**

```typescript
// Cancel old subscription in Stripe immediately (for upgrade/downgrade)
const stripeSubId = (existingActiveSubscription as any).stripeSubscriptionId;
if (stripeSubId) {
  await stripeService.cancelSubscription(
    stripeSubId,
    false // Cancel immediately, not at period end ← PROBLEM!
  );
}

// Update database: Mark old subscription as canceled
await prisma.subscription.update({
  where: { id: existingActiveSubscription.id },
  data: {
    status: 'canceled', // ← User loses access immediately
    canceledAt: new Date(),
    cancelAtPeriodEnd: false,
    updatedAt: new Date()
  }
});
```

**Problem:** Old subscription is canceled **immediately**, before new one is confirmed.

---

### **2. New Subscription Creation (paymentCheckout.ts:515-646)**

```typescript
// Creates subscription with status 'incomplete' or 'pending'
const subscription = await stripeService.createSubscriptionAndExtractInvoicePI(
  customerId!,
  priceId,
  request.interval,
  0, // No trial
  referralMetadata
);

// Database record created with status 'incomplete'
await prisma.subscription.create({
  data: {
    userId: request.userId,
    planId: plan.id,
    status: 'incomplete', // ← Not active yet!
    stripeSubscriptionId: subscription.id,
    // ...
  }
});
```

**Problem:** New subscription is created with `'incomplete'` status, which doesn't grant access.

---

### **3. Access Control Check (accessControl/index.ts:194)**

```typescript
const isActive = user?.subscription?.isActive === true;

if (!isActive && !routeAllowsFree) {
  return { allowed: false, reason: 'Subscription inactive' };
}
```

**Problem:** `isActive` is `false` for `'incomplete'` or `'pending'` subscriptions.

---

### **4. Grace Period (subscription.ts:299-313)**

```typescript
const PENDING_GRACE_MS = Number(process.env.SUBS_PENDING_GRACE_MS || 300000); // 5 minutes
if (!isActive && subscription.status === 'pending_activation') {
  const ageMs = Date.now() - updatedAt.getTime();
  if (ageMs >= 0 && ageMs <= PENDING_GRACE_MS) {
    isActive = true; // Temporarily allow while activation completes
  }
}
```

**Problem:** Grace period only works for `'pending_activation'`, not `'incomplete'` or `'pending'`.

---

## ✅ **SOLUTIONS**

### **Option 1: Keep Old Subscription Active Until New One Confirms (RECOMMENDED)**

**Strategy:** Don't cancel old subscription immediately. Instead:
1. Mark old subscription as `'canceling'` (new status)
2. Create new subscription
3. When new subscription becomes `'active'`, then cancel old one
4. Access control checks for either `'active'` OR `'canceling'` subscriptions

**Pros:**
- User never loses access
- Clean transition
- No grace period needed

**Cons:**
- More complex state management
- Need to handle edge cases (what if payment fails?)

---

### **Option 2: Extend Grace Period for Incomplete Subscriptions**

**Strategy:** Extend grace period to cover `'incomplete'` and `'pending'` statuses during upgrades.

**Implementation:**
```typescript
// Check if this is an upgrade scenario
const isUpgradeScenario = existingActiveSubscription && 
  compareTiers(existingPlan.name, newPlan.name) === 'upgrade';

if (isUpgradeScenario && subscription.status === 'incomplete') {
  // Allow access during upgrade transition (5 minutes grace)
  const ageMs = Date.now() - updatedAt.getTime();
  if (ageMs <= PENDING_GRACE_MS) {
    isActive = true;
  }
}
```

**Pros:**
- Simple implementation
- Minimal code changes

**Cons:**
- Still a gap if payment takes > 5 minutes
- User might see "Activating..." message

---

### **Option 3: Cancel at Period End Instead of Immediately**

**Strategy:** Cancel old subscription at period end, not immediately.

**Implementation:**
```typescript
await stripeService.cancelSubscription(
  stripeSubId,
  true // Cancel at period end, not immediately
);
```

**Pros:**
- User keeps access until period ends
- Natural transition

**Cons:**
- User might be charged for both subscriptions
- Not ideal for upgrades (user wants immediate access to new tier)

---

## 🎯 **RECOMMENDED FIX**

**Use Option 1** with modifications:

1. **Add `'canceling'` status** to subscription status enum
2. **Keep old subscription active** during upgrade
3. **Mark as `'canceling'`** instead of `'canceled'`
4. **Access control allows** both `'active'` and `'canceling'` subscriptions
5. **Cancel old subscription** only after new one is confirmed `'active'`

**Implementation:**
- Update Prisma schema to add `'canceling'` status
- Modify `paymentCheckout.ts` to use `'canceling'` instead of `'canceled'`
- Update access control to allow `'canceling'` subscriptions
- Add cleanup job to cancel `'canceling'` subscriptions after new one is active

---

**embracingearth.space - Enterprise subscription upgrade audit**

