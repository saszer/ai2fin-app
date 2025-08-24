# 🔒 Feature Access Security Audit & Token Structure Implementation

## 🚨 **CURRENT SECURITY ANALYSIS**

### **1. Authentication Flow (Frontend → Backend)**

#### **Current Implementation:**
```
Frontend (React) → API Call with Bearer Token → Backend Auth Middleware → User Context → Route Handler
```

#### **Security Layers:**
1. **Frontend**: `SubscriptionRequired` wrapper (UI only - CAN BE BYPASSED)
2. **Backend Auth**: `authenticateToken` middleware (JWT/OIDC verification)
3. **Access Control**: `AccessControlService` (centralized permission checks)
4. **Database**: User provisioning via `ensureUser` middleware

### **2. Current Vulnerabilities & Fixes**

#### **⚠️ VULNERABILITY 1: Frontend-Only Gating**
**Issue**: `SubscriptionRequired` component only hides UI - users can bypass via:
- Browser DevTools (removing component)
- Direct API calls (Postman/curl)
- Modified JavaScript

**✅ FIX IMPLEMENTED**: Backend enforces access via:
```typescript
// ai2-core-app/src/services/accessControl/config.ts
'/api/bank': { 
  auth: true, 
  subscription: ['basic', 'pro', 'elite+'],
  features: ['bank_import'] 
}
```

#### **⚠️ VULNERABILITY 2: Inconsistent Middleware Usage**
**Issue**: Some routes use `authenticateToken` only, missing subscription checks

**🔧 FIX NEEDED**: 
```typescript
// WRONG - Only checks authentication
router.post('/api/ai/categorize', authenticateToken, handler);

// CORRECT - Checks auth + subscription + features
router.post('/api/ai/categorize', 
  authenticateToken, 
  enforceAccess(), // This checks subscription/features
  handler
);
```

#### **✅ STRENGTH: Centralized Access Control**
- Single source of truth: `AccessControlService`
- Route-based permissions in `config.ts`
- Feature flags and plan requirements

### **3. Security Audit Results**

| Component | Security Level | Issues | Action Required |
|-----------|---------------|---------|-----------------|
| **Authentication** | ✅ Strong | JWT + OIDC support | None |
| **Frontend Gating** | ⚠️ UI Only | Can be bypassed | Backend enforcement exists |
| **Backend Routes** | ⚠️ Partial | Some routes missing `enforceAccess()` | Add middleware to AI routes |
| **Access Control** | ✅ Strong | Centralized config | None |
| **Subscription Check** | ✅ Good | Real-time Stripe sync | Working |
| **Token/Quota System** | ❌ Missing | Not implemented | **IMPLEMENT NOW** |

## 🎯 **TOKEN/QUOTA STRUCTURE IMPLEMENTATION**

### **1. Database Schema Addition**

```prisma
// ai2-core-app/prisma/schema.prisma

model UserQuota {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  // AI Token Quotas (per month)
  aiTokensLimit   Int      @default(0)     // Monthly limit based on plan
  aiTokensUsed    Int      @default(0)     // Current month usage
  
  // Feature-specific quotas
  bankImportsLimit    Int  @default(0)
  bankImportsUsed     Int  @default(0)
  
  exportLimit         Int  @default(0)
  exportUsed          Int  @default(0)
  
  customRulesLimit    Int  @default(0)
  customRulesUsed     Int  @default(0)
  
  // Reset tracking
  lastResetAt     DateTime @default(now())
  nextResetAt     DateTime
  
  // Audit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([nextResetAt])
}

model UsageLog {
  id          String   @id @default(cuid())
  userId      String
  feature     String   // 'ai_categorization', 'ai_tax', 'bank_import', etc.
  tokens      Int      @default(1)
  metadata    Json?    // Additional context
  timestamp   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  @@index([userId, feature, timestamp])
}
```

### **2. Quota Configuration by Plan**

```typescript
// ai2-core-app/src/services/quotaService.ts

export const PLAN_QUOTAS = {
  free: {
    aiTokensLimit: 0,        // No AI access
    bankImportsLimit: 0,     // No bank imports
    exportLimit: 0,          // No exports
    customRulesLimit: 0      // No custom rules
  },
  trial: {
    aiTokensLimit: 100,      // 100 AI calls for trial
    bankImportsLimit: 1,     // 1 bank import
    exportLimit: 1,          // 1 export
    customRulesLimit: 3      // 3 custom rules
  },
  basic: {
    aiTokensLimit: 500,      // 500 AI calls/month
    bankImportsLimit: 10,    // 10 bank imports/month
    exportLimit: 5,          // 5 exports/month
    customRulesLimit: 10     // 10 custom rules
  },
  pro: {
    aiTokensLimit: 2000,     // 2000 AI calls/month
    bankImportsLimit: 50,    // 50 bank imports/month
    exportLimit: 20,         // 20 exports/month
    customRulesLimit: 50     // 50 custom rules
  },
  'elite+': {
    aiTokensLimit: 10000,    // 10000 AI calls/month
    bankImportsLimit: -1,    // Unlimited (-1)
    exportLimit: -1,         // Unlimited
    customRulesLimit: -1     // Unlimited
  }
};
```

### **3. Quota Service Implementation**

