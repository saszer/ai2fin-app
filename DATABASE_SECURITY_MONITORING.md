# 🗄️ Database Security Monitoring - Wazuh & Sentry

**Date:** 2025-01-26  
**Status:** ✅ Can monitor database attacks with enhancements

---

## 🎯 What Can Be Monitored

### **1. SQL Injection Attacks** ✅

**Wazuh can detect:**
- ✅ SQL injection patterns in requests
- ✅ Unusual query patterns
- ✅ Database error patterns
- ✅ Multiple failed queries from same IP

**Sentry can detect:**
- ✅ Database query errors
- ✅ Prisma query failures
- ✅ Connection errors
- ✅ Query timeout errors

**How it works:**
- Wazuh monitors HTTP requests for SQL injection patterns
- Sentry captures database errors from Prisma
- Together they identify attack attempts

---

### **2. NoSQL Injection Attacks** ✅

**Current protection:**
- ✅ `nosqlGuard` middleware already exists
- ✅ Blocks NoSQL injection attempts
- ⚠️ **Needs:** Wazuh tracking added

**What to add:**
- Track blocked NoSQL injection attempts in Wazuh
- Alert on repeated injection attempts
- Monitor for MongoDB/NoSQL attack patterns

---

### **3. Database Access Hacks** ✅

**Wazuh can detect:**
- ✅ Unusual database access patterns
- ✅ Credential brute force attempts
- ✅ Connection pool exhaustion
- ✅ Unauthorized database access

**Sentry can detect:**
- ✅ Database connection failures
- ✅ Authentication errors
- ✅ Connection pool errors
- ✅ Query performance issues

---

### **4. Neon Database Specific** ✅

**Neon (Serverless Postgres) monitoring:**
- ✅ Connection errors (Sentry)
- ✅ Query timeouts (Sentry)
- ✅ Connection pool exhaustion (Sentry)
- ✅ Unusual connection patterns (Wazuh)
- ✅ Branch/endpoint access (Wazuh)

**Neon-specific threats:**
- Connection string leaks
- Branch access from unauthorized IPs
- Query performance degradation
- Connection limit exhaustion

---

### **5. Logic-Based Attacks** ✅

**Types of logic attacks:**
- ✅ **SQL Injection** - Malicious SQL in queries
- ✅ **NoSQL Injection** - MongoDB/NoSQL attacks
- ✅ **Prisma Injection** - Prisma query manipulation
- ✅ **IDOR (Insecure Direct Object Reference)** - Accessing other users' data
- ✅ **Mass Assignment** - Unauthorized field updates
- ✅ **Business Logic Bypass** - Circumventing validation

**Detection:**
- Wazuh: Request pattern analysis
- Sentry: Error pattern analysis
- Custom rules: Business logic violations

---

## 🔧 Current State

### **What's Already Protected:**

1. **NoSQL Injection** ✅
   - `nosqlGuard` middleware exists
   - Blocks NoSQL operators ($gt, $ne, etc.)
   - ⚠️ **Missing:** Wazuh tracking

2. **Prisma ORM** ✅
   - Parameterized queries (prevents SQL injection)
   - Type-safe queries
   - ⚠️ **Missing:** Query monitoring

3. **Database Errors** ✅
   - Sentry captures Prisma errors
   - Connection errors logged
   - ⚠️ **Missing:** Security event tracking

---

## 🚀 Enhancements Needed

### **1. Add Database Attack Detection to Wazuh** ⚠️

**Add to `wazuhSecurity.ts`:**
```typescript
/**
 * Track database injection attempts
 */
export const trackDatabaseInjection = (
  req: Request,
  attackType: 'sql' | 'nosql' | 'prisma',
  pattern: string
) => {
  wazuhClient.sendSecurityEvent({
    type: 'sql_injection_attempt',
    severity: 'critical',
    message: `${attackType.toUpperCase()} injection attempt detected`,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    metadata: {
      attackType,
      pattern,
      payload: req.body // Sanitized
    }
  });
};
```

---

### **2. Enhance NoSQL Guard with Wazuh** ⚠️

**Update `nosqlGuard.ts`:**
```typescript
// When NoSQL injection detected:
trackDatabaseInjection(req, 'nosql', detectedPattern);
```

---

### **3. Add Database Query Monitoring** ⚠️

**Create `databaseMonitor.ts`:**
```typescript
// Monitor Prisma queries for:
// - Unusual patterns
// - Performance issues
// - Error patterns
// - Access violations
```

---

### **4. Add Neon-Specific Monitoring** ⚠️

**Monitor:**
- Connection string access
- Branch endpoint access
- Query performance on Neon
- Connection pool usage

---

## 📊 Detection Capabilities

