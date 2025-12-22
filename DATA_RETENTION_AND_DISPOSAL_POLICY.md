# Data Retention & Disposal Policy

**Effective Date:** January 2025  
**Review Cycle:** Annual  
**Version:** 1.0

---

## 1. PURPOSE

This policy defines how AI2Fin retains and disposes of personal data and financial data, including data received from financial data providers (e.g., Plaid), in order to minimize risk, meet customer expectations, and comply with applicable privacy and security requirements.

---

## 2. SCOPE

This policy applies to:
- End-user account data (profile and identity data)
- Bank-connection data (connection metadata and tokens where applicable)
- Transaction and account data received from bank/aggregation providers
- Operational logs and audit records
- Backups and replicas

---

## 3. DATA MINIMIZATION

- We retain **only the minimum data required** to provide the service (e.g., transaction history and account metadata needed for budgeting, categorization, and reporting).
- We **do not store bank login credentials** (usernames/passwords) for bank connections.
- Sensitive secrets and tokens are restricted to least-privilege access and stored using secure secret handling practices.

---

## 4. RETENTION PRINCIPLES

- **Default retention**: Data is retained only as long as required to provide the service, meet legal obligations, and resolve disputes.
- **User control**: Users may request access, export, correction, and deletion of their personal data, subject to legal and operational constraints.
- **Backups**: Backups are retained for a limited window and are not used for routine application access.

---

## 5. RETENTION SCHEDULE (DEFAULTS)

Retention periods may vary by jurisdiction and product use; the following are baseline defaults:

| Data Type | Examples | Default Retention |
|----------|----------|------------------|
| Account/Profile Data | Name, email, preferences | While account is active; deleted on request unless legally required |
| Bank Connection Metadata | Provider, connection status, institution identifiers | While connection is active; deleted on disconnect or account deletion |
| Provider Tokens (if stored) | Access/refresh tokens, item identifiers | While connection is active; deleted on disconnect or account deletion |
| Transaction Data | Merchant, amount, date, category | While account is active; deleted on account deletion request unless retention is legally required |
| Audit/Security Logs | Auth events, access logs, security events | Up to 24 months (minimum needed for security investigations) |
| Support/Diagnostics | Error reports, support tickets | Up to 24 months or until resolved (whichever is longer) |
| Backups | Encrypted database backups | 30 days |

---

## 6. DELETION & DISPOSAL

### 6.1 User-Initiated Deletion (Account Deletion / Erasure Request)
- Requests are validated to prevent unauthorized deletion.
- Data is deleted or anonymized where feasible.
- Data that must be retained for legal, regulatory, fraud prevention, or security reasons may be retained for the minimum required period.

### 6.2 Bank Connection Termination
- When a user disconnects a bank connection, connection credentials/tokens (where stored) are deleted promptly.

### 6.3 Backup Disposal
- Backups expire automatically at the end of the retention window.
- Expired backups are removed from storage and are no longer accessible.

---

## 7. SECURITY CONTROLS SUPPORTING RETENTION & DISPOSAL

- Encryption in transit (TLS) for all external communications.
- Encryption at rest for databases and backup storage (via cloud provider controls).
- Strict access controls (least privilege) for production data and backups.
- Audit logging for security-relevant access and administrative operations.

---

## 8. REVIEW & CHANGES

- Reviewed at least annually and whenever significant changes occur (architecture, vendors, regulatory requirements).
- Updates are version controlled.

---

## 9. CONTACT

For privacy or data retention requests: **security@ai2fin.com**

<!-- embracingearth.space -->


