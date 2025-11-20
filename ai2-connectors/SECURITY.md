# 🔒 Security Guide

## Overview

This document outlines security best practices for the AI2 Connectors framework. Since this is a public repository, security is paramount.

## 🔐 Credential Management

### Never Commit Secrets

❌ **DON'T:**
```typescript
const API_KEY = 'sk_live_1234567890'; // NEVER!
const SECRET = 'my-secret-key'; // NEVER!
```

✅ **DO:**
```typescript
const API_KEY = process.env.API_KEY; // ✅ From environment variable
if (!API_KEY) {
  throw new Error('API_KEY not configured');
}
```

### Credential Storage

All credentials are encrypted using AES-256-GCM:

```typescript
// Credentials are automatically encrypted before storage
await credentialManager.storeCredentials(connectionId, userId, credentials);
```

**Encryption Requirements:**
- `CREDENTIAL_ENCRYPTION_KEY` must be at least 32 characters
- Encryption key must never be committed to repository
- Use environment variables or secret management services

### Production Recommendations

For production, use a secure vault service:

1. **AWS Secrets Manager**
2. **HashiCorp Vault**
3. **Azure Key Vault**
4. **Google Secret Manager**

Example (AWS Secrets Manager):
```typescript
// TODO: Replace in-memory storage with AWS Secrets Manager
import { SecretsManager } from 'aws-sdk';

const secretsManager = new SecretsManager();

async storeCredentials(connectionId: string, userId: string, credentials: ConnectorCredentials): Promise<void> {
  const secretName = `connectors/${userId}/${connectionId}`;
  const encrypted = this.encrypt(JSON.stringify(credentials));
  
  await secretsManager.putSecret({
    SecretId: secretName,
    SecretString: encrypted
  }).promise();
}
```

## 🛡️ Input Validation

### Sanitization

All inputs are automatically sanitized:

```typescript
// XSS protection
app.use(sanitizeInput); // Applied to all requests
```

**What's sanitized:**
- Script tags (`<script>`)
- Iframe tags (`<iframe>`)
- JavaScript URLs (`javascript:`)
- Event handlers (`onclick=`, etc.)

### Request Size Limits

```typescript
app.use(express.json({ limit: '10mb' })); // Prevent DoS via large payloads
```

### Field Validation

All connector credential fields are validated:

```typescript
// Automatic validation based on connector metadata
credentialManager.validateCredentials(credentials, requiredFields);
```

## 🔑 Authentication

### JWT Tokens

All API endpoints require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

**Token Requirements:**
- Valid JWT with `userId`
- Issued by `ai2-platform`
- Not expired

### Service-to-Service Auth

For internal service calls:

```http
X-Service-Token: <service_secret>
```

### Cloudflare Origin Lock (Optional)

For production deployments behind Cloudflare:

```bash
ENFORCE_CF_ORIGIN_LOCK=true
ORIGIN_SHARED_SECRET=your_shared_secret
```

Validates requests arrive via Cloudflare using header validation.

## 🚨 Error Handling

### Never Expose Sensitive Data

❌ **DON'T:**
```typescript
res.status(500).json({ 
  error: error.message,
  credentials: credentials // NEVER expose credentials!
});
```

✅ **DO:**
```typescript
// Mask sensitive fields before logging
const masked = credentialManager.maskCredentials(credentials);
console.log('Connection attempt:', masked);

res.status(500).json({ 
  error: 'Connection failed',
  code: 'CONNECTION_FAILED'
});
```

### Secure Error Messages

Error messages should not reveal:
- API keys or secrets
- Internal system details
- Credential formats
- Database structures

## 📝 Logging

### Mask Sensitive Data

All sensitive fields are automatically masked in logs:

```typescript
const masked = credentialManager.maskCredentials(credentials);
// { apiKey: '***MASKED***', apiSecret: '***MASKED***', ... }
```

### Audit Logging

Connector access is logged:

```typescript
console.log(`🔌 Connector Access: ${user.email} - ${req.method} ${req.path}`);
```

## 🔒 Environment Variables

### Required Variables

```bash
# JWT secret (minimum 32 characters)
JWT_SECRET=your_jwt_secret_min_32_chars

# Credential encryption key (minimum 32 characters)
CREDENTIAL_ENCRYPTION_KEY=your_encryption_key_min_32_chars
```

### Optional Variables

```bash
# Service-to-service authentication
SERVICE_SECRET=your_service_secret

# Cloudflare Origin Lock
ENFORCE_CF_ORIGIN_LOCK=true
ORIGIN_SHARED_SECRET=your_origin_secret
```

### .env Files

✅ **All `.env` files are excluded** in `.gitignore`:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🚫 What Not to Commit

**Never commit:**
- ✅ Environment variable files (`.env*`)
- ✅ API keys or secrets
- ✅ Credentials
- ✅ Encryption keys
- ✅ Private keys (`.pem`, `.key`, `.crt`)
- ✅ Database files (`.db`, `.sqlite`)
- ✅ Connection/credential storage directories

**Safe to commit:**
- ✅ Code
- ✅ Documentation
- ✅ Tests (without real credentials)
- ✅ Configuration templates (without secrets)

## 🧪 Security Testing

### Before Committing

1. ✅ Search for hardcoded secrets:
   ```bash
   grep -r "password\|secret\|key\|token" --exclude-dir=node_modules src/
   ```

2. ✅ Verify `.gitignore` excludes sensitive files:
   ```bash
   git check-ignore .env credentials/ secrets/
   ```

3. ✅ Test credential encryption:
   ```bash
   npm test -- --testNamePattern="CredentialManager"
   ```

### Security Checklist

- [ ] No hardcoded secrets in code
- [ ] All credentials use environment variables
- [ ] `.env` files excluded in `.gitignore`
- [ ] Credentials encrypted before storage
- [ ] Input sanitization enabled
- [ ] Request size limits configured
- [ ] JWT authentication required
- [ ] Error messages don't expose sensitive data
- [ ] Logs mask sensitive fields
- [ ] HTTPS enabled in production

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🆘 Reporting Security Issues

If you discover a security vulnerability, please **DO NOT** create a public issue. Instead:

1. Email: security@embracingearth.space
2. Include detailed description
3. Include steps to reproduce (if applicable)
4. We will respond within 48 hours

---

**Security is everyone's responsibility. Stay vigilant! 🔒**