### **SQL Injection Detection:**

**Patterns Wazuh can detect:**
- `' OR '1'='1`
- `'; DROP TABLE--`
- `UNION SELECT`
- `'; EXEC xp_cmdshell--`
- `1' AND '1'='1`

**What you'll see:**
```
🚨 ALERT: SQL Injection Attempt
- IP: 203.0.113.42
- Pattern: ' OR '1'='1
- Endpoint: POST /api/bank/transactions
- Status: BLOCKED
```

---

### **NoSQL Injection Detection:**

**Patterns Wazuh can detect:**
- `{"$gt": ""}`
- `{"$ne": null}`
- `{"$regex": ".*"}`
- `{"$where": "this.password == this.username"}`

**What you'll see:**
```
🚨 ALERT: NoSQL Injection Attempt
- IP: 203.0.113.42
- Pattern: $gt operator
- Endpoint: POST /api/users
- Status: BLOCKED by nosqlGuard
```

---

### **Database Access Hack Detection:**

**Wazuh can detect:**
- Multiple connection failures
- Unusual query patterns
- Access from new IPs
- Rapid query execution
- Connection pool exhaustion

**Sentry can detect:**
- Database connection errors
- Query timeout errors
- Authentication failures
- Connection pool errors

**What you'll see:**
```
🚨 ALERT: Database Access Anomaly
- IP: 203.0.113.42
- Pattern: 50 connection attempts in 1 minute
- Status: SUSPICIOUS
- Action: Rate limit database connections
```

---

### **Neon-Specific Monitoring:**

**What to monitor:**
- Connection string leaks
- Branch access patterns
- Query performance degradation
- Connection limit exhaustion
- Branch switching anomalies

**What you'll see:**
```
🚨 ALERT: Neon Connection Anomaly
- Pattern: Connection limit reached
- Branch: production-main
- Status: CRITICAL
- Action: Scale Neon instance
```

---

## 🔒 Logic-Based Attack Detection

### **1. IDOR (Insecure Direct Object Reference)**

**Detection:**
- User accessing other users' data
- Unauthorized resource access
- Cross-user data access

**Wazuh rule:**
```xml
<rule id="100020" level="12">
  <match>unauthorized.*access|access.*denied|forbidden</match>
  <description>IDOR attack attempt detected</description>
</rule>
```

---

### **2. Mass Assignment**

**Detection:**
- Unauthorized field updates
- Privilege escalation attempts
- Admin field modifications

**Wazuh rule:**
```xml
<rule id="100021" level="11">
  <match>mass.*assignment|unauthorized.*field</match>
  <description>Mass assignment attack detected</description>
</rule>
```

---

### **3. Business Logic Bypass**

**Detection:**
- Validation bypass attempts
- Rate limit circumvention
- Payment logic manipulation

**Wazuh rule:**
```xml
<rule id="100022" level="13">
  <match>logic.*bypass|validation.*bypass</match>
  <description>Business logic bypass attempt</description>
</rule>
```

---

## 🎯 Implementation Plan

### **Phase 1: Basic Detection** ✅
- [x] NoSQL injection protection (exists)
- [ ] Add Wazuh tracking to nosqlGuard
- [ ] Add database error tracking to Sentry

### **Phase 2: Enhanced Detection** ⚠️
- [ ] SQL injection pattern detection
- [ ] Database access anomaly detection
- [ ] Query performance monitoring

### **Phase 3: Advanced Detection** ⚠️
- [ ] Neon-specific monitoring
- [ ] Logic-based attack detection
- [ ] IDOR detection
- [ ] Mass assignment detection

---

## 📋 Summary

### **What Can Be Monitored NOW:**

✅ **SQL Injection** - With Wazuh pattern detection  
✅ **NoSQL Injection** - Already blocked, needs Wazuh tracking  
✅ **Database Errors** - Sentry captures Prisma errors  
✅ **Connection Issues** - Sentry monitors connection failures  
✅ **Query Performance** - Sentry tracks slow queries  

### **What Needs Enhancement:**

⚠️ **Database Attack Tracking** - Add Wazuh events  
⚠️ **Neon-Specific Monitoring** - Add custom rules  
⚠️ **Logic Attack Detection** - Add custom Wazuh rules  
⚠️ **Query Pattern Analysis** - Add monitoring middleware  

---

## 🚀 Next Steps

1. **Add Wazuh tracking to nosqlGuard** (5 min)
2. **Add database error tracking** (10 min)
3. **Create database monitoring middleware** (30 min)
4. **Add Neon-specific rules** (15 min)
5. **Add logic attack detection** (20 min)

**Total time:** ~1.5 hours for complete database security monitoring

---

**Your database can be fully monitored for attacks!** 🛡️

