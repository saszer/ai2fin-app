# 🔧 Stripe Setup Guide - No Trial, Immediate Payment

## 📋 **Environment Variables Required**

### **In `ai2-subscription-service/.env`:**

```env
# Stripe Configuration (REQUIRED)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Webhook endpoint secret

# Stripe Price IDs (REQUIRED)
STRIPE_PRICE_ID_MONTHLY=price_1RzZSRLs39ChsYkALp8dR8zl  # Your monthly price ID
STRIPE_PRICE_ID_YEARLY=price_xxxxxxxxxxxxx              # Your yearly price ID
```

## 🎯 **Creating Stripe Products & Prices**

### **Step 1: Create Product in Stripe Dashboard**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Click **"+ Add product"**
3. Enter:
   - Product name: `AI2 Premium`
   - Description: `Full access to AI2 Platform features`
4. Save

### **Step 2: Create Recurring Prices**

#### **Monthly Price:**
1. In the product, click **"Add price"**
2. Select:
   - Pricing model: **Standard pricing**
   - Price: `23.00 USD`
   - Billing period: **Monthly**
3. Save and copy the Price ID (e.g., `price_1RzZSRLs39ChsYkALp8dR8zl`)

#### **Yearly Price:**
1. Click **"Add another price"**
2. Select:
   - Pricing model: **Standard pricing**
   - Price: `222.00 USD`
   - Billing period: **Yearly**
3. Save and copy the Price ID

### **Step 3: Configure Webhook**
1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter:
   - Endpoint URL: `https://your-app.fly.dev/api/payment/webhook/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Copy the **Signing secret** (starts with `whsec_`)

## ❌ **NO TRIAL PERIOD**

The system is configured for **immediate payment**:
- Trial days set to `0` in all code paths
- No `trial_period_days` field sent to Stripe
- Payment required immediately upon subscription

## 🔍 **Verification Checklist**

### **1. Check Price Configuration:**
```bash
# In your .env file, ensure you have:
STRIPE_PRICE_ID_MONTHLY=price_xxxxx  # Your actual monthly price ID
STRIPE_PRICE_ID_YEARLY=price_xxxxx   # Your actual yearly price ID
```

### **2. Verify No Trial in Code:**
- ✅ `paymentCheckout.ts`: `trialDays = 0`
- ✅ `stripe.ts`: No `trial_period_days` unless explicitly > 0
- ✅ `subscription.ts`: `trialPeriodDays: 0` in plan

### **3. Test Subscription Creation:**
```bash
# Check logs for:
"💳 Creating Stripe subscription:"
# Should show: trialDays: 0
```

## 🚨 **Common Issues & Fixes**

### **Issue: Charged but no subscription shows**
**Cause**: Using one-time price or `mode: 'payment'` instead of `mode: 'subscription'`
**Fix**: Ensure using recurring price IDs and subscription mode

### **Issue: Trial period still showing**
**Cause**: Old price has trial configured in Stripe
**Fix**: Create new price without trial in Stripe Dashboard

### **Issue: Subscription not activating**
**Cause**: Webhook not configured or secret mismatch
**Fix**: 
1. Check webhook endpoint in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches
3. Check webhook events in Stripe Dashboard → Webhooks → Event log

## 📊 **Database Check**

After successful payment, check subscription status:

```sql
-- In subscription-service database
SELECT 
  id,
  user_id,
  status,
  stripe_subscription_id,
  current_period_end
FROM subscription
WHERE user_id = 'USER_ID_HERE';
```

Status should be `active` or `trialing` (but with immediate payment).

## 🔄 **Manual Sync Command**

If subscription exists in Stripe but not showing as active:

```bash
# Sync specific user
curl -X POST https://your-app.fly.dev/api/subscription/admin/sync-user \
  -H "X-Service-Token: YOUR_SERVICE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_HERE"}'

# Sync all users
curl -X POST https://your-app.fly.dev/api/subscription/admin/sync-stripe \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

## ✅ **Summary**

1. **Set environment variables** with your Stripe price IDs
2. **No trial period** - immediate payment required
3. **Webhook configured** for real-time updates
4. **Manual sync available** as fallback

---

*embracingearth.space - Subscription System*
*Last Updated: [Current Date]*
