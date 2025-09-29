# 📊 Subscription Analytics Events Documentation

## **Custom Events Added for Subscription Bug Fix Tracking**

### **🎯 Overview**
Enhanced Google Analytics tracking with comprehensive subscription events to monitor the payment verification security fix and overall subscription health.

**Google Analytics ID**: `x 
**Platform**: ai2fin.com  
**Security Enhancement**: Bug Fix 2025 - Payment Verification Before Activation

---

## **📈 New Analytics Events**

### **1. Checkout & Payment Flow Events**

#### `checkout_initiated`
**Triggered**: When user starts subscription checkout process
```typescript
{
  plan_name: string,        // "Premium Monthly" | "Premium Yearly"
  plan_price: number,       // 23.00 | 222.00
  payment_method: string,   // "stripe" | "gocardless"
  interval: string,         // "monthly" | "yearly"
  currency: "USD",
  savings_percentage: number // 19.6 for yearly, 0 for monthly
}
```

#### `payment_processing_started`
**Triggered**: When payment processing begins
```typescript
{
  checkout_session_id: string,
  payment_method: string,
  processing_stage: "initial"
}
```

### **2. Payment Verification Events (Security Fix)**

#### `payment_verification_attempted`
**Triggered**: When system attempts to verify payment completion
```typescript
{
  checkout_session_id: string,
  stripe_status: string,
  verification_method: "payment_intent_check",
  security_enhancement: "bug_fix_2025"
}
```

#### `payment_verification_success`
**Triggered**: When payment is successfully verified
```typescript
{
  checkout_session_id: string,
  payment_intent_status: "succeeded",
  verification_time: number,
  security_enhancement: "bug_fix_2025"
}
```

#### `payment_verification_failed`
**Triggered**: When payment verification fails
```typescript
{
  checkout_session_id: string,
  failure_reason: string,
  stripe_status: string,
  security_enhancement: "bug_fix_2025"
}
```

### **3. Subscription Activation Events**

#### `subscription_activated`
**Triggered**: When subscription is activated after verified payment
```typescript
{
  subscription_id: string,
  plan_name: string,
  plan_price: number,
  payment_method: string,
  currency: "USD",
  activation_method: "verified_payment",
  security_enhancement: "bug_fix_2025"
}
```

#### `subscription_status_checked`
**Triggered**: When subscription status is checked
```typescript
{
  user_id: string,
  is_active: boolean,
  status: string,
  check_source: string, // "status_chip" | "middleware" | "payment_flow"
  timestamp: number
}
```

### **4. Access Control Events**

#### `subscription_locked`
**Triggered**: When user is blocked from accessing premium feature
```typescript
{
  feature: string,
  lock_reason: string,
  user_id: string,
  security_enhancement: "bug_fix_2025"
}
```

#### `subscription_unlocked`
**Triggered**: When user gains access to premium feature
```typescript
{
  feature: string,
  user_id: string,
  verification_method: string,
  security_enhancement: "bug_fix_2025"
}
```

### **5. Webhook & System Events**

#### `webhook_received`
**Triggered**: When Stripe webhook is processed
```typescript
{
  event_type: string,
  subscription_id: string,
  new_status: string,
  processing_method: "enhanced_webhook_handler"
}
```

#### `grace_period_used`
**Triggered**: When grace period is utilized
```typescript
{
  user_id: string,
  duration_seconds: number,
  reason: string,
  max_duration: 300, // 5 minutes
  security_enhancement: "bug_fix_2025"
}
```

---

## **🔧 Implementation Details**

### **Frontend Integration**
- **SubscriptionRequired.tsx**: Tracks checkout, payment verification, and activation
- **SubscriptionStatusChip.tsx**: Tracks status checks and polling
- **LockedPageWrapper.tsx**: Tracks lock/unlock events

### **Backend Integration**
- **stripe.ts**: Tracks webhook processing and status updates
- **paymentCheckout.ts**: Tracks payment confirmation flow
- **subscription.ts**: Tracks subscription service operations

### **Analytics Dashboard**
- **SubscriptionAnalytics.tsx**: Real-time dashboard for monitoring events
- Metrics tracking: conversion rates, payment times, success rates
- Event timeline with detailed breakdowns

---

## **📊 Key Metrics Tracked**

### **Conversion Funnel**
1. **Checkout Initiated** → **Payment Processing** → **Verification** → **Activation**
2. **Success Rate**: Successful activations / Total checkouts
3. **Payment Time**: Average time from checkout to activation
4. **Failure Points**: Where users drop off in the process

### **Security Metrics**
1. **Payment Verification Rate**: How often verification succeeds/fails
2. **Lock Events**: Frequency of access denials
3. **Grace Period Usage**: How often grace period is needed
4. **Webhook Processing**: Success rate of webhook events

---

## **🎯 Business Intelligence**

### **Revenue Tracking**
- Conversion rates by plan type
- Payment method preferences
- Seasonal trends in subscriptions
- Churn analysis through status checks

### **Security Monitoring**
- Failed payment attempts
- Unusual verification patterns
- Access control violations
- System health through webhook processing

### **User Experience**
- Payment processing times
- Checkout abandonment points
- Feature usage patterns
- Support ticket correlation

---

## **🚀 Usage Examples**

### **Track Custom Events**
```typescript
import { SubscriptionEvents } from '../utils/analytics';

// Track plan selection
SubscriptionEvents.planSelected('Premium Monthly', 23.00, 'monthly');

// Track checkout initiation
SubscriptionEvents.checkoutInitiated('Premium Monthly', 23.00, 'stripe', 'monthly');

// Track payment verification
SubscriptionEvents.paymentVerificationSuccess('cs_test_123', 'succeeded');
```

### **Monitor in Google Analytics**
1. Go to **Events** → **All events**
2. Filter by event name (e.g., `payment_verification_success`)
3. View parameters and conversion paths
4. Set up custom dashboards for subscription metrics

---

## **🔍 Debugging & Monitoring**

### **Event Debugging**
```typescript
// Enable debug mode in console
localStorage.setItem('analytics_debug', 'true');

// View all subscription events
console.log('Subscription Events:', window.dataLayer.filter(e => 
  e[0] === 'event' && e[1].includes('subscription')
));
```

### **Health Checks**
- Monitor `payment_verification_failed` events for payment issues
- Track `subscription_locked` events for access control problems
- Watch `webhook_received` events for system health
- Alert on high failure rates in verification process

---

**ai2fin.com** - Comprehensive subscription analytics for security and business intelligence 🎉
