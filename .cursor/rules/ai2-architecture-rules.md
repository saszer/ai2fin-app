# AI2 Enterprise Platform - Architecture Rules for AI Assistants

## 🏗️ System Overview

You are working on the **AI2 Enterprise Platform**, a modular, microservices-based financial management system with the following structure:

```
embracingearthspace/
├── ai2-core-app/                 # 🏢 Core Application (API Gateway + Business Logic)
├── ai2-ai-modules/               # 🧠 AI/ML Services (Classification, Analysis)  
├── ai2-connectors/               # 🔌 External Data Connectors (Banks, Email APIs)
├── ai2-analytics/                # 📊 Analytics & Reporting Service
├── ai2-subscription-service/     # 💳 User Management & Billing
├── ai2-notifications/            # 📢 Notification Service
├── shared/                       # 📚 Shared Types, Utils, and Components
└── infrastructure/               # 🚀 Deployment & DevOps
```

## 🎯 CRITICAL RULES - NEVER VIOLATE

### 1. NO DUPLICATE LOGIC
```typescript
// ❌ WRONG: Creating new function without checking existing
function parseCSV(data: string) { ... }

// ✅ CORRECT: Check these locations first:
// - src/lib/ (current implementation)
// - src-old/server/lib/ (legacy - needs migration)
// - Other service modules

// If functionality exists, extend or refactor it - NEVER duplicate
```

### 2. COMPLETE IMPLEMENTATIONS ONLY
```typescript
// ❌ WRONG: Leaving TODO endpoints
router.post('/upload-csv', (req, res) => {
  // TODO: Implement CSV upload
  res.json({ message: 'Not implemented' });
});

// ✅ CORRECT: Full implementation with error handling
router.post('/upload-csv', authenticateToken, uploadMiddleware, async (req, res, next) => {
  try {
    // Complete business logic
    const result = await processCSVUpload(req.file, req.user.id);
    await ActivityTracker.logActivity({...});
    res.json(result);
  } catch (error) {
    next(error);
  }
});
```

### 3. MIGRATE, DON'T IGNORE src-old/
```typescript
// RULE: All business logic in src-old/ MUST be migrated to src/
// Check these files for critical logic:
// - src-old/server/lib/ai.ts (36KB) - AI classification
// - src-old/server/lib/csvParser.ts (48KB) - Advanced CSV processing
// - src-old/server/lib/bankConnector.ts (22KB) - Bank integrations
// - src-old/server/routes/*.ts - Additional endpoints

// Don't create new implementations if they exist in src-old/
```

## 🔄 Service Communication Rules

### 1. Use Service Discovery
```typescript
// ✅ CORRECT: Dynamic service calls with fallback
const aiResult = await serviceDiscovery.callService(
  'ai-modules', '/api/classify', 'POST', { transaction: data }
);

if (aiResult) {
  return aiResult;
} else {
  // Graceful fallback
  return basicClassification(data);
}

// ❌ WRONG: Hard-coded service URLs or missing fallbacks
const result = await axios.post('http://localhost:3002/api/classify', data);
```

### 2. API Gateway Pattern
```typescript
// Core app routes to appropriate services:
// /api/auth/* → Authentication service
// /api/bank/* → Banking/transaction operations  
// /api/bills/* → Bill management
// /api/expenses/* → Expense tracking
// /api/ai/* → AI service proxy (with fallback)
// /api/analytics/* → Analytics service proxy
// /api/subscription/* → Subscription service proxy
```

## 📊 Database & Activity Rules

### 1. Always Track Activities
```typescript
// ✅ REQUIRED: Log all user actions
await ActivityTracker.logActivity({
  userId: req.user!.id,
  action: 'create|update|delete|read',
  entityType: 'transaction|category|expense|bill',
  entityId: entity.id,
  oldData: originalData, // for updates/deletes
  newData: updatedData,  // for creates/updates
  description: 'Human readable description',
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

### 2. Proper Error Handling
```typescript
// ✅ CORRECT: Use createError for HTTP errors
import createError from 'http-errors';

if (!transaction) {
  throw createError(404, 'Transaction not found');
}

if (amount < 0) {
  throw createError(400, 'Amount must be positive');
}