```typescript
// ai2-core-app/src/services/quotaService.ts

export class QuotaService {
  async checkQuota(userId: string, feature: string, tokensNeeded: number = 1): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetDate: Date;
  }> {
    // Get user's quota
    const quota = await prisma.userQuota.findUnique({ where: { userId } });
    
    // Get user's plan
    const subscription = await this.getSubscription(userId);
    const plan = subscription?.plan || 'free';
    const limits = PLAN_QUOTAS[plan];
    
    // Check specific feature
    const limitKey = `${feature}Limit`;
    const usedKey = `${feature}Used`;
    
    const limit = limits[limitKey] || 0;
    const used = quota?.[usedKey] || 0;
    
    // Unlimited check
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1, resetDate: quota?.nextResetAt };
    }
    
    // Check if within quota
    const remaining = limit - used;
    const allowed = remaining >= tokensNeeded;
    
    return { allowed, remaining, limit, resetDate: quota?.nextResetAt };
  }
  
  async consumeQuota(userId: string, feature: string, tokens: number = 1): Promise<void> {
    // Update usage
    await prisma.userQuota.update({
      where: { userId },
      data: {
        [`${feature}Used`]: { increment: tokens }
      }
    });
    
    // Log usage
    await prisma.usageLog.create({
      data: { userId, feature, tokens }
    });
  }
  
  async resetMonthlyQuotas(): Promise<void> {
    // Run monthly via cron
    const now = new Date();
    await prisma.userQuota.updateMany({
      where: { nextResetAt: { lte: now } },
      data: {
        aiTokensUsed: 0,
        bankImportsUsed: 0,
        exportUsed: 0,
        customRulesUsed: 0,
        lastResetAt: now,
        nextResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    });
  }
}
```

### **4. Middleware Integration**

```typescript
// ai2-core-app/src/middleware/quotaCheck.ts

export function requireQuota(feature: string, tokens: number = 1) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const quotaService = new QuotaService();
    const check = await quotaService.checkQuota(userId, feature, tokens);
    
    if (!check.allowed) {
      return res.status(429).json({
        error: 'Quota exceeded',
        feature,
        limit: check.limit,
        remaining: check.remaining,
        resetDate: check.resetDate,
        upgradeUrl: '/subscription'
      });
    }
    
    // Attach quota info to request
    req.quota = check;
    
    // Consume quota after successful response
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await quotaService.consumeQuota(userId, feature, tokens);
      }
    });
    
    next();
  };
}
```

### **5. Route Protection Examples**

```typescript
// ai2-core-app/src/routes/ai.ts

// AI Categorization - consumes tokens
router.post('/categorize',
  authenticateToken,
  enforceAccess(),           // Check subscription
  requireQuota('aiTokens', 1), // Check & consume quota
  async (req, res) => {
    // AI categorization logic
    res.json({ 
      success: true,
      quotaRemaining: req.quota.remaining - 1 
    });
  }
);

// Bank Import - limited by plan
router.post('/bank/import',
  authenticateToken,
  enforceAccess(),
  requireQuota('bankImports', 1),
  async (req, res) => {
    // Import logic
  }
);
```

### **6. Frontend Integration**

```typescript
// ai2-core-app/client/src/hooks/useQuota.ts

export function useQuota() {
  const [quotas, setQuotas] = useState({});
  
  const checkQuota = async (feature: string) => {
    const response = await api.get(`/api/quota/${feature}`);
    return response.data;
  };
  
  const getQuotaDisplay = (feature: string) => {
    const quota = quotas[feature];
    if (!quota) return 'Loading...';
    if (quota.limit === -1) return 'Unlimited';
    return `${quota.remaining}/${quota.limit} remaining`;
  };
  
  return { checkQuota, getQuotaDisplay, quotas };
}

// Usage in component
function AICategorizationButton() {
  const { checkQuota, getQuotaDisplay } = useQuota();
  
  return (
    <Button onClick={handleCategorize}>
      Categorize with AI
      <Chip label={getQuotaDisplay('aiTokens')} />
    </Button>
  );
}
```

## 📊 **IMPLEMENTATION CHECKLIST**

### **Immediate Actions (Security Critical):**
- [ ] Add `enforceAccess()` middleware to ALL premium routes
- [ ] Add quota tables to database schema
- [ ] Implement `QuotaService` class
- [ ] Add `requireQuota()` middleware
- [ ] Test bypass attempts

### **Configuration Needed:**
```env
# ai2-core-app/.env
QUOTA_RESET_DAY=1  # Day of month to reset quotas
AI_TOKEN_COST=1    # Tokens per AI call
```

### **Routes Requiring Quota Protection:**
1. `/api/ai/categorize` - AI categorization
2. `/api/ai/tax-analysis` - Tax deductibility
3. `/api/bank/import` - Bank imports
4. `/api/export/*` - All export endpoints
5. `/api/custom-rules` - Custom rule creation

## 🎯 **SECURITY RECOMMENDATIONS**

### **1. Immediate Fixes:**
```typescript
// Add to ALL AI routes
router.use('/api/ai/*', authenticateToken, enforceAccess(), requireQuota('aiTokens'));
```

### **2. Rate Limiting:**
```typescript
// Add global rate limiting
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many AI requests'
});

router.use('/api/ai/*', aiLimiter);
```

### **3. Audit Logging:**
```typescript
// Log all quota consumption
await prisma.usageLog.create({
  data: {
    userId,
    feature: 'ai_categorization',
    tokens: 1,
    metadata: { endpoint: req.path, ip: req.ip }
  }
});
```

## ✅ **SUMMARY**

### **Current Security:**
- ✅ Authentication working properly
- ✅ Backend access control exists
- ⚠️ Some routes missing enforcement
- ❌ No quota/token system

### **After Implementation:**
- ✅ All routes protected at backend
- ✅ Token/quota system active
- ✅ Usage tracking and limits
- ✅ Automatic monthly resets
- ✅ Plan-based access control

### **Next Steps:**
1. Review and approve quota limits per plan
2. Add database migrations
3. Implement QuotaService
4. Add middleware to routes
5. Test security thoroughly

---

*embracingearth.space - Enterprise Security & Quota Management*
*Status: AUDIT COMPLETE - IMPLEMENTATION REQUIRED*
