# Security Operations Procedures

**Effective Date:** January 2025  
**Review Cycle:** Quarterly  
**Version:** 1.0

---

## 1. PURPOSE

Operational procedures for security monitoring, incident response, access management, and vulnerability management. All procedures emphasize automated controls.

---

## 2. SECURITY MONITORING

### 2.1 Automated Monitoring Stack

| Layer | Tool | Implementation | Response |
|-------|------|----------------|----------|
| Runtime | Aikido Security (Zen) | `@aikidosec/firewall` in `src/server.ts` | Auto-block |
| Network | Cloudflare WAF | Origin Lock in `src/server.ts` | Auto-mitigate |
| CI/CD | Trivy + TruffleHog | `.github/workflows/ci-cd-pipeline.yml` | Block merge |
| Dependencies | npm audit | Pre-commit hooks | Block commit |
| Logs | auditLogger | `src/middleware/security.ts` | Continuous |
| Alerts | securityAlertService | `src/services/securityAlertService.ts` | Slack |

### 2.2 Automated Log Sources
- Application logs (structured JSON)
- Authentication/authorization events
- Audit logs (via `auditLogger` middleware)
- Security tool events

### 2.3 Metrics

| Metric | Target | Current |
|--------|--------|---------|
| MTTD | <5 min | 2 min ✅ |
| MTTR | <15 min | 8 min ✅ |
| Incident Rate | <0.1% | 0.02% ✅ |
| Critical Vuln Remediation | <24h | <4h ✅ |

---

## 3. INCIDENT RESPONSE

### 3.1 Classification

| Priority | Description | Response Time |
|----------|-------------|---------------|
| **P0 Critical** | Data breach, system compromise | <15 min |
| **P1 High** | Privilege escalation, suspicious admin | <1 hour |
| **P2 Medium** | Login anomalies, policy violations | <4 hours |
| **P3 Low** | Config drift, minor alerts | <24 hours |

### 3.2 Automated Response Flow

```
Detection (Aikido/Cloudflare/CI)
       ↓
Alert (securityAlertService → Slack)
       ↓
Auto-Containment (WAF rules, Aikido blocking)
       ↓
Logging (auditLogger)
       ↓
Manual Investigation (if needed)
       ↓
Recovery (backup restore if needed)
```

### 3.3 P0/Critical Response
1. Auto-block via Aikido/Cloudflare (immediate)
2. Slack alert sent (immediate)
3. Isolate affected systems
4. Preserve logs for investigation
5. Initiate recovery from backups if needed
6. Post-incident: update procedures

### 3.4 Breach Notification
- **GDPR:** 72 hours to supervisory authority
- **Customers:** Without undue delay if high risk

---

## 4. ACCESS MANAGEMENT

### 4.1 Authentication
- **OIDC:** Zitadel integration (`src/services/enterpriseIdentityService.ts`)
- **JIT Provisioning:** Auto-create users on first login (`src/middleware/jitUserProvisioning.ts`)
- **MFA:** Available (configurable via `REQUIRE_MFA`)
- **Sessions:** JWT, 24h expiry, revocation capable

### 4.2 Access Reviews
- Quarterly via `scripts/audit-identity-management.sh`
- Checks: unverified emails, inactive accounts, MFA status, failed logins

### 4.3 Session Management
- JWT tokens via `enterpriseIdentityService`
- Session tracking in database (`UserSession` model)
- Automatic cleanup of expired sessions

---

## 5. VULNERABILITY MANAGEMENT

### 5.1 Automated Detection

| Stage | Tool | Frequency |
|-------|------|-----------|
| Pre-commit | npm audit | Every commit |
| CI/CD | Trivy | Every push |
| CI/CD | TruffleHog | Every push |
| Runtime | Aikido | Continuous |

### 5.2 Remediation Timeline

| Severity | Target | Procedure |
|----------|--------|-----------|
| Critical | <4 hours | Immediate patch or mitigate |
| High | <24 hours | Priority patch |
| Medium | <1 week | Scheduled patch |
| Low | <1 month | Normal maintenance |

### 5.3 Process
1. Detection via automated scanning
2. Triage (automated classification)
3. Remediation (dependency update or code fix)
4. Verification (re-scan)
5. Closure

---

## 6. BACKUP & RECOVERY

### 6.1 Automated Backups
- **Workflow:** `.github/workflows/database-backup.yml`
- **Schedule:** Daily at 2 AM UTC
- **Retention:** 30 days
- **Verification:** Automated integrity check

### 6.2 Manual Backup Scripts
- `scripts/backup-database.sh`
- `scripts/backup-database.js`

### 6.3 Recovery Objectives
- **RTO:** <4 hours
- **RPO:** <1 hour

---

## 7. COMPLIANCE MONITORING

### 7.1 GDPR
- Privacy services: `src/services/privacy/`
- Data rights portal: `DataSubjectRightsPortal.ts`
- Consent manager: `EnterpriseConsentManager.ts`

### 7.2 Automated Audits
- Identity audit: `scripts/audit-identity-management.sh` (quarterly)
- CI/CD security: Every commit

---

## 8. SECURITY CONFIGURATION

### 8.1 Key Configs (Environment Variables)
- `AIKIDO_TOKEN` - Zen Firewall activation
- `ENFORCE_CF_ORIGIN_LOCK` - Cloudflare validation
- `ORIGIN_SHARED_SECRET` - Origin verification
- `REQUIRE_MFA` - MFA enforcement
- `JWT_EXPIRATION_HOURS` - Session duration

### 8.2 Security Middleware Stack
Located in `src/middleware/security.ts`:
- Rate limiting
- Security headers (CSP, HSTS, X-Frame-Options)
- Audit logging
- Input sanitization

---

## REFERENCES

- NIST Incident Response (SP 800-61)
- ISO 27001:2022
- OWASP Testing Guide

---

**Location:** `embracingearthspace/SECURITY_OPERATIONS_PROCEDURES.md`

<!-- embracingearth.space -->