// ✅ CORRECT: Wrap async operations
try {
  const result = await prisma.transaction.create(data);
  return result;
} catch (error) {
  logger.error('Database error:', error);
  throw createError(500, 'Database operation failed');
}
```

### 3. Validate All Inputs
```typescript
// ✅ CORRECT: Validate before processing
const validTransactionTypes = ['transaction', 'expense', 'bill'];
if (transactionType && !validTransactionTypes.includes(transactionType)) {
  throw createError(400, `Invalid transaction type: ${transactionType}`);
}

if (amount !== undefined && (isNaN(amount) || amount === null)) {
  throw createError(400, 'Amount must be a valid number');
}
```

## 🔐 Security Rules

### 1. Authentication Required
```typescript
// ✅ CORRECT: Use authenticateToken middleware
router.get('/transactions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // req.user is guaranteed to exist
  const transactions = await getTransactions(req.user!.id);
});

// ❌ WRONG: Unprotected endpoints for user data
router.get('/transactions', async (req, res) => {
  // Missing authentication
});
```

### 2. Input Sanitization
```typescript
// ✅ CORRECT: Sanitize and validate inputs
const { description, amount, category } = req.body;

// Validate required fields
if (!description || !amount) {
  throw createError(400, 'Description and amount are required');
}

// Sanitize strings
const cleanDescription = description.trim().substring(0, 255);
```

## 📁 File Organization Rules

### 1. Proper Module Structure
```typescript
// Core App Structure:
ai2-core-app/
├── src/
│   ├── server.ts                 # Main application server
│   ├── routes/                   # API route definitions
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── bank.ts              # Banking/transaction endpoints
│   │   ├── bills.ts             # Bill management
│   │   ├── expenses.ts          # Expense tracking
│   │   └── ai.ts                # AI integration endpoints
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts              # JWT authentication
│   │   ├── uploadMiddleware.ts  # File upload handling
│   │   └── errorHandler.ts     # Global error handling
│   ├── lib/                     # Core business logic
│   │   ├── csvParser.ts         # CSV processing
│   │   ├── bankConnector.ts     # Bank API integration
│   │   ├── activityTracker.ts   # User activity logging
│   │   └── serviceDiscovery.ts  # Microservice discovery
│   └── prisma/                  # Database schema and migrations
```

### 2. Import Rules
```typescript
// ✅ CORRECT: Proper imports
import express from 'express';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ActivityTracker } from '../lib/activityTracker';

// ❌ WRONG: Relative imports outside module
import { something } from '../../../other-service/lib/something';
```

## 🧪 Testing Rules

### 1. Test All New Code
```typescript
// ✅ REQUIRED: Add tests for new functionality
describe('CSV Upload', () => {
  it('should process valid CSV file', async () => {
    const csvData = 'Date,Description,Amount\n2024-01-01,Test,100.00';
    const result = await processCSV(csvData, userId);
    expect(result.success).toBe(true);
  });

  it('should handle invalid CSV format', async () => {
    const invalidCSV = 'invalid,csv,data';
    await expect(processCSV(invalidCSV, userId)).rejects.toThrow();
  });
});
```

### 2. Integration Testing
```typescript
// Test complete flows, not just units
describe('Bank Transaction Flow', () => {
  it('should create, update, and delete transaction', async () => {
    // Test full CRUD operations
    const created = await createTransaction(data);
    const updated = await updateTransaction(created.id, changes);
    await deleteTransaction(created.id);
  });
});
```

## 🚀 Performance Rules

### 1. Database Optimization
```typescript
// ✅ CORRECT: Use proper indexing and queries
const transactions = await prisma.bankTransaction.findMany({
  where: { userId },
  orderBy: { date: 'desc' },
  take: limit,
  skip: offset,
  include: { category: true } // Only include what's needed
});

// ❌ WRONG: Fetch all data then filter
const allTransactions = await prisma.bankTransaction.findMany();
const filtered = allTransactions.filter(t => t.userId === userId);
```

### 2. Memory Management
```typescript
// ✅ CORRECT: Stream large files
const stream = fs.createReadStream(filename);
stream.on('data', chunk => processChunk(chunk));

// ❌ WRONG: Load entire file into memory
const fileContent = fs.readFileSync(filename, 'utf8');
```

## 🔧 API Design Rules

### 1. Consistent Response Format
```typescript
// ✅ CORRECT: Consistent API responses
res.json({
  success: true,
  data: result,
  pagination: { total, limit, offset, hasMore },
  timestamp: new Date().toISOString()
});

// Error responses
res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: validationErrors,
  timestamp: new Date().toISOString()
});
```

### 2. Proper HTTP Status Codes
```typescript
// ✅ CORRECT: Use appropriate status codes
// 200 - Success
// 201 - Created
// 400 - Bad Request (validation errors)
// 401 - Unauthorized
// 403 - Forbidden
// 404 - Not Found
// 409 - Conflict (duplicates)
// 422 - Unprocessable Entity
// 500 - Internal Server Error
```

## 📝 Documentation Rules

### 1. Comment Complex Logic
```typescript
// ✅ CORRECT: Explain non-obvious code
/**
 * Parses CSV data and extracts transactions
 * Handles multiple bank formats and performs duplicate detection
 * @param csvData - Raw CSV string
 * @param userId - User ID for ownership
 * @param bankName - Bank identifier for format detection
 * @returns Array of parsed transactions
 */
async function parseCSV(csvData: string, userId: string, bankName: string): Promise<Transaction[]> {
  // Complex parsing logic with comments
}
```

### 2. API Documentation
```typescript
// Document all endpoints with JSDoc
/**
 * @route POST /api/bank/upload-csv
 * @desc Upload and process CSV file containing bank transactions
 * @access Private (requires authentication)
 * @param {File} file - CSV file to upload
 * @param {string} bankName - Name of the bank
 * @param {string} accountNumber - Account number
 * @returns {Object} Upload result with transaction count
 */
```

## ⚠️ Common Mistakes to Avoid

### 1. Don't Break Existing Functionality
```typescript
// ❌ WRONG: Removing working code without replacement
// router.get('/old-endpoint', handler); // Commented out

// ✅ CORRECT: Migrate and maintain compatibility
router.get('/old-endpoint', legacyHandler); // Keep for backward compatibility
router.get('/new-endpoint', newHandler);   // Add new functionality
```

### 2. Don't Ignore Error Handling
```typescript
// ❌ WRONG: Unhandled promises
prisma.transaction.create(data); // No await or error handling

// ✅ CORRECT: Proper error handling
try {
  const result = await prisma.transaction.create(data);
  return result;
} catch (error) {
  logger.error('Transaction creation failed:', error);
  throw createError(500, 'Failed to create transaction');
}
```

### 3. Don't Skip Activity Logging
```typescript
// ❌ WRONG: No audit trail
await prisma.transaction.delete({ where: { id } });

// ✅ CORRECT: Log all significant actions
const transaction = await prisma.transaction.findUnique({ where: { id } });
await prisma.transaction.delete({ where: { id } });
await ActivityTracker.logActivity({
  userId: req.user!.id,
  action: 'delete',
  entityType: 'transaction',
  entityId: id,
  oldData: transaction,
  description: `Deleted transaction: ${transaction.description}`
});
```

## 🎯 Quality Checklist

Before submitting any code, verify:

- [ ] **No duplicate logic** - Checked existing implementations
- [ ] **Complete functionality** - No TODOs or incomplete features
- [ ] **Proper error handling** - All async operations wrapped in try-catch
- [ ] **Activity logging** - All user actions tracked
- [ ] **Input validation** - All inputs sanitized and validated
- [ ] **Authentication** - Protected endpoints use authenticateToken
- [ ] **Service discovery** - External services called through serviceDiscovery
- [ ] **Testing** - Unit and integration tests added
- [ ] **Documentation** - Complex logic commented
- [ ] **Performance** - Efficient database queries and memory usage

## 🚨 Emergency Rules

If you encounter:

1. **500 Errors**: Always check server logs, validate database schema alignment, verify imports
2. **Authentication Issues**: Ensure JWT middleware is properly configured and tokens are valid
3. **Database Errors**: Check Prisma schema, run migrations, verify connection
4. **Service Communication**: Verify service discovery configuration and fallback logic
5. **File Upload Issues**: Check upload middleware configuration and file size limits

## 📞 When in Doubt

1. **Check existing implementations** in src/ and src-old/
2. **Follow the patterns** established in working code
3. **Preserve backward compatibility** unless explicitly refactoring
4. **Log everything** for debugging and audit purposes
5. **Test thoroughly** before marking as complete

---

These rules ensure the AI2 platform remains **enterprise-grade**, **scalable**, **secure**, and **maintainable** while providing consistent development patterns for all contributors. 